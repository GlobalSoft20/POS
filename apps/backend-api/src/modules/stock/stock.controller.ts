import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(private svc: StockService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get('low') getLowStock() { return this.svc.getLowStock(); }
  @Get('movements') getMovements(@Query('productId') productId?: string) { return this.svc.getMovements(productId); }
  @Post('adjust') adjust(@Body() body: { productId: string; quantity: number; type: string; reason?: string }) {
    return this.svc.adjust(body.productId, body.quantity, body.type, body.reason);
  }
}
