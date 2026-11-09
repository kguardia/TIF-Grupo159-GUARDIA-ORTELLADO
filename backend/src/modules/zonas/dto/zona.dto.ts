import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Recortar } from '../../../common/utils/transformadores';

export class ZonaDto {
  @Recortar()
  @IsString({ message: 'Escribí el nombre de la zona.' })
  @IsNotEmpty({ message: 'Escribí el nombre de la zona.' })
  @MaxLength(80, { message: 'El nombre puede tener hasta 80 caracteres.' })
  nombre: string;
}
