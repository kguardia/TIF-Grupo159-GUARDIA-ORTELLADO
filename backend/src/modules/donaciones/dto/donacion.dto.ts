import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { NumeroONulo, Recortar } from '../../../common/utils/transformadores';

const MAX_MONTO = 99_999_999.99; // DECIMAL(10,2)

export class GuardarDonacionDto {
  @Recortar()
  @IsString({ message: 'Indicá el alias donde se recibe la donación.' })
  @IsNotEmpty({ message: 'Indicá el alias donde se recibe la donación.' })
  @MaxLength(80, { message: 'El alias puede tener hasta 80 caracteres.' })
  alias_donacion: string;

  /** Opcional: sin monto objetivo se muestra solo lo recaudado. */
  @NumeroONulo()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto objetivo tiene que ser un número (o dejalo vacío).' })
  @Min(0.01, { message: 'El monto objetivo tiene que ser mayor a cero (o dejalo vacío).' })
  @Max(MAX_MONTO, { message: 'El monto objetivo es demasiado grande.' })
  monto_objetivo?: number | null;

  @NumeroONulo()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto recaudado tiene que ser un número, por ejemplo 15000.' })
  @Min(0, { message: 'El monto recaudado no puede ser negativo.' })
  @Max(MAX_MONTO, { message: 'El monto recaudado es demasiado grande.' })
  monto_recaudado: number;
}
