import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class StockFormsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationsService
  ) { }

  // --- FİŞ OLUŞTURMA (ÇOKLU İŞLEM) ---
  async create(data: any, user: any) {
    const { type, supplierId, waybillNo, waybillDate, notes, items, isReceived } = data;

    if (!items || items.length === 0) {
      throw new BadRequestException("Fiş içinde en az bir ürün olmalıdır.");
    }

    // 1. Durum Belirleme
    // Admin ise ve 'Teslim Alındı' dediyse -> APPROVED
    // Personel ise veya 'Teslim Alınmadı' dediyse -> PENDING
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_MANAGER';

    let status: 'APPROVED' | 'PENDING' = 'PENDING';
    if (isAdmin && isReceived) {
      status = 'APPROVED';
    }

    // Fiş Numarası (SF-IN-2024...)
    const prefix = type === 'INBOUND' ? 'IN' : (type === 'OUTBOUND' ? 'OUT' : 'WST');
    const formNumber = `SF-${prefix}-${Date.now().toString().slice(-8)}`;

    return this.prisma.$transaction(async (tx) => {
      // 2. Fiş Başlığını Oluştur
      const stockForm = await tx.stockForm.create({
        data: {
          formNumber,
          type: type as TransactionType,
          supplierId: supplierId || null,
          waybillNo: waybillNo || null,
          waybillDate: waybillDate ? new Date(waybillDate) : null,
          notes: notes,
          tenantId: user.tenantId,
          createdById: user.userId
        }
      });

      // 3. Kalemleri İşle
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new NotFoundException(`Ürün bulunamadı: ${item.productId}`);

        // Birim Çevrimi
        let actualQuantity = Number(item.quantity);
        if (item.unit === 'BOX' && product.unitType === 'BOX') {
          const multiplier = product.itemsPerBox > 1 ? product.itemsPerBox : 1;
          actualQuantity = actualQuantity * multiplier;
        }

        // Eğer ONAYLANDIYSA Stoktan Düş/Ekle
        if (status === 'APPROVED') {
          let newStock = product.currentStock;
          if (type === 'INBOUND') newStock += actualQuantity;
          else {
            if (product.currentStock < actualQuantity) throw new BadRequestException(`${product.name} için yetersiz stok!`);
            newStock -= actualQuantity;
          }
          await tx.product.update({ where: { id: product.id }, data: { currentStock: newStock } });
        }

        // Transaction Kaydı (Status: PENDING veya APPROVED)
        await tx.transaction.create({
          data: {
            type: type as TransactionType,
            quantity: actualQuantity,
            productId: product.id,
            tenantId: user.tenantId,
            createdById: user.userId,
            status: status as any, // Enum uyumu
            stockFormId: stockForm.id,

            // Finansal Detaylar (Onay bekleyenler henüz ödenmedi sayılır)
            isCash: item.isCash ?? false,
            isPaid: false,
            paymentDate: item.paymentDate ? new Date(item.paymentDate) : null,
            batchNumber: item.batchNumber || null,
            expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,

            notes: `Fiş: ${formNumber}`
          }
        });
      }

      // 4. Bildirim
      if (status === 'PENDING') {
        const msg = isReceived
          ? `📦 ONAY GEREKİYOR: ${user.fullName} tarafından ${items.length} kalemlik mal girişi yapıldı.`
          : `🚚 YENİ SİPARİŞ: ${user.fullName} tarafından ${items.length} kalemlik sipariş girildi.`;

        await this.notificationService.notifyManagers(user.tenantId, user.branchId, msg);
      }

      return stockForm;
    });
  }

  // --- LİSTELEME ---
  async findAll(tenantId: string) {
    return this.prisma.stockForm.findMany({
      where: { tenantId },
      include: {
        supplier: true,
        createdBy: { select: { fullName: true } },
        transactions: { include: { product: true } } // Detaylar için
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // --- YÖNETİCİ ONAYLAMA / REDDETME ---
  async processForm(id: string, action: 'APPROVE' | 'REJECT', data: any, user: any) {
    return this.prisma.$transaction(async (tx) => {
      const form = await tx.stockForm.findUnique({
        where: { id },
        include: { transactions: { include: { product: true } } }
      });
      if (!form) throw new NotFoundException("Fiş bulunamadı.");

      if (action === 'REJECT') {
        // İşlemleri sil veya statüyü REJECTED yap
        await tx.transaction.updateMany({ where: { stockFormId: id }, data: { status: 'REJECTED' } });
        return { message: "Fiş reddedildi." };
      }

      // ONAYLAMA (APPROVE)
      for (const txRecord of form.transactions) {
        if (txRecord.status === 'APPROVED') continue; // Zaten onaylıysa geç

        // Stok Güncelle
        let newStock = txRecord.product.currentStock;
        if (txRecord.type === 'INBOUND') newStock += txRecord.quantity;
        else newStock -= txRecord.quantity;

        await tx.product.update({ where: { id: txRecord.productId }, data: { currentStock: newStock } });

        // İşlemi Güncelle (Finansal verilerle)
        await tx.transaction.update({
          where: { id: txRecord.id },
          data: {
            status: 'APPROVED',
            // Yöneticinin girdiği finansal veriler
            isCash: data.isCash,
            paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
            notes: `${txRecord.notes} (Onaylandı: ${user.fullName})`
          }
        });
      }

      return { message: "Fiş onaylandı ve stoklar güncellendi." };
    });
  }
}