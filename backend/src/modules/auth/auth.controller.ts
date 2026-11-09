import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Publico } from '../../common/decorators/publico.decorator';
import { UsuarioActual, UsuarioSesion } from '../../common/decorators/usuario-actual.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Límite estricto por IP: frena los intentos de adivinar contraseñas. */
  @Publico()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  me(@UsuarioActual() u: UsuarioSesion) {
    return { ...u, activo: true };
  }
}
