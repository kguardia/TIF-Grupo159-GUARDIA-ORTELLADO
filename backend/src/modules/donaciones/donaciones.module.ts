import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caso, Donacion } from '../../entities';
import { DonacionesService } from './donaciones.service';

@Module({
  imports: [TypeOrmModule.forFeature([Donacion, Caso])],
  providers: [DonacionesService],
  exports: [DonacionesService],
})
export class DonacionesModule {}
