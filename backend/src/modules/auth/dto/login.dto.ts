import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'Escribí tu email.' })
  @MinLength(3, { message: 'Escribí tu email.' })
  @MaxLength(160, { message: 'Escribí tu email.' })
  email: string;

  @IsString({ message: 'Escribí tu contraseña.' })
  @MinLength(1, { message: 'Escribí tu contraseña.' })
  @MaxLength(200, { message: 'Escribí tu contraseña.' })
  password: string;
}
