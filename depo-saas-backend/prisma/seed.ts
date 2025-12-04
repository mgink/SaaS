import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding işlemi başladı...');

    // 1. TEMİZLİK (Sıra Çok Önemli: Child -> Parent)
    // En uçtaki verilerden başlayarak silmeliyiz.

    await prisma.notification.deleteMany();
    await prisma.transaction.deleteMany();       // Hareketler (Ürüne bağlı)
    await prisma.procurementRequest.deleteMany(); // Talepler (Ürüne bağlı)
    await prisma.purchaseOrderItem.deleteMany();  // Satınalma Sipariş Kalemleri (Ürüne bağlı)
    await prisma.purchaseOrder.deleteMany();      // Satınalma Siparişleri
    await prisma.productSupplier.deleteMany();    // Ürün-Tedarikçi bağı
    await prisma.stockForm.deleteMany();          // ⭐ EKLENDİ: Stok Formları (User'a bağlı)

    await prisma.product.deleteMany();            // Ürünler (Artık silinebilir)

    await prisma.department.deleteMany();         // Departmanlar
    await prisma.warehouse.deleteMany();          // Depolar
    await prisma.supplier.deleteMany();           // Tedarikçiler

    await prisma.enterpriseRequest.deleteMany();
    await prisma.user.deleteMany();               // Kullanıcılar
    await prisma.branch.deleteMany();             // Şubeler
    await prisma.tenant.deleteMany();             // Şirketler
    await prisma.subscriptionPlan.deleteMany();   // Paketler

    console.log('🧹 Eski veriler temizlendi.');

    // 2. Paketleri Oluştur
    const plans = [
        {
            code: 'FREE',
            name: 'Başlangıç',
            price: 0,
            maxUsers: 1,
            maxProducts: 50,
            maxWarehouses: 1,
            maxBranches: 1,
            features: ['Tek Şube', '50 Ürün Limiti', 'Temel Raporlar'],
            isPopular: false,
            order: 1,
            isActive: true
        },
        {
            code: 'STARTER',
            name: 'Esnaf Paketi',
            price: 299,
            maxUsers: 3,
            maxProducts: 500,
            maxWarehouses: 2,
            maxBranches: 1,
            features: ['3 Kullanıcı', '500 Ürün', '2 Depo', 'E-posta Desteği'],
            isPopular: false,
            order: 2,
            isActive: true
        },
        {
            code: 'PRO',
            name: 'KOBİ Pro',
            price: 799,
            maxUsers: 10,
            maxProducts: 5000,
            maxWarehouses: 5,
            maxBranches: 3,
            features: ['10 Kullanıcı', '5.000 Ürün', 'Çoklu Şube', 'Excel Raporlama', 'Öncelikli Destek'],
            isPopular: true,
            order: 3,
            isActive: true
        },
        {
            code: 'BUSINESS',
            name: 'Kurumsal',
            price: 1499,
            maxUsers: 25,
            maxProducts: 50000,
            maxWarehouses: 20,
            maxBranches: 10,
            features: ['25 Kullanıcı', '50.000 Ürün', '10 Şube', 'API Erişimi', '7/24 Canlı Destek', 'Gelişmiş Loglar'],
            isPopular: false,
            order: 4,
            isActive: true
        },
        {
            code: 'ENTERPRISE',
            name: 'Holding / Özel',
            price: 0,
            maxUsers: 0,
            maxProducts: 0,
            maxWarehouses: 0,
            maxBranches: 0,
            features: ['Sınırsız Kullanıcı', 'Sınırsız Ürün', 'Sınırsız Şube', 'Özel Sunucu', 'Dedike Müşteri Temsilcisi', 'SLA Anlaşması'],
            isPopular: false,
            order: 5,
            isActive: true
        }
    ];

    for (const plan of plans) {
        await prisma.subscriptionPlan.create({ data: plan });
    }
    console.log('✅ Paketler oluşturuldu.');

    // 3. SUPER ADMIN ŞİRKETİ VE KULLANICISI
    const hashedPassword = await bcrypt.hash('123456', 10);

    const founderTenant = await prisma.tenant.create({
        data: {
            name: 'SaaS Founder HQ',
            subdomain: 'founder',
            plan: { connect: { code: 'ENTERPRISE' } },
            isActive: true,
        }
    });

    // Merkez Şube Oluştur (Super Admin için)
    const founderBranch = await prisma.branch.create({
        data: {
            name: 'HQ Center',
            tenantId: founderTenant.id
        }
    });

    // Kullanıcıyı Oluştur
    await prisma.user.create({
        data: {
            email: 'saas@founder.com',
            password: hashedPassword,
            fullName: 'SaaS Patronu',
            role: 'SUPER_ADMIN',
            tenantId: founderTenant.id,
            branchId: founderBranch.id,
            isPasswordChanged: true
        }
    });

    console.log(`👑 Süper Admin oluşturuldu: saas@founder.com / 123456`);
    console.log('🚀 Seed işlemi başarıyla tamamlandı!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });