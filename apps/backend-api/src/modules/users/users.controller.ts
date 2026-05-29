import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Roles('ADMIN', 'MANAGER')
  @Get() findAll() { return this.users.findAll(); }

  @Roles('ADMIN', 'MANAGER')
  @Get(':id') findOne(@Param('id') id: string) { return this.users.findOne(id); }

  @Roles('ADMIN')
  @Post() create(@Body() body: any) { return this.users.create(body); }

  @Roles('ADMIN')
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.users.update(id, body); }

  @Roles('ADMIN')
  @Delete(':id') remove(@Param('id') id: string) { return this.users.remove(id); }
}
