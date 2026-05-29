import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.room.findMany({ include: { category: true, reservations: { where: { actualCheckOut: null }, include: { guest: true } } } });
  }

  findCategories() { return this.prisma.roomCategory.findMany(); }
  createCategory(data: any) { return this.prisma.roomCategory.create({ data }); }
  create(data: any) { return this.prisma.room.create({ data, include: { category: true } }); }
  update(id: string, data: any) { return this.prisma.room.update({ where: { id }, data }); }
  updateStatus(id: string, status: any) { return this.prisma.room.update({ where: { id }, data: { status } }); }
}
