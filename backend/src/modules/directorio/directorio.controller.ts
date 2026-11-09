import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { Publico } from '../../common/decorators/publico.decorator';
import { IdPipe } from '../../common/utils/id.pipe';
import { ContactoDto, ListarDirectorioQuery } from './dto/directorio.dto';
import { DirectorioService } from './directorio.service';

@Controller('directorio')
export class DirectorioController {
  constructor(private readonly directorio: DirectorioService) {}

  @Publico()
  @Get()
  listar(@Query() filtros: ListarDirectorioQuery) {
    return this.directorio.listar(filtros);
  }

  // Alta, edición y baja: cualquier usuario con sesión (moderador o administrador). El moderador carga el directorio.
  @Post()
  crear(@Body() dto: ContactoDto) {
    return this.directorio.crear(dto);
  }

  @Put(':id')
  actualizar(@Param('id', IdPipe) id: number, @Body() dto: ContactoDto) {
    return this.directorio.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  eliminar(@Param('id', IdPipe) id: number) {
    return this.directorio.eliminar(id);
  }
}
