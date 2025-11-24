import { PrismaClient, TransactionType, RequestStatus, Product } from '@prisma/client'; // Product tipini ekledik
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('☕ CAFE ERP: Demo Verisi Yükleniyor...');

    // 1. Temizlik
    await prisma.notification.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.procurementRequest.deleteMany();
    await prisma.productSupplier.deleteMany();
    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.department.deleteMany();
    await prisma.warehouse.deleteMany();
    await prisma.user.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.subscriptionPlan.deleteMany();

    // 2. Paketler
    const plans = [
        { code: 'FREE', name: 'Başlangıç', price: 0, maxUsers: 1, maxProducts: 50, maxWarehouses: 1, maxBranches: 1, features: ['Tek Şube'], order: 1 },
        { code: 'PRO', name: 'Profesyonel', price: 499, maxUsers: 10, maxProducts: 5000, maxWarehouses: 5, maxBranches: 3, features: ['Çoklu Şube', 'Gelişmiş Rapor'], isPopular: true, order: 2 },
        { code: 'ENTERPRISE', name: 'Zincir', price: 0, maxUsers: 0, maxProducts: 0, maxWarehouses: 0, maxBranches: 0, features: ['Sınırsız'], order: 3 }
    ];
    for (const p of plans) await prisma.subscriptionPlan.create({ data: p });

    // 3. Şirket & Patron
    const password = await bcrypt.hash('123456', 10);
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Espresso Lab HQ',
            subdomain: 'espressolab',
            plan: { connect: { code: 'ENTERPRISE' } },
            address: 'Maslak No:1, İstanbul',
            phone: '0212 555 0000'
        }
    });

    // 4. Şubeler
    const branchCenter = await prisma.branch.create({ data: { name: 'Merkez & Roastery', location: 'Maslak', tenantId: tenant.id } });
    const branchKadikoy = await prisma.branch.create({ data: { name: 'Kadıköy Moda', location: 'Moda Cd.', tenantId: tenant.id } });
    const branchBesiktas = await prisma.branch.create({ data: { name: 'Beşiktaş Çarşı', location: 'Çarşı İçi', tenantId: tenant.id } });

    // 5. Kullanıcılar (Patron + Şube Müdürleri)
    const admin = await prisma.user.create({
        data: { email: 'patron@cafe.com', password, fullName: 'Patron', role: 'SUPER_ADMIN', branchId: branchCenter.id, tenantId: tenant.id, isPasswordChanged: true }
    });

    const managerKadikoy = await prisma.user.create({
        data: { email: 'kadikoy@cafe.com', password, fullName: 'Ali Barista', role: 'BRANCH_MANAGER', branchId: branchKadikoy.id, tenantId: tenant.id, isPasswordChanged: true }
    });

    // 6. Depolar
    const whCenter = await prisma.warehouse.create({ data: { name: 'Ana Depo (Çiğ Kahve)', branchId: branchCenter.id, tenantId: tenant.id } });
    const whKadikoy = await prisma.warehouse.create({ data: { name: 'Kadıköy Stok', branchId: branchKadikoy.id, tenantId: tenant.id } });

    // Departmanlar
    const deptRaw = await prisma.department.create({ data: { name: 'Çiğ Çekirdek', warehouseId: whCenter.id, tenantId: tenant.id } });
    const deptBar = await prisma.department.create({ data: { name: 'Bar', warehouseId: whKadikoy.id, tenantId: tenant.id } });
    const deptKitchen = await prisma.department.create({ data: { name: 'Mutfak', warehouseId: whKadikoy.id, tenantId: tenant.id } });

    // 7. Tedarikçiler
    const sup1 = await prisma.supplier.create({ data: { name: 'Probador Co.', category: 'Kahve', tenantId: tenant.id } });
    const sup2 = await prisma.supplier.create({ data: { name: 'Sütaş Kurumsal', category: 'Süt', tenantId: tenant.id } });
    const sup3 = await prisma.supplier.create({ data: { name: 'Metro Toptan', category: 'Genel', tenantId: tenant.id } });
    const sup4 = await prisma.supplier.create({ data: { name: 'Paketleme Dünyası', category: 'Ambalaj', tenantId: tenant.id } });

    // 8. Ürünler
    const productsList = [
        { name: 'Ethiopia Yirgacheffe (Çiğ)', unit: 'KG', items: 1, price: 350, sell: 0, wh: whCenter.id, dept: deptRaw.id, sup: sup1.id, stock: 500, min: 100 },
        { name: 'Tam Yağlı Süt (1L)', unit: 'BOX', items: 12, price: 320, sell: 0, wh: whKadikoy.id, dept: deptBar.id, sup: sup2.id, stock: 10, min: 3 }, // 10 Koli
        { name: 'Yulaf Sütü Barista', unit: 'PIECE', items: 1, price: 85, sell: 0, wh: whKadikoy.id, dept: deptBar.id, sup: sup3.id, stock: 24, min: 6 },
        { name: 'Takeaway Bardak 8oz', unit: 'BOX', items: 1000, price: 1500, sell: 0, wh: whKadikoy.id, dept: deptBar.id, sup: sup4.id, stock: 5, min: 1 },
        { name: 'San Sebastian Cheesecake', unit: 'PIECE', items: 1, price: 600, sell: 1400, wh: whKadikoy.id, dept: deptKitchen.id, sup: sup3.id, stock: 4, min: 1 }, // 4 Bütün pasta
        { name: 'Karamel Şurubu', unit: 'PIECE', items: 1, price: 450, sell: 0, wh: whKadikoy.id, dept: deptBar.id, sup: sup3.id, stock: 6, min: 2 },
        { name: 'Türk Kahvesi (Öğütülmüş)', unit: 'KG', items: 1, price: 400, sell: 900, wh: whKadikoy.id, dept: deptBar.id, sup: sup1.id, stock: 5, min: 2 },
    ];

    // FIX: Array tipini Product[] olarak belirttik
    const createdProducts: Product[] = [];
    for (const p of productsList) {
        const sku = p.name.substring(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
        const prod = await prisma.product.create({
            data: {
                name: p.name, sku, tenantId: tenant.id, createdById: admin.id,
                warehouseId: p.wh, departmentId: p.dept, supplierId: p.sup,
                buyingPrice: p.price, sellingPrice: p.sell,
                minStock: p.min, currentStock: p.stock,
                unitType: p.unit, itemsPerBox: p.items,
                status: 'APPROVED'
            }
        });
        createdProducts.push(prod);

        // Tedarikçi ilişkisi
        await prisma.productSupplier.create({ data: { productId: prod.id, supplierId: p.sup, isMain: true } });
    }

    // 9. Hareketler (Geçmiş 30 Gün)
    for (let i = 0; i < 80; i++) {
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const isInbound = Math.random() > 0.7; // %30 Giriş, %70 Çıkış (Satış)
        const type = isInbound ? 'INBOUND' : 'OUTBOUND';

        // Koli ürünse ve çıkışsa adet bazlı çıkış yapabiliriz, burada basit tutuyoruz
        let qty = Math.floor(Math.random() * 5) + 1;
        if (product.unitType === 'BOX' && type === 'OUTBOUND') qty = 1; // 1 koli çıkış

        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        let isCash = true;
        let isPaid = true;
        // FIX: Date | null tipini belirttik
        let paymentDate: Date | null = null;

        if (isInbound && Math.random() > 0.5) {
            isCash = false;
            isPaid = Math.random() > 0.5; // Bazı borçlar ödenmemiş
            const pDate = new Date();
            pDate.setDate(date.getDate() + 30);
            paymentDate = pDate;
        }

        await prisma.transaction.create({
            data: {
                productId: product.id,
                tenantId: tenant.id,
                createdById: admin.id,
                type,
                quantity: qty,
                status: 'APPROVED',
                createdAt: date,
                supplierId: isInbound ? product.supplierId : null,
                isCash,
                isPaid,
                paymentDate,
                notes: isInbound ? 'Mal Kabul' : 'Günlük Satış/Kullanım'
            }
        });
    }

    // 10. Talepler (Bekleyen Siparişler)
    const pMilk = createdProducts.find(p => p.name.includes('Süt'));
    const pCup = createdProducts.find(p => p.name.includes('Bardak'));

    if (pMilk) {
        await prisma.procurementRequest.create({
            data: {
                productId: pMilk.id, quantity: 5, reason: 'Haftasonu yoğunluğu için',
                requesterId: managerKadikoy.id, tenantId: tenant.id, branchId: branchKadikoy.id,
                status: 'PENDING', type: 'PURCHASE'
            }
        });
        // Bir tane de sipariş verilmiş (Yolda)
        await prisma.procurementRequest.create({
            data: {
                productId: pMilk.id, quantity: 10, reason: 'Aylık Stok',
                requesterId: managerKadikoy.id, tenantId: tenant.id, branchId: branchKadikoy.id,
                status: 'ORDERED', type: 'PURCHASE', deliveryDate: new Date()
            }
        });
    }

    console.log('✅ CAFE ERP SİSTEMİ HAZIR!');
    console.log('👑 Giriş: patron@cafe.com / 123456');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());