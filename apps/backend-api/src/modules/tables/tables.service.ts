import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.table.findMany({
      include: { orders: { where: { status: { in: ['PENDING', 'IN_PROGRESS', 'READY', 'SERVED'] } }, include: { items: true } } },
      orderBy: { number: 'asc' },
    });
  }

  create(data: any) { return this.prisma.table.create({ data }); }
  update(id: string, data: any) { return this.prisma.table.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.table.delete({ where: { id } }); }

  updateStatus(id: string, status: any) {
    return this.prisma.table.update({ where: { id }, data: { status } });
  }
}
