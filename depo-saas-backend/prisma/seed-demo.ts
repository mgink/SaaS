import { PrismaClient, TransactionType, RequestStatus, Product, Supplier, OrderStatus, ProcurementStatus, RequestType as RequestTypeEnum, ProductStatus, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// --- YARDIMCI FONKSİYONLAR ---
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Rastgele Ürün İsimleri Oluşturucu
const ADJECTIVES = ['Premium', 'Organik', 'Ekonomik', 'Gurme', 'Vegan', 'Glutensiz', 'Klasik', 'Gold', 'Special', 'Barista'];
const NOUNS = ['Espresso Çekirdek', 'Filtre Kahve', 'Tam Yağlı Süt', 'Yulaf Sütü', 'Badem Sütü', 'Karamel Şurup', 'Vanilya Şurup', 'Çikolata Sos', 'Beyaz Çikolata', 'Chai Tea'];
const PACKAGING = ['8oz Bardak', '12oz Bardak', '16oz Bardak', 'Pipet', 'Peçete', 'Taşıma Kabı', 'Karton Tutacak', 'Plastik Kapak'];
const FOOD = ['Cheesecake', 'Brownie', 'Cookie', 'Kruvasan', 'Sandviç', 'Panini', 'Muffin', 'Tiramisu'];

const generateProductName = (category: 'COFFEE' | 'MILK' | 'PACKAGING' | 'FOOD') => {
    if (category === 'COFFEE') return `${getRandomItem(ADJECTIVES)} ${getRandomItem(NOUNS)}`;
    if (category === 'PACKAGING') return `${getRandomItem(PACKAGING)} (${getRandomInt(50, 100)}'lü Paket)`;
    if (category === 'FOOD') return `${getRandomItem(ADJECTIVES)} ${getRandomItem(FOOD)}`;
    return `${getRandomItem(ADJECTIVES)} Ürün`;
};

async function main() {
    console.log('🔥 KAOS MODU BAŞLATILIYOR: Devasa Veri Yükleniyor...');
    const startTime = Date.now();

    // 1. TEMİZLİK
    // =====================================================================================
    await prisma.notification.deleteMany();
    await prisma.log.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.stockForm.deleteMany(); // StockForm temizliği eklendi
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.procurementRequest.deleteMany();
    await prisma.productSupplier.deleteMany();
    await prisma.product.deleteMany();
    await prisma.department.deleteMany();
    await prisma.warehouse.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.enterpriseRequest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.subscriptionPlan.deleteMany();
    console.log('🧹 Temizlik tamamlandı.');

    // 2. SİSTEM KURULUMU (Paketler & Şirket)
    // =====================================================================================
    const plans = [
        { code: 'FREE', name: 'Başlangıç', price: 0, maxUsers: 1, maxProducts: 50, maxWarehouses: 1, maxBranches: 1, features: ['Tek Şube'], order: 1, isActive: true },
        { code: 'PRO', name: 'Profesyonel', price: 499, maxUsers: 10, maxProducts: 5000, maxWarehouses: 5, maxBranches: 3, features: ['Çoklu Şube'], isPopular: true, order: 2, isActive: true },
        { code: 'ENTERPRISE', name: 'Zincir', price: 0, maxUsers: 0, maxProducts: 0, maxWarehouses: 0, maxBranches: 0, features: ['Sınırsız'], order: 3, isActive: true }
    ];
    for (const p of plans) await prisma.subscriptionPlan.create({ data: p });

    const password = await bcrypt.hash('123456', 10);
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Grand Coffee Chain HQ',
            subdomain: 'grandcoffee',
            plan: { connect: { code: 'ENTERPRISE' } },
            address: 'Levent Plaza No:1, İstanbul',
            phone: '0850 222 33 44',
            taxNo: '1234567890',
            isActive: true
        }
    });

    // 3. ŞUBELER VE PERSONEL (5 Şube, 25+ Personel)
    // =====================================================================================
    const branchesData = [
        { name: 'Merkez Depo & Lojistik', location: 'İkitelli OSB' },
        { name: 'Kadıköy Rıhtım', location: 'Kadıköy' },
        { name: 'Beşiktaş Çarşı', location: 'Beşiktaş' },
        { name: 'Nişantaşı Flagship', location: 'Şişli' },
        { name: 'Karaköy Sahil', location: 'Beyoğlu' }
    ];

    const branches: any[] = [];
    const allUsers: User[] = [];

    // Süper Admin
    const superAdmin = await prisma.user.create({
        data: { email: 'admin@grandcoffee.com', password, fullName: 'CEO Patron', role: 'SUPER_ADMIN', tenantId: tenant.id, isPasswordChanged: true, canCreateProduct: true, autoApprove: true }
    });
    allUsers.push(superAdmin);

    for (const [index, bData] of branchesData.entries()) {
        // Şube Oluştur
        const branch = await prisma.branch.create({ data: { ...bData, tenantId: tenant.id } });
        branches.push(branch);

        // Şube Müdürü Oluştur
        const manager = await prisma.user.create({
            data: {
                email: `manager${index + 1}@grandcoffee.com`,
                password,
                fullName: `Müdür ${bData.name.split(' ')[0]}`,
                role: 'BRANCH_MANAGER',
                branchId: branch.id,
                tenantId: tenant.id,
                isPasswordChanged: true,
                canCreateProduct: true,
                autoApprove: true
            }
        });
        allUsers.push(manager);

        // 4 Adet Personel Oluştur
        for (let i = 1; i <= 4; i++) {
            const staff = await prisma.user.create({
                data: {
                    email: `staff${index + 1}_${i}@grandcoffee.com`,
                    password,
                    fullName: `Personel ${bData.name.split(' ')[0]} ${i}`,
                    role: 'STAFF',
                    branchId: branch.id,
                    tenantId: tenant.id,
                    isPasswordChanged: true,
                    canCreateProduct: false,
                    autoApprove: false // Otomatik onay yok, talep oluşturacaklar
                }
            });
            allUsers.push(staff);
        }
    }
    console.log(`🏢 5 Şube ve ${allUsers.length} Personel oluşturuldu.`);

    // 4. DEPOLAR VE DEPARTMANLAR
    // =====================================================================================
    const warehouses: any[] = [];
    const departments: any[] = [];

    for (const branch of branches) {
        // Her şubeye 2 depo (Ana Depo, Soğuk Hava)
        const whMain = await prisma.warehouse.create({ data: { name: `${branch.name} - Ana Depo`, branchId: branch.id, tenantId: tenant.id } });
        const whCold = await prisma.warehouse.create({ data: { name: `${branch.name} - Soğuk Hava`, branchId: branch.id, tenantId: tenant.id } });
        warehouses.push(whMain, whCold);

        // Departmanlar
        const d1 = await prisma.department.create({ data: { name: `${branch.name} - Bar Arkası`, warehouseId: whMain.id, tenantId: tenant.id } });
        const d2 = await prisma.department.create({ data: { name: `${branch.name} - Paketleme`, warehouseId: whMain.id, tenantId: tenant.id } });
        const d3 = await prisma.department.create({ data: { name: `${branch.name} - Mutfak`, warehouseId: whCold.id, tenantId: tenant.id } });
        departments.push(d1, d2, d3);
    }

    // 5. TEDARİKÇİLER (20 Adet)
    // =====================================================================================
    const suppliers: Supplier[] = [];
    const supplierNames = [
        'Probador Co.', 'Sütaş Kurumsal', 'Metro Toptan', 'Paketleme Dünyası', 'Halil Usta Pastanesi',
        'Nestle Professional', 'Coca Cola İçecek', 'Eti Gıda', 'Dimes Meyve Suları', 'Pınar Süt',
        'Uno Ekmek', 'Beypazarı Maden Suyu', 'Doğuş Çay', 'Kuru Kahveci Mehmet Efendi', 'Callebaut Çikolata',
        'Monin Şurupları', 'Fabbri Sosları', 'Seyidoğlu Gıda', 'Namet Gıda', 'SuperFresh'
    ];

    for (const name of supplierNames) {
        const s = await prisma.supplier.create({
            data: {
                name,
                contactName: `Satış Temsilcisi ${name.split(' ')[0]}`,
                phone: `05${getRandomInt(30, 55)} ${getRandomInt(100, 999)} 0000`,
                email: `info@${name.replace(/\s/g, '').toLowerCase()}.com`,
                tenantId: tenant.id,
                category: 'Genel'
            }
        });
        suppliers.push(s);
    }
    console.log(`🚚 ${suppliers.length} Tedarikçi oluşturuldu.`);

    // 6. ÜRÜNLER (Her şube için yüzlerce ürün - Toplamda 500+)
    // =====================================================================================
    const allProducts: Product[] = [];

    for (const branch of branches) {
        const branchWarehouses = warehouses.filter(w => w.branchId === branch.id);
        const productCountForBranch = getRandomInt(100, 120);

        for (let i = 0; i < productCountForBranch; i++) {
            const wh = getRandomItem(branchWarehouses);
            const dept = departments.find(d => d.warehouseId === wh.id) || getRandomItem(departments);
            const sup = getRandomItem(suppliers);

            const categoryChoice = Math.random();
            let category: any = 'COFFEE';
            if (categoryChoice > 0.7) category = 'PACKAGING';
            else if (categoryChoice > 0.4) category = 'FOOD';

            const name = generateProductName(category);

            const uniqueSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
            const sku = `${branch.name.substring(0, 2).toUpperCase()}-${name.substring(0, 3).toUpperCase()}-${uniqueSuffix}`;

            const price = getRandomInt(50, 500);
            const minStock = getRandomInt(5, 20);
            const isCritical = Math.random() > 0.85;
            const stock = isCritical ? getRandomInt(0, minStock - 1) : getRandomInt(minStock + 5, 200);

            const barcode = `869${Math.floor(Date.now() + Math.random() * 1000000).toString().slice(-9)}`;

            const product = await prisma.product.create({
                data: {
                    name,
                    sku,
                    barcode,
                    tenantId: tenant.id,
                    createdById: superAdmin.id,
                    warehouseId: wh.id,
                    departmentId: dept.id,
                    supplierId: sup.id,
                    buyingPrice: price,
                    sellingPrice: Math.round(price * 1.4),
                    minStock,
                    currentStock: stock,
                    unitType: category === 'PACKAGING' ? 'BOX' : 'PIECE',
                    itemsPerBox: category === 'PACKAGING' ? getRandomInt(50, 500) : 1,
                    status: Math.random() > 0.95 ? 'PENDING' : 'APPROVED'
                }
            });
            allProducts.push(product);

            if (product.status === 'APPROVED') {
                await prisma.productSupplier.create({
                    data: { productId: product.id, supplierId: sup.id, isMain: true }
                });
            }
        }
    }
    console.log(`🛒 ${allProducts.length} Ürün oluşturuldu.`);

    // 7. GEÇMİŞ İŞLEMLER (TRANSACTIONS - 1 Yıllık Veri)
    // =====================================================================================
    const transactionCount = 2000;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const transactions: any[] = [];

    console.log(`🔄 ${transactionCount} işlem geçmişi oluşturuluyor (Bu biraz sürebilir)...`);

    for (let i = 0; i < transactionCount; i++) {
        const approvedProducts = allProducts.filter(p => p.status === 'APPROVED');
        const product = getRandomItem(approvedProducts);
        if (!product) continue;

        const date = randomDate(oneYearAgo, new Date());

        const rand = Math.random();
        let type: TransactionType = 'OUTBOUND';
        if (rand > 0.65) type = 'INBOUND';
        if (rand > 0.95) type = 'WASTAGE';

        let qty = getRandomInt(1, 10);
        if (product.unitType === 'BOX' && type !== 'INBOUND') qty = 1;

        let isCash = true;
        let isPaid = true;
        let paymentDate: Date | null = null;

        if (type === 'INBOUND' && Math.random() > 0.4) {
            isCash = false;
            if (Math.random() > 0.7) {
                isPaid = false;
                const pastDue = new Date(date);
                pastDue.setDate(pastDue.getDate() + 15);
                paymentDate = pastDue;
            } else {
                isPaid = true;
                paymentDate = new Date(date);
            }
        }

        transactions.push(prisma.transaction.create({
            data: {
                productId: product.id,
                tenantId: tenant.id,
                createdById: superAdmin.id,
                type,
                quantity: qty,
                status: 'APPROVED',
                createdAt: date,
                updatedAt: date,
                supplierId: type === 'INBOUND' ? product.supplierId : null,
                isCash,
                isPaid,
                paymentDate,
                notes: type === 'WASTAGE' ? 'Kırılma/Bozulma' : 'Otomatik İşlem',
                batchNumber: type === 'INBOUND' ? `LOT-${getRandomInt(1000, 9999)}` : null
            }
        }));

        if (transactions.length >= 100) {
            await prisma.$transaction(transactions);
            transactions.length = 0;
        }
    }
    if (transactions.length > 0) await prisma.$transaction(transactions);

    // 8. STOK FİŞLERİ (StockForm)
    // =====================================================================================
    console.log('📄 Stok Fişleri oluşturuluyor...');
    for (let i = 0; i < 25; i++) {
        const date = randomDate(oneYearAgo, new Date());
        const type: TransactionType = Math.random() > 0.5 ? 'INBOUND' : 'OUTBOUND';
        const supplier = getRandomItem(suppliers);
        const formNumber = `SF-${type === 'INBOUND' ? 'IN' : 'OUT'}-${getRandomInt(10000, 99999)}`;

        // Fiş başlığı
        const stockForm = await prisma.stockForm.create({
            data: {
                formNumber,
                type,
                tenantId: tenant.id,
                createdById: superAdmin.id,
                createdAt: date,
                updatedAt: date,
                supplierId: type === 'INBOUND' ? supplier.id : null,
                notes: 'Toplu işlem fişi (Demo)',
                waybillNo: `IRS-${getRandomInt(100000, 999999)}`,
                waybillDate: date
            }
        });

        // Fişe ait 3-10 kalem ürün ekle
        const itemsCount = getRandomInt(3, 10);
        for (let j = 0; j < itemsCount; j++) {
            const product = getRandomItem(allProducts.filter(p => p.status === 'APPROVED'));
            if (!product) continue;

            const qty = getRandomInt(5, 50);

            // İşlemi ekle ve forma bağla
            await prisma.transaction.create({
                data: {
                    productId: product.id,
                    tenantId: tenant.id,
                    createdById: superAdmin.id,
                    type,
                    quantity: qty,
                    status: 'APPROVED',
                    createdAt: date,
                    updatedAt: date,
                    stockFormId: stockForm.id, // <--- Fişe bağla
                    isCash: true, // Basit tutuyoruz
                    isPaid: true,
                    notes: `Fiş: ${formNumber}`
                }
            });
        }
    }


    // 9. AKTİF KAOS (Bekleyen Talepler ve Siparişler)
    // =====================================================================================
    for (let i = 0; i < 15; i++) {
        const user = getRandomItem(allUsers.filter((u: User) => u.role === 'STAFF'));
        const product = getRandomItem(allProducts.filter((p: Product) => p.warehouseId));
        if (!product || !user) continue;

        await prisma.procurementRequest.create({
            data: {
                productId: product.id,
                quantity: getRandomInt(5, 50),
                reason: getRandomItem(['Stok bitiyor', 'Müşteri siparişi', 'Haftasonu hazırlığı', 'Acil ihtiyaç']),
                requesterId: user.id,
                branchId: user.branchId,
                tenantId: tenant.id,
                status: 'PENDING',
                type: 'PURCHASE'
            }
        });
    }

    for (let i = 0; i < 8; i++) {
        const supplier = getRandomItem(suppliers);
        const prod = getRandomItem(allProducts.filter((p: Product) => p.supplierId === supplier.id));

        if (prod) {
            await prisma.purchaseOrder.create({
                data: {
                    orderNumber: `PO-2025-${getRandomInt(1000, 9999)}`,
                    status: 'ORDERED',
                    supplierId: supplier.id,
                    tenantId: tenant.id,
                    createdById: superAdmin.id,
                    expectedDate: new Date(new Date().getTime() + 86400000 * getRandomInt(1, 7)),
                    items: {
                        create: [
                            { productId: prod.id, quantityExpected: getRandomInt(10, 100), unitPrice: prod.buyingPrice }
                        ]
                    }
                }
            });
        }
    }

    const endTime = Date.now();
    console.log(`✅ SİMÜLASYON TAMAMLANDI! (${((endTime - startTime) / 1000).toFixed(2)} saniye)`);
    console.log('---------------------------------------------------');
    console.log('👑 Giriş: admin@grandcoffee.com / 123456');
    console.log('---------------------------------------------------');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => await prisma.$disconnect());