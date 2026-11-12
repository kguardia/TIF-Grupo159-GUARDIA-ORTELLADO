import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ACCIONES_MODERACION, ESTADOS_CASO, NIVELES_URGENCIA } from '../../../common/enums';
import { VacioANulo } from '../../../common/utils/transformadores';

export class CambiarEstadoDto {
  @IsIn(ACCIONES_MODERACION, { message: 'Acción no válida.' })
  accion: (typeof ACCIONES_MODERACION)[number];

  /** Obligatorio solo al rechazar (se valida en el servicio). Va a historial_moderacion. */
  @VacioANulo()
  @IsOptional()
  @IsString()
  @MaxLength(350, { message: 'El motivo puede tener hasta 350 caracteres.' })
  motivo?: string | null;
}

export class CambiarUrgenciaDto {
  @IsIn(NIVELES_URGENCIA, { message: 'Nivel de urgencia no válido.' })
  nivel_urgencia: (typeof NIVELES_URGENCIA)[number];
}

export class ListarModeracionQuery {
  @IsOptional()
  @IsIn(ESTADOS_CASO, { message: 'Estado no válido.' })
  estado?: (typeof ESTADOS_CASO)[number];
}
