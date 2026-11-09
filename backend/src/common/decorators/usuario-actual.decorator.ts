import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Rol } from '../enums';

export interface UsuarioSesion {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

/** Inyecta el usuario autenticado (lo deja listo JwtAuthGuard). */
export const UsuarioActual = createParamDecorator((_: unknown, ctx: ExecutionContext): UsuarioSesion => {
  return ctx.switchToHttp().getRequest().usuario;
});
