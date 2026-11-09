import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { AccionModeracion } from '../common/enums';
import { Caso } from './caso.entity';
import { Usuario } from './usuario.entity';

@Entity('historial_moderacion')
export class HistorialModeracion {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'int' }) caso_id: number;
  @ManyToOne(() => Caso, (c) => c.historial, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'caso_id' }) caso: Caso;
  @Column({ type: 'int' }) usuario_id: number;
  @ManyToOne(() => Usuario, { nullable: false }) @JoinColumn({ name: 'usuario_id' }) usuario: Usuario;
  @Column({ type: 'enum', enum: ['aprobado', 'rechazado', 'en_revision'] }) accion: AccionModeracion;
  @Column({ type: 'varchar', length: 255, nullable: true }) motivo: string | null;
  @Column({ type: 'datetime' }) fecha: Date;
}
