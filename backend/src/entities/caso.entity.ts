import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { EstadoCaso, NivelUrgencia, TipoAyuda } from '../common/enums';
import { Zona } from './zona.entity';
import { Usuario } from './usuario.entity';
import { CasoFoto } from './caso-foto.entity';
import { HistorialModeracion } from './historial-moderacion.entity';
import { Donacion } from './donacion.entity';
import { decimalANumero } from './transformadores';

@Entity('caso')
export class Caso {
  @PrimaryGeneratedColumn() id: number;

  /** Agregada por database/migracion_01_mapa_y_seguimiento.sql */
  @Column({ type: 'varchar', length: 12, unique: true }) codigo_seguimiento: string;

  @Column({ type: 'varchar', length: 60 }) tipo_animal: string;
  @Column({ type: 'text' }) descripcion: string;
  @Column({ type: 'enum', enum: ['critica', 'media', 'baja'] }) nivel_urgencia: NivelUrgencia;
  @Column({ type: 'enum', enum: ['veterinaria', 'traslado', 'alimento', 'otro'] }) tipo_ayuda: TipoAyuda;
  @Column({ type: 'enum', enum: ['pendiente', 'en_revision', 'aprobado', 'rechazado', 'resuelto'], default: 'pendiente' }) estado: EstadoCaso;
  @Column({ type: 'varchar', length: 160 }) contacto_publicante: string;

  @Column({ type: 'int' }) zona_id: number;
  @ManyToOne(() => Zona, { nullable: false, eager: false }) @JoinColumn({ name: 'zona_id' }) zona: Zona;

  /** Agregadas por database/migracion_01_mapa_y_seguimiento.sql (opcionales). */
  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true, transformer: decimalANumero }) latitud: number | null;
  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true, transformer: decimalANumero }) longitud: number | null;

  @Column({ type: 'int', nullable: true }) moderador_id: number | null;
  @ManyToOne(() => Usuario, { nullable: true }) @JoinColumn({ name: 'moderador_id' }) moderador: Usuario | null;

  @Column({ type: 'varchar', length: 255, nullable: true }) motivo_rechazo: string | null;
  @Column({ type: 'datetime' }) fecha_publicacion: Date;
  @Column({ type: 'datetime', nullable: true }) fecha_moderacion: Date | null;

  @OneToMany(() => CasoFoto, (f) => f.caso) fotos: CasoFoto[];
  @OneToMany(() => HistorialModeracion, (h) => h.caso) historial: HistorialModeracion[];
  @OneToOne(() => Donacion, (d) => d.caso) donacion: Donacion | null;
}
