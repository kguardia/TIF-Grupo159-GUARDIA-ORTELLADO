import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { TIPOS_CONTACTO } from '../../../common/enums';
import { ABooleano, Recortar, VacioANulo } from '../../../common/utils/transformadores';

export class ContactoDto {
  @IsIn(TIPOS_CONTACTO, { message: 'Elegí si es veterinaria o rescatista.' })
  tipo: (typeof TIPOS_CONTACTO)[number];

  @Recortar()
  @IsString({ message: 'Escribí el nombre.' })
  @IsNotEmpty({ message: 'Escribí el nombre.' })
  @MaxLength(160, { message: 'El nombre puede tener hasta 160 caracteres.' })
  nombre: string;

  @Recortar()
  @IsString({ message: 'Escribí el teléfono.' })
  @Matches(/^(?=(?:\D*\d){7,})[\d\s()+\-.]{7,40}$/, { message: 'Escribí un teléfono con código de área (solo números, espacios, + y -).' })
  telefono: string;

  @Type(() => Number)
  @IsInt({ message: 'Elegí la zona.' })
  zona_id: number;

  @ABooleano()
  @IsBoolean()
  atencion_24hs: boolean;

  @VacioANulo()
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'La especialidad puede tener hasta 120 caracteres.' })
  especialidad?: string | null;
}

export class ListarDirectorioQuery {
  @IsOptional()
  @IsIn(TIPOS_CONTACTO, { message: 'Tipo no válido.' })
  tipo?: (typeof TIPOS_CONTACTO)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Zona no válida.' })
  zona_id?: number;

  @IsOptional()
  @ABooleano()
  @IsBoolean()
  atencion_24hs?: boolean;
}
