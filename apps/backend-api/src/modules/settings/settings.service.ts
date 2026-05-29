import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  get() {
    return this.prisma.businessSettings.findFirst();
  }

  async upsert(data: any) {
    const existing = await this.prisma.businessSettings.findFirst();
    if (existing) return this.prisma.businessSettings.update({ where: { id: existing.id }, data });
    return this.prisma.businessSettings.create({ data });
  }
}
