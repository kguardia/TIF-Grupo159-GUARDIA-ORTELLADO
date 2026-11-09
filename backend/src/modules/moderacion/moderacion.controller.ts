import { Body, Controller, Get, Param, Patch, Put, Query } from '@nestjs/common';
import { UsuarioActual, UsuarioSesion } from '../../common/decorators/usuario-actual.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdPipe } from '../../common/utils/id.pipe';
import { GuardarDonacionDto } from '../donaciones/dto/donacion.dto';
import { CambiarEstadoDto, CambiarUrgenciaDto, ListarModeracionQuery } from './dto/moderacion.dto';
import { ModeracionService } from './moderacion.service';

/**
 * RNF02: solo moderador y administrador. Se declara explícito en el controlador entero
 * (además del guard global que ya exige sesión), así queda a la vista y no se puede perder.
 */
@Roles('moderador', 'administrador')
@Controller('moderacion/casos')
export class ModeracionController {
  constructor(private readonly moderacion: ModeracionService) {}

  @Get()
  listar(@Query() q: ListarModeracionQuery) {
    return this.moderacion.listar(q.estado);
  }

  @Get(':id')
  obtener(@Param('id', IdPipe) id: number) {
    return this.moderacion.obtener(id);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id', IdPipe) id: number, @Body() dto: CambiarEstadoDto, @UsuarioActual() u: UsuarioSesion) {
    return this.moderacion.cambiarEstado(id, dto.accion, dto.motivo, u);
  }

  @Patch(':id/urgencia')
  cambiarUrgencia(@Param('id', IdPipe) id: number, @Body() dto: CambiarUrgenciaDto) {
    return this.moderacion.cambiarUrgencia(id, dto.nivel_urgencia);
  }

  @Patch(':id/resolver')
  resolver(@Param('id', IdPipe) id: number, @UsuarioActual() u: UsuarioSesion) {
    return this.moderacion.resolver(id, u);
  }

  @Put(':id/donacion')
  guardarDonacion(@Param('id', IdPipe) id: number, @Body() dto: GuardarDonacionDto, @UsuarioActual() u: UsuarioSesion) {
    return this.moderacion.guardarDonacion(id, dto, u);
  }
}
