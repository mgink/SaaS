import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestType } from '@prisma/client';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationsService
  ) { }

  // --- TALEP OLUŞTURMA ---
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
        branchId: user.branchId || null, // Şube bilgisini kaydet
        status: 'PENDING'
      },
      include: { product: true, requester: true, branch: true }
    });

    // Bildirim: İlgili şube müdürüne ve patrona
    const branchName = request.branch?.name || 'Merkez';
    await this.notificationService.notifyManagers(
      user.tenantId,
      user.branchId,
      `📦 YENİ TALEP (${branchName}): ${user.fullName}, ${request.product.name} talep etti.`
    );

    return request;
  }

  // --- LİSTELEME (FİLTRELİ) ---
  async findAll(user: any) {
    let whereClause: any = { tenantId: user.tenantId };

    // HİYERARŞİ KONTROLÜ:
    // 1. ADMIN / SUPER_ADMIN: Her şeyi görür.
    // 2. BRANCH_MANAGER: Sadece kendi şubesini görür.
    // 3. STAFF: Sadece kendi açtığı talepleri görür.

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

  // --- GÜNCELLEME (ONAY / SİPARİŞ / RED) ---
  async update(id: string, data: any, user: any) {
    const request = await this.prisma.procurementRequest.findUnique({ where: { id } });
    if (!request) throw new BadRequestException("Talep bulunamadı");

    // Şube Müdürü, başka şubenin talebini yönetemez
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

    // Talep sahibine bildirim
    const statusMsg = data.status === 'APPROVED' ? 'Onaylandı' : (data.status === 'ORDERED' ? 'Sipariş Verildi' : 'Güncellendi');
    await this.notificationService.create(
      updatedRequest.requesterId,
      `🔔 Talep Durumu: ${updatedRequest.product.name} -> ${statusMsg}`,
      data.status === 'APPROVED' ? 'SUCCESS' : 'INFO'
    );

    return updatedRequest;
  }

  // --- MAL KABUL (Sipariş -> Stok) ---
  async receiveGoods(id: string, user: any) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Talebi Bul
      const request = await tx.procurementRequest.findUnique({
        where: { id },
        include: { product: true }
      });

      if (!request) throw new BadRequestException("Talep bulunamadı.");
      if (request.status !== 'ORDERED') throw new BadRequestException("Sadece 'Sipariş Verildi' durumundaki ürünler kabul edilebilir.");

      // 2. Talebi Kapat (DELIVERED)
      const updatedRequest = await tx.procurementRequest.update({
        where: { id },
        data: { status: 'DELIVERED', deliveryDate: new Date() }
      });

      // 3. Koli Hesabı (Talepteki miktar adet kabul edilir, koli hesabı ürün girişinde yapıldı varsayılır)
      // Veya burada da koli çarpımı yapılabilir ama basitlik için talep miktarı = stok artışı diyelim.

      // 4. Stok Hareketi Oluştur (INBOUND)
      await tx.transaction.create({
        data: {
          type: 'INBOUND',
          quantity: request.quantity,
          productId: request.productId,
          tenantId: request.tenantId,
          createdById: user.userId,
          status: 'APPROVED',
          notes: `Sipariş Teslim Alındı (Talep #${request.id.slice(0, 4)})`,
          isCash: false, // Genelde siparişler vadelidir
          isPaid: false
        }
      });

      // 5. Ürün Stoğunu Artır
      await tx.product.update({
        where: { id: request.productId },
        data: { currentStock: { increment: request.quantity } }
      });

      // 6. Bildirim
      await this.notificationService.create(
        request.requesterId,
        `📦 Mal Kabul: ${request.product.name} depoya girdi ve stok güncellendi.`,
        'SUCCESS'
      );

      return updatedRequest;
    });
  }
}