import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todaySales, totalOrders, activeOrders, lowStockCount, occupiedRooms, totalRooms] = await Promise.all([
      this.prisma.order.aggregate({ where: { status: 'PAID', paidAt: { gte: today, lt: tomorrow } }, _sum: { total: true }, _count: true }),
      this.prisma.order.count({ where: { status: 'PAID' } }),
      this.prisma.order.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS', 'READY', 'SERVED'] } } }),
      this.prisma.stock.count({ where: { quantity: { lte: 5 } } }),
      this.prisma.room.count({ where: { status: 'OCCUPIED' } }),
      this.prisma.room.count(),
    ]);

    return {
      todayRevenue: todaySales._sum.total || 0,
      todayOrders: todaySales._count,
      totalOrders,
      activeOrders,
      lowStockCount,
      occupiedRooms,
      totalRooms,
      occupancyRate: totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    };
  }

  async getSalesReport(from: string, to: string) {
    const orders = await this.prisma.order.findMany({
      where: { status: 'PAID', paidAt: { gte: new Date(from), lte: new Date(to) } },
      include: { items: { include: { product: { include: { category: true } } } }, payments: true },
      orderBy: { paidAt: 'asc' },
    });

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalVat = orders.reduce((s, o) => s + o.vatAmount, 0);
    const totalCost = orders.reduce((s, o) => o.items.reduce((si, i) => si + i.product.costPrice * i.quantity, 0) + s, 0);

    return { orders, totalRevenue, totalVat, grossProfit: totalRevenue - totalCost, orderCount: orders.length };
  }

  async getTopProducts(limit = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const products = await Promise.all(
      items.map(async (item) => {
        const product = await this.prisma.product.findUnique({ where: { id: item.productId }, include: { category: true } });
        return { product, totalSold: item._sum.quantity, orderCount: item._count };
      }),
    );
    return products;
  }

  async getPaymentBreakdown(from: string, to: string) {
    return this.prisma.payment.groupBy({
      by: ['method'],
      _sum: { amount: true },
      _count: true,
      where: { createdAt: { gte: new Date(from), lte: new Date(to) } },
    });
  }
}
