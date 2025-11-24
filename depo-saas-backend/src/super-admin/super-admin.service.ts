import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) { }

  // 1. Dashboard İstatistikleri
  async getDashboardStats() {
    // Tüm Tenantları (Şirketleri) Çek + Kullanıcı ve Ürün Sayıları + Plan Bilgisi
    const tenants = await this.prisma.tenant.findMany({
      include: {
        plan: true,
        _count: {
          select: {
            users: true,
            products: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Genel Toplamlar
    const totalUsers = tenants.reduce((acc, t) => acc + t._count.users, 0);
    const totalProducts = tenants.reduce((acc, t) => acc + t._count.products, 0);
    const totalTenants = tenants.length;

    // Plan Dağılımı
    const planDistribution = tenants.reduce((acc, t) => {
      const planName = t.plan?.name || 'Bilinmiyor';
      acc[planName] = (acc[planName] || 0) + 1;
      return acc;
    }, {});

    return {
      overview: { totalTenants, totalUsers, totalProducts, planDistribution },
      tenants: tenants.map(t => ({
        // Tenant modelindeki tüm alanları (adres, telefon vb.) frontend'e gönderiyoruz
        ...t,
        userCount: t._count.users,
        productCount: t._count.products,
      }))
    };
  }

  // 2. Kendini Super Admin Yapma (Geliştirme aracı)
  async promoteToSuperAdmin(email: string) {
    return this.prisma.user.update({
      where: { email },
      data: { role: 'SUPER_ADMIN' }
    });
  }

  // --- PAKET (PLAN) YÖNETİMİ ---

  // Tüm Paketleri Getir (Sıraya Göre)
  async getAllPlans() {
    return this.prisma.subscriptionPlan.findMany({ orderBy: { order: 'asc' } });
  }

  // Paket Oluştur
  async createPlan(data: any) {
    return this.prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        price: Number(data.price),
        maxUsers: Number(data.maxUsers),
        maxProducts: Number(data.maxProducts),
        maxWarehouses: Number(data.maxWarehouses),
        features: data.features,
        isPopular: data.isPopular,
        isActive: data.isActive,
        order: 99 // Varsayılan sıra (sona ekle)
      }
    });
  }

  // Paketi Güncelle
  async updatePlan(id: string, data: any) {
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: data.name,
        price: Number(data.price),
        maxUsers: Number(data.maxUsers),
        maxProducts: Number(data.maxProducts),
        maxWarehouses: Number(data.maxWarehouses),
        features: data.features,
        isPopular: data.isPopular,
        isActive: data.isActive
      }
    });
  }

  // Paket Sıralamasını Güncelle (Sürükle-Bırak)
  async reorderPlans(plans: { id: string, order: number }[]) {
    const updates = plans.map(plan =>
      this.prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: { order: plan.order }
      })
    );
    return await this.prisma.$transaction(updates);
  }

  // Paketi Sil
  async deletePlan(id: string) {
    // Önce bu planı kullanan şirket var mı kontrol et
    const usageCount = await this.prisma.tenant.count({ where: { planId: id } });
    if (usageCount > 0) {
      throw new Error('Bu paketi kullanan şirketler var. Silmeden önce onları başka pakete taşıyın.');
    }
    return this.prisma.subscriptionPlan.delete({ where: { id } });
  }

  // --- ŞİRKET (TENANT) YÖNETİMİ ---

  // Şirket Güncelleme (Detaylı)
  async updateTenant(id: string, data: any) {
    return this.prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        isActive: data.isActive,
        planId: data.planId,
        // Detaylı Bilgiler:
        phone: data.phone,
        address: data.address,
        taxNo: data.taxNo,
        taxOffice: data.taxOffice,
        contactName: data.contactName,
        website: data.website
      }
    });
  }

  // Şirket Silme
  async deleteTenant(id: string) {
    // Cascade delete ayarlı olduğu için ilişkili veriler de silinir
    return this.prisma.tenant.delete({
      where: { id }
    });
  }

  // --- KURUMSAL TALEPLER (ENTERPRISE REQUESTS) ---

  async getEnterpriseRequests() {
    return this.prisma.enterpriseRequest.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateRequestStatus(id: string, status: 'PENDING' | 'CONTACTED' | 'CLOSED') {
    return this.prisma.enterpriseRequest.update({
      where: { id },
      data: { status }
    });
  }
}