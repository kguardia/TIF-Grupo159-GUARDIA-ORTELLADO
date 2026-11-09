import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectorioContacto } from '../../entities';
import { ZonasModule } from '../zonas/zonas.module';
import { DirectorioController } from './directorio.controller';
import { DirectorioService } from './directorio.service';

@Module({
  imports: [TypeOrmModule.forFeature([DirectorioContacto]), ZonasModule],
  controllers: [DirectorioController],
  providers: [DirectorioService],
})
export class DirectorioModule {}
