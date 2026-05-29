import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private async generateOrderNumber() {
    const count = await this.prisma.order.count();
    return `ORD-${String(count + 1).padStart(5, '0')}`;
  }

  findAll(status?: string) {
    return this.prisma.order.findMany({
      where: status ? { status: status as any } : undefined,
      include: { table: true, user: { select: { id: true, name: true } }, items: { include: { product: { include: { printer: true } } } }, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { table: true, user: { select: { id: true, name: true } }, items: { include: { product: { include: { printer: true, category: true } } } }, payments: true },
    });
  }

  async create(data: any) {
    const { items, ...orderData } = data;
    const orderNumber = await this.generateOrderNumber();

    let subtotal = 0;
    let vatAmount = 0;
    for (const item of items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      subtotal += product.sellPrice * item.quantity;
      vatAmount += (product.sellPrice * item.quantity * product.vatRate) / 100;
    }
    const total = subtotal + vatAmount - (orderData.discount || 0);

    const order = await this.prisma.order.create({
      data: {
        ...orderData,
        orderNumber,
        subtotal,
        vatAmount,
        total,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
          })),
        },
      },
      include: { table: true, items: { include: { product: { include: { printer: true } } } } },
    });

    if (order.tableId) {
      await this.prisma.table.update({ where: { id: order.tableId }, data: { status: 'OCCUPIED' } });
    }

    return order;
  }

  async addItems(orderId: string, items: any[]) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    for (const item of items) {
      await this.prisma.orderItem.create({ data: { orderId, ...item } });
    }
    return this.recalculate(orderId);
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.order.update({ where: { id }, data: { status: status as any } });
  }

  async pay(id: string, payments: any[]) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: { include: { product: true } } } });

    await this.prisma.payment.createMany({ data: payments.map(p => ({ ...p, orderId: id })) });

    const primaryMethod = payments[0].method;
    await this.prisma.order.update({
      where: { id },
      data: { status: 'PAID', paymentMethod: primaryMethod, paidAt: new Date() },
    });

    // Deduct stock
    for (const item of order.items) {
      if (item.product.trackStock) {
        const stock = await this.prisma.stock.findUnique({ where: { productId: item.productId } });
        if (stock) {
          await this.prisma.stock.update({ where: { id: stock.id }, data: { quantity: { decrement: item.quantity } } });
          await this.prisma.stockMovement.create({
            data: { stockId: stock.id, type: 'OUT', quantity: item.quantity, reason: 'Sale', reference: order.orderNumber },
          });
        }
      }
    }

    if (order.tableId) {
      await this.prisma.table.update({ where: { id: order.tableId }, data: { status: 'FREE' } });
    }

    return this.findOne(id);
  }

  async cancel(id: string) {
    const order = await this.prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } });
    if (order.tableId) {
      await this.prisma.table.update({ where: { id: order.tableId }, data: { status: 'FREE' } });
    }
    return order;
  }

  private async recalculate(orderId: string) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId }, include: { product: true } });
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const vatAmount = items.reduce((s, i) => s + (i.unitPrice * i.quantity * i.product.vatRate) / 100, 0);
    return this.prisma.order.update({ where: { id: orderId }, data: { subtotal, vatAmount, total: subtotal + vatAmount } });
  }
}
