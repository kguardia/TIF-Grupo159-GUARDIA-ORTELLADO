import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ErroresFilter } from './common/filters/errores.filter';
import { crearPipeDeValidacion } from './common/utils/validacion';
import { CONFIGURACION, Configuracion } from './config/configuracion';
import { AlmacenamientoService } from './modules/almacenamiento/almacenamiento.service';

/** Todo lo que no es "módulo" pero tiene que valer igual en producción y en los tests. */
export function configurarApp(app: INestApplication): void {
  const cfg = app.get<Configuracion>(CONFIGURACION);
  const express = app as NestExpressApplication;

  express.disable('x-powered-by');
  // Railway pone un proxy delante: sin esto todas las IP serían la misma y el límite de pedidos no serviría.
  express.set('trust proxy', 1);

  // Las fotos las pide otro origen (el frontend), por eso "cross-origin" en vez del valor por defecto.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const permitidos = cfg.corsOrigenes;
  app.enableCors({
    origin: (origen: string | undefined, cb: (e: Error | null, ok?: boolean) => void) => cb(null, !origen || permitidos.includes('*') || permitidos.includes(origen)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  express.useStaticAssets(app.get(AlmacenamientoService).raiz, { prefix: '/uploads', index: false, dotfiles: 'deny', maxAge: '7d' });

  app.useGlobalPipes(crearPipeDeValidacion());
  app.useGlobalFilters(new ErroresFilter());
}
