import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Caso } from './caso.entity';
import { decimalANumero } from './transformadores';

@Entity('donacion')
export class Donacion {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'int', unique: true }) caso_id: number;
  @OneToOne(() => Caso, (c) => c.donacion, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'caso_id' }) caso: Caso;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: decimalANumero }) monto_objetivo: number | null;
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: decimalANumero }) monto_recaudado: number;
  @Column({ type: 'varchar', length: 80 }) alias_donacion: string;
  @Column({ type: 'int' }) actualizado_por: number;
  @Column({ type: 'datetime' }) fecha_actualizacion: Date;
}
