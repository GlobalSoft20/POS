import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}
  findAll() { return this.prisma.supplier.findMany({ include: { purchases: true } }); }
  create(data: any) { return this.prisma.supplier.create({ data }); }
  update(id: string, data: any) { return this.prisma.supplier.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.supplier.delete({ where: { id } }); }

  async createPurchase(supplierId: string, data: any) {
    const { items, ...purchaseData } = data;
    const purchase = await this.prisma.purchase.create({
      data: { ...purchaseData, supplierId, items: { create: items } },
      include: { items: true },
    });
    // Add stock for each item
    for (const item of items) {
      const stock = await this.prisma.stock.findUnique({ where: { productId: item.productId } });
      if (stock) {
        await this.prisma.stock.update({ where: { productId: item.productId }, data: { quantity: { increment: item.quantity } } });
        await this.prisma.stockMovement.create({
          data: { stockId: stock.id, type: 'IN', quantity: item.quantity, reason: 'Purchase', reference: purchase.id },
        });
      }
    }
    return purchase;
  }
}
