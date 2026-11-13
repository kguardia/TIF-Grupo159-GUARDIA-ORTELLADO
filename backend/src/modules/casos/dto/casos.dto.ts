import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { NIVELES_URGENCIA, TIPOS_ANIMAL, TIPOS_AYUDA } from '../../../common/enums';
import { ContactoValido } from '../../../common/utils/contacto';
import { NumeroONulo, Recortar } from '../../../common/utils/transformadores';

/** RF01: lo que cualquier persona puede enviar sin registrarse. */
export class CrearCasoDto {
  @Recortar()
  @IsIn(TIPOS_ANIMAL, { message: 'Indicá qué tipo de animal es...' })
  tipo_animal: (typeof TIPOS_ANIMAL)[number];

  @Recortar()
  @IsString({ message: 'Contanos qué le pasa y dónde está.' })
  @MinLength(20, { message: 'Contanos un poco más: qué le pasa y dónde está (mínimo 20 caracteres).' })
  @MaxLength(2000, { message: 'La descripción puede tener hasta 2000 caracteres.' })
  descripcion: string;

  @IsIn(NIVELES_URGENCIA, { message: 'Elegí qué tan urgente es.' })
  nivel_urgencia: (typeof NIVELES_URGENCIA)[number];

  @IsIn(TIPOS_AYUDA, { message: 'Elegí qué tipo de ayuda necesita.' })
  tipo_ayuda: (typeof TIPOS_AYUDA)[number];

  /** Obligatorio: sin contacto el moderador no puede verificar el caso. */
  @Recortar()
  @IsString({ message: 'Dejá un teléfono o email para que el moderador pueda verificar el caso.' })
  @IsNotEmpty({ message: 'Dejá un teléfono o email para que el moderador pueda verificar el caso.' })
  @MaxLength(160, { message: 'El contacto puede tener hasta 160 caracteres.' })
  @ContactoValido({ message: 'Escribí un teléfono (con código de área), un email o un usuario que empiece con @.' })
  contacto_publicante: string;

  @Type(() => Number)
  @IsInt({ message: 'Elegí la zona donde está.' })
  zona_id: number;

  /** Opcionales (migración 01). Si viene una, tiene que venir la otra: se valida en el servicio. */
  @NumeroONulo()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 }, { message: 'La ubicación no es válida.' })
  @Min(-90, { message: 'La ubicación no es válida.' })
  @Max(90, { message: 'La ubicación no es válida.' })
  latitud?: number | null;

  @NumeroONulo()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 }, { message: 'La ubicación no es válida.' })
  @Min(-180, { message: 'La ubicación no es válida.' })
  @Max(180, { message: 'La ubicación no es válida.' })
  longitud?: number | null;
}

/** RF05: filtros del listado público. */
export class ListarCasosQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Zona no válida.' })
  zona_id?: number;

  @IsOptional()
  @IsIn(NIVELES_URGENCIA, { message: 'Urgencia no válida.' })
  nivel_urgencia?: (typeof NIVELES_URGENCIA)[number];

  @IsOptional()
  @IsIn(TIPOS_AYUDA, { message: 'Tipo de ayuda no válido.' })
  tipo_ayuda?: (typeof TIPOS_AYUDA)[number];

  @IsOptional()
  @Recortar()
  @IsString()
  @MaxLength(100, { message: 'La búsqueda puede tener hasta 100 caracteres.' })
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limite?: number;
}
