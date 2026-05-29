import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException();
    try {
      const payload = this.jwt.verify(auth.split(' ')[1]);
      if (payload.role !== 'SUPER_ADMIN') throw new UnauthorizedException('Super Admin access required');
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
