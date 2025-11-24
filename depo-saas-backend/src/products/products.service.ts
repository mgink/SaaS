import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as ExcelJS from 'exceljs';
import { StreamableFile } from '@nestjs/common';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationsService
  ) { }

  // --- ÜRÜN OLUŞTURMA ---
  async create(data: any, user: any, file?: Express.Multer.File) {

    // 1. SAAS LİMİT KONTROLÜ
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        plan: true,
        _count: { select: { products: true } }
      }
    });

    // --- DÜZELTME BAŞLANGICI (Null Kontrolü) ---
    if (!tenant) {
      throw new BadRequestException("Şirket bilgisi bulunamadı.");
    }
    if (!tenant.plan) {
      throw new BadRequestException("Abonelik planı bulunamadı.");
    }
    // --- DÜZELTME BİTİŞİ ---

    // Artık TypeScript tenant.plan'ın var olduğundan emin
    if (tenant.plan.maxProducts > 0 && tenant._count.products >= tenant.plan.maxProducts) {
      throw new BadRequestException(`Ürün limitiniz (${tenant.plan.maxProducts}) doldu. Lütfen paketinizi yükseltin.`);
    }

    // 2. Barkod Benzersizlik Kontrolü
    if (data.barcode) {
      const existing = await this.prisma.product.findFirst({
        where: { tenantId: user.tenantId, barcode: data.barcode }
      });
      if (existing) throw new BadRequestException(`Bu barkod (${data.barcode}) zaten kullanımda.`);
    }

    // 3. Depo ve Departman Kontrolü
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id: data.warehouseId } });
    const department = await this.prisma.department.findUnique({ where: { id: data.departmentId } });

    if (!warehouse || !department) throw new BadRequestException('Geçersiz Depo veya Departman seçimi.');

    const clean = (text: string) => text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3);
    const randomSuffix = Date.now().toString().slice(-4);
    const autoSku = `${clean(data.name)}-${clean(warehouse.name)}-${clean(department.name)}-${randomSuffix}`;

    const status = (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? 'APPROVED' : 'PENDING';
    const fileName = file ? file.filename : null;

    // Tedarikçileri Parse Et
    let suppliersList: any[] = [];
    if (data.suppliers) {
      try { suppliersList = JSON.parse(data.suppliers); } catch (e) { suppliersList = []; }
    }

    // Transaction
    const product = await this.prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name: data.name,
          sku: autoSku,
          barcode: data.barcode || null,
          tenantId: user.tenantId,
          createdById: user.userId,
          warehouseId: data.warehouseId,
          departmentId: data.departmentId,
          supplierId: data.supplierId || null,

          minStock: Number(data.minStock),
          currentStock: data.currentStock ? Number(data.currentStock) : 0,
          unitType: data.unitType || 'PIECE',
          itemsPerBox: data.itemsPerBox ? Number(data.itemsPerBox) : 1,
          buyingPrice: Number(data.buyingPrice),
          sellingPrice: Number(data.sellingPrice),
          isCash: data.isCash === 'true' || data.isCash === true,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
          documentUrl: fileName,
          status: status,
          // Yeni alanlar
          batchNumber: data.batchNumber || null,
          expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        },
      });

      // Alternatif Tedarikçiler
      if (suppliersList.length > 0) {
        for (const sup of suppliersList) {
          let supId = sup.id;
          if (!supId && sup.name) {
            const newSup = await tx.supplier.create({ data: { name: sup.name, tenantId: user.tenantId } });
            supId = newSup.id;
          }
          if (supId) {
            await tx.productSupplier.create({
              data: { productId: newProduct.id, supplierId: supId, isMain: sup.isMain || false }
            });
          }
        }
      }
      return newProduct;
    });

    if (status === 'PENDING') {
      await this.notificationService.notifyAdmins(user.tenantId, `📢 YENİ ÜRÜN: ${user.fullName}, "${data.name}" ürününü ekledi. Onay bekleniyor.`);
    }

    return product;
  }

  // --- GÜNCELLEME ---
  async update(id: string, data: any, user: any, file?: Express.Multer.File) {
    const updateData: any = {
      name: data.name,
      barcode: data.barcode,
      minStock: Number(data.minStock),
      buyingPrice: Number(data.buyingPrice),
      sellingPrice: Number(data.sellingPrice),
      warehouseId: data.warehouseId,
      departmentId: data.departmentId,
      unitType: data.unitType,
      itemsPerBox: Number(data.itemsPerBox),
      batchNumber: data.batchNumber || null,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
      isCash: data.isCash === 'true' || data.isCash === true,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      supplierId: data.supplierId || null
    };

    if (file) updateData.documentUrl = file.filename;

    let suppliersList: any[] = [];
    if (data.suppliers) { try { suppliersList = JSON.parse(data.suppliers); } catch (e) { suppliersList = []; } }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({ where: { id }, data: updateData });

      if (suppliersList.length > 0) {
        await tx.productSupplier.deleteMany({ where: { productId: id } });
        for (const sup of suppliersList) {
          let supId = sup.id;
          if (!supId && sup.name) {
            const newSup = await tx.supplier.create({ data: { name: sup.name, tenantId: user.tenantId } });
            supId = newSup.id;
          }
          if (supId) {
            await tx.productSupplier.create({
              data: { productId: id, supplierId: supId, isMain: sup.isMain || false }
            });
          }
        }
      }
      return updated;
    });
  }

  // --- LİSTELEME ---
  async findAll(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId },
      include: {
        warehouse: true,
        department: true,
        supplier: true,
        suppliers: { include: { supplier: true } },
        createdBy: { select: { fullName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, tenantId: string) {
    return this.prisma.product.deleteMany({ where: { id, tenantId } });
  }

  async updateStatus(id: string, status: 'APPROVED' | 'REJECTED', reason: string | null, tenantId: string) {
    const product = await this.prisma.product.update({
      where: { id },
      data: { status, rejectionReason: reason },
      include: { createdBy: true }
    });
    if (product.createdById) {
      const message = status === 'APPROVED' ? `✅ Onaylandı: ${product.name}` : `❌ Reddedildi: ${product.name}`;
      await this.notificationService.create(product.createdById, message, status === 'APPROVED' ? 'SUCCESS' : 'ERROR');
    }
    return product;
  }

  // --- EXCEL ---
  async exportToExcel(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: { tenantId },
      include: { warehouse: true, department: true, supplier: true }
    });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Stok Listesi');
    sheet.columns = [
      { header: 'Barkod', key: 'barcode', width: 15 }, { header: 'SKU', key: 'sku', width: 20 }, { header: 'Ad', key: 'name', width: 30 },
      { header: 'Stok', key: 'stock', width: 10 }, { header: 'Tedarikçi', key: 'supplier', width: 20 }, { header: 'Depo', key: 'warehouse', width: 20 }
    ];
    products.forEach((p: any) => {
      sheet.addRow({ barcode: p.barcode || '-', name: p.name, stock: p.currentStock, supplier: p.supplier?.name || '-', warehouse: p.warehouse?.name || '-' });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer));
  }
}