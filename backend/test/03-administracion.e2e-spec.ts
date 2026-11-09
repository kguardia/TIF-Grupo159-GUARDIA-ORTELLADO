import { CLAVE, Entorno, conToken, ingresar, levantar, publicar, reiniciarBd, zonaId } from './ayudas';

describe('Administración: usuarios, zonas, directorio, enlace compartible y seguridad (RF06, RF08, RF09, RNF02, RNF04)', () => {
  let env: Entorno;
  let almagro: number, palermo: number;
  let mod: string, admin: string;

  beforeAll(async () => {
    env = await levantar();
  });
  beforeEach(async () => {
    await reiniciarBd(env.ds);
    [almagro, palermo] = await Promise.all(['Almagro', 'Palermo'].map((n) => zonaId(env.ds, n)));
    mod = await ingresar(env, 'mod@test.com');
    admin = await ingresar(env, 'admin@test.com');
  });
  afterAll(() => env.cerrar());

  describe('RF09: el administrador da de alta moderadores', () => {
    it('un moderador no puede ver ni crear usuarios', async () => {
      await env.http().get('/usuarios').set(conToken(mod)).expect(403);
      await env.http().post('/usuarios').set(conToken(mod)).send({ nombre: 'X', email: 'x@x.com', password: 'unaclavelarga1' }).expect(403);
    });

    it('el administrador crea un moderador que puede ingresar; el rol siempre es moderador', async () => {
      const r = await env.http().post('/usuarios').set(conToken(admin)).send({ nombre: 'Lucía Pérez', email: ' Lucia@Test.com ', password: 'claveSegura1', rol: 'administrador', activo: false }).expect(201);
      expect(r.body).toEqual({ id: expect.any(Number), nombre: 'Lucía Pérez', email: 'lucia@test.com', rol: 'moderador', activo: true });
      expect(JSON.stringify(r.body)).not.toMatch(/hash/);
      const [u] = await env.ds.query("SELECT password_hash FROM usuario WHERE email = 'lucia@test.com'");
      expect(u.password_hash).toMatch(/^\$2[aby]\$12\$/); // bcrypt, nunca texto plano
      expect(u.password_hash).not.toContain('claveSegura1');
      const t = await ingresar(env, 'lucia@test.com', 'claveSegura1');
      await env.http().get('/moderacion/casos').set(conToken(t)).expect(200);
      await env.http().get('/usuarios').set(conToken(t)).expect(403); // y sigue sin poder administrar
    });

    it('valida datos y rechaza emails repetidos', async () => {
      const post = (b: object) => env.http().post('/usuarios').set(conToken(admin)).send(b);
      expect((await post({ nombre: '', email: 'a@a.com', password: 'unaclavelarga1' }).expect(400)).body.errors.nombre).toBeDefined();
      expect((await post({ nombre: 'A', email: 'no-es-email', password: 'unaclavelarga1' }).expect(400)).body.errors.email).toBeDefined();
      expect((await post({ nombre: 'A', email: 'a@a.com', password: 'corta' }).expect(400)).body.errors.password).toBeDefined();
      const dup = await post({ nombre: 'Otra', email: 'MOD@test.com', password: 'unaclavelarga1' }).expect(409);
      expect(dup.body.errors.email).toBe('Ya existe un usuario con ese email.');
    });

    it('lista usuarios sin exponer hashes, y no se puede desactivar el propio usuario', async () => {
      const r = await env.http().get('/usuarios').set(conToken(admin)).expect(200);
      expect(r.body).toHaveLength(2);
      expect(JSON.stringify(r.body)).not.toMatch(/hash|password/);
      const yo = r.body.find((u: { email: string }) => u.email === 'admin@test.com');
      await env.http().patch(`/usuarios/${yo.id}`).set(conToken(admin)).send({ activo: false }).expect(409);
      await env.http().patch('/usuarios/99999').set(conToken(admin)).send({ activo: false }).expect(404);
      await env.http().patch(`/usuarios/${yo.id}`).set(conToken(admin)).send({ activo: 'tal vez' }).expect(400); // un valor raro no se interpreta como "false"
    });
  });

  describe('RNF04: zonas', () => {
    it('solo el administrador crea y renombra; cualquiera las lista', async () => {
      await env.http().post('/zonas').set(conToken(mod)).send({ nombre: 'Quilmes' }).expect(403);
      const nueva = await env.http().post('/zonas').set(conToken(admin)).send({ nombre: '  Quilmes  ' }).expect(201);
      expect(nueva.body.nombre).toBe('Quilmes');
      await env.http().put(`/zonas/${nueva.body.id}`).set(conToken(admin)).send({ nombre: 'Quilmes Oeste' }).expect(200);
      expect((await env.http().get('/zonas')).body.map((z: { nombre: string }) => z.nombre)).toContain('Quilmes Oeste');
    });
    it('rechaza zonas repetidas (sin distinguir mayúsculas) y vacías; una zona nueva ya sirve para publicar', async () => {
      const dup = await env.http().post('/zonas').set(conToken(admin)).send({ nombre: 'almagro' }).expect(409);
      expect(dup.body.errors.nombre).toBe('Esa zona ya existe.');
      await env.http().post('/zonas').set(conToken(admin)).send({ nombre: '   ' }).expect(400);
      const z = (await env.http().post('/zonas').set(conToken(admin)).send({ nombre: 'Avellaneda' }).expect(201)).body;
      await publicar(env, z.id).expect(201);
    });
  });

  describe('RF06: directorio', () => {
    const contacto = (extra = {}) => ({ tipo: 'veterinaria', nombre: 'Vet 24 Rivadavia', telefono: '11 4903-2200', zona_id: almagro, atencion_24hs: true, especialidad: 'Urgencias', ...extra });

    it('alta, edición y baja por el equipo; el público lo ve y lo filtra por zona, tipo y 24 hs', async () => {
      const a = (await env.http().post('/directorio').set(conToken(mod)).send(contacto()).expect(201)).body;
      expect(a).toMatchObject({ nombre: 'Vet 24 Rivadavia', zona: { nombre: 'Almagro' }, atencion_24hs: true });
      await env.http().post('/directorio').set(conToken(mod)).send(contacto({ tipo: 'rescatista', nombre: 'Marta R.', telefono: '+54 11 5123-4567', zona_id: palermo, atencion_24hs: false, especialidad: '' })).expect(201);
      await env.http().post('/directorio').set(conToken(admin)).send(contacto({ nombre: 'Clínica Palermo', zona_id: palermo, atencion_24hs: false })).expect(201);

      const todos = (await env.http().get('/directorio').expect(200)).body; // sin sesión
      expect(todos).toHaveLength(3);
      expect(todos[0].nombre).toBe('Vet 24 Rivadavia'); // las guardias 24 hs primero
      expect((await env.http().get(`/directorio?zona_id=${palermo}`)).body).toHaveLength(2);
      expect((await env.http().get('/directorio?tipo=rescatista')).body).toHaveLength(1);
      expect((await env.http().get('/directorio?atencion_24hs=1')).body).toHaveLength(1);
      expect((await env.http().get('/directorio?atencion_24hs=true&tipo=veterinaria')).body).toHaveLength(1);
      expect((await env.http().get('/directorio?tipo=otro')).status).toBe(400);

      const e = await env.http().put(`/directorio/${a.id}`).set(conToken(mod)).send(contacto({ nombre: 'Vet Renombrada', atencion_24hs: false })).expect(200);
      expect(e.body).toMatchObject({ nombre: 'Vet Renombrada', atencion_24hs: false });
      await env.http().delete(`/directorio/${a.id}`).set(conToken(mod)).expect(204);
      await env.http().delete(`/directorio/${a.id}`).set(conToken(mod)).expect(404);
      expect((await env.http().get('/directorio')).body).toHaveLength(2);
    });

    it('sin sesión no se puede modificar el directorio', async () => {
      await env.http().post('/directorio').send(contacto()).expect(401);
      await env.http().put('/directorio/1').send(contacto()).expect(401);
      await env.http().delete('/directorio/1').expect(401);
    });

    it('valida los datos', async () => {
      const post = (b: object) => env.http().post('/directorio').set(conToken(mod)).send(b);
      expect((await post(contacto({ tipo: 'otro' })).expect(400)).body.errors.tipo).toBeDefined();
      expect((await post(contacto({ nombre: '' })).expect(400)).body.errors.nombre).toBeDefined();
      expect((await post(contacto({ telefono: '123' })).expect(400)).body.errors.telefono).toBeDefined();
      expect((await post(contacto({ telefono: 'llamar ya' })).expect(400)).body.errors.telefono).toBeDefined();
      expect((await post(contacto({ zona_id: 99999 })).expect(400)).body.errors.zona_id).toBeDefined();
    });
  });

  describe('RF08: enlace compartible con metadatos para redes', () => {
    it('devuelve HTML con etiquetas Open Graph y redirige al detalle en el frontend', async () => {
      const c = (await publicar(env, almagro, { tipo_animal: 'Perro', nivel_urgencia: 'critica' }).expect(201)).body;
      await env.http().patch(`/moderacion/casos/${c.id}/estado`).set(conToken(mod)).send({ accion: 'aprobado' }).expect(200);
      const r = await env.http().get(`/c/${c.id}`).expect(200);
      expect(r.headers['content-type']).toMatch(/text\/html/);
      expect(r.text).toContain('<meta property="og:title" content="Perro en Almagro necesita ayuda">');
      expect(r.text).toContain('property="og:description"');
      expect(r.text).toContain(`property="og:url" content="http://api.test/c/${c.id}"`);
      expect(r.text).toContain(`http-equiv="refresh" content="0;url=http://localhost:8080/caso.html?id=${c.id}"`);
    });
    it('incluye la primera foto como imagen de la vista previa', async () => {
      const { PNG } = await import('./ayudas');
      const c = (await publicar(env, almagro, {}, [{ buf: PNG, nombre: 'a.png', tipo: 'image/png' }]).expect(201)).body;
      await env.http().patch(`/moderacion/casos/${c.id}/estado`).set(conToken(mod)).send({ accion: 'aprobado' });
      const r = await env.http().get(`/c/${c.id}`).expect(200);
      expect(r.text).toMatch(/property="og:image" content="http:\/\/api\.test\/uploads\/casos\/[a-f0-9]{32}\.png"/);
      expect(r.text).toContain('summary_large_image');
    });
    it('escapa el contenido para que nadie inyecte HTML o scripts desde la descripción', async () => {
      const c = (await publicar(env, almagro, { tipo_animal: '<img src=x onerror=alert(1)>', descripcion: '"><script>alert(1)</script> descripción lo bastante larga' }).expect(201)).body;
      await env.http().patch(`/moderacion/casos/${c.id}/estado`).set(conToken(mod)).send({ accion: 'aprobado' });
      const r = await env.http().get(`/c/${c.id}`).expect(200);
      expect(r.text).not.toMatch(/<script>alert|<img src=x/);
      expect(r.text).toContain('&lt;script&gt;');
    });
    it('un caso no publicado o inexistente redirige al listado sin revelar nada', async () => {
      const c = (await publicar(env, almagro).expect(201)).body;
      for (const id of [c.id, 99999]) {
        const r = await env.http().get(`/c/${id}`).expect(302);
        expect(r.headers.location).toBe('http://localhost:8080/casos.html');
      }
    });
  });

  describe('Seguridad general', () => {
    it('CORS: solo los orígenes configurados reciben permiso', async () => {
      const ok = await env.http().options('/casos').set('Origin', 'http://localhost:8080').set('Access-Control-Request-Method', 'GET');
      expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:8080');
      const mal = await env.http().options('/casos').set('Origin', 'http://sitio-malo.com').set('Access-Control-Request-Method', 'GET');
      expect(mal.headers['access-control-allow-origin']).toBeUndefined();
    });
    it('cabeceras de seguridad y sin pista del framework', async () => {
      const r = await env.http().get('/zonas');
      expect(r.headers['x-powered-by']).toBeUndefined();
      expect(r.headers['x-content-type-options']).toBe('nosniff');
      expect(r.headers['strict-transport-security']).toBeDefined();
    });
    it('rutas inexistentes y errores de formato dan JSON en español, nunca un stack trace', async () => {
      const r = await env.http().get('/no-existe').expect(404);
      expect(r.body).toEqual({ statusCode: 404, message: 'No encontramos lo que buscabas.' });
      const m = await env.http().post('/auth/login').set('Content-Type', 'application/json').send('{"roto":').expect(400);
      expect(JSON.stringify(m.body)).not.toMatch(/at \w+|node_modules|SyntaxError/);
    });
    it('no se puede acceder a archivos fuera de la carpeta de fotos', async () => {
      const r = await env.http().get('/uploads/..%2f..%2fpackage.json');
      expect([400, 403, 404]).toContain(r.status);
      expect(r.text).not.toContain('sos-patitas-backend');
    });
    it('el login valida el cuerpo', async () => {
      await env.http().post('/auth/login').send({}).expect(400);
      await env.http().post('/auth/login').send({ email: 'mod@test.com', password: { $ne: '' } }).expect(400); // no acepta objetos (inyección NoSQL-style)
    });
    it('la contraseña correcta sigue funcionando tras todo lo anterior', async () => {
      await env.http().post('/auth/login').send({ email: 'mod@test.com', password: CLAVE }).expect(200);
    });
  });
});
