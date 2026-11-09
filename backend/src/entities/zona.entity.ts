import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('zona')
export class Zona {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'varchar', length: 80, unique: true }) nombre: string;
}
