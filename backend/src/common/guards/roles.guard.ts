import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Rol } from '../enums';
import { ROLES_PERMITIDOS } from '../decorators/roles.decorator';

/** Se ejecuta después de JwtAuthGuard. Si la ruta declara @Roles(...), exige uno de esos roles. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<Rol[]>(ROLES_PERMITIDOS, [ctx.getHandler(), ctx.getClass()]);
    if (!permitidos?.length) return true;
    const usuario = ctx.switchToHttp().getRequest().usuario;
    if (!usuario || !permitidos.includes(usuario.rol)) throw new ForbiddenException('No tenés permiso para hacer esto.');
    return true;
  }
}
