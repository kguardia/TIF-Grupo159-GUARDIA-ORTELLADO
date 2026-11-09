import { Body, Controller, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { Publico } from '../../common/decorators/publico.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdPipe } from '../../common/utils/id.pipe';
import { ZonaDto } from './dto/zona.dto';
import { ZonasService } from './zonas.service';

@Controller('zonas')
export class ZonasController {
  constructor(private readonly zonas: ZonasService) {}

  @Publico()
  @Get()
  listar() {
    return this.zonas.listar();
  }

  @Roles('administrador')
  @Post()
  crear(@Body() dto: ZonaDto) {
    return this.zonas.crear(dto.nombre);
  }

  @Roles('administrador')
  @Put(':id')
  @HttpCode(200)
  renombrar(@Param('id', IdPipe) id: number, @Body() dto: ZonaDto) {
    return this.zonas.renombrar(id, dto.nombre);
  }
}
