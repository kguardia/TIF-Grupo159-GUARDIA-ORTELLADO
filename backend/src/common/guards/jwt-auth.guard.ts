import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../entities';
import { ES_PUBLICO } from '../decorators/publico.decorator';

/**
 * Guard global: TODAS las rutas exigen sesión salvo las marcadas con @Publico().
 * "Denegar por defecto" evita que una ruta nueva quede abierta por olvido (RNF02).
 *
 * En cada pedido se vuelve a leer el usuario de la base: si un administrador desactiva
 * a un moderador, pierde el acceso al instante aunque su token siga vigente.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [ctx.getHandler(), ctx.getClass()])) return true;

    const req = ctx.switchToHttp().getRequest();
    const cabecera: string = req.headers['authorization'] ?? '';
    const [tipo, token] = cabecera.split(' ');
    if (tipo !== 'Bearer' || !token) throw new UnauthorizedException('Tu sesión venció. Ingresá de nuevo.');

    let payload: { sub: number };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Tu sesión venció. Ingresá de nuevo.');
    }

    const u = await this.usuarios.findOne({ where: { id: payload.sub } });
    if (!u || !u.activo) throw new UnauthorizedException('Tu sesión venció. Ingresá de nuevo.');

    req.usuario = { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol };
    return true;
  }
}
