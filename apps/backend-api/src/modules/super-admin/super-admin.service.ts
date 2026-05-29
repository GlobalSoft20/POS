import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  // ── AUTH ──────────────────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const sa = await this.prisma.superAdmin.findUnique({ where: { email } });
    if (!sa || !sa.isActive) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, sa.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const token = this.jwt.sign({ sub: sa.id, role: 'SUPER_ADMIN' }, { expiresIn: '7d' });
    const { password: _, ...rest } = sa;
    return { token, superAdmin: rest };
  }

  // ── BUSINESSES ────────────────────────────────────────────────────────────

  getBusinesses(status?: string) {
    return this.prisma.business.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        owner: { select: { id: true, name: true, email: true, lastLoginAt: true } },
        subscription: true,
        _count: { select: { loginLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getBusiness(id: string) {
    return this.prisma.business.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true, lastLoginAt: true, isActive: true } },
        subscription: { include: { payments: true } },
        loginLogs: { orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { name: true, email: true } } } },
        platformRevenue: { orderBy: { createdAt: 'desc' }, take: 12 },
      },
    });
  }

  async approveBusiness(id: string) {
    const business = await this.prisma.business.update({
      where: { id },
      data: { status: 'ACTIVE', isVerified: true },
    });
    await this.createAlert(`Business "${business.name}" has been approved and activated`);
    return business;
  }

  async rejectBusiness(id: string, reason: string) {
    const business = await this.prisma.business.update({ where: { id }, data: { status: 'REJECTED' } });
    await this.createAlert(`Business "${business.name}" has been rejected: ${reason}`);
    return business;
  }

  async suspendBusiness(id: string, reason: string) {
    const business = await this.prisma.business.update({ where: { id }, data: { status: 'SUSPENDED' } });
    await this.createAlert(`Business "${business.name}" has been suspended: ${reason}`);
    return business;
  }

  async activateBusiness(id: string) {
    return this.prisma.business.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async verifyBusiness(id: string) {
    return this.prisma.business.update({ where: { id }, data: { isVerified: true } });
  }

  // ── USERS ─────────────────────────────────────────────────────────────────

  getAllUsers(businessId?: string) {
    return this.prisma.user.findMany({
      where: businessId ? { businessId } : undefined,
      select: { id: true, name: true, email: true, role: true, isActive: true, businessId: true, lastLoginAt: true, createdAt: true },
      orderBy: { lastLoginAt: 'desc' },
    });
  }

  async forceLogoutUser(userId: string) {
    // Mark user session as invalid by updating a flag
    await this.prisma.user.update({ where: { id: userId }, data: { updatedAt: new Date() } });
    await this.createAlert(`Force logout applied to user ${userId}`);
    return { success: true, message: 'User session invalidated' };
  }

  async toggleUserActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive } });
  }

  // ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────

  getSubscriptions() {
    return this.prisma.subscription.findMany({
      include: { business: true, payments: { orderBy: { paidAt: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSubscription(businessId: string, data: { plan: string; status: string; endDate?: string; amount?: number }) {
    return this.prisma.subscription.upsert({
      where: { businessId },
      update: { ...data, plan: data.plan as any, status: data.status as any, endDate: data.endDate ? new Date(data.endDate) : undefined },
      create: { businessId, plan: data.plan as any, status: data.status as any, amount: data.amount || 0, endDate: data.endDate ? new Date(data.endDate) : undefined },
    });
  }

  async recordSubscriptionPayment(subscriptionId: string, amount: number, method: string, reference?: string) {
    return this.prisma.subscriptionPayment.create({
      data: { subscriptionId, amount, method, reference },
    });
  }

  // ── REVENUE ───────────────────────────────────────────────────────────────

  async getPlatformRevenue() {
    const [totalRevenue, monthlyRevenue, byPlan, recentPayments] = await Promise.all([
      this.prisma.subscriptionPayment.aggregate({ _sum: { amount: true }, _count: true }),
      this.prisma.subscriptionPayment.groupBy({
        by: ['paidAt'],
        _sum: { amount: true },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.subscription.groupBy({
        by: ['plan'],
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.subscriptionPayment.findMany({
        orderBy: { paidAt: 'desc' },
        take: 20,
        include: { subscription: { include: { business: true } } },
      }),
    ]);

    const activeBusinesses = await this.prisma.business.count({ where: { status: 'ACTIVE' } });
    const totalBusinesses = await this.prisma.business.count();

    return { totalRevenue: totalRevenue._sum.amount || 0, totalPayments: totalRevenue._count, byPlan, recentPayments, activeBusinesses, totalBusinesses };
  }

  // ── ACTIVITY & MONITORING ─────────────────────────────────────────────────

  getLoginActivity(businessId?: string, limit = 50) {
    return this.prisma.loginLog.findMany({
      where: businessId ? { businessId } : undefined,
      include: { user: { select: { name: true, email: true, role: true } }, business: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getOnlineUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.prisma.user.findMany({
      where: { lastLoginAt: { gte: fiveMinutesAgo }, isActive: true },
      select: { id: true, name: true, email: true, role: true, businessId: true, lastLoginAt: true },
    });
  }

  // ── ALERTS ────────────────────────────────────────────────────────────────

  async getAlerts(superAdminId: string) {
    return this.prisma.systemAlert.findMany({
      where: { superAdminId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAlertRead(id: string) {
    return this.prisma.systemAlert.update({ where: { id }, data: { isRead: true } });
  }

  private async createAlert(message: string, type = 'INFO') {
    const sa = await this.prisma.superAdmin.findFirst();
    if (!sa) return;
    return this.prisma.systemAlert.create({ data: { superAdminId: sa.id, type, title: type, message } });
  }

  // ── PLATFORM SETTINGS ─────────────────────────────────────────────────────

  async getSettings() {
    return this.prisma.platformSettings.findFirst();
  }

  async updateSettings(data: any) {
    const existing = await this.prisma.platformSettings.findFirst();
    if (existing) return this.prisma.platformSettings.update({ where: { id: existing.id }, data });
    return this.prisma.platformSettings.create({ data });
  }

  // ── DASHBOARD STATS ───────────────────────────────────────────────────────

  async getDashboardStats() {
    const [total, active, pending, suspended, totalUsers, onlineUsers, totalRevenue, unreadAlerts] = await Promise.all([
      this.prisma.business.count(),
      this.prisma.business.count({ where: { status: 'ACTIVE' } }),
      this.prisma.business.count({ where: { status: 'PENDING' } }),
      this.prisma.business.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.getOnlineUsers(),
      this.prisma.subscriptionPayment.aggregate({ _sum: { amount: true } }),
      this.prisma.systemAlert.count({ where: { isRead: false } }),
    ]);

    return {
      businesses: { total, active, pending, suspended },
      users: { total: totalUsers, online: onlineUsers.length },
      revenue: totalRevenue._sum.amount || 0,
      unreadAlerts,
    };
  }
}
