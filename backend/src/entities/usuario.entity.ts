import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { Rol } from '../common/enums';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'varchar', length: 120 }) nombre: string;
  @Column({ type: 'varchar', length: 160, unique: true }) email: string;
  /** Nunca se devuelve por la API: ver UsuariosService.aVista(). */
  @Column({ type: 'varchar', length: 255 }) password_hash: string;
  @Column({ type: 'enum', enum: ['moderador', 'administrador'], default: 'moderador' }) rol: Rol;
  @Column({ type: 'boolean', default: true }) activo: boolean;
}
