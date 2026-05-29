import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private svc: ProductsService) {}

  @Get() findAll(@Query('categoryId') categoryId?: string, @Query('search') search?: string) {
    return this.svc.findAll(categoryId, search);
  }

  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(id); }

  @Put(':id/favorite')
  toggleFavorite(@Param('id') id: string, @Body() body: { isFavorite: boolean }) {
    return this.svc.toggleFavorite(id, body.isFavorite);
  }
}
