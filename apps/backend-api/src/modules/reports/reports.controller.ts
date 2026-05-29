import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private svc: ReportsService) {}

  @Get('dashboard') getDashboard() { return this.svc.getDashboard(); }

  @Get('sales')
  getSales(@Query('from') from: string, @Query('to') to: string) {
    return this.svc.getSalesReport(from || new Date(Date.now() - 30 * 86400000).toISOString(), to || new Date().toISOString());
  }

  @Get('top-products')
  getTopProducts(@Query('limit') limit?: string) { return this.svc.getTopProducts(limit ? +limit : 10); }

  @Get('payments')
  getPayments(@Query('from') from: string, @Query('to') to: string) {
    return this.svc.getPaymentBreakdown(from || new Date(Date.now() - 30 * 86400000).toISOString(), to || new Date().toISOString());
  }
}
