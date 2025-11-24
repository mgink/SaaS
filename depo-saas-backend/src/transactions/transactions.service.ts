import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestType } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationsService
  ) { }

  // --- HAREKET OLUŞTURMA ---
  async create(data: any, tenantId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const canDirectlyTransact =
      user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_MANAGER' || user.autoApprove === true;

    // Yetkisiz ise Talep Oluştur
    if (!canDirectlyTransact) {
      return this.createRequestAsTransaction(data, user);
    }

    // Yetkili ise İşlemi Yap
    return this.processTransaction(data, tenantId, userId);
  }

  private async createRequestAsTransaction(data: any, user: any) {
    let rType: RequestType = 'PURCHASE';
    if (data.type === 'INBOUND') rType = 'INBOUND';
    if (data.type === 'OUTBOUND') rType = 'STOCK_OUT';

    const request = await this.prisma.procurementRequest.create({
      data: {
        productId: data.productId,
        quantity: Number(data.quantity),
        reason: data.notes || 'Stok Hareketi Talebi',
        type: rType,
        requesterId: user.id,
        tenantId: user.tenantId,
        branchId: user.branchId || null,
        status: 'PENDING'
      },
      include: { product: true }
    });

    await this.notificationService.notifyManagers(
      user.tenantId,
      user.branchId,
      `📝 ONAY GEREKİYOR: ${user.fullName}, ${request.product.name} için işlem yapmak istiyor.`
    );

    return { ...request, isRequest: true };
  }

  private async processTransaction(data: any, tenantId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: data.productId, tenantId } });
      if (!product) throw new NotFoundException('Ürün bulunamadı.');

      // Koli Hesabı
      let actualQuantity = Number(data.quantity);
      if (data.unit === 'BOX' && product.unitType === 'BOX') {
        const multiplier = product.itemsPerBox > 1 ? product.itemsPerBox : 1;
        actualQuantity = actualQuantity * multiplier;
      }

      let newStock = product.currentStock;
      if (data.type === 'INBOUND') {
        newStock += actualQuantity;
      } else {
        if (product.currentStock < actualQuantity) throw new BadRequestException(`Yetersiz stok!`);
        newStock -= actualQuantity;
      }

      await tx.product.update({ where: { id: data.productId }, data: { currentStock: newStock } });

      let isPaid = true;
      if (data.type === 'INBOUND' && data.isCash === false) isPaid = false;

      const transaction = await tx.transaction.create({
        data: {
          type: data.type,
          quantity: actualQuantity,
          productId: data.productId,
          tenantId,
          createdById: userId,
          status: 'APPROVED',
          waybillNo: data.waybillNo,
          supplierId: data.supplierId || null,
          notes: data.notes,
          isCash: data.isCash !== undefined ? data.isCash : true,
          isPaid,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : null
        },
      });

      if (data.type === 'OUTBOUND' && newStock <= product.minStock) {
        await this.notificationService.notifyAdmins(tenantId, `⚠️ KRİTİK STOK: "${product.name}" azaldı!`);
      }

      return { ...transaction, isRequest: false };
    });
  }

  // --- LİSTELEME ---
  async findAll(tenantId: string, query?: any, user?: any) {
    let whereClause: any = { tenantId };

    // Tarih Filtresi
    if (query?.startDate && query?.endDate) {
      whereClause.createdAt = {
        gte: new Date(query.startDate),
        lte: new Date(new Date(query.endDate).setHours(23, 59, 59, 999))
      };
    }

    // Yetki Filtresi
    if (user) {
      if (user.role === 'BRANCH_MANAGER') {
        // Sadece kendi şubesindeki depolarda olan hareketleri görsün
        whereClause.product = { warehouse: { branchId: user.branchId } };
      } else if (user.role === 'STAFF') {
        // Personel de şube kısıtlı olsun
        whereClause.product = { warehouse: { branchId: user.branchId } };
      }
    }

    return this.prisma.transaction.findMany({
      where: whereClause,
      include: {
        product: true,
        createdBy: { select: { fullName: true, email: true } },
        supplier: true
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFinancialStats(tenantId: string) { /* ... (Aynı kalabilir, önceki cevaptan) ... */ return {}; }
  async markAsPaid(id: string, tenantId: string) { /* ... (Aynı kalabilir) ... */ return {}; }
}