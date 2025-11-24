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
        _count: { select: { transactions: true } } // Kaç işlem yapılmış?
      },
      orderBy: { name: 'asc' }
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
    // İşlem geçmişi varsa silme, pasife al (Veri bütünlüğü için)
    const count = await this.prisma.transaction.count({ where: { supplierId: id } });
    if (count > 0) {
      throw new Error("Bu tedarikçi ile geçmiş işlemler var, silinemez. Pasife alabilirsiniz.");
    }
    return this.prisma.supplier.deleteMany({ where: { id, tenantId } });
  }
}