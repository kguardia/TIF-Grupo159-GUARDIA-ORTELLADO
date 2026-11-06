# SOS Patitas — Frontend

HTML, CSS y JavaScript puro (sin framework), como se definió en la 1ª entrega. Funciona **sin backend** en modo de prueba y se conecta a la API de NestJS cambiando un solo valor.

## Cómo ejecutarlo

Usa módulos ES (`type="module"`), por eso **no se abre con doble clic** (`file://`): necesita un servidor local.

```bash
cd frontend
python3 -m http.server 8080      # o: npx serve .
# abrir http://localhost:8080
```

En VS Code también sirve la extensión *Live Server*.

**Datos de prueba** (modo `USE_MOCK = true`):

| Rol | Email | Contraseña |
|---|---|---|
| Moderador | moderador@sospatitas.test | moderador123 |
| Administrador | admin@sospatitas.test | admin12345 |

Los casos se guardan en el `localStorage` del navegador. El enlace "Restablecer datos de ejemplo" del pie vuelve al estado inicial.

## Estructura

```
frontend/
├── index.html            Inicio: casos críticos y cómo funciona
├── casos.html            Listado público con filtros y vista de mapa      (RF05)
├── caso.html             Detalle de un caso, donación, compartir          (RF07, RF08)
├── publicar.html         Formulario para publicar, sin cuenta             (RF01, RNF01)
├── seguimiento.html      El publicante consulta el estado con su código
├── directorio.html       Veterinarias 24 hs y rescatistas por zona        (RF06)
├── login.html            Ingreso de moderador / administrador
├── panel/
│   ├── moderacion.html   Cola, aprobar / rechazar / en revisión, urgencia, donaciones  (RF02-RF04, RF07)
│   ├── directorio.html   Alta, edición y baja de contactos
│   └── usuarios.html     Alta de moderadores y zonas (solo administrador) (RF09, RNF04)
├── css/
│   ├── tokens.css        Colores, tipografía, espacios (un solo lugar)
│   ├── base.css          Reset y elementos
│   ├── components.css    Botones, formularios, ficha de caso, diálogos, tablas
│   └── pages.css         Maquetación de cada pantalla
├── js/
│   ├── config.js         ← ÚNICO archivo a tocar para conectar con el backend
│   ├── api/              Capa de acceso a datos
│   │   ├── index.js      Elige cliente real o de prueba
│   │   ├── http.js       Cliente HTTP real + contrato de la API (comentado)
│   │   ├── mock.js       Cliente de prueba (localStorage)
│   │   └── seed.js       Datos de ejemplo
│   ├── state/session.js  Sesión del personal y protección de rutas
│   ├── ui/               Piezas compartidas: layout, ficha, mapa, diálogos, avisos
│   ├── utils/            html seguro (anti-XSS), formatos, validación de formularios
│   └── pages/            Un archivo por pantalla
├── assets/               Fuentes (con licencias) y logo
└── vendor/leaflet/       Leaflet 1.9.4 incluido (mapa), sin depender de un CDN
```

Cada pantalla es "HTML + un JS de página". Las pantallas **nunca** llaman a `fetch` directamente: usan `api.casos.listarPublicos()`, `api.moderacion.cambiarEstado()`, etc. Eso respeta la arquitectura en capas del proyecto (Presentación / Aplicación) y permite cambiar de mock a backend sin tocar las pantallas.

## Conectar con el backend (NestJS en Railway)

En `js/config.js`:

```js
USE_MOCK: false,
API_URL: "https://tu-servicio.up.railway.app",
```

El backend ya trae CORS configurable: en su `.env` / variables de Railway, `CORS_ORIGINS` tiene que incluir la URL desde donde se sirve este frontend.

### Contrato de la API que espera el frontend

Los nombres de campos coinciden con `database/schema.sql`. Los errores de validación pueden devolver `{ "message": "...", "errors": { "campo": "mensaje" } }` y el frontend los muestra junto a cada campo.

| Método y ruta | Quién | Notas |
|---|---|---|
| `GET /zonas` | público | `[{id, nombre}]` |
| `POST /zonas`, `PUT /zonas/:id` | administrador | `{nombre}` |
| `GET /casos?zona_id&nivel_urgencia&tipo_ayuda&q` | público | **Solo `aprobado`.** Cada item: `id, tipo_animal, descripcion, nivel_urgencia, tipo_ayuda, estado, zona:{id,nombre}, fecha_publicacion, foto_principal, tiene_donacion` (+ `latitud`, `longitud` si se agregan) |
| `GET /casos/:id` | público | `aprobado` o `resuelto`. Suma `fotos:[{url,orden}]`, `donacion:{monto_objetivo, monto_recaudado, alias_donacion}`, `contacto_publicante` |
| `POST /casos` | público | `multipart/form-data`: `tipo_animal, descripcion, nivel_urgencia, tipo_ayuda, contacto_publicante, zona_id`, `fotos` (hasta 3). Responde `{id, codigo_seguimiento}`. Estado inicial `pendiente` |
| `GET /casos/seguimiento/:codigo` | público | Solo `estado, motivo_rechazo, tipo_animal, fechas`. Nunca el contacto |
| `GET /directorio?tipo&zona_id&atencion_24hs` | público | Incluye `zona:{id,nombre}` |
| `POST/PUT/DELETE /directorio` | moderador+ | |
| `POST /auth/login` | público | `{email, password}` → `{access_token, usuario:{id,nombre,email,rol}}` (JWT) |
| `GET /moderacion/casos?estado` | moderador+ | Todos los estados; incluye `contacto_publicante`, `historial` |
| `PATCH /moderacion/casos/:id/estado` | moderador+ | `{accion: "aprobado"\|"rechazado"\|"en_revision", motivo}`. `motivo` obligatorio al rechazar. Registra en `historial_moderacion` |
| `PATCH /moderacion/casos/:id/urgencia` | moderador+ | `{nivel_urgencia}` (RF04) |
| `PATCH /moderacion/casos/:id/resolver` | moderador+ | Solo desde `aprobado` |
| `PUT /moderacion/casos/:id/donacion` | moderador+ | `{monto_objetivo?, monto_recaudado, alias_donacion}` |
| `GET/POST /usuarios`, `PATCH /usuarios/:id` | administrador | Crea siempre rol `moderador` (RF09); `{activo}` para desactivar |

El JWT viaja en `Authorization: Bearer ...`. **El frontend oculta pantallas según el rol, pero la seguridad real (RNF02) tiene que estar en los guards de NestJS.**

> **Actualización:** el backend ya existe en `/backend` y implementa este contrato completo, incluidas las columnas nuevas (`database/migracion_01_mapa_y_seguimiento.sql`) y el enlace compartible `GET /c/:id` (punto 3 de abajo). Ver `backend/README.md`.

## Decisiones que conviene validar con el tutor

1. **Mapa y coordenadas.** El MVP promete que el caso aparece "con su ubicación", pero `caso` no tiene `latitud`/`longitud`. El frontend ya lo soporta de forma opcional (botón "Usar mi ubicación" al publicar, vista de mapa, mini mapa en el detalle). Si se agregan dos columnas `DECIMAL(9,6) NULL`, funciona. Si no, poner `USAR_COORDENADAS: false` en `config.js` y el sitio queda por zona, sin mapa.
2. **Código de seguimiento.** La documentación dice que quien publica consulta su caso "con el link recibido", pero no hay una columna para eso. El frontend usa un `codigo_seguimiento` (ej. `PAT-4821`). Hace falta una columna única en `caso` (idealmente aleatoria, no el `id` autoincremental).
3. **Enlace compartible con metadatos (RF08).** El botón *Compartir* funciona (`navigator.share` o copiar enlace), pero las vistas previas en WhatsApp/Instagram leen las etiquetas Open Graph del HTML sin ejecutar JavaScript. Para eso el backend debe devolver una versión del detalle con esas etiquetas (por ejemplo `GET /c/:id` renderizando HTML mínimo) o sumar prerender.
4. **Contacto de quien publica.** Hoy se muestra en el detalle público detrás del botón "Ver contacto", y el formulario avisa de eso. Si se prefiere que lo vea solo el equipo, basta con que la API no devuelva `contacto_publicante` en `GET /casos/:id`: el botón desaparece solo.

## Diseño

- **Idea central:** la *ficha de caso* imita una etiqueta de triage de emergencias. La banda lateral lleva la urgencia **escrita** (no solo con color) y un agujero de etiqueta. Es el único elemento "decorativo" y a la vez informa.
- **Color:** verde pino (`#0e5a52`) para acciones, fondo azul-grisáceo frío, y rojo / ámbar / azul reservados exclusivamente para urgencia crítica / media / baja.
- **Tipografía:** Bricolage Grotesque (títulos) y Atkinson Hyperlegible (texto, pensada para legibilidad). Ambas autoalojadas.
- **Accesibilidad:** navegación por teclado, foco visible, `aria-live` en resultados, resumen de errores con foco, diálogos nativos `<dialog>`, `prefers-reduced-motion`. Sin violaciones WCAG 2.0/2.1 A y AA en las 7 pantallas públicas ni en el panel, medido con axe-core.
- **Móvil primero:** formulario de publicación en una columna con opciones grandes tocables (RNF01); sin scroll horizontal desde 360 px.
- **Seguridad:** todo texto cargado por usuarios se escapa (`html\`\``) antes de entrar al DOM; el token vive en `sessionStorage`.

## Qué no incluye todavía

- Paginación del listado (con más de ~100 casos conviene agregarla en la API y acá).
- Subida real de fotos a almacenamiento (en modo de prueba se guardan reducidas en el navegador; en producción las recibe el backend).
- Pruebas automatizadas dentro del repositorio.
