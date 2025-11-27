import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  // Varsayılan Dashboard Düzeni
  private readonly DEFAULT_LAYOUT = [
    { i: 'kpi-1', x: 0, y: 0, w: 3, h: 4, minW: 2, minH: 3 },
    { i: 'kpi-2', x: 3, y: 0, w: 3, h: 4, minW: 2, minH: 3 },
    { i: 'kpi-3', x: 6, y: 0, w: 3, h: 4, minW: 2, minH: 3 },
    { i: 'kpi-4', x: 9, y: 0, w: 3, h: 4, minW: 2, minH: 3 },
    { i: 'chart-bar', x: 0, y: 4, w: 8, h: 11, minW: 4, minH: 8 },
    { i: 'chart-pie', x: 8, y: 4, w: 4, h: 11, minW: 3, minH: 8 },
    { i: 'transactions', x: 0, y: 15, w: 6, h: 10, minW: 4, minH: 6 },
    { i: 'incoming', x: 6, y: 15, w: 6, h: 10, minW: 4, minH: 6 },
  ];

  async getStats(tenantId: string, branchId?: string, startDate?: string, endDate?: string) {

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Filtreler
    let productWhere: any = { tenantId, deletedAt: null };
    let transactionWhere: any = { tenantId };
    let requestWhere: any = { tenantId };
    let orderWhere: any = { tenantId }; // Siparişler genelde merkezi olur ama şube bazlı da bakılabilir

    if (branchId && branchId !== 'ALL') {
      productWhere.warehouse = { branchId };
      // İşlemler: O şubeye ait depolardaki hareketler
      transactionWhere.product = { warehouse: { branchId } };
      requestWhere.branchId = branchId;
      // Siparişler için özel bir şube filtresi yoksa tenant bazlı kalabilir veya user'a göre filtrelenebilir
    }

    // 1. PARALEL VERİ ÇEKME
    const [
      totalProducts,
      lowStockProducts,
      transactions, // Grafik için tüm liste
      pendingRequests,
      incomingOrders,
      overduePayments,
      upcomingPayments,
      recentActivity // Tablo için son 5 işlem
    ] = await Promise.all([
      // A. Toplam Ürün Sayısı
      this.prisma.product.count({ where: productWhere }),

      // B. Kritik Stoktaki Ürünler
      this.prisma.product.findMany({
        where: { ...productWhere, currentStock: { lte: this.prisma.product.fields.minStock } },
        take: 5,
        orderBy: { currentStock: 'asc' },
        include: { supplier: true }
      }),

      // C. İşlemler (Grafik İçin - Tarih filtresi varsa uygula)
      this.prisma.transaction.findMany({
        where: {
          ...transactionWhere,
          ...(startDate && endDate ? { createdAt: { gte: new Date(startDate), lte: new Date(new Date(endDate).setHours(23, 59, 59)) } } : {})
        },
        orderBy: { createdAt: 'desc' },
        // Grafik için çok veri gerekebilir, limit koymuyoruz veya mantıklı bir limit (örn 1000)
      }),

      // D. Bekleyen Talepler
      this.prisma.procurementRequest.findMany({
        where: { ...requestWhere, status: 'PENDING' },
        take: 5,
        include: { product: true, requester: true },
        orderBy: { createdAt: 'desc' }
      }),

      // E. Bekleyen Mal Kabuller (Siparişler)
      this.prisma.purchaseOrder.findMany({
        where: { ...orderWhere, status: { in: ['ORDERED', 'PARTIAL'] } },
        take: 5,
        include: { supplier: true },
        orderBy: { expectedDate: 'asc' } // Tarihi en yakın olan en üstte
      }),

      // F. Gecikmiş Ödemeler
      this.prisma.transaction.findMany({
        where: { tenantId, type: 'INBOUND', isCash: false, isPaid: false, paymentDate: { lt: today } },
        take: 5,
        include: { supplier: true, product: true }
      }),

      // G. Yaklaşan Ödemeler
      this.prisma.transaction.findMany({
        where: { tenantId, type: 'INBOUND', isCash: false, isPaid: false, paymentDate: { gte: today, lte: nextWeek } },
        take: 5,
        include: { supplier: true, product: true }
      }),

      // H. Son Hareketler (Tablo İçin - Filtreye uygun son 5)
      this.prisma.transaction.findMany({
        where: transactionWhere, // <--- DÜZELTME: Artık şube filtresini kullanıyor
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { product: true, createdBy: true }
      })
    ]);

    // 2. HESAPLAMALAR
    const allProductsForValue = await this.prisma.product.findMany({
      where: productWhere,
      select: { currentStock: true, buyingPrice: true, department: { select: { name: true } } }
    });

    const totalValue = allProductsForValue.reduce((acc, p) => acc + (p.currentStock * p.buyingPrice), 0);

    // Kategori Dağılımı
    const categoryStats: Record<string, number> = {};
    allProductsForValue.forEach(p => {
      const deptName = p.department?.name || 'Diğer';
      if (p.currentStock > 0) {
        const value = p.currentStock * p.buyingPrice;
        categoryStats[deptName] = (categoryStats[deptName] || 0) + value;
      }
    });

    const pieChartData = Object.keys(categoryStats).map(key => ({
      name: key,
      value: Math.round(categoryStats[key])
    }));

    // Grafik Verisi (transactions dizisinden)
    const chartMap = new Map<string, { date: string, Giris: number, Cikis: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      chartMap.set(key, { date: key, Giris: 0, Cikis: 0 });
    }

    // Grafik verisi için sadece son 7 güne odaklanabiliriz veya filtrelenmiş transactions verisini kullanabiliriz.
    // Eğer tarih filtresi yoksa son 7 günü baz alalım.
    const chartTransactions = startDate ? transactions : transactions.filter(t => new Date(t.createdAt) >= new Date(new Date().setDate(new Date().getDate() - 7)));

    chartTransactions.forEach(tx => {
      const key = new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      if (chartMap.has(key)) {
        const entry = chartMap.get(key)!;
        if (tx.type === 'INBOUND') entry.Giris += tx.quantity;
        else entry.Cikis += tx.quantity;
      }
    });

    return {
      kpi: {
        totalProducts,
        totalValue,
        criticalCount: lowStockProducts.length,
        pendingRequestCount: pendingRequests.length,
        incomingOrderCount: incomingOrders.length
      },
      lists: {
        lowStockProducts,
        pendingRequests,
        incomingOrders,
        overduePayments,
        upcomingPayments
      },
      chartData: Array.from(chartMap.values()),
      pieChartData,
      // Son hareketleri buraya ekliyoruz
      recentActivity: recentActivity.map(tx => ({
        action: tx.type === 'INBOUND' ? 'Giriş' : (tx.type === 'WASTAGE' ? 'Zayi' : 'Çıkış'),
        product: tx.product.name,
        quantity: tx.quantity,
        user: tx.createdBy?.fullName || 'Sistem',
        time: tx.createdAt
      }))
    };
  }

  // --- Dashboard Düzenini Getir ---
  async getUserLayout(userId: string) {
    const config = await this.prisma.dashboardConfig.findUnique({ where: { userId } });
    return config ? config.layout : this.DEFAULT_LAYOUT;
  }

  // --- Dashboard Düzenini Kaydet ---
  async updateUserLayout(userId: string, layout: any) {
    return this.prisma.dashboardConfig.upsert({
      where: { userId },
      update: { layout },
      create: { userId, layout }
    });
  }
}