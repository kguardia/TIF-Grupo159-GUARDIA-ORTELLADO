import { IsBoolean, IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ABooleano, Recortar } from '../../../common/utils/transformadores';
import { Transform } from 'class-transformer';

export class CrearUsuarioDto {
  @Recortar()
  @IsString({ message: 'Escribí el nombre.' })
  @IsNotEmpty({ message: 'Escribí el nombre.' })
  @MaxLength(120, { message: 'El nombre puede tener hasta 120 caracteres.' })
  nombre: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Escribí un email válido.' })
  @MaxLength(160, { message: 'El email puede tener hasta 160 caracteres.' })
  email: string;

  // bcrypt solo considera los primeros 72 bytes: más largo no suma seguridad.
  @IsString({ message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(72, { message: 'La contraseña puede tener hasta 72 caracteres.' })
  password: string;
}

export class CambiarActivoDto {
  @ABooleano()
  @IsBoolean({ message: 'Indicá si el usuario queda activo o desactivado.' })
  activo: boolean;
}
