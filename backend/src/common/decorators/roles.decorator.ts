import { SetMetadata } from '@nestjs/common';
import type { Rol } from '../enums';

export const ROLES_PERMITIDOS = 'roles_permitidos';
/** Limita una ruta a ciertos roles. Sin este decorador, basta con tener sesión (moderador o administrador). */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_PERMITIDOS, roles);
