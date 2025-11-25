import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationsService
  ) { }

  // --- HAREKET OLUŞTURMA ---
  async create(data: any, tenantId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: data.productId, tenantId },
      });

      if (!product) throw new NotFoundException('Ürün bulunamadı.');

      // 1. BİRİM VE KOLİ HESABI (HEM GİRİŞ HEM ÇIKIŞ İÇİN)
      let actualQuantity = Number(data.quantity);

      // Eğer kullanıcı "Koli" birimini seçtiyse, arka planda adet'e çeviriyoruz
      // Örn: 2 Koli Süt (12'li) = 24 Adet işlem görür.
      if (data.unit === 'BOX') {
        // Ürünün koli içi adedi tanımlıysa onu kullan, yoksa 1 say.
        const multiplier = product.itemsPerBox > 1 ? product.itemsPerBox : 1;
        actualQuantity = actualQuantity * multiplier;
      }

      // 2. YENİ STOK HESAPLA
      let newStock = product.currentStock;

      if (data.type === 'INBOUND') {
        newStock += actualQuantity;
      } else {
        // OUTBOUND (Çıkış) veya WASTAGE (Zayi) ise düş
        if (product.currentStock < actualQuantity) {
          throw new BadRequestException(`Yetersiz stok! Mevcut: ${product.currentStock}, İstenen: ${actualQuantity}`);
        }
        newStock -= actualQuantity;
      }

      // 3. STOK GÜNCELLE
      await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: newStock },
      });

      // 4. FİNANSAL DURUM
      let isPaid = true;
      // Sadece giriş işlemlerinde vadeli olabilir
      if (data.type === 'INBOUND' && data.isCash === false) {
        isPaid = false;
      }

      // 5. HAREKET KAYDI
      const transaction = await tx.transaction.create({
        data: {
          type: data.type, // INBOUND, OUTBOUND veya WASTAGE
          quantity: actualQuantity,
          productId: data.productId,
          tenantId,
          createdById: userId,
          status: 'APPROVED',

          waybillNo: data.waybillNo,
          supplierId: data.supplierId || null,
          notes: data.notes,

          isCash: data.isCash !== undefined ? data.isCash : true,
          isPaid: isPaid,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,

          batchNumber: data.batchNumber || null,
          expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        },
      });

      // 6. KRİTİK STOK UYARISI (Çıkış veya Zayi ise)
      if ((data.type === 'OUTBOUND' || data.type === 'WASTAGE') && newStock <= product.minStock) {
        await this.notificationService.notifyAdmins(
          tenantId,
          `⚠️ KRİTİK STOK: "${product.name}" azaldı! Kalan: ${newStock}`
        );
      }

      return transaction;
    });
  }

  // --- LİSTELEME ---
  async findAll(tenantId: string, query?: any, user?: any) {
    let whereClause: any = { tenantId };

    if (query?.startDate && query?.endDate) {
      whereClause.createdAt = {
        gte: new Date(query.startDate),
        lte: new Date(new Date(query.endDate).setHours(23, 59, 59, 999))
      };
    }

    if (user) {
      if (user.role === 'BRANCH_MANAGER' || user.role === 'STAFF') {
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

  // --- FİNANSAL İSTATİSTİKLER VE ANALİZ ---
  async getFinancialStats(tenantId: string) {
    // 1. Ödenmemiş Borçlar
    const unpaidTransactions = await this.prisma.transaction.findMany({
      where: { tenantId, type: 'INBOUND', isCash: false, isPaid: false },
      include: { supplier: true, product: true },
      orderBy: { paymentDate: 'asc' }
    });

    // 2. Geçmiş Ödemeler (Son 50)
    const paidHistory = await this.prisma.transaction.findMany({
      where: { tenantId, type: 'INBOUND', isCash: false, isPaid: true },
      include: { supplier: true, product: true },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    // 3. Analiz: En Çok Harcama Yapılan Tedarikçiler
    // Tüm zamanların giriş hareketlerini çekip JS ile gruplayalım
    const allInbound = await this.prisma.transaction.findMany({
      where: { tenantId, type: 'INBOUND' },
      include: { supplier: true, product: true }
    });

    const supplierSpend: Record<string, number> = {};
    const productSpend: Record<string, number> = {};

    allInbound.forEach(tx => {
      const cost = tx.quantity * tx.product.buyingPrice;
      const supName = tx.supplier?.name || 'Bilinmiyor';

      supplierSpend[supName] = (supplierSpend[supName] || 0) + cost;
      productSpend[tx.product.name] = (productSpend[tx.product.name] || 0) + cost;
    });

    // Sıralama ve Formatlama
    const topSuppliers = Object.entries(supplierSpend)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5

    const topProducts = Object.entries(productSpend)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5

    // Toplamlar
    const totalDebt = unpaidTransactions.reduce((acc, tx) => acc + (tx.quantity * tx.product.buyingPrice), 0);
    const today = new Date();
    const overdueAmount = unpaidTransactions
      .filter(tx => tx.paymentDate && new Date(tx.paymentDate) < today)
      .reduce((acc, tx) => acc + (tx.quantity * tx.product.buyingPrice), 0);

    return {
      unpaidTransactions: unpaidTransactions.map(tx => ({
        id: tx.id,
        supplier: tx.supplier?.name || 'Bilinmiyor',
        product: tx.product.name,
        amount: tx.quantity * tx.product.buyingPrice,
        dueDate: tx.paymentDate,
        isOverdue: tx.paymentDate && new Date(tx.paymentDate) < today
      })),
      paidHistory: paidHistory.map(tx => ({
        id: tx.id,
        supplier: tx.supplier?.name || 'Bilinmiyor',
        product: tx.product.name,
        amount: tx.quantity * tx.product.buyingPrice,
        date: tx.updatedAt // Ödeme tarihi (güncellenme tarihi)
      })),
      topSuppliers,
      topProducts,
      totalDebt,
      overdueAmount
    };
  }

  async markAsPaid(id: string, tenantId: string) {
    return this.prisma.transaction.updateMany({
      where: { id, tenantId },
      data: { isPaid: true, updatedAt: new Date() } // updatedAt ödeme tarihi olur
    });
  }
}