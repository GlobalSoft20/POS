import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const token = this.jwt.sign({ sub: user.id, role: user.role });
    const { password: _, ...rest } = user;
    return { token, user: rest };
  }

  async unifiedLogin(email: string, password: string) {
    // Check SuperAdmin table first
    const sa = await this.prisma.superAdmin.findUnique({ where: { email } });
    if (sa && sa.isActive) {
      const valid = await bcrypt.compare(password, sa.password);
      if (valid) {
        const token = this.jwt.sign({ sub: sa.id, role: 'SUPER_ADMIN' }, { expiresIn: '7d' });
        const { password: _, ...rest } = sa;
        return { token, role: 'SUPER_ADMIN', user: rest };
      }
    }
    // Fall back to regular user
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const token = this.jwt.sign({ sub: user.id, role: user.role });
    const { password: _, ...rest } = user;
    return { token, role: user.role, user: rest };
  }

  async loginPin(pin: string) {
    const user = await this.prisma.user.findFirst({ where: { pin, isActive: true } });
    if (!user) throw new UnauthorizedException('Invalid PIN');
    const token = this.jwt.sign({ sub: user.id, role: user.role });
    const { password: _, ...rest } = user;
    return { token, user: rest };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const { password: _, ...rest } = user;
    return rest;
  }
}
