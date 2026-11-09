import { existsSync } from 'fs';
import { join } from 'path';
import { Entorno, JPG, PNG, levantar, publicar, reiniciarBd, zonaId } from './ayudas';

describe('Público: publicar sin cuenta, seguimiento y visibilidad (RF01, RF02, RF05)', () => {
  let env: Entorno;
  let almagro: number;

  beforeAll(async () => {
    env = await levantar();
  });
  beforeEach(async () => {
    await reiniciarBd(env.ds);
    almagro = await zonaId(env.ds, 'Almagro');
  });
  afterAll(() => env.cerrar());

  it('responde el healthcheck con la base conectada', async () => {
    const r = await env.http().get('/salud').expect(200);
    expect(r.body).toEqual({ estado: 'ok', bd: 'ok' });
  });

  it('lista las zonas ordenadas, sin sesión', async () => {
    const r = await env.http().get('/zonas').expect(200);
    expect(r.body.map((z: { nombre: string }) => z.nombre)).toEqual(['Almagro', 'Flores', 'Palermo']);
  });

  describe('RF01: publicar', () => {
    it('cualquiera publica sin registrarse y el caso nace PENDIENTE', async () => {
      const r = await publicar(env, almagro).expect(201);
      expect(r.body.id).toBeGreaterThan(0);
      expect(r.body.codigo_seguimiento).toMatch(/^PAT-[A-Z2-9]{6}$/);
      const [fila] = await env.ds.query('SELECT estado, moderador_id FROM caso WHERE id = ?', [r.body.id]);
      expect(fila).toEqual({ estado: 'pendiente', moderador_id: null });
    });

    it('un cliente malicioso no puede publicar un caso ya aprobado (ignora campos extra)', async () => {
      const r = await publicar(env, almagro, {}).field('estado', 'aprobado').field('moderador_id', '1').field('codigo_seguimiento', 'PAT-HACKED');
      expect(r.status).toBe(201);
      const [fila] = await env.ds.query('SELECT estado, codigo_seguimiento, moderador_id FROM caso WHERE id = ?', [r.body.id]);
      expect(fila.estado).toBe('pendiente');
      expect(fila.codigo_seguimiento).not.toBe('PAT-HACKED');
      expect(fila.moderador_id).toBeNull();
    });

    it('guarda hasta 3 fotos y las sirve', async () => {
      const r = await publicar(env, almagro, {}, [
        { buf: PNG, nombre: 'a.png', tipo: 'image/png' },
        { buf: JPG, nombre: 'b.jpg', tipo: 'image/jpeg' },
      ]).expect(201);
      const filas = await env.ds.query('SELECT url, orden FROM caso_foto WHERE caso_id = ? ORDER BY orden', [r.body.id]);
      expect(filas).toHaveLength(2);
      expect(filas[0].url).toMatch(/^\/uploads\/casos\/[a-f0-9]{32}\.png$/);
      expect(filas[1].url).toMatch(/\.jpg$/);
      expect(existsSync(join(process.env.UPLOADS_DIR!, 'casos', filas[0].url.split('/').pop()))).toBe(true);
      const img = await env.http().get(filas[0].url).expect(200);
      expect(img.headers['content-type']).toBe('image/png');
      expect(img.headers['x-content-type-options']).toBe('nosniff');
    });

    it('el nombre del archivo del cliente nunca se usa (no se puede escribir fuera de la carpeta)', async () => {
      const r = await publicar(env, almagro, {}, [{ buf: PNG, nombre: '../../../etc/passwd.png', tipo: 'image/png' }]).expect(201);
      const [f] = await env.ds.query('SELECT url FROM caso_foto WHERE caso_id = ?', [r.body.id]);
      expect(f.url).toMatch(/^\/uploads\/casos\/[a-f0-9]{32}\.png$/);
    });

    it('rechaza un formulario vacío indicando cada campo', async () => {
      const r = await env.http().post('/casos').field('x', 'y').expect(400);
      expect(Object.keys(r.body.errors).sort()).toEqual(['contacto_publicante', 'descripcion', 'nivel_urgencia', 'tipo_animal', 'tipo_ayuda', 'zona_id']);
      expect(r.body.message).toBeTruthy();
    });

    it('el contacto es obligatorio y tiene que ser teléfono, email o @usuario', async () => {
      const faltante = await publicar(env, almagro, { contacto_publicante: '' }).expect(400);
      expect(faltante.body.errors.contacto_publicante).toMatch(/Dejá un teléfono/);
      const raro = await publicar(env, almagro, { contacto_publicante: 'hola' }).expect(400);
      expect(raro.body.errors.contacto_publicante).toMatch(/teléfono/);
      await publicar(env, almagro, { contacto_publicante: 'ana@correo.com' }).expect(201);
      await publicar(env, almagro, { contacto_publicante: '@ana.rescata' }).expect(201);
    });

    it('valida descripción corta, enums y zona inexistente', async () => {
      expect((await publicar(env, almagro, { descripcion: 'corta' }).expect(400)).body.errors.descripcion).toBeDefined();
      expect((await publicar(env, almagro, { nivel_urgencia: 'altisima' }).expect(400)).body.errors.nivel_urgencia).toBeDefined();
      expect((await publicar(env, almagro, { tipo_ayuda: 'dinero' }).expect(400)).body.errors.tipo_ayuda).toBeDefined();
      expect((await publicar(env, 99999).expect(400)).body.errors.zona_id).toBeDefined();
    });

    it('la ubicación es opcional, pero no puede venir a medias ni fuera de rango', async () => {
      const ok = await publicar(env, almagro, { latitud: '-34.6037', longitud: '-58.4116' }).expect(201);
      const [f] = await env.ds.query('SELECT latitud, longitud FROM caso WHERE id = ?', [ok.body.id]);
      expect(Number(f.latitud)).toBeCloseTo(-34.6037, 4);
      expect((await publicar(env, almagro, { latitud: '-34.6' }).expect(400)).body.errors.latitud).toBeDefined();
      expect((await publicar(env, almagro, { latitud: '200', longitud: '1' }).expect(400)).body.errors.latitud).toBeDefined();
    });

    it('rechaza archivos que no son imágenes aunque digan serlo', async () => {
      const r = await publicar(env, almagro, {}, [{ buf: Buffer.from('<script>alert(1)</script>'), nombre: 'x.png', tipo: 'image/png' }]).expect(400);
      expect(r.body.errors.fotos).toMatch(/imágenes/);
      expect(await env.ds.query('SELECT id FROM caso')).toHaveLength(0); // no queda un caso a medias
    });

    it('rechaza más de 3 fotos y fotos de más de 5 MB', async () => {
      const f = { buf: PNG, nombre: 'a.png', tipo: 'image/png' };
      const muchas = await publicar(env, almagro, {}, [f, f, f, f]).expect(400);
      expect(muchas.body.errors.fotos).toMatch(/hasta 3/);
      const grande = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024 + 10)]);
      const pesada = await publicar(env, almagro, {}, [{ buf: grande, nombre: 'g.png', tipo: 'image/png' }]).expect(413);
      expect(pesada.body.errors.fotos).toMatch(/5 MB/);
    });

    it('si una foto es inválida, ninguna se guarda en disco ni en la base', async () => {
      await publicar(env, almagro, {}, [
        { buf: PNG, nombre: 'buena.png', tipo: 'image/png' },
        { buf: Buffer.from('no soy imagen'), nombre: 'mala.png', tipo: 'image/png' },
      ]).expect(400);
      expect(await env.ds.query('SELECT id FROM caso_foto')).toHaveLength(0);
    });
  });

  describe('RF02: un caso no es público hasta que lo aprueba un moderador', () => {
    it('un caso pendiente no aparece en el listado ni en el detalle ni en el enlace compartible', async () => {
      const { body } = await publicar(env, almagro).expect(201);
      expect((await env.http().get('/casos').expect(200)).body).toEqual([]);
      const detalle = await env.http().get(`/casos/${body.id}`).expect(404);
      expect(detalle.body.message).toBe('Este caso no está disponible.');
      await env.http().get(`/c/${body.id}`).expect(302);
    });

    it('los estados en_revision y rechazado tampoco son públicos', async () => {
      const a = (await publicar(env, almagro)).body.id;
      const b = (await publicar(env, almagro)).body.id;
      await env.ds.query("UPDATE caso SET estado = 'en_revision' WHERE id = ?", [a]);
      await env.ds.query("UPDATE caso SET estado = 'rechazado', motivo_rechazo = 'x' WHERE id = ?", [b]);
      expect((await env.http().get('/casos')).body).toEqual([]);
      await env.http().get(`/casos/${a}`).expect(404);
      await env.http().get(`/casos/${b}`).expect(404);
    });

    it('ningún filtro puede traer casos no aprobados', async () => {
      await publicar(env, almagro, { nivel_urgencia: 'critica' }).expect(201);
      expect((await env.http().get('/casos?nivel_urgencia=critica')).body).toEqual([]);
      expect((await env.http().get(`/casos?zona_id=${almagro}&q=perro`)).body).toEqual([]);
    });
  });

  describe('Seguimiento del publicante', () => {
    it('con el código ve el estado, sin datos privados', async () => {
      const { body } = await publicar(env, almagro).expect(201);
      const r = await env.http().get(`/casos/seguimiento/${body.codigo_seguimiento}`).expect(200);
      expect(r.body.estado).toBe('pendiente');
      expect(r.body.contacto_publicante).toBeUndefined();
      expect(r.body.moderador_id).toBeUndefined();
      // acepta minúsculas y espacios
      await env.http().get(`/casos/seguimiento/${encodeURIComponent(' ' + body.codigo_seguimiento.toLowerCase() + ' ')}`).expect(200);
    });

    it('un código inexistente o mal formado da 404 con el mismo mensaje', async () => {
      const a = await env.http().get('/casos/seguimiento/PAT-AAAAAA').expect(404);
      const b = await env.http().get("/casos/seguimiento/' OR 1=1 --").expect(404);
      expect(a.body.message).toBe(b.body.message);
    });
  });

  it('GET /casos/:id con id no numérico da 404, no 500', async () => {
    await env.http().get('/casos/abc').expect(404);
    await env.http().get('/casos/-5').expect(404);
  });
});
