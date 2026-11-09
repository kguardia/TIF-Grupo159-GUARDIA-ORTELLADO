import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Publico } from '../../common/decorators/publico.decorator';

/** Railway la usa como healthcheck: responde 200 solo si la base también contesta. */
@Publico()
@SkipThrottle()
@Controller('salud')
export class SaludController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Get()
  async estado() {
    try {
      await this.ds.query('SELECT 1');
      return { estado: 'ok', bd: 'ok' };
    } catch {
      throw new ServiceUnavailableException('La base de datos no responde.');
    }
  }
}
