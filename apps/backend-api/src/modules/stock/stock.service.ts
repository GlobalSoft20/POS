import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.stock.findMany({
      include: { product: { include: { category: true } } },
      orderBy: { product: { name: 'asc' } },
    });
  }

  getLowStock() {
    return this.prisma.stock.findMany({
      where: { quantity: { lte: this.prisma.stock.fields.minQuantity } },
      include: { product: true },
    });
  }

  async adjust(productId: string, quantity: number, type: string, reason?: string) {
    const stock = await this.prisma.stock.findUnique({ where: { productId } });
    const newQty = type === 'IN' ? stock.quantity + quantity : type === 'OUT' ? stock.quantity - quantity : quantity;
    await this.prisma.stock.update({ where: { productId }, data: { quantity: newQty } });
    await this.prisma.stockMovement.create({
      data: { stockId: stock.id, type, quantity, reason },
    });
    return this.prisma.stock.findUnique({ where: { productId }, include: { product: true } });
  }

  getMovements(productId?: string) {
    return this.prisma.stockMovement.findMany({
      where: productId ? { stock: { productId } } : undefined,
      include: { stock: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
