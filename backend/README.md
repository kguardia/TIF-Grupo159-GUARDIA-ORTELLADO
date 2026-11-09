# SOS Patitas — Backend

API REST en **NestJS + TypeScript** sobre **MySQL**, para desplegar en **Railway**. Implementa los requerimientos aprobados (RF01–RF09, RNF01–RNF05) y el contrato que ya usa el frontend de `/frontend`.

## Qué cubre cada requerimiento

| Req. | Qué hace | Dónde |
|---|---|---|
| RF01 | Cualquiera publica un caso sin cuenta (formulario con contacto obligatorio, hasta 3 fotos) | `POST /casos` · `modules/casos` |
| RF02 | Un caso nace `pendiente` y **no aparece** en ningún endpoint público hasta ser aprobado | `casos.service.ts` (listado y detalle filtran por estado) |
| RF03 | Moderador aprueba / rechaza (con motivo) / marca en revisión, con historial de auditoría | `PATCH /moderacion/casos/:id/estado` · `modules/moderacion` |
| RF04 | Marcar urgencia crítica; la cola y el listado ordenan críticos primero | `PATCH …/urgencia` |
| RF05 | Listado público filtrable por zona, urgencia, tipo de ayuda y texto; solo casos aprobados | `GET /casos` |
| RF06 | Directorio de veterinarias 24 hs y rescatistas, filtrable por zona | `modules/directorio` |
| RF07 | Monto objetivo / recaudado / alias por caso, cargado a mano (sin pasarela de pago) | `PUT …/donacion` · `modules/donaciones` |
| RF08 | Enlace compartible por caso con metadatos Open Graph (vista previa en WhatsApp, etc.) | `GET /c/:id` · `modules/compartir` |
| RF09 | El administrador da de alta moderadores | `POST /usuarios` · `modules/usuarios` |
| RNF02 | Solo moderador/administrador entra al panel: guard global "denegar por defecto" + roles | `common/guards` |
| RNF03 | Healthcheck y reintentos de conexión (Railway puede "dormir" el servicio) | `GET /salud`, `retryAttempts` |
| RNF04 | Las zonas son filas de una tabla: se suman desde la API sin tocar el modelo | `modules/zonas` |
| RNF05 | Un módulo por área: auth, usuarios, zonas, casos, moderación, directorio, donaciones | `src/modules` |

## Estructura

```
backend/
├── src/
│   ├── main.ts / app.module.ts / configurar-app.ts
│   ├── config/          Lectura y validación de variables de entorno
│   ├── common/          Guards (JWT + roles), filtro de errores, validación, utilidades
│   ├── entities/        Una entidad por tabla de database/schema.sql
│   ├── modules/
│   │   ├── auth/  usuarios/  zonas/  casos/  moderacion/
│   │   ├── directorio/  donaciones/  almacenamiento/  compartir/  salud/
│   └── scripts/         db-init, seed-zonas, seed-admin
├── test/                62 tests e2e contra una base real
├── .env.example
└── railway.json
```

Arquitectura en capas (la de la documentación): *controladores* (presentación/HTTP) → *servicios* (reglas de negocio) → *entidades/TypeORM* (infraestructura). Un controlador no toca la base; un servicio no conoce HTTP.

## Correrlo en tu computadora

Requisitos: Node 20+ y MySQL 8 (o MariaDB 10.6+) corriendo.

```bash
cd backend
npm install
cp .env.example .env          # y completá DB_USER / DB_PASSWORD / JWT_SECRET
```

1. **Crear la base** (una vez), por ejemplo en MySQL Workbench:
   `CREATE DATABASE sos_patitas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2. **Crear las tablas**: `npm run db:init` aplica `database/schema.sql` y luego `database/migracion_01_mapa_y_seguimiento.sql`. Se puede repetir sin problema: solo aplica lo que falta.
3. **Cargar las zonas de CABA**: `npm run seed:zonas` (los 48 barrios).
4. **Crear el primer administrador**: definí `ADMIN_EMAIL` y `ADMIN_PASSWORD` (12+ caracteres) en `.env` y corré `npm run seed:admin`. La API no permite crear administradores (RF09 solo da de alta moderadores), por eso el primero se siembra así. Después, el administrador crea a los moderadores desde el panel.
5. **Levantar la API**: `npm run start:dev` → `http://localhost:3000` (probar con `/salud`).
6. **Conectar el frontend**: en `frontend/js/config.js` poné `USE_MOCK: false` y `API_URL: "http://localhost:3000"`, y servilo en un puerto que esté en `CORS_ORIGINS` (por defecto `http://localhost:8080`).

## ⚠️ Migración 01: dos columnas que el esquema aprobado no tenía

`database/migracion_01_mapa_y_seguimiento.sql` agrega a `caso`, **sin modificar ni borrar nada de lo aprobado**:

- `codigo_seguimiento` — código tipo `PAT-7K3M9Q` que recibe quien publica para consultar el estado sin crear cuenta (la documentación dice "con el link recibido", pero el esquema no tenía dónde guardarlo).
- `latitud` / `longitud` (opcionales) — para mostrar el caso en el mapa ("aparecer públicamente con su ubicación").

Conviene **comentarlo con el tutor** y reflejarlo en el diagrama ER y en `docs/`. Si el equipo decide no usar el mapa, la API sigue funcionando (las coordenadas son opcionales); el código de seguimiento sí es necesario.

## Tests

Los tests levantan la API completa y le hacen pedidos HTTP reales contra una base MySQL **aparte**: `sos_patitas_test`. **Borran el contenido de esa base**, por eso el nombre tiene que incluir "test" (si no, se niegan a correr).

```sql
CREATE DATABASE sos_patitas_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- y un usuario con permisos sobre esa base (por defecto: sos / sos_test_pw)
```
```bash
DB_NAME=sos_patitas_test DB_USER=... DB_PASSWORD=... npm run db:init   # crea las tablas en la base de pruebas
npm test                                                                # 62 tests
```
Variables opcionales: `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_DB_NAME`.

Qué verifican (resumen): que un caso pendiente nunca es público; que sin token ninguna ruta del panel responde; que un moderador no puede administrar usuarios; que un usuario desactivado pierde el acceso al instante; que dos moderadores aprobando a la vez no duplican el historial; que las fotos se validan por contenido y no se guardan a medias; que no se filtran datos internos en las vistas públicas; que el texto de búsqueda no permite inyección SQL; y todos los flujos de RF01–RF09.

## Desplegar en Railway

1. En Railway: **New Project → Deploy from GitHub repo** y elegí el repositorio. En el servicio: **Settings → Root Directory = `backend`**.
2. **Agregá una base**: *New → Database → MySQL*.
3. En **Variables** del servicio de la API:
   | Variable | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | `${{MySQL.MYSQL_URL}}` |
   | `JWT_SECRET` | un valor aleatorio largo (ver `.env.example` para generarlo) |
   | `CORS_ORIGINS` | la URL del frontend, sin barra final |
   | `FRONTEND_URL` | la URL del frontend |
   | `PUBLIC_BASE_URL` | la URL pública de esta API (Settings → Networking → Generate Domain) |
   | `UPLOADS_DIR` | `/data/uploads` |
4. **Fotos**: el disco de Railway se borra en cada deploy. Creá un **Volume** montado en `/data` (o reemplazá `almacenamiento.service.ts` por una versión que suba a S3/Cloudinary: es el único archivo que sabe dónde viven las fotos).
5. **Crear las tablas y el administrador** (una vez), desde tu computadora apuntando a la base de Railway. En el servicio MySQL, pestaña *Connect*, copiá la **URL pública** y:
   ```bash
   cd backend
   DATABASE_URL="mysql://…url-publica…" npm run db:init
   DATABASE_URL="mysql://…" npm run seed:zonas
   DATABASE_URL="mysql://…" ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run seed:admin
   ```
6. Probar `https://tu-api.up.railway.app/salud` → `{"estado":"ok","bd":"ok"}`. En `frontend/js/config.js`: `USE_MOCK: false` y `API_URL` con esa URL.

## Seguridad: decisiones tomadas

- **Denegar por defecto**: toda ruta exige JWT salvo las marcadas `@Publico()`. Una ruta nueva olvidada queda cerrada, no abierta.
- **Contraseñas** con bcrypt (coste 12). El hash nunca sale en ninguna respuesta. El login responde igual si el email no existe, la clave es incorrecta o el usuario está desactivado, y gasta el mismo tiempo (no se pueden enumerar emails).
- **Se revalida al usuario en cada pedido**: desactivarlo corta el acceso al instante, aunque su token siga vigente (8 h).
- **Límite de pedidos por IP**: login 10/min, publicar 10 cada 15 min, seguimiento 30/min, general 120/min.
- **Validación estricta** con class-validator: se descartan campos no declarados (nadie puede publicar un caso ya "aprobado" mandando `estado`), los enums coinciden con la base, y todas las consultas usan parámetros (sin SQL armado a mano).
- **Fotos**: se identifican por su contenido (firma JPG/PNG/WEBP), no por la extensión ni el tipo que declara el cliente; el nombre en disco es aleatorio; máx. 3 fotos de 5 MB; si algo falla no quedan archivos huérfanos.
- **Código de seguimiento** aleatorio criptográfico (≈887 millones de combinaciones) + límite de pedidos: no se puede adivinar ni recorrer. Devuelve solo el estado, nunca el contacto.
- **Moderación concurrente**: el cambio de estado corre en una transacción con el caso bloqueado.
- `helmet`, CORS restringido a `CORS_ORIGINS`, sin cabecera `X-Powered-By`, errores siempre en JSON en español sin trazas.

## Decisiones para confirmar con el tutor

1. **Contacto de quien publica.** Hoy el detalle público lo incluye (el formulario avisa: "se muestra en la publicación…"), para que quien quiera ayudar pueda coordinar. Si preferís que lo vea solo el equipo: `MOSTRAR_CONTACTO_PUBLICO=false`.
2. **Un administrador por defecto.** Se siembra con un script; no hay pantalla para crear administradores (RF09 solo habla de moderadores).
3. **Un caso `resuelto`** deja de aparecer en el listado pero su detalle sigue accesible por enlace (sin contacto) y ya no se puede modificar.

## Qué no incluye todavía

- Cambio y recuperación de contraseña (hoy un administrador crea al moderador con una clave inicial que se comparte por un canal seguro; falta que cada persona pueda cambiarla).
- Refresco de token: la sesión dura 8 horas (`JWT_EXPIRES_IN`) y luego hay que volver a ingresar.
- Paginación en el panel de moderación (devuelve hasta 1000 casos; el listado público sí pagina con `pagina` y `limite`).
- Notificaciones (mail al moderador cuando entra un caso crítico), que no estaban en el alcance del MVP.
- Los tests se corrieron sobre MariaDB 10.11 (compatible con MySQL 8). Conviene correrlos una vez en su MySQL real antes de entregar.
