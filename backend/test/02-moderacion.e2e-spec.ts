import { CLAVE, Entorno, conToken, ingresar, levantar, publicar, reiniciarBd, zonaId } from './ayudas';

describe('Moderación, sesión y donaciones (RF02-RF05, RF07, RNF02)', () => {
  let env: Entorno;
  let almagro: number, palermo: number, flores: number;
  let mod: string, admin: string;

  beforeAll(async () => {
    env = await levantar();
  });
  beforeEach(async () => {
    await reiniciarBd(env.ds);
    [almagro, palermo, flores] = await Promise.all(['Almagro', 'Palermo', 'Flores'].map((n) => zonaId(env.ds, n)));
    mod = await ingresar(env, 'mod@test.com');
    admin = await ingresar(env, 'admin@test.com');
  });
  afterAll(() => env.cerrar());

  const crear = async (extra = {}, zona = almagro) => (await publicar(env, zona, extra).expect(201)).body as { id: number; codigo_seguimiento: string };
  const aprobar = (id: number, token = mod) => env.http().patch(`/moderacion/casos/${id}/estado`).set(conToken(token)).send({ accion: 'aprobado' });

  describe('Sesión (RNF02)', () => {
    it('sin token, ninguna ruta del panel responde', async () => {
      for (const [metodo, ruta] of [['get', '/moderacion/casos'], ['get', '/moderacion/casos/1'], ['patch', '/moderacion/casos/1/estado'], ['put', '/moderacion/casos/1/donacion'], ['get', '/usuarios'], ['post', '/zonas'], ['post', '/directorio'], ['get', '/auth/me']] as const) {
        const r = await (env.http() as any)[metodo](ruta).send({});
        expect([metodo, ruta, r.status]).toEqual([metodo, ruta, 401]);
      }
    });

    it('rechaza tokens inválidos, manipulados o con otra firma', async () => {
      await env.http().get('/moderacion/casos').set(conToken('basura')).expect(401);
      const jwt = require('jsonwebtoken');
      const falso = jwt.sign({ sub: 1, rol: 'administrador' }, 'otro-secreto-cualquiera-que-no-es-el-nuestro');
      await env.http().get('/usuarios').set(conToken(falso)).expect(401);
      const sinFirma = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url') + '.' + Buffer.from(JSON.stringify({ sub: 1 })).toString('base64url') + '.';
      await env.http().get('/usuarios').set(conToken(sinFirma)).expect(401);
    });

    it('el login da el mismo error para email inexistente y contraseña incorrecta', async () => {
      const a = await env.http().post('/auth/login').send({ email: 'mod@test.com', password: 'mala' }).expect(401);
      const b = await env.http().post('/auth/login').send({ email: 'noexiste@test.com', password: 'mala' }).expect(401);
      expect(a.body.message).toBe('El email o la contraseña no coinciden.');
      expect(b.body.message).toBe(a.body.message);
    });

    it('el login devuelve token y usuario sin hash de contraseña; el email no distingue mayúsculas', async () => {
      const r = await env.http().post('/auth/login').send({ email: ' MOD@Test.com ', password: CLAVE }).expect(200);
      expect(r.body.access_token).toBeTruthy();
      expect(r.body.usuario).toEqual({ id: expect.any(Number), nombre: 'Mara Moderadora', email: 'mod@test.com', rol: 'moderador', activo: true });
      expect(JSON.stringify(r.body)).not.toMatch(/hash|\$2[aby]\$/);
      const me = await env.http().get('/auth/me').set(conToken(r.body.access_token)).expect(200);
      expect(me.body.email).toBe('mod@test.com');
    });

    it('un usuario desactivado pierde el acceso al instante, aunque su token siga vigente', async () => {
      await env.http().get('/moderacion/casos').set(conToken(mod)).expect(200);
      const [m] = await env.ds.query("SELECT id FROM usuario WHERE email = 'mod@test.com'");
      await env.http().patch(`/usuarios/${m.id}`).set(conToken(admin)).send({ activo: false }).expect(200);
      await env.http().get('/moderacion/casos').set(conToken(mod)).expect(401);
      await env.http().post('/auth/login').send({ email: 'mod@test.com', password: CLAVE }).expect(401);
    });

    it('el login tiene límite de intentos (frena fuerza bruta)', async () => {
      process.env.THROTTLE_DESACTIVADO = 'false';
      try {
        const estados: number[] = [];
        for (let i = 0; i < 12; i++) estados.push((await env.http().post('/auth/login').send({ email: 'mod@test.com', password: 'mala' })).status);
        expect(estados.slice(0, 10).every((s) => s === 401)).toBe(true);
        expect(estados.slice(10)).toEqual([429, 429]);
      } finally {
        process.env.THROTTLE_DESACTIVADO = 'true';
      }
    });
  });

  describe('RF03: aprobar, rechazar y marcar en revisión', () => {
    it('lista los casos de todos los estados y filtra por estado', async () => {
      const a = await crear(), b = await crear();
      await aprobar(a.id).expect(200);
      const todos = await env.http().get('/moderacion/casos').set(conToken(mod)).expect(200);
      expect(todos.body).toHaveLength(2);
      expect(todos.body[0].contacto_publicante).toBe('11 5555-1234'); // el equipo ve el contacto
      const pend = await env.http().get('/moderacion/casos?estado=pendiente').set(conToken(mod)).expect(200);
      expect(pend.body.map((c: { id: number }) => c.id)).toEqual([b.id]);
      await env.http().get('/moderacion/casos?estado=inventado').set(conToken(mod)).expect(400);
    });

    it('aprobar publica el caso, registra quién y deja historial', async () => {
      const c = await crear({ nivel_urgencia: 'critica' }, palermo);
      const r = await aprobar(c.id).expect(200);
      expect(r.body.estado).toBe('aprobado');
      expect(r.body.historial).toHaveLength(1);
      expect(r.body.historial[0]).toMatchObject({ accion: 'aprobado', usuario: 'Mara Moderadora' });
      const [fila] = await env.ds.query('SELECT moderador_id, fecha_moderacion FROM caso WHERE id = ?', [c.id]);
      expect(fila.moderador_id).not.toBeNull();
      expect(fila.fecha_moderacion).not.toBeNull();

      const lista = await env.http().get('/casos').expect(200);
      expect(lista.body).toHaveLength(1);
      expect(lista.body[0]).toMatchObject({ id: c.id, zona: { nombre: 'Palermo' }, estado: 'aprobado' });
      const detalle = await env.http().get(`/casos/${c.id}`).expect(200);
      expect(detalle.body.contacto_publicante).toBe('11 5555-1234');
    });

    it('la vista pública nunca expone datos internos', async () => {
      const c = await crear();
      await aprobar(c.id);
      const d = (await env.http().get(`/casos/${c.id}`).expect(200)).body;
      for (const campo of ['codigo_seguimiento', 'moderador_id', 'historial', 'motivo_rechazo', 'password_hash']) expect(d[campo]).toBeUndefined();
      const l = (await env.http().get('/casos')).body[0];
      expect(l.contacto_publicante).toBeUndefined();
    });

    it('rechazar exige motivo; con motivo el publicante lo ve en el seguimiento', async () => {
      const c = await crear();
      const sin = await env.http().patch(`/moderacion/casos/${c.id}/estado`).set(conToken(mod)).send({ accion: 'rechazado' }).expect(400);
      expect(sin.body.errors.motivo).toBe('Escribí el motivo del rechazo.');
      await env.http().patch(`/moderacion/casos/${c.id}/estado`).set(conToken(mod)).send({ accion: 'rechazado', motivo: '   ' }).expect(400);
      await env.http().patch(`/moderacion/casos/${c.id}/estado`).set(conToken(mod)).send({ accion: 'rechazado', motivo: 'x'.repeat(256) }).expect(400);
      const r = await env.http().patch(`/moderacion/casos/${c.id}/estado`).set(conToken(mod)).send({ accion: 'rechazado', motivo: 'No pudimos verificar la dirección.' }).expect(200);
      expect(r.body.motivo_rechazo).toBe('No pudimos verificar la dirección.');
      const seg = await env.http().get(`/casos/seguimiento/${c.codigo_seguimiento}`).expect(200);
      expect(seg.body).toMatchObject({ estado: 'rechazado', motivo_rechazo: 'No pudimos verificar la dirección.' });
      await env.http().get(`/casos/${c.id}`).expect(404);
    });

    it('en revisión mantiene el caso oculto; se puede aprobar después y limpia el motivo', async () => {
      const c = await crear();
      await env.http().patch(`/moderacion/casos/${c.id}/estado`).set(conToken(mod)).send({ accion: 'en_revision' }).expect(200);
      expect((await env.http().get('/casos')).body).toEqual([]);
      await env.http().patch(`/moderacion/casos/${c.id}/estado`).set(conToken(mod)).send({ accion: 'rechazado', motivo: 'Dudoso' }).expect(200);
      const ok = await aprobar(c.id).expect(200);
      expect(ok.body.motivo_rechazo).toBeNull();
      expect(ok.body.historial.map((h: { accion: string }) => h.accion)).toEqual(['aprobado', 'rechazado', 'en_revision']);
    });

    it('repetir el mismo estado da 409 y no ensucia el historial', async () => {
      const c = await crear();
      await aprobar(c.id).expect(200);
      await aprobar(c.id).expect(409);
      expect(await env.ds.query('SELECT id FROM historial_moderacion WHERE caso_id = ?', [c.id])).toHaveLength(1);
    });

    it('dos moderadores aprobando a la vez: uno gana y el otro recibe 409 (sin historial duplicado)', async () => {
      const c = await crear();
      const rs = await Promise.all([aprobar(c.id), aprobar(c.id, admin), aprobar(c.id)]);
      expect(rs.map((r) => r.status).sort()).toEqual([200, 409, 409]);
      expect(await env.ds.query('SELECT id FROM historial_moderacion WHERE caso_id = ?', [c.id])).toHaveLength(1);
    });

    it('acción inválida y caso inexistente', async () => {
      const c = await crear();
      await env.http().patch(`/moderacion/casos/${c.id}/estado`).set(conToken(mod)).send({ accion: 'resuelto' }).expect(400);
      await env.http().patch(`/moderacion/casos/${c.id}/estado`).set(conToken(mod)).send({}).expect(400);
      await env.http().patch('/moderacion/casos/99999/estado').set(conToken(mod)).send({ accion: 'aprobado' }).expect(404);
    });
  });

  describe('RF04: urgencia crítica y orden de la cola', () => {
    it('un moderador marca un caso como crítico', async () => {
      const c = await crear({ nivel_urgencia: 'baja' });
      const r = await env.http().patch(`/moderacion/casos/${c.id}/urgencia`).set(conToken(mod)).send({ nivel_urgencia: 'critica' }).expect(200);
      expect(r.body.nivel_urgencia).toBe('critica');
      await env.http().patch(`/moderacion/casos/${c.id}/urgencia`).set(conToken(mod)).send({ nivel_urgencia: 'urgentisima' }).expect(400);
    });
  });

  describe('RF05: listado público filtrable', () => {
    beforeEach(async () => {
      const casos = [
        { extra: { nivel_urgencia: 'baja', tipo_ayuda: 'alimento', tipo_animal: 'Gato', descripcion: 'Gata con crías en un patio, necesitan comida balanceada.' }, zona: almagro },
        { extra: { nivel_urgencia: 'critica', tipo_ayuda: 'veterinaria', descripcion: 'Perro atropellado en Rivadavia, no puede caminar bien.' }, zona: palermo },
        { extra: { nivel_urgencia: 'media', tipo_ayuda: 'traslado', descripcion: 'Perra herida cerca de la estación, hace falta transporte.' }, zona: almagro },
        { extra: { nivel_urgencia: 'critica', tipo_ayuda: 'traslado', descripcion: 'Cachorros 100% abandonados en una caja frente a la plaza.' }, zona: flores },
      ];
      for (const c of casos) await aprobar((await crear(c.extra, c.zona)).id);
      await crear({ nivel_urgencia: 'critica' }); // pendiente: no debe verse
    });

    const ids = async (qs: string) => (await env.http().get(`/casos${qs}`).expect(200)).body as { nivel_urgencia: string; zona: { id: number }; tipo_ayuda: string }[];

    it('ordena críticos primero y, dentro de cada nivel, lo más reciente', async () => {
      const l = await ids('');
      expect(l.map((c) => c.nivel_urgencia)).toEqual(['critica', 'critica', 'media', 'baja']);
    });
    it('filtra por zona, urgencia, tipo de ayuda y texto, y combina filtros', async () => {
      expect((await ids(`?zona_id=${almagro}`)).length).toBe(2);
      expect((await ids('?nivel_urgencia=critica')).length).toBe(2);
      expect((await ids('?tipo_ayuda=traslado')).length).toBe(2);
      expect((await ids('?q=atropellado')).length).toBe(1);
      expect((await ids('?q=ATROPELLADO')).length).toBe(1); // sin distinguir mayúsculas
      expect((await ids('?q=transporte')).length).toBe(1);
      expect((await ids(`?zona_id=${almagro}&tipo_ayuda=traslado`)).length).toBe(1);
      expect((await ids(`?zona_id=${flores}&nivel_urgencia=baja`)).length).toBe(0);
    });
    it('el texto de búsqueda se toma literal (% y _ no son comodines) y no permite inyección SQL', async () => {
      expect((await ids('?q=%25')).length).toBe(1); // solo el caso que contiene "100%"
      expect((await ids('?q=_')).length).toBe(0);
      expect((await ids(`?q=${encodeURIComponent("' OR '1'='1")}`)).length).toBe(0);
    });
    it('valida los parámetros y pagina', async () => {
      await env.http().get('/casos?nivel_urgencia=x').expect(400);
      await env.http().get('/casos?zona_id=abc').expect(400);
      await env.http().get('/casos?limite=9999').expect(400);
      expect((await ids('?limite=2&pagina=1')).length).toBe(2);
      expect((await ids('?limite=2&pagina=2')).length).toBe(2);
      expect((await ids('?limite=2&pagina=3')).length).toBe(0);
    });
  });

  describe('Resolver un caso', () => {
    it('solo un caso publicado se puede resolver; sale del listado pero su detalle queda y no muestra contacto', async () => {
      const c = await crear();
      await env.http().patch(`/moderacion/casos/${c.id}/resolver`).set(conToken(mod)).expect(409); // pendiente
      await aprobar(c.id);
      const r = await env.http().patch(`/moderacion/casos/${c.id}/resolver`).set(conToken(mod)).expect(200);
      expect(r.body.estado).toBe('resuelto');
      expect((await env.http().get('/casos')).body).toEqual([]);
      const d = await env.http().get(`/casos/${c.id}`).expect(200);
      expect(d.body.estado).toBe('resuelto');
      expect(d.body.contacto_publicante).toBeUndefined();
      await aprobar(c.id).expect(409); // un caso resuelto ya no se modifica
      await env.http().patch(`/moderacion/casos/${c.id}/urgencia`).set(conToken(mod)).send({ nivel_urgencia: 'baja' }).expect(409);
    });
  });

  describe('RF07: donaciones', () => {
    it('no se puede cargar una donación a un caso no publicado', async () => {
      const c = await crear();
      const r = await env.http().put(`/moderacion/casos/${c.id}/donacion`).set(conToken(mod)).send({ alias_donacion: 'ayuda.perro', monto_recaudado: 0 }).expect(409);
      expect(r.body.message).toMatch(/publicado/);
    });

    it('crea y luego actualiza la donación (un solo registro por caso), visible públicamente', async () => {
      const c = await crear();
      await aprobar(c.id);
      const a = await env.http().put(`/moderacion/casos/${c.id}/donacion`).set(conToken(mod)).send({ alias_donacion: 'ayuda.perro', monto_objetivo: 85000, monto_recaudado: 32000 }).expect(200);
      expect(a.body.donacion).toMatchObject({ alias_donacion: 'ayuda.perro', monto_objetivo: 85000, monto_recaudado: 32000 });
      await env.http().put(`/moderacion/casos/${c.id}/donacion`).set(conToken(admin)).send({ alias_donacion: 'ayuda.perro', monto_objetivo: 85000, monto_recaudado: 50500.5 }).expect(200);
      expect(await env.ds.query('SELECT id FROM donacion WHERE caso_id = ?', [c.id])).toHaveLength(1);
      const [d] = await env.ds.query('SELECT actualizado_por FROM donacion WHERE caso_id = ?', [c.id]);
      const [adm] = await env.ds.query("SELECT id FROM usuario WHERE email = 'admin@test.com'");
      expect(d.actualizado_por).toBe(adm.id); // queda registrado quién la actualizó

      const pub = await env.http().get(`/casos/${c.id}`).expect(200);
      expect(pub.body.donacion).toMatchObject({ monto_recaudado: 50500.5, alias_donacion: 'ayuda.perro' });
      expect((await env.http().get('/casos')).body[0].tiene_donacion).toBe(true);
    });

    it('acepta lo que manda el formulario: textos numéricos y objetivo vacío', async () => {
      const c = await crear();
      await aprobar(c.id);
      const r = await env.http().put(`/moderacion/casos/${c.id}/donacion`).set(conToken(mod)).send({ alias_donacion: '  mi.alias  ', monto_objetivo: '', monto_recaudado: '15000' }).expect(200);
      expect(r.body.donacion).toMatchObject({ alias_donacion: 'mi.alias', monto_objetivo: null, monto_recaudado: 15000 });
    });

    it('valida alias y montos', async () => {
      const c = await crear();
      await aprobar(c.id);
      const put = (b: object) => env.http().put(`/moderacion/casos/${c.id}/donacion`).set(conToken(mod)).send(b);
      expect((await put({ alias_donacion: '', monto_recaudado: 0 }).expect(400)).body.errors.alias_donacion).toBeDefined();
      expect((await put({ alias_donacion: 'a', monto_recaudado: -5 }).expect(400)).body.errors.monto_recaudado).toBeDefined();
      expect((await put({ alias_donacion: 'a', monto_objetivo: 0, monto_recaudado: 0 }).expect(400)).body.errors.monto_objetivo).toBeDefined();
      expect((await put({ alias_donacion: 'a', monto_recaudado: 'mucho' }).expect(400)).body.errors.monto_recaudado).toBeDefined();
      expect((await put({ alias_donacion: 'a', monto_recaudado: 1e12 }).expect(400)).body.errors.monto_recaudado).toBeDefined();
    });
  });
});
