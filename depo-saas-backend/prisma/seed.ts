import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding işlemi başladı...');

    // 1. Temizlik (Sıra Önemli: Child -> Parent)
    await prisma.notification.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.product.deleteMany();
    await prisma.warehouse.deleteMany();
    await prisma.department.deleteMany();
    await prisma.enterpriseRequest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.subscriptionPlan.deleteMany();

    console.log('🧹 Eski veriler temizlendi.');

    // 2. Paketleri Oluştur
    const plans = [
        {
            code: 'FREE',
            name: 'Ücretsiz Başlangıç',
            price: 0,
            maxUsers: 1,
            maxProducts: 50,
            maxWarehouses: 1,
            features: ['1 Kullanıcı', '50 Ürün Limiti', 'Tek Depo', 'Topluluk Desteği'],
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
            features: ['3 Kullanıcı', '500 Ürün', '2 Şube/Depo', 'E-posta Desteği'],
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
            features: ['10 Kullanıcı', '5.000 Ürün', 'Excel Raporlama', 'Öncelikli Destek', 'Dosya Yükleme'],
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
            features: ['25 Kullanıcı', '50.000 Ürün', 'API Erişimi', '7/24 Canlı Destek', 'Gelişmiş Loglar'],
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
            features: ['Sınırsız Kullanıcı', 'Sınırsız Ürün', 'Özel Sunucu', 'Dedike Müşteri Temsilcisi', 'SLA Anlaşması'],
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

    // Şifre: 123456
    const hashedPassword = await bcrypt.hash('123456', 10);

    const founderTenant = await prisma.tenant.create({
        data: {
            name: 'SaaS Founder HQ',
            subdomain: 'founder',
            // Enterprise paketine bağlayalım
            plan: { connect: { code: 'ENTERPRISE' } },
            isActive: true,
            users: {
                create: {
                    email: 'saas@founder.com',
                    password: hashedPassword,
                    fullName: 'SaaS Patronu',
                    role: 'SUPER_ADMIN'
                }
            }
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