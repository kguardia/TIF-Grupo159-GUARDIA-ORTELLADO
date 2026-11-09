import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Usuario } from '../../entities';
import { ErrorDeNegocio, errorCampo, esDuplicado } from '../../common/utils/errores';

/** Coste de bcrypt: ~250 ms por hash, razonable contra fuerza bruta sin trabar el login. */
export const COSTE_BCRYPT = 12;

export const aVistaUsuario = (u: Usuario) => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo });

@Injectable()
export class UsuariosService {
  constructor(@InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>) {}

  async listar() {
    return (await this.usuarios.find({ order: { nombre: 'ASC' } })).map(aVistaUsuario);
  }

  buscarPorEmail(email: string) {
    return this.usuarios.findOne({ where: { email: email.trim().toLowerCase() } });
  }

  /** RF09: un administrador da de alta usuarios con rol moderador. Nunca se crea otro rol desde la API. */
  async crearModerador(dto: { nombre: string; email: string; password: string }) {
    const u = this.usuarios.create({
      nombre: dto.nombre,
      email: dto.email,
      password_hash: await bcrypt.hash(dto.password, COSTE_BCRYPT),
      rol: 'moderador',
      activo: true,
    });
    try {
      return aVistaUsuario(await this.usuarios.save(u));
    } catch (e) {
      if (esDuplicado(e)) throw errorCampo(HttpStatus.CONFLICT, 'email', 'Ya existe un usuario con ese email.');
      throw e;
    }
  }

  async cambiarActivo(id: number, activo: boolean, quienPide: number) {
    if (id === quienPide && !activo) throw new ErrorDeNegocio(HttpStatus.CONFLICT, 'No podés desactivar tu propio usuario.');
    const u = await this.usuarios.findOne({ where: { id } });
    if (!u) throw new NotFoundException('No encontramos el usuario.');
    u.activo = activo;
    return aVistaUsuario(await this.usuarios.save(u));
  }
}
