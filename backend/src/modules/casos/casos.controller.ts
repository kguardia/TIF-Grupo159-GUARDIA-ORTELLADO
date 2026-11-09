import { Body, Controller, Get, HttpCode, Inject, Param, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { Publico } from '../../common/decorators/publico.decorator';
import { IdPipe } from '../../common/utils/id.pipe';
import { CasosService } from './casos.service';
import { CrearCasoDto, ListarCasosQuery } from './dto/casos.dto';

/** Rutas públicas: no piden cuenta (RF01, RF05). */
@Publico()
@Controller('casos')
export class CasosController {
  constructor(private readonly casos: CasosService) {}

  @Get()
  listar(@Query() filtros: ListarCasosQuery) {
    return this.casos.listarPublicos(filtros);
  }

  /** Va antes que ":id" para que "seguimiento" no se interprete como un id. */
  @Get('seguimiento/:codigo')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  seguimiento(@Param('codigo') codigo: string) {
    return this.casos.seguimiento(codigo);
  }

  @Get(':id')
  detalle(@Param('id', IdPipe) id: number) {
    return this.casos.obtenerPublico(id);
  }

  /**
   * multipart/form-data con hasta 3 fotos en el campo "fotos".
   * Límite por IP: es público, así que lo protegemos del spam.
   */
  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  @UseInterceptors(FilesInterceptor('fotos', 3, { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 3, fields: 20 } }))
  publicar(@Body() dto: CrearCasoDto, @UploadedFiles() fotos: Express.Multer.File[]) {
    return this.casos.publicar(dto, fotos ?? []);
  }
}
