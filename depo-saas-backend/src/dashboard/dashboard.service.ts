import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  // Varsayılan Dashboard Düzeni
  private readonly DEFAULT_LAYOUT = [
    { i: 'kpi-cards', x: 0, y: 0, w: 12, h: 4, hidden: false },
    { i: 'chart-main', x: 0, y: 4, w: 8, h: 10, hidden: false },
    { i: 'chart-pie', x: 8, y: 4, w: 4, h: 10, hidden: false },
    { i: 'recent-transactions', x: 0, y: 14, w: 12, h: 8, hidden: false }
  ];

  async getStats(tenantId: string, branchId?: string, startDate?: string, endDate?: string) {

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Filtreler
    let productWhere: any = { tenantId, deletedAt: null };
    let transactionWhere: any = { tenantId };
    let requestWhere: any = { tenantId };
    let orderWhere: any = { tenantId };

    if (branchId && branchId !== 'ALL') {
      productWhere.warehouse = { branchId };
      transactionWhere.product = { warehouse: { branchId } };
      requestWhere.branchId = branchId;
    }

    // 1. PARALEL VERİ ÇEKME
    const [
      totalProducts,
      lowStockProducts,
      transactions,
      pendingRequests,
      incomingOrders,
      overduePayments,
      upcomingPayments
    ] = await Promise.all([
      this.prisma.product.count({ where: productWhere }),

      this.prisma.product.findMany({
        where: { ...productWhere, currentStock: { lte: this.prisma.product.fields.minStock } },
        take: 5,
        orderBy: { currentStock: 'asc' },
        include: { supplier: true }
      }),

      this.prisma.transaction.findMany({
        where: transactionWhere,
        orderBy: { createdAt: 'desc' },
        take: 100
      }),

      this.prisma.procurementRequest.findMany({
        where: { ...requestWhere, status: 'PENDING' },
        take: 5,
        include: { product: true, requester: true }
      }),

      this.prisma.purchaseOrder.findMany({
        where: { ...orderWhere, status: { in: ['ORDERED', 'PARTIAL'] } },
        take: 5,
        include: { supplier: true }
      }),

      this.prisma.transaction.findMany({
        where: {
          tenantId,
          type: 'INBOUND',
          isCash: false,
          isPaid: false,
          paymentDate: { lt: today }
        },
        take: 5,
        include: { supplier: true, product: true }
      }),

      this.prisma.transaction.findMany({
        where: {
          tenantId,
          type: 'INBOUND',
          isCash: false,
          isPaid: false,
          paymentDate: { gte: today, lte: nextWeek }
        },
        take: 5,
        include: { supplier: true, product: true }
      })
    ]);

    // 2. HESAPLAMALAR
    const allProductsForValue = await this.prisma.product.findMany({
      where: productWhere,
      select: { currentStock: true, buyingPrice: true, department: { select: { name: true } } }
    });

    const totalValue = allProductsForValue.reduce((acc, p) => acc + (p.currentStock * p.buyingPrice), 0);

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

    const chartMap = new Map<string, { date: string, Giris: number, Cikis: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      chartMap.set(key, { date: key, Giris: 0, Cikis: 0 });
    }

    transactions.forEach(tx => {
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
      pieChartData
    };
  }

  // --- Dashboard Düzenini Getir ---
  async getUserLayout(userId: string) {
    const config = await this.prisma.dashboardConfig.findUnique({
      where: { userId }
    });
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