import { Module } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminGuard } from './super-admin.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'shms-secret-key' })],
  providers: [SuperAdminService, SuperAdminGuard],
  controllers: [SuperAdminController],
})
export class SuperAdminModule {}
