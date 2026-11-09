import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caso, CasoFoto } from '../../entities';
import { ZonasModule } from '../zonas/zonas.module';
import { CasosController } from './casos.controller';
import { CasosService } from './casos.service';
import { VistasCaso } from './vistas-caso';

@Module({
  imports: [TypeOrmModule.forFeature([Caso, CasoFoto]), ZonasModule],
  controllers: [CasosController],
  providers: [CasosService, VistasCaso],
  exports: [CasosService, VistasCaso],
})
export class CasosModule {}
