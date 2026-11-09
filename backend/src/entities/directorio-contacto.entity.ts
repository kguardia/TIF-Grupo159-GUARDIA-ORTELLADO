import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { TipoContacto } from '../common/enums';
import { Zona } from './zona.entity';

@Entity('directorio_contacto')
export class DirectorioContacto {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'enum', enum: ['veterinaria', 'rescatista'] }) tipo: TipoContacto;
  @Column({ type: 'varchar', length: 160 }) nombre: string;
  @Column({ type: 'varchar', length: 40 }) telefono: string;
  @Column({ type: 'int' }) zona_id: number;
  @ManyToOne(() => Zona, { nullable: false }) @JoinColumn({ name: 'zona_id' }) zona: Zona;
  @Column({ type: 'boolean', default: false }) atencion_24hs: boolean;
  @Column({ type: 'varchar', length: 120, nullable: true }) especialidad: string | null;
}
