import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tables')
export class TablesController {
  constructor(private svc: TablesService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Roles('ADMIN', 'MANAGER')
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Roles('ADMIN', 'MANAGER')
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Roles('ADMIN')
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(id); }
  @Put(':id/status') updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.svc.updateStatus(id, body.status);
  }
}
