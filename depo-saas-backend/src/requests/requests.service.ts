import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestType, ProcurementStatus } from '@prisma/client';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationsService
  ) { }

  async create(data: any, user: any) {
    let rType: RequestType = 'PURCHASE';
    if (data.type === 'INBOUND') rType = 'INBOUND';
    if (data.type === 'STOCK_OUT') rType = 'STOCK_OUT';

    const request = await this.prisma.procurementRequest.create({
      data: {
        productId: data.productId,
        quantity: Number(data.quantity),
        reason: data.reason,
        type: rType,
        requesterId: user.userId,
        tenantId: user.tenantId,
        branchId: user.branchId || null,
        status: 'PENDING'
      },
      include: { product: true, requester: true, branch: true }
    });

    const branchName = request.branch?.name || 'Merkez';
    await this.notificationService.notifyManagers(
      user.tenantId,
      user.branchId,
      `📦 YENİ TALEP (${branchName}): ${user.fullName}, ${request.product.name} talep etti.`
    );

    return request;
  }

  async findAll(user: any) {
    let whereClause: any = { tenantId: user.tenantId };

    if (user.role === 'BRANCH_MANAGER') {
      whereClause.branchId = user.branchId;
    } else if (user.role === 'STAFF' || user.role === 'VIEWER') {
      whereClause.requesterId = user.userId;
    }

    return this.prisma.procurementRequest.findMany({
      where: whereClause,
      include: {
        product: true,
        requester: { select: { fullName: true } },
        branch: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id: string, data: any, user: any) {
    const request = await this.prisma.procurementRequest.findUnique({ where: { id } });
    if (!request) throw new BadRequestException("Talep bulunamadı");

    if (user.role === 'BRANCH_MANAGER' && request.branchId !== user.branchId) {
      throw new BadRequestException("Bu talep sizin şubenize ait değil.");
    }

    const updatedRequest = await this.prisma.procurementRequest.update({
      where: { id },
      data: {
        status: data.status,
        adminNote: data.adminNote,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null
      },
      include: { product: true }
    });

    const statusMsg = data.status === 'APPROVED' ? 'Onaylandı' : (data.status === 'ORDERED' ? 'Sipariş Verildi' : 'Güncellendi');
    await this.notificationService.create(
      updatedRequest.requesterId,
      `🔔 Talep Durumu: ${updatedRequest.product.name} -> ${statusMsg}`,
      data.status === 'APPROVED' ? 'SUCCESS' : 'INFO'
    );

    return updatedRequest;
  }

  // --- YENİ: TOPLU GÜNCELLEME ---
  async bulkUpdateStatus(ids: string[], status: ProcurementStatus, user: any) {
    // 1. Yetki Kontrolü: Sadece kendi şubesi veya tümü
    const requests = await this.prisma.procurementRequest.findMany({
      where: {
        id: { in: ids },
        tenantId: user.tenantId
      }
    });

    if (requests.length === 0) return { count: 0 };

    // Şube yöneticisi sadece kendi şubesine ait olanları güncelleyebilir
    const validIds = requests
      .filter(req => {
        if (user.role === 'BRANCH_MANAGER') return req.branchId === user.branchId;
        return true; // Admin ise hepsi
      })
      .map(r => r.id);

    if (validIds.length === 0) throw new BadRequestException("Seçilen talepler üzerinde yetkiniz yok.");

    // 2. Güncelleme
    const result = await this.prisma.procurementRequest.updateMany({
      where: { id: { in: validIds } },
      data: { status }
    });

    return result;
  }

  async receiveGoods(id: string, user: any) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.procurementRequest.findUnique({
        where: { id },
        include: { product: true }
      });

      if (!request) throw new BadRequestException("Talep bulunamadı.");
      if (request.status !== 'ORDERED') throw new BadRequestException("Sadece 'Sipariş Verildi' durumundaki ürünler kabul edilebilir.");

      const updatedRequest = await tx.procurementRequest.update({
        where: { id },
        data: { status: 'DELIVERED', deliveryDate: new Date() }
      });

      await tx.transaction.create({
        data: {
          type: 'INBOUND',
          quantity: request.quantity,
          productId: request.productId,
          tenantId: request.tenantId,
          createdById: user.userId,
          status: 'APPROVED',
          notes: `Sipariş Teslim Alındı (Talep #${request.id.slice(0, 4)})`,
          isCash: false,
          isPaid: false
        }
      });

      await tx.product.update({
        where: { id: request.productId },
        data: { currentStock: { increment: request.quantity } }
      });

      await this.notificationService.create(
        request.requesterId,
        `📦 Mal Kabul: ${request.product.name} stoğa eklendi.`,
        'SUCCESS'
      );

      return updatedRequest;
    });
  }
}