import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) { }

  async create(data: any, tenantId: string) {
    return this.prisma.supplier.create({
      data: {
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        category: data.category,
        tenantId
      }
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      include: {
        _count: { select: { transactions: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  // YENİ: Tekil Tedarikçi Detayı ve Geçmişi
  async findOne(id: string, tenantId: string) {
    return this.prisma.supplier.findFirst({
      where: { id, tenantId },
      include: {
        // Geçmiş işlemleri getir (En yeniden eskiye)
        transactions: {
          where: { type: 'INBOUND' }, // Sadece mal alımlarını göster
          include: { product: true },
          orderBy: { createdAt: 'desc' }
        },
        // Hangi ürünleri sağlıyor?
        products: true
      }
    });
  }

  async update(id: string, data: any, tenantId: string) {
    return this.prisma.supplier.updateMany({
      where: { id, tenantId },
      data: {
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        category: data.category,
        isActive: data.isActive
      }
    });
  }

  async remove(id: string, tenantId: string) {
    const count = await this.prisma.transaction.count({ where: { supplierId: id } });
    if (count > 0) {
      throw new Error("Bu tedarikçi ile geçmiş işlemler var, silinemez.");
    }
    return this.prisma.supplier.deleteMany({ where: { id, tenantId } });
  }
}