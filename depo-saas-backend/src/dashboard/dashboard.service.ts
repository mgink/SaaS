import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  async getStats(tenantId: string, branchId?: string, startDate?: string, endDate?: string) {

    // Tarih Filtresi Hazırlığı
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      };
    }

    // 1. Ürün Bazlı İstatistikler (Anlık Durum)
    let productWhere: any = { tenantId };
    if (branchId && branchId !== 'ALL') productWhere.warehouse = { branchId };

    const products = await this.prisma.product.findMany({
      where: productWhere,
      include: { department: true }
    });

    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.currentStock <= p.minStock).length;
    const totalValue = products.reduce((acc, p) => acc + (p.currentStock * p.buyingPrice), 0);

    // 2. Kategori (Departman) Dağılımı - Pasta Grafik İçin
    const categoryStats: Record<string, number> = {};
    products.forEach(p => {
      const deptName = p.department?.name || 'Diğer';
      if (p.currentStock > 0) { // Sadece stoğu olanları sayalım
        // İster adet bazlı, ister tutar bazlı dağılım yapabiliriz. Tutar daha mantıklı.
        const value = p.currentStock * p.buyingPrice;
        categoryStats[deptName] = (categoryStats[deptName] || 0) + value;
      }
    });

    const pieChartData = Object.keys(categoryStats).map(key => ({
      name: key,
      value: Math.round(categoryStats[key])
    }));


    // 3. İşlem Bazlı İstatistikler (Tarih Aralığına Göre)
    let transactionWhere: any = { tenantId, ...dateFilter };
    if (branchId && branchId !== 'ALL') transactionWhere.product = { warehouse: { branchId } };

    const transactions = await this.prisma.transaction.findMany({
      where: transactionWhere,
      orderBy: { createdAt: 'asc' } // Eskiden yeniye (Grafik için)
    });

    // Günlük Hareket Grafiği (Bar Chart)
    const dailyStats: Record<string, { date: string, Giris: number, Cikis: number }> = {};

    transactions.forEach(tx => {
      const dateKey = new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      if (!dailyStats[dateKey]) dailyStats[dateKey] = { date: dateKey, Giris: 0, Cikis: 0 };

      // Miktar bazında topluyoruz (Tutar bazında da olabilir)
      if (tx.type === 'INBOUND') dailyStats[dateKey].Giris += tx.quantity;
      else dailyStats[dateKey].Cikis += tx.quantity;
    });

    const chartData = Object.values(dailyStats);

    // Son Hareketler (Sadece son 5)
    const recentActivity = await this.prisma.transaction.findMany({
      where: { tenantId }, // Tarih filtresinden bağımsız her zaman en sonuncular
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { product: true, createdBy: true }
    });

    return {
      totalProducts,
      lowStockCount,
      totalValue,
      chartData,      // Bar Chart
      pieChartData,   // Pie Chart
      recentActivity: recentActivity.map(tx => ({
        action: tx.type === 'INBOUND' ? 'Giriş' : 'Çıkış',
        product: tx.product.name,
        quantity: tx.quantity,
        user: tx.createdBy?.fullName || 'Sistem',
        time: tx.createdAt
      }))
    };
  }
}