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
        owner: { select: { id: true, name: true, email: true, lastLoginAt: true, isActive: true } },
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
        loginLogs: { orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { name: true, email: true, role: true } } } },
        platformRevenue: { orderBy: { createdAt: 'desc' }, take: 12 },
      },
    });
  }

  async approveBusiness(id: string) {
    const business = await this.prisma.business.update({ where: { id }, data: { status: 'ACTIVE', isVerified: true } });
    await this.createAlert(`Business "${business.name}" has been approved and activated`, 'SUCCESS');
    return business;
  }

  async rejectBusiness(id: string, reason: string) {
    const business = await this.prisma.business.update({ where: { id }, data: { status: 'REJECTED' } });
    await this.createAlert(`Business "${business.name}" rejected: ${reason}`, 'WARNING');
    return business;
  }

  async suspendBusiness(id: string, reason: string) {
    const business = await this.prisma.business.update({ where: { id }, data: { status: 'SUSPENDED' } });
    // Force logout all users of this business
    await this.prisma.user.updateMany({ where: { businessId: id }, data: { updatedAt: new Date() } });
    await this.createAlert(`Business "${business.name}" suspended: ${reason}`, 'WARNING');
    return business;
  }

  async activateBusiness(id: string) {
    const business = await this.prisma.business.update({ where: { id }, data: { status: 'ACTIVE' } });
    await this.createAlert(`Business "${business.name}" has been activated`, 'SUCCESS');
    return business;
  }

  async lockBusiness(id: string) {
    const business = await this.prisma.business.update({ where: { id }, data: { status: 'SUSPENDED' } });
    await this.prisma.user.updateMany({ where: { businessId: id }, data: { isActive: false } });
    await this.createAlert(`Business "${business.name}" locked — all users disabled`, 'WARNING');
    return business;
  }

  async unlockBusiness(id: string) {
    const business = await this.prisma.business.update({ where: { id }, data: { status: 'ACTIVE' } });
    await this.prisma.user.updateMany({ where: { businessId: id }, data: { isActive: true } });
    await this.createAlert(`Business "${business.name}" unlocked — all users re-enabled`, 'INFO');
    return business;
  }

  async verifyBusiness(id: string) {
    const business = await this.prisma.business.update({ where: { id }, data: { isVerified: true } });
    await this.createAlert(`Business "${business.name}" has been verified`, 'SUCCESS');
    return business;
  }

  async requestMoreInfo(id: string, message: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    await this.createAlert(`More info requested from "${business?.name}": ${message}`, 'INFO');
    return { success: true };
  }

  async forceLogoutAllUsers(businessId: string) {
    await this.prisma.user.updateMany({ where: { businessId }, data: { updatedAt: new Date() } });
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    await this.createAlert(`Force logout applied to all users of "${business?.name}"`, 'WARNING');
    return { success: true };
  }

  // ── BUSINESS PERFORMANCE ──────────────────────────────────────────────────

  async getBusinessPerformance() {
    const businesses = await this.prisma.business.findMany({
      include: {
        owner: { select: { id: true, name: true } },
        subscription: { select: { plan: true, status: true } },
        _count: { select: { loginLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const results = await Promise.all(businesses.map(async (b) => {
      const users = await this.prisma.user.count({ where: { businessId: b.id, isActive: true } });
      const usersByRole = await this.prisma.user.groupBy({
        by: ['role'],
        where: { businessId: b.id, isActive: true },
        _count: true,
      });

      const dailyOrders = await this.prisma.order.count({
        where: { userId: { in: (await this.prisma.user.findMany({ where: { businessId: b.id }, select: { id: true } })).map(u => u.id) }, createdAt: { gte: startOfDay }, status: 'PAID' },
      });

      const monthlyRevenue = await this.prisma.order.aggregate({
        where: { userId: { in: (await this.prisma.user.findMany({ where: { businessId: b.id }, select: { id: true } })).map(u => u.id) }, createdAt: { gte: startOfMonth }, status: 'PAID' },
        _sum: { total: true },
      });

      return {
        id: b.id,
        name: b.name,
        email: b.email,
        status: b.status,
        isVerified: b.isVerified,
        subscription: b.subscription,
        activeUsers: users,
        usersByRole,
        dailyOrders,
        monthlyRevenue: monthlyRevenue._sum.total || 0,
        loginCount: b._count.loginLogs,
      };
    }));

    return results;
  }

  // ── USERS ─────────────────────────────────────────────────────────────────

  getAllUsers(businessId?: string) {
    return this.prisma.user.findMany({
      where: businessId ? { businessId } : undefined,
      select: { id: true, name: true, email: true, role: true, isActive: true, businessId: true, lastLoginAt: true, createdAt: true },
      orderBy: { lastLoginAt: 'desc' },
    });
  }

  async getOnlineUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const users = await this.prisma.user.findMany({
      where: { lastLoginAt: { gte: fiveMinutesAgo }, isActive: true },
      select: { id: true, name: true, email: true, role: true, businessId: true, lastLoginAt: true },
    });

    const byRole = users.reduce((acc: any, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    return { users, byRole, total: users.length };
  }

  async forceLogoutUser(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { updatedAt: new Date() } });
    await this.createAlert(`Force logout applied to user ${userId}`, 'WARNING');
    return { success: true };
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

  async extendSubscription(businessId: string, days: number) {
    const sub = await this.prisma.subscription.findUnique({ where: { businessId } });
    const currentEnd = sub?.endDate ? new Date(sub.endDate) : new Date();
    const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
    const updated = await this.prisma.subscription.upsert({
      where: { businessId },
      update: { endDate: newEnd, status: 'ACTIVE' },
      create: { businessId, plan: 'STARTER', status: 'ACTIVE', amount: 0, endDate: newEnd },
    });
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    await this.createAlert(`Subscription extended ${days} days for "${business?.name}"`, 'SUCCESS');
    return updated;
  }

  async grantFreeTrial(businessId: string, days: number) {
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const updated = await this.prisma.subscription.upsert({
      where: { businessId },
      update: { status: 'TRIAL', endDate, plan: 'PROFESSIONAL' },
      create: { businessId, plan: 'PROFESSIONAL', status: 'TRIAL', amount: 0, endDate },
    });
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    await this.createAlert(`Free trial of ${days} days granted to "${business?.name}"`, 'INFO');
    return updated;
  }

  async recordSubscriptionPayment(subscriptionId: string, amount: number, method: string, reference?: string) {
    const payment = await this.prisma.subscriptionPayment.create({ data: { subscriptionId, amount, method, reference } });
    await this.createAlert(`Payment of ${amount} RWF received via ${method}`, 'SUCCESS');
    return payment;
  }

  // ── REVENUE ───────────────────────────────────────────────────────────────

  async getPlatformRevenue() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalRevenue, monthlyRevenue, dailyRevenue, byPlan, recentPayments] = await Promise.all([
      this.prisma.subscriptionPayment.aggregate({ _sum: { amount: true }, _count: true }),
      this.prisma.subscriptionPayment.aggregate({ where: { paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      this.prisma.subscriptionPayment.aggregate({ where: { paidAt: { gte: startOfDay } }, _sum: { amount: true } }),
      this.prisma.subscription.groupBy({ by: ['plan'], _count: true, _sum: { amount: true } }),
      this.prisma.subscriptionPayment.findMany({ orderBy: { paidAt: 'desc' }, take: 20, include: { subscription: { include: { business: true } } } }),
    ]);

    const activeBusinesses = await this.prisma.business.count({ where: { status: 'ACTIVE' } });
    const totalBusinesses = await this.prisma.business.count();

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      totalPayments: totalRevenue._count,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      dailyRevenue: dailyRevenue._sum.amount || 0,
      byPlan,
      recentPayments,
      activeBusinesses,
      totalBusinesses,
    };
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

  // ── ALERTS ────────────────────────────────────────────────────────────────

  async getAlerts(superAdminId: string) {
    return this.prisma.systemAlert.findMany({
      where: { superAdminId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markAlertRead(id: string) {
    return this.prisma.systemAlert.update({ where: { id }, data: { isRead: true } });
  }

  async markAllAlertsRead(superAdminId: string) {
    return this.prisma.systemAlert.updateMany({ where: { superAdminId, isRead: false }, data: { isRead: true } });
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
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [total, active, pending, suspended, rejected, totalUsers, onlineUsers, totalRevenue, monthlyRevenue, dailyTransactions, unreadAlerts, expiredSubs] = await Promise.all([
      this.prisma.business.count(),
      this.prisma.business.count({ where: { status: 'ACTIVE' } }),
      this.prisma.business.count({ where: { status: 'PENDING' } }),
      this.prisma.business.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.business.count({ where: { status: 'REJECTED' } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.findMany({ where: { lastLoginAt: { gte: fiveMinutesAgo }, isActive: true }, select: { id: true, name: true, role: true, businessId: true } }),
      this.prisma.subscriptionPayment.aggregate({ _sum: { amount: true } }),
      this.prisma.subscriptionPayment.aggregate({ where: { paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      this.prisma.subscriptionPayment.count({ where: { paidAt: { gte: startOfDay } } }),
      this.prisma.systemAlert.count({ where: { isRead: false } }),
      this.prisma.subscription.count({ where: { status: 'EXPIRED' } }),
    ]);

    const onlineByRole = onlineUsers.reduce((acc: any, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

    return {
      businesses: { total, active, pending, suspended, rejected, expired: expiredSubs },
      users: {
        total: totalUsers,
        online: onlineUsers.length,
        byRole: onlineByRole,
        cashiers: onlineByRole['CASHIER'] || 0,
        managers: onlineByRole['MANAGER'] || 0,
        waiters: onlineByRole['WAITER'] || 0,
        admins: onlineByRole['ADMIN'] || 0,
      },
      revenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      dailyTransactions,
      unreadAlerts,
    };
  }
}
