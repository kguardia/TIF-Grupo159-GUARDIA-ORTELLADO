import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { COSTE_BCRYPT, UsuariosService, aVistaUsuario } from '../usuarios/usuarios.service';

@Injectable()
export class AuthService {
  /**
   * Hash falso para gastar el mismo tiempo cuando el email no existe:
   * si no, midiendo la demora se podría descubrir qué emails están registrados.
   */
  private readonly hashFalso = bcrypt.hashSync('no-existe-este-usuario', COSTE_BCRYPT);

  constructor(
    private readonly usuarios: UsuariosService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const u = await this.usuarios.buscarPorEmail(email);
    const coincide = await bcrypt.compare(password, u?.password_hash ?? this.hashFalso);
    // Mismo mensaje para "no existe", "clave incorrecta" y "desactivado": no filtramos información.
    if (!u || !coincide || !u.activo) throw new UnauthorizedException('El email o la contraseña no coinciden.');
    const access_token = await this.jwt.signAsync({ sub: u.id, rol: u.rol });
    return { access_token, usuario: aVistaUsuario(u) };
  }
}
