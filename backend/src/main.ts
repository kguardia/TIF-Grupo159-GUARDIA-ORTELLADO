import './config/cargar-env';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './configurar-app';
import { CONFIGURACION, Configuracion } from './config/configuracion';

async function arrancar() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  configurarApp(app);
  const cfg = app.get<Configuracion>(CONFIGURACION);
  await app.listen(cfg.puerto, '0.0.0.0');
  new Logger('SOS Patitas').log(`API lista en el puerto ${cfg.puerto} (${cfg.entorno})`);
}

arrancar().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
