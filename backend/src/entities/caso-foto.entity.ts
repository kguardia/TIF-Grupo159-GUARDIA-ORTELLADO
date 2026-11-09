import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Caso } from './caso.entity';

@Entity('caso_foto')
export class CasoFoto {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'int' }) caso_id: number;
  @ManyToOne(() => Caso, (c) => c.fotos, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'caso_id' }) caso: Caso;
  /** Ruta relativa (/uploads/casos/xxx.jpg). La URL absoluta se arma al responder. */
  @Column({ type: 'varchar', length: 500 }) url: string;
  @Column({ type: 'int', default: 1 }) orden: number;
}
