import { Module } from '@nestjs/common';
import { CasosModule } from '../casos/casos.module';
import { CompartirController } from './compartir.controller';

@Module({ imports: [CasosModule], controllers: [CompartirController] })
export class CompartirModule {}
