import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private svc: RoomsService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get('categories') findCategories() { return this.svc.findCategories(); }
  @Post('categories') createCategory(@Body() body: any) { return this.svc.createCategory(body); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Put(':id/status') updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.svc.updateStatus(id, body.status);
  }
}
