import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caso, HistorialModeracion } from '../../entities';
import { CasosModule } from '../casos/casos.module';
import { DonacionesModule } from '../donaciones/donaciones.module';
import { ModeracionController } from './moderacion.controller';
import { ModeracionService } from './moderacion.service';

@Module({
  imports: [TypeOrmModule.forFeature([Caso, HistorialModeracion]), CasosModule, DonacionesModule],
  controllers: [ModeracionController],
  providers: [ModeracionService],
})
export class ModeracionModule {}
