/**
 * Variables de entorno para los tests. Usan una base APARTE (sos_patitas_test): los tests
 * borran el contenido de las tablas, así que NUNCA deben apuntar a la base real.
 * Se pueden cambiar con TEST_DB_HOST, TEST_DB_PORT, TEST_DB_USER, TEST_DB_PASSWORD, TEST_DB_NAME.
 */
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const nombre = process.env.TEST_DB_NAME ?? 'sos_patitas_test';
if (!/test/i.test(nombre)) throw new Error('TEST_DB_NAME debe contener "test": los tests borran datos.');

delete process.env.DATABASE_URL;
delete process.env.MYSQL_URL;
Object.assign(process.env, {
  NODE_ENV: 'test',
  DB_HOST: process.env.TEST_DB_HOST ?? '127.0.0.1',
  DB_PORT: process.env.TEST_DB_PORT ?? '3306',
  DB_USER: process.env.TEST_DB_USER ?? 'sos',
  DB_PASSWORD: process.env.TEST_DB_PASSWORD ?? 'sos_test_pw',
  DB_NAME: nombre,
  JWT_SECRET: 'secreto-de-pruebas-que-tiene-mas-de-32-caracteres-seguro',
  JWT_EXPIRES_IN: '1h',
  CORS_ORIGINS: 'http://localhost:8080',
  FRONTEND_URL: 'http://localhost:8080',
  PUBLIC_BASE_URL: 'http://api.test',
  UPLOADS_DIR: mkdtempSync(join(tmpdir(), 'sos-fotos-')),
  MOSTRAR_CONTACTO_PUBLICO: 'true',
  THROTTLE_DESACTIVADO: 'true',
});
