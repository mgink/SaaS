import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) { }

  // 1. Sipariş Oluştur (Çoklu Ürün)
  async create(data: any, user: any) {
    // data.items = [{ productId: '...', quantity: 10, unitPrice: 100 }]

    // Sipariş No Üret (PO-TIMESTAMP)
    const orderNumber = `PO-${Date.now().toString().slice(-6)}`;

    return this.prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        status: 'ORDERED',
        tenantId: user.tenantId,
        createdById: user.userId,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId,
            quantityExpected: Number(item.quantity),
            unitPrice: Number(item.unitPrice)
          }))
        }
      },
      include: { items: true }
    });
  }

  // 2. Listele
  async findAll(tenantId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: {
        supplier: true,
        items: { include: { product: true } },
        createdBy: { select: { fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 3. Detay Getir
  async findOne(id: string) {
    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true } }
      }
    });
  }

  // 4. MAL KABUL İŞLEMİ (Critical Part)
  async receiveGoods(id: string, data: { items: { id: string, received: number, notes?: string }[] }, user: any) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: { include: { product: true } } }
      });
      if (!order) throw new BadRequestException("Sipariş bulunamadı.");

      let isAllCompleted = true;

      for (const receivedItem of data.items) {
        const originalItem = order.items.find(i => i.id === receivedItem.id);
        if (!originalItem) continue;

        const qty = Number(receivedItem.received);
        if (qty <= 0) continue; // 0 giriş yapıldıysa işlem yapma

        // A. PO Item Güncelle
        const newReceivedTotal = originalItem.quantityReceived + qty;
        await tx.purchaseOrderItem.update({
          where: { id: originalItem.id },
          data: {
            quantityReceived: newReceivedTotal,
            notes: receivedItem.notes ? `${originalItem.notes || ''} | ${receivedItem.notes}` : originalItem.notes
          }
        });

        // B. Stok Hareketi Oluştur (INBOUND)
        // Eğer personel ise PENDING, yönetici ise APPROVED yapabiliriz.
        // Şimdilik akışı hızlandırmak için APPROVED yapıyoruz, çünkü sipariş zaten önceden onaylanmış.
        await tx.transaction.create({
          data: {
            type: 'INBOUND',
            quantity: qty,
            productId: originalItem.productId,
            tenantId: user.tenantId,
            createdById: user.userId,
            supplierId: order.supplierId,
            status: 'APPROVED', // Mal fiziksel olarak geldiği için onaylı
            waybillNo: `PO-GİRİŞ-${order.orderNumber}`,
            notes: `Siparişten Mal Kabul (${order.orderNumber}) - ${receivedItem.notes || ''}`,
            isCash: false, // Cari çalışılıyor varsayımı
            isPaid: false
          }
        });

        // C. Ürün Stoğunu Artır
        await tx.product.update({
          where: { id: originalItem.productId },
          data: { currentStock: { increment: qty } }
        });

        // Sipariş tamamen bitti mi kontrolü
        if (newReceivedTotal < originalItem.quantityExpected) {
          isAllCompleted = false;
        }
      }

      // D. Sipariş Durumunu Güncelle
      // Eğer tüm kalemler tam geldiyse COMPLETED, eksik varsa PARTIAL
      const allItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
      const reallyCompleted = allItems.every(i => i.quantityReceived >= i.quantityExpected);

      await tx.purchaseOrder.update({
        where: { id },
        data: { status: reallyCompleted ? 'COMPLETED' : 'PARTIAL' }
      });

      return { success: true };
    });
  }
}