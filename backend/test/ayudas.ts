import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';

export const CLAVE = 'clave-de-prueba-123';

/** PNG válido de 1x1 píxel. */
export const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
/** Un JPEG mínimo (alcanza con la firma: el servidor valida la firma, no decodifica la imagen). */
export const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), Buffer.from('JFIF'), Buffer.alloc(40)]);

export interface Entorno {
  app: INestApplication;
  ds: DataSource;
  http: () => ReturnType<typeof request>;
  cerrar: () => Promise<void>;
}

export async function levantar(): Promise<Entorno> {
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = modulo.createNestApplication();
  configurarApp(app);
  await app.init();
  const ds = app.get(DataSource);
  return { app, ds, http: () => request(app.getHttpServer()), cerrar: () => app.close() };
}

/** Deja la base limpia y con datos mínimos: 3 zonas, 1 administrador y 1 moderador. */
export async function reiniciarBd(ds: DataSource) {
  for (const t of ['donacion', 'historial_moderacion', 'caso_foto', 'caso', 'directorio_contacto', 'usuario', 'zona']) await ds.query(`DELETE FROM ${t}`);
  await ds.query("INSERT INTO zona (nombre) VALUES ('Almagro'), ('Palermo'), ('Flores')");
  const hash = bcrypt.hashSync(CLAVE, 4); // coste bajo: solo para que los tests sean rápidos
  await ds.query("INSERT INTO usuario (nombre, email, password_hash, rol, activo) VALUES ('Ada Admin', 'admin@test.com', ?, 'administrador', 1), ('Mara Moderadora', 'mod@test.com', ?, 'moderador', 1)", [hash, hash]);
}

export async function ingresar(env: Entorno, email: string, password = CLAVE): Promise<string> {
  const r = await env.http().post('/auth/login').send({ email, password });
  if (r.status !== 200) throw new Error(`login falló (${r.status}): ${JSON.stringify(r.body)}`);
  return r.body.access_token;
}

export const conToken = (t: string) => ({ Authorization: `Bearer ${t}` });

export async function zonaId(ds: DataSource, nombre: string): Promise<number> {
  return (await ds.query('SELECT id FROM zona WHERE nombre = ?', [nombre]))[0].id;
}

export interface DatosCaso {
  tipo_animal?: string;
  descripcion?: string;
  nivel_urgencia?: string;
  tipo_ayuda?: string;
  contacto_publicante?: string;
  zona_id?: number | string;
  latitud?: string;
  longitud?: string;
}

/** Publica un caso como lo hace el formulario: multipart, sin sesión. */
export function publicar(env: Entorno, zona: number, extra: DatosCaso = {}, fotos: { buf: Buffer; nombre: string; tipo: string }[] = []) {
  const datos: Record<string, unknown> = {
    tipo_animal: 'Perro',
    descripcion: 'Perro herido en la vereda de Rivadavia al 4000, no puede caminar.',
    nivel_urgencia: 'media',
    tipo_ayuda: 'veterinaria',
    contacto_publicante: '11 5555-1234',
    zona_id: zona,
    ...extra,
  };
  let req = env.http().post('/casos');
  for (const [k, v] of Object.entries(datos)) if (v !== undefined) req = req.field(k, String(v));
  for (const f of fotos) req = req.attach('fotos', f.buf, { filename: f.nombre, contentType: f.tipo });
  return req;
}
