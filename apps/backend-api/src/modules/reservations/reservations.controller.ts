import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private svc: ReservationsService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Put(':id/checkin') checkIn(@Param('id') id: string) { return this.svc.checkIn(id); }
  @Put(':id/checkout') checkOut(@Param('id') id: string) { return this.svc.checkOut(id); }
}
