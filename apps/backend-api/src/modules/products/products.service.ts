import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(categoryId?: string, search?: string) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoryId && { categoryId }),
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
      },
      include: { category: true, stock: true, printer: true, variants: true },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true, stock: true, printer: true, variants: true },
    });
  }

  async create(data: any) {
    const { variants, ...productData } = data;
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        ...(productData.trackStock && { stock: { create: { quantity: 0, minQuantity: 5 } } }),
        ...(variants?.length && { variants: { create: variants } }),
      },
      include: { category: true, stock: true, variants: true },
    });
    return product;
  }

  update(id: string, data: any) {
    const { variants, ...productData } = data;
    return this.prisma.product.update({ where: { id }, data: productData, include: { category: true, stock: true } });
  }

  remove(id: string) {
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  toggleFavorite(id: string, isFavorite: boolean) {
    return this.prisma.product.update({ where: { id }, data: { isFavorite } });
  }
}
