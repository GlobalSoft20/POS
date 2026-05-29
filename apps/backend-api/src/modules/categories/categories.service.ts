import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}
  findAll() { return this.prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }); }
  create(data: any) { return this.prisma.category.create({ data }); }
  update(id: string, data: any) { return this.prisma.category.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.category.delete({ where: { id } }); }
}
