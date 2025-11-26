import { PrismaClient, TransactionType, RequestStatus, Product, Supplier, OrderStatus, ProcurementStatus, RequestType as RequestTypeEnum, ProductStatus, Role, User, Warehouse, Department } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// --- YARDIMCI FONKSİYONLAR ---
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Rastgele Veri Listeleri
const FIRST_NAMES = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Mustafa', 'Zeynep', 'Emre', 'Selin', 'Can', 'Elif', 'Burak', 'Ceren', 'Deniz', 'Gamze', 'Hakan', 'İrem', 'Kaan', 'Leyla', 'Mert', 'Nur', 'Oğuz', 'Pelin', 'Rüzgar', 'Seda', 'Tolga', 'Umut', 'Volkan', 'Yağmur', 'Zafer', 'Buse', 'Cem', 'Derya', 'Eren', 'Fulya', 'Gökhan', 'Hande', 'İlker', 'Jale', 'Kerem', 'Melis'];
const LAST_NAMES = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Korkmaz', 'Özcan', 'Çakır', 'Erdoğan', 'Yavuz', 'Can', 'Acar', 'Şen', 'Aksoy'];
const BRANCH_LOCATIONS = ['Kadıköy Rıhtım', 'Beşiktaş Çarşı', 'Nişantaşı', 'Karaköy', 'Moda', 'Bağdat Caddesi', 'Etiler', 'Bebek', 'Ortaköy', 'Üsküdar', 'Ataşehir', 'Maslak', 'Levent', 'Taksim', 'Şişhane', 'Göktürk', 'Kemerburgaz', 'Florya', 'Bakırköy', 'Cihangir', 'Galata'];
const SUPPLIER_DATA = [
    { name: 'Probador Co.', category: 'Kahve' }, { name: 'Sütaş Kurumsal', category: 'Süt' }, { name: 'Metro Toptan', category: 'Genel' }, { name: 'Paketleme Dünyası', category: 'Ambalaj' }, { name: 'Halil Usta Pastanesi', category: 'Gıda' }, { name: 'Nestle Professional', category: 'Kahve' }, { name: 'Coca Cola İçecek', category: 'İçecek' }, { name: 'Eti Gıda', category: 'Gıda' }, { name: 'Dimes', category: 'İçecek' }, { name: 'Pınar Süt', category: 'Süt' }, { name: 'Uno Ekmek', category: 'Gıda' }, { name: 'Beypazarı', category: 'İçecek' }, { name: 'Doğuş Çay', category: 'İçecek' }, { name: 'Mehmet Efendi', category: 'Kahve' }, { name: 'Callebaut', category: 'Gıda' }, { name: 'Monin', category: 'Şurup' }, { name: 'Fabbri', category: 'Sos' }, { name: 'Seyidoğlu', category: 'Gıda' }, { name: 'Namet', category: 'Gıda' }, { name: 'SuperFresh', category: 'Donuk' }
];
const PRODUCT_TEMPLATES = [
    { name: 'Espresso Blend', unit: 'KG', price: 450, cat: 'Kahve' }, { name: 'Tam Yağlı Süt', unit: 'BOX', items: 12, price: 320, cat: 'Süt' }, { name: 'Yulaf Sütü', unit: 'PIECE', price: 85, cat: 'Süt' }, { name: 'Karton Bardak 8oz', unit: 'BOX', items: 1000, price: 1500, cat: 'Ambalaj' }, { name: 'Cheesecake', unit: 'PIECE', price: 600, cat: 'Gıda' }, { name: 'Karamel Şurubu', unit: 'PIECE', price: 450, cat: 'Şurup' }, { name: 'Filtre Kahve', unit: 'KG', price: 380, cat: 'Kahve' }, { name: 'Sandviç Ekmek', unit: 'PIECE', price: 15, cat: 'Gıda' }, { name: 'Pipet Siyah', unit: 'BOX', items: 500, price: 120, cat: 'Ambalaj' }, { name: 'Peçete', unit: 'BOX', items: 100, price: 50, cat: 'Ambalaj' }, { name: 'Çikolata Sos', unit: 'PIECE', price: 250, cat: 'Sos' }, { name: 'Muffin', unit: 'PIECE', price: 45, cat: 'Gıda' }, { name: 'Croissant', unit: 'PIECE', price: 35, cat: 'Gıda' }, { name: 'Badem Sütü', unit: 'PIECE', price: 95, cat: 'Süt' }, { name: 'Türk Kahvesi', unit: 'KG', price: 400, cat: 'Kahve' }, { name: 'Limonata', unit: 'PIECE', price: 60, cat: 'İçecek' }, { name: 'Soda', unit: 'BOX', items: 24, price: 240, cat: 'İçecek' }, { name: 'Esmer Şeker', unit: 'KG', price: 80, cat: 'Gıda' }, { name: 'Beyaz Şeker', unit: 'KG', price: 60, cat: 'Gıda' }, { name: 'Temizlik Bezi', unit: 'PIECE', price: 20, cat: 'Temizlik' }, { name: 'Bulaşık Deterjanı', unit: 'PIECE', price: 150, cat: 'Temizlik' }, { name: 'El Sabunu', unit: 'PIECE', price: 80, cat: 'Temizlik' }, { name: 'Çöp Torbası', unit: 'BOX', items: 50, price: 90, cat: 'Ambalaj' }
];
const REQUEST_REASONS = [
    'Stok kritik seviyede', 'Müşteri özel siparişi', 'Haftasonu yoğunluğu beklentisi',
    'Ürün bozuk çıktı, telafi lazım', 'Barista eğitimi için ekstra', 'Yeni menü denemesi',
    'Tedarikçi kampanyası var', 'Acil durum stoku', 'Raf ömrü dolmak üzere', 'Sezonluk yoğunluk'
];
const ADMIN_NOTES = [
    'Onaylandı, siparişe eklenecek', 'Bütçe aşımı nedeniyle reddedildi', 'Depoda var, transfer edilecek',
    'Beklemeye alındı', 'Tedarikçi ile görüşülüyor', 'Aciliyeti doğrulandı', 'Muadil ürün önerildi'
];

// EKSİK OLAN LİSTELER EKLENDİ
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
    console.log('🧹 Veritabanı temizleniyor...');
    const tablenames = ['Notification', 'Log', 'Transaction', 'StockForm', 'PurchaseOrderItem', 'PurchaseOrder', 'ProcurementRequest', 'ProductSupplier', 'Product', 'Department', 'Warehouse', 'Supplier', 'EnterpriseRequest', 'User', 'Branch', 'Tenant', 'SubscriptionPlan'];
    for (const tableName of tablenames) {
        try { await (prisma as any)[tableName].deleteMany(); } catch (e) { }
    }

    // 2. SİSTEM KURULUMU
    const plans = [
        { code: 'ENTERPRISE', name: 'Zincir', price: 0, maxUsers: 0, maxProducts: 0, maxWarehouses: 0, maxBranches: 0, features: ['Sınırsız'], order: 3, isActive: true }
    ];
    await prisma.subscriptionPlan.create({ data: plans[0] });

    const password = await bcrypt.hash('123456', 10);
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Urban Brew Lab',
            subdomain: 'urbanbrew',
            plan: { connect: { code: 'ENTERPRISE' } },
            address: 'Kanyon Ofis, İstanbul',
            phone: '0850 333 99 88',
            isActive: true
        }
    });
    const generateName = () => {
        const first = getRandomItem(FIRST_NAMES);
        const last = getRandomItem(LAST_NAMES);
        return `${first} ${last}`;
    };

    // 3. TEDARİKÇİLER
    console.log('🚚 Tedarikçiler oluşturuluyor...');
    const suppliers: Supplier[] = [];
    for (const sData of SUPPLIER_DATA) {
        const s = await prisma.supplier.create({ data: { ...sData, tenantId: tenant.id, contactName: generateName(), phone: `05${getRandomInt(30, 55)} ${getRandomInt(100, 999)} 0000`, email: `info@${sData.name.substring(0, 5).trim().toLowerCase()}.com` } });
        suppliers.push(s);
    }

    // 4. ŞUBELER VE PERSONEL
    console.log('🏢 20 Şube ve Personeller kuruluyor...');
    const branches: any[] = [];
    const allUsers: User[] = [];

    const admin = await prisma.user.create({
        data: { email: 'admin@urbanbrew.com', password, fullName: 'CEO Patron', role: 'SUPER_ADMIN', tenantId: tenant.id, isPasswordChanged: true, canCreateProduct: true, autoApprove: true }
    });
    allUsers.push(admin);

    for (let i = 0; i < BRANCH_LOCATIONS.length; i++) {
        const branchName = BRANCH_LOCATIONS[i];
        const branch = await prisma.branch.create({ data: { name: branchName, location: 'İstanbul', tenantId: tenant.id } });
        branches.push(branch);

        const manager = await prisma.user.create({
            data: { email: `manager.${i + 1}@urbanbrew.com`, password, fullName: generateName(), role: 'BRANCH_MANAGER', branchId: branch.id, tenantId: tenant.id, isPasswordChanged: true, canCreateProduct: true, autoApprove: true, tags: ['Yönetici'] }
        });
        allUsers.push(manager);

        const roles = [{ count: 4, tag: 'Barista' }, { count: 2, tag: 'Mutfak' }, { count: 4, tag: 'Steward' }];
        for (const r of roles) {
            for (let j = 0; j < r.count; j++) {
                const staff = await prisma.user.create({
                    data: { email: `staff.${i + 1}.${r.tag.toLowerCase()}${j + 1}@urbanbrew.com`, password, fullName: generateName(), role: 'STAFF', branchId: branch.id, tenantId: tenant.id, isPasswordChanged: true, canCreateProduct: false, autoApprove: false, tags: [r.tag] }
                });
                allUsers.push(staff);
            }
        }
    }

    // 5. DEPOLAR VE DEPARTMANLAR
    const warehouses: Warehouse[] = [];
    const departments: Department[] = [];

    for (const branch of branches) {
        const whMain = await prisma.warehouse.create({ data: { name: `${branch.name} - Ana Depo`, branchId: branch.id, tenantId: tenant.id } });
        const whCold = await prisma.warehouse.create({ data: { name: `${branch.name} - +4 Dolap`, branchId: branch.id, tenantId: tenant.id } });
        const whFreeze = await prisma.warehouse.create({ data: { name: `${branch.name} - -18 Buzluk`, branchId: branch.id, tenantId: tenant.id } });
        warehouses.push(whMain, whCold, whFreeze);

        const d1 = await prisma.department.create({ data: { name: `${branch.name} - Bar Arkası`, warehouseId: whMain.id, tenantId: tenant.id } });
        const d2 = await prisma.department.create({ data: { name: `${branch.name} - Paketleme`, warehouseId: whMain.id, tenantId: tenant.id } });
        const d3 = await prisma.department.create({ data: { name: `${branch.name} - Mutfak`, warehouseId: whCold.id, tenantId: tenant.id } });
        departments.push(d1, d2, d3);
    }

    // 6. ÜRÜNLER
    const allProducts: Product[] = [];

    for (const branch of branches) {
        const branchWarehouses = warehouses.filter(w => w.branchId === branch.id);
        const productCountForBranch = getRandomInt(35, 50);

        for (let i = 0; i < productCountForBranch; i++) {
            // Rastgele isim veya template kullanımı
            const useTemplate = Math.random() > 0.5;
            let name = '', category = 'COFFEE', price = 0, unit = 'PIECE', items = 1;
            let supplierId = '';

            if (useTemplate) {
                const template = getRandomItem(PRODUCT_TEMPLATES);
                name = `${template.name} ${['A', 'B', 'C'][i % 3]}`;
                category = template.cat;
                price = template.price;
                unit = template.unit;
                items = template.items || 1;
            } else {
                // Tamamen rastgele
                const categoryChoice = Math.random();
                if (categoryChoice > 0.7) category = 'PACKAGING';
                else if (categoryChoice > 0.4) category = 'FOOD';
                name = generateProductName(category as any);
                price = getRandomInt(50, 500);
                unit = category === 'PACKAGING' ? 'BOX' : 'PIECE';
                items = category === 'PACKAGING' ? getRandomInt(50, 500) : 1;
            }

            const supplier = getRandomItem(suppliers.filter((s: any) => s.category === category || s.category === 'Genel')) || getRandomItem(suppliers);
            supplierId = supplier.id;

            let whId = branchWarehouses[0].id;
            let deptId = departments.find(d => d.warehouseId === whId)?.id;

            if (['Süt', 'İçecek', 'Sos'].includes(category)) { whId = branchWarehouses[1].id; }
            if (['Gıda', 'Donuk'].includes(category)) { whId = branchWarehouses[2].id; }

            const uniqueSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
            const sku = `${branch.name.substring(0, 2).toUpperCase()}-${name.substring(0, 3).toUpperCase()}-${uniqueSuffix}`;
            const barcode = `869${Math.floor(Date.now() + Math.random() * 1000000).toString().slice(-9)}`;

            // KAOS: Stok Sorunu Olan Ürünler (%15)
            const isCritical = Math.random() > 0.85;
            const minStock = getRandomInt(10, 50);
            const currentStock = isCritical ? getRandomInt(0, minStock - 1) : getRandomInt(minStock + 10, 300);

            const product = await prisma.product.create({
                data: {
                    name,
                    sku,
                    barcode,
                    tenantId: tenant.id,
                    createdById: admin.id,
                    warehouseId: whId,
                    departmentId: deptId,
                    supplierId: supplier.id,
                    buyingPrice: price,
                    sellingPrice: Math.round(price * 2.5),
                    minStock,
                    currentStock,
                    unitType: unit,
                    itemsPerBox: items,
                    status: (Math.random() > 0.95 ? 'PENDING' : 'APPROVED') as ProductStatus,
                    batchNumber: `BATCH-${getRandomInt(2023, 2025)}-${getRandomInt(10, 99)}`
                }
            });
            allProducts.push(product);

            if (product.status === 'APPROVED') {
                await prisma.productSupplier.create({ data: { productId: product.id, supplierId: supplier.id, isMain: true } });
            }
        }
    }
    console.log(`🛒 ${allProducts.length} Ürün oluşturuldu.`);

    // 7. İŞLEMLER (20.000 Hareket)
    console.log('🔄 20.000 İşlem ve Finansal Kayıt oluşturuluyor...');
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const transactionBatch: any[] = [];

    for (let i = 0; i < 20000; i++) {
        const product = getRandomItem(allProducts);
        if (!product) continue;
        const date = randomDate(oneYearAgo, new Date());

        const rand = Math.random();
        let type: TransactionType = 'OUTBOUND';
        if (rand > 0.65) type = 'INBOUND';
        if (rand > 0.98) type = 'WASTAGE';

        let qty = getRandomInt(1, 20);
        if (product.unitType === 'BOX' && type !== 'INBOUND') qty = 1;

        let isCash = true;
        let isPaid = true;
        let paymentDate: Date | null = null;

        if (type === 'INBOUND' && Math.random() > 0.4) {
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

        transactionBatch.push({
            productId: product.id,
            tenantId: tenant.id,
            createdById: admin.id,
            type,
            quantity: qty,
            status: 'APPROVED',
            createdAt: date,
            updatedAt: date,
            supplierId: type === 'INBOUND' ? product.supplierId : null,
            isCash: type === 'INBOUND' ? false : true,
            isPaid,
            paymentDate,
            notes: type === 'WASTAGE' ? 'Fire' : (type === 'INBOUND' ? 'Mal Kabul' : 'Satış'),
            batchNumber: product.batchNumber
        });

        if (transactionBatch.length >= 500) {
            await prisma.transaction.createMany({ data: transactionBatch });
            transactionBatch.length = 0;
            process.stdout.write('.');
        }
    }
    if (transactionBatch.length > 0) await prisma.transaction.createMany({ data: transactionBatch });

    // 8. STOK FİŞLERİ (STOCK FORM)
    console.log('\n📄 Stok Fişleri (50 Adet)...');
    for (let i = 0; i < 50; i++) {
        const date = randomDate(oneYearAgo, new Date());
        const type: TransactionType = Math.random() > 0.5 ? 'INBOUND' : 'OUTBOUND';
        const supplier = getRandomItem(suppliers);
        const formNumber = `SF-${type === 'INBOUND' ? 'IN' : 'OUT'}-${getRandomInt(10000, 99999)}`;

        const stockForm = await prisma.stockForm.create({
            data: {
                formNumber,
                type,
                tenantId: tenant.id,
                createdById: admin.id,
                createdAt: date,
                updatedAt: date,
                supplierId: type === 'INBOUND' ? supplier.id : null,
                notes: 'Toplu Fiş Demo',
                waybillNo: `IRS-${getRandomInt(100000, 999999)}`,
                waybillDate: date
            }
        });

        const itemsCount = getRandomInt(3, 10);
        for (let j = 0; j < itemsCount; j++) {
            const prod = getRandomItem(allProducts.filter(p => p.status === 'APPROVED'));
            if (!prod) continue;

            await prisma.transaction.create({
                data: {
                    productId: prod.id,
                    tenantId: tenant.id,
                    createdById: admin.id,
                    type,
                    quantity: getRandomInt(5, 50),
                    status: 'APPROVED',
                    createdAt: date,
                    updatedAt: date,
                    stockFormId: stockForm.id,
                    isCash: true,
                    isPaid: true,
                    notes: `Fiş Kalemi: ${formNumber}`
                }
            });
        }
    }

    // 9. KAOTİK TALEPLER (150+ Talep)
    console.log('📋 Talepler (Procurement Requests) oluşturuluyor...');
    for (let i = 0; i < 150; i++) {
        // Rastgele bir şube ve o şubenin personelini bul
        const branch = getRandomItem(branches);
        const branchStaff = allUsers.filter(u => u.branchId === branch.id && u.role === 'STAFF');
        const requester = getRandomItem(branchStaff);

        // O şubedeki (veya herhangi bir) ürünü seç
        const product = getRandomItem(allProducts);

        if (!requester || !product) continue;

        const statusRand = Math.random();
        let status: ProcurementStatus = 'PENDING';
        let adminNote: string | null = null;
        let deliveryDate: Date | null = null;

        if (statusRand > 0.8) {
            status = 'REJECTED';
            adminNote = getRandomItem(ADMIN_NOTES);
        } else if (statusRand > 0.6) {
            status = 'APPROVED';
            adminNote = 'Onaylandı.';
        } else if (statusRand > 0.4) {
            status = 'ORDERED';
            adminNote = 'Sipariş geçildi PO-12345';
            deliveryDate = new Date(Date.now() + 86400000 * 3);
        } else if (statusRand > 0.2) {
            status = 'DELIVERED';
            adminNote = 'Teslim alındı.';
            deliveryDate = new Date();
        }

        await prisma.procurementRequest.create({
            data: {
                tenantId: tenant.id,
                branchId: branch.id,
                requesterId: requester.id,
                productId: product.id,
                quantity: getRandomInt(5, 100),
                reason: getRandomItem(REQUEST_REASONS),
                status: status,
                type: 'PURCHASE',
                adminNote: adminNote,
                deliveryDate: deliveryDate,
                createdAt: randomDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), new Date())
            }
        });
    }

    // 10. SATIN ALMA SİPARİŞLERİ (PO)
    console.log('📦 Siparişler (Purchase Orders) oluşturuluyor...');
    for (let i = 0; i < 30; i++) {
        const supplier = getRandomItem(suppliers);
        const prod = getRandomItem(allProducts.filter((p: Product) => p.supplierId === supplier.id));

        if (prod) {
            await prisma.purchaseOrder.create({
                data: {
                    orderNumber: `PO-2025-${getRandomInt(1000, 9999)}`,
                    status: Math.random() > 0.5 ? 'ORDERED' : 'COMPLETED',
                    supplierId: supplier.id,
                    tenantId: tenant.id,
                    createdById: admin.id,
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
    console.log(`\n✅ ULTRA KAOS TAMAMLANDI! (${((endTime - startTime) / 1000).toFixed(2)} saniye)`);
    console.log('---------------------------------------------------');
    console.log('👑 Giriş: admin@urbanbrew.com / 123456');
    console.log('---------------------------------------------------');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => await prisma.$disconnect());