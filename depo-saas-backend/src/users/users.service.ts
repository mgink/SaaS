import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  // --- KULLANICI EKLEME ---
  async create(data: any, currentUser: any) {
    // 1. SAAS LİMİT KONTROLÜ
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: currentUser.tenantId },
      include: {
        plan: true,
        _count: { select: { users: true } }
      }
    });

    if (!tenant || !tenant.plan) {
      throw new BadRequestException("Şirket veya abonelik planı bulunamadı.");
    }

    // Limit 0 ise sınırsızdır, değilse kontrol et
    if (tenant.plan.maxUsers > 0 && tenant._count.users >= tenant.plan.maxUsers) {
      throw new BadRequestException(`Kullanıcı limitiniz (${tenant.plan.maxUsers}) doldu. Paketinizi yükseltin.`);
    }

    // 2. Yetki Kontrolü: Şube Yöneticisi
    if (currentUser.role === 'BRANCH_MANAGER') {
      if (data.branchId && data.branchId !== currentUser.branchId && data.branchId !== 'none') {
        throw new ForbiddenException("Sadece kendi şubenize personel ekleyebilirsiniz.");
      }
      // Şube seçilmediyse otomatik ata
      if (!data.branchId || data.branchId === 'none') {
        data.branchId = currentUser.branchId;
      }
      // Yönetici atayamaz
      if (data.role === 'ADMIN' || data.role === 'SUPER_ADMIN') {
        throw new ForbiddenException("Yönetici rolü atayamazsınız.");
      }
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new BadRequestException('Bu email zaten kullanımda.');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,

        // Şube ve Yetkiler
        branchId: data.branchId && data.branchId !== 'none' ? data.branchId : null,
        canCreateProduct: data.canCreateProduct || false,
        autoApprove: data.autoApprove || false,
        tags: data.tags || [],

        tenantId: currentUser.tenantId,
        isPasswordChanged: false
      },
    });
  }

  // --- LİSTELEME ---
  async findAll(currentUser: any) {
    let whereClause: any = { tenantId: currentUser.tenantId };

    // Şube Yöneticisi sadece kendi ekibini görür
    if (currentUser.role === 'BRANCH_MANAGER') {
      whereClause.branchId = currentUser.branchId;
    }

    return this.prisma.user.findMany({
      where: whereClause,
      include: { branch: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  // --- GÜNCELLEME ---
  async update(id: string, data: any, currentUser: any) {
    const updateData: any = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      branchId: data.branchId && data.branchId !== 'none' ? data.branchId : null,
      canCreateProduct: data.canCreateProduct,
      autoApprove: data.autoApprove,
      tags: data.tags
    };

    if (data.password && data.password.length >= 6) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.updateMany({
      where: { id, tenantId: currentUser.tenantId },
      data: updateData
    });
  }

  // --- SİLME ---
  async remove(id: string, currentUser: any) {
    return this.prisma.user.deleteMany({ where: { id, tenantId: currentUser.tenantId } });
  }
}