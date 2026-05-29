import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.reservation.findMany({
      include: { room: { include: { category: true } }, guest: true },
      orderBy: { checkIn: 'desc' },
    });
  }

  async create(data: any) {
    const { guest, ...resData } = data;
    let guestRecord = guest.id
      ? await this.prisma.guest.findUnique({ where: { id: guest.id } })
      : await this.prisma.guest.create({ data: guest });

    const reservation = await this.prisma.reservation.create({
      data: { ...resData, guestId: guestRecord.id },
      include: { room: true, guest: true },
    });
    await this.prisma.room.update({ where: { id: resData.roomId }, data: { status: 'RESERVED' } });
    return reservation;
  }

  async checkIn(id: string) {
    const res = await this.prisma.reservation.update({
      where: { id },
      data: { actualCheckIn: new Date() },
      include: { room: true },
    });
    await this.prisma.room.update({ where: { id: res.roomId }, data: { status: 'OCCUPIED' } });
    return res;
  }

  async checkOut(id: string) {
    const res = await this.prisma.reservation.update({
      where: { id },
      data: { actualCheckOut: new Date() },
      include: { room: true },
    });
    await this.prisma.room.update({ where: { id: res.roomId }, data: { status: 'AVAILABLE' } });
    return res;
  }
}
