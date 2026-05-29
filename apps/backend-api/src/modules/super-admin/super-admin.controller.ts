import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminGuard } from './super-admin.guard';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private svc: SuperAdminService) {}

  @Post('auth/login')
  login(@Body() body: { email: string; password: string }) { return this.svc.login(body.email, body.password); }

  @UseGuards(SuperAdminGuard) @Get('dashboard')
  getDashboard() { return this.svc.getDashboardStats(); }

  // ── BUSINESSES ────────────────────────────────────────────────────────────
  @UseGuards(SuperAdminGuard) @Get('businesses')
  getBusinesses(@Query('status') status?: string) { return this.svc.getBusinesses(status); }

  @UseGuards(SuperAdminGuard) @Get('businesses/performance')
  getPerformance() { return this.svc.getBusinessPerformance(); }

  @UseGuards(SuperAdminGuard) @Get('businesses/:id')
  getBusiness(@Param('id') id: string) { return this.svc.getBusiness(id); }

  @UseGuards(SuperAdminGuard) @Put('businesses/:id/approve')
  approve(@Param('id') id: string) { return this.svc.approveBusiness(id); }

  @UseGuards(SuperAdminGuard) @Put('businesses/:id/reject')
  reject(@Param('id') id: string, @Body() body: { reason: string }) { return this.svc.rejectBusiness(id, body.reason); }

  @UseGuards(SuperAdminGuard) @Put('businesses/:id/suspend')
  suspend(@Param('id') id: string, @Body() body: { reason: string }) { return this.svc.suspendBusiness(id, body.reason); }

  @UseGuards(SuperAdminGuard) @Put('businesses/:id/activate')
  activate(@Param('id') id: string) { return this.svc.activateBusiness(id); }

  @UseGuards(SuperAdminGuard) @Put('businesses/:id/lock')
  lock(@Param('id') id: string) { return this.svc.lockBusiness(id); }

  @UseGuards(SuperAdminGuard) @Put('businesses/:id/unlock')
  unlock(@Param('id') id: string) { return this.svc.unlockBusiness(id); }

  @UseGuards(SuperAdminGuard) @Put('businesses/:id/verify')
  verify(@Param('id') id: string) { return this.svc.verifyBusiness(id); }

  @UseGuards(SuperAdminGuard) @Put('businesses/:id/request-info')
  requestInfo(@Param('id') id: string, @Body() body: { message: string }) { return this.svc.requestMoreInfo(id, body.message); }

  @UseGuards(SuperAdminGuard) @Put('businesses/:id/force-logout-all')
  forceLogoutAll(@Param('id') id: string) { return this.svc.forceLogoutAllUsers(id); }

  // ── USERS ─────────────────────────────────────────────────────────────────
  @UseGuards(SuperAdminGuard) @Get('users')
  getUsers(@Query('businessId') businessId?: string) { return this.svc.getAllUsers(businessId); }

  @UseGuards(SuperAdminGuard) @Get('users/online')
  getOnlineUsers() { return this.svc.getOnlineUsers(); }

  @UseGuards(SuperAdminGuard) @Put('users/:id/force-logout')
  forceLogout(@Param('id') id: string) { return this.svc.forceLogoutUser(id); }

  @UseGuards(SuperAdminGuard) @Put('users/:id/toggle-active')
  toggleActive(@Param('id') id: string, @Body() body: { isActive: boolean }) { return this.svc.toggleUserActive(id, body.isActive); }

  // ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────
  @UseGuards(SuperAdminGuard) @Get('subscriptions')
  getSubscriptions() { return this.svc.getSubscriptions(); }

  @UseGuards(SuperAdminGuard) @Put('subscriptions/:businessId')
  updateSubscription(@Param('businessId') businessId: string, @Body() body: any) { return this.svc.updateSubscription(businessId, body); }

  @UseGuards(SuperAdminGuard) @Put('subscriptions/:businessId/extend')
  extendSubscription(@Param('businessId') businessId: string, @Body() body: { days: number }) { return this.svc.extendSubscription(businessId, body.days); }

  @UseGuards(SuperAdminGuard) @Put('subscriptions/:businessId/trial')
  grantTrial(@Param('businessId') businessId: string, @Body() body: { days: number }) { return this.svc.grantFreeTrial(businessId, body.days); }

  @UseGuards(SuperAdminGuard) @Post('subscriptions/:id/payment')
  recordPayment(@Param('id') id: string, @Body() body: { amount: number; method: string; reference?: string }) { return this.svc.recordSubscriptionPayment(id, body.amount, body.method, body.reference); }

  // ── REVENUE ───────────────────────────────────────────────────────────────
  @UseGuards(SuperAdminGuard) @Get('revenue')
  getRevenue() { return this.svc.getPlatformRevenue(); }

  // ── ACTIVITY ──────────────────────────────────────────────────────────────
  @UseGuards(SuperAdminGuard) @Get('activity')
  getActivity(@Query('businessId') businessId?: string, @Query('limit') limit?: string) { return this.svc.getLoginActivity(businessId, limit ? +limit : 100); }

  // ── ALERTS ────────────────────────────────────────────────────────────────
  @UseGuards(SuperAdminGuard) @Get('alerts')
  getAlerts(@Request() req: any) { return this.svc.getAlerts(req.user.sub); }

  @UseGuards(SuperAdminGuard) @Put('alerts/:id/read')
  markRead(@Param('id') id: string) { return this.svc.markAlertRead(id); }

  @UseGuards(SuperAdminGuard) @Put('alerts/read-all')
  markAllRead(@Request() req: any) { return this.svc.markAllAlertsRead(req.user.sub); }

  // ── SETTINGS ──────────────────────────────────────────────────────────────
  @UseGuards(SuperAdminGuard) @Get('settings')
  getSettings() { return this.svc.getSettings(); }

  @UseGuards(SuperAdminGuard) @Put('settings')
  updateSettings(@Body() body: any) { return this.svc.updateSettings(body); }
}
