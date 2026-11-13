/**
 * Lectura y validación de variables de entorno.
 * Si falta algo crítico el servidor NO arranca, y dice qué falta:
 * es mejor fallar al iniciar que fallar a las 3 de la mañana con un caso crítico abierto.
 */
export interface Configuracion {
  entorno: string;
  puerto: number;
  bd: {
    url?: string;
    host: string;
    puerto: number;
    usuario: string;
    clave: string;
    nombre: string;
    ssl: boolean;
  };
  jwt: { secreto: string; expiracion: string };
  corsOrigenes: string[];
  urlFrontend: string;
  urlPublica: string;
  carpetaFotos: string;
  mostrarContactoPublico: boolean;
  maxFotos: number;
  maxFotoBytes: number;
}

const bool = (v: string | undefined, def: boolean) => (v === undefined || v === '' ? def : ['1', 'true', 'si', 'sí'].includes(v.toLowerCase()));
const quitarBarra = (u: string) => u.replace(/\/+$/, '');

export function cargarConfiguracion(env: NodeJS.ProcessEnv = process.env): Configuracion {
  const errores: string[] = [];
  const produccion = env.NODE_ENV === 'production';

  const secreto = env.JWT_SECRET ?? '';
  if (secreto.length < 32) errores.push('JWT_SECRET debe tener al menos 32 caracteres.');
  if (produccion && /cambiar-por/i.test(secreto)) errores.push('JWT_SECRET sigue con el valor de ejemplo: generá uno propio.');

  const url = env.DATABASE_URL || env.MYSQL_URL || undefined;
  const host = env.DB_HOST || env.MYSQLHOST || 'localhost';
  const nombre = env.DB_NAME || env.MYSQLDATABASE || 'sos_patitas';
  if (!url && produccion && !env.DB_HOST && !env.MYSQLHOST) errores.push('Falta la base de datos: definí DATABASE_URL (o DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).');

  const puerto = Number(env.PORT ?? 3000);
  if (!Number.isInteger(puerto) || puerto <= 0) errores.push('PORT no es válido.');

  if (errores.length) {
    throw new Error(`Configuración inválida:\n - ${errores.join('\n - ')}`);
  }

  const origenes = (env.CORS_ORIGINS ?? 'http://localhost:8080,http://localhost:5500,http://127.0.0.1:5500')
    .split(',')
    .map((o) => quitarBarra(o.trim()))
    .filter(Boolean);
    
  return {
    entorno: env.NODE_ENV ?? 'development',
    puerto,
    bd: {
      url,
      host,
      puerto: Number(env.DB_PORT || env.MYSQLPORT || 3306),
      usuario: env.DB_USER || env.MYSQLUSER || 'root',
      clave: env.DB_PASSWORD ?? env.MYSQLPASSWORD ?? '',
      nombre,
      ssl: bool(env.DB_SSL, false),
    },
    jwt: { secreto, expiracion: env.JWT_EXPIRES_IN || '8h' },
    corsOrigenes: origenes,
    urlFrontend: quitarBarra(env.FRONTEND_URL ?? origenes[0] ?? 'http://localhost:8080'),
    urlPublica: quitarBarra(env.PUBLIC_BASE_URL ?? `http://localhost:${puerto}`),
    carpetaFotos: env.UPLOADS_DIR || './uploads',
    mostrarContactoPublico: bool(env.MOSTRAR_CONTACTO_PUBLICO, true),
    maxFotos: 3,
    maxFotoBytes: 5 * 1024 * 1024,
  };
}

/** Token de inyección para la configuración ya validada. */
export const CONFIGURACION = Symbol('CONFIGURACION');
