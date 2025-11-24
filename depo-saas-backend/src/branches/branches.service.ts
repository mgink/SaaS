import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) { }

  // Şube Oluştur
  async create(data: any, tenantId: string) {
    // 1. Şirket ve Plan Bilgisini Çek
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: true,
        branches: true
      }
    });

    // TS DÜZELTMESİ: Kontrolleri ayırarak TypeScript'e verinin varlığını garanti ediyoruz
    if (!tenant) {
      throw new BadRequestException("Şirket bilgisi bulunamadı.");
    }

    if (!tenant.plan) {
      throw new BadRequestException("Şirketin aktif bir paketi bulunamadı.");
    }

    // 2. Limit Kontrolü
    // Artık tenant ve tenant.plan kesinlikle dolu, hata vermez.
    if (tenant.plan.maxBranches !== 0 && tenant.branches.length >= tenant.plan.maxBranches) {
      throw new BadRequestException(`Paketinizin şube limiti (${tenant.plan.maxBranches}) doldu. Yeni şube eklemek için paketinizi yükseltin.`);
    }

    // 3. Şube ve Yönetici Oluşturma (Transaction)
    // bcrypt servise dahil olmadığı için burada import edilmeli veya hashleme auth service'e bırakılmalı.
    // Ancak yapıyı bozmamak için burada basit bir create yapıyoruz, yönetici eklemeyi
    // Frontend'den ayrı bir istek veya Auth servisi üzerinden yapmak daha temizdir.
    // Şimdilik sadece şubeyi oluşturuyoruz:

    return this.prisma.branch.create({
      data: {
        name: data.name,
        location: data.location,
        phone: data.phone,
        tenantId: tenantId
      }
    });
  }

  // Şubeleri Listele
  async findAll(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            warehouses: true,
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  // Şube Sil
  async remove(id: string, tenantId: string) {
    return this.prisma.branch.deleteMany({
      where: { id, tenantId }
    });
  }
}