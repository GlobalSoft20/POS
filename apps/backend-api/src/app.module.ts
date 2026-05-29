import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { TablesModule } from './modules/tables/tables.module';
import { StockModule } from './modules/stock/stock.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PrintersModule } from './modules/printers/printers.module';
import { SettingsModule } from './modules/settings/settings.module';
import { OrdersGateway } from './gateways/orders.gateway';

import { SuperAdminModule } from './modules/super-admin/super-admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    TablesModule,
    StockModule,
    SuppliersModule,
    RoomsModule,
    ReservationsModule,
    ReportsModule,
    PrintersModule,
    SettingsModule,
    SuperAdminModule,
  ],
  providers: [OrdersGateway],
})
export class AppModule {}
