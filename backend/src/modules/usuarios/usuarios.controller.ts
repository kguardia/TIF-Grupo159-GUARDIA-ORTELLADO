import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioActual, UsuarioSesion } from '../../common/decorators/usuario-actual.decorator';
import { IdPipe } from '../../common/utils/id.pipe';
import { CambiarActivoDto, CrearUsuarioDto } from './dto/usuario.dto';
import { UsuariosService } from './usuarios.service';

/** Todo el módulo es solo para administradores (RF09). */
@Roles('administrador')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  listar() {
    return this.usuarios.listar();
  }

  @Post()
  crear(@Body() dto: CrearUsuarioDto) {
    return this.usuarios.crearModerador(dto);
  }

  @Patch(':id')
  cambiarActivo(@Param('id', IdPipe) id: number, @Body() dto: CambiarActivoDto, @UsuarioActual() yo: UsuarioSesion) {
    return this.usuarios.cambiarActivo(id, dto.activo, yo.id);
  }
}
