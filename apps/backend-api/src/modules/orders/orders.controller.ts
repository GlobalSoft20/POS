import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private svc: OrdersService) {}

  @Get() findAll(@Query('status') status?: string) { return this.svc.findAll(status); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.svc.create({ ...body, userId: req.user.sub });
  }

  @Put(':id/items')
  addItems(@Param('id') id: string, @Body() body: { items: any[] }) {
    return this.svc.addItems(id, body.items);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.svc.updateStatus(id, body.status);
  }

  @Post(':id/pay')
  pay(@Param('id') id: string, @Body() body: { payments: any[] }) {
    return this.svc.pay(id, body.payments);
  }

  @Put(':id/cancel')
  cancel(@Param('id') id: string) { return this.svc.cancel(id); }
}
