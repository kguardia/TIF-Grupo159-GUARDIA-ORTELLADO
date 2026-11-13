/**
 * Cliente de prueba: mismo contrato que http.js, pero guarda todo en localStorage.
 * Sirve para desarrollar y mostrar el frontend sin backend.
 * Para reiniciar los datos de ejemplo: apiMock.reiniciar() en la consola,
 * o el enlace "Restablecer datos de ejemplo" del pie de página.
 */
import { ErrorApi } from "./http.js";
import { crearSemilla } from "./seed.js";
import { sesion } from "../state/session.js";
import { normalizar } from "../utils/format.js";

const CLAVE = "sospatitas.mock.v1";
const LATENCIA_MS = 220;

let memoria = null;

function cargar() {
  if (memoria) return memoria;
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) return (memoria = JSON.parse(guardado));
  } catch { /* sin almacenamiento: seguimos en memoria */ }
  memoria = crearSemilla();
  guardar();
  return memoria;
}

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(memoria)); }
  catch { /* cuota llena o bloqueado: los datos viven mientras dure la pestaña */ }
}

const demora = (valor) => new Promise((ok) => setTimeout(() => ok(structuredClone(valor)), LATENCIA_MS));
const siguienteId = (lista) => lista.reduce((m, x) => Math.max(m, x.id), 0) + 1;
const fallo = (msg, estado = 400, detalles = null) => { throw new ErrorApi(msg, estado, detalles); };

/* ---------- Autorización simulada ---------- */
function usuarioActual() {
  const token = sesion.token();
  if (!token?.startsWith("mock.")) return null;
  return cargar().usuarios.find((u) => u.id === Number(token.slice(5)) && u.activo) ?? null;
}
function exigir(...roles) {
  const u = usuarioActual();
  if (!u) fallo("Tu sesión venció. Ingresá de nuevo.", 401);
  if (!roles.includes(u.rol)) fallo("No tenés permiso para hacer esto.", 403);
  return u;
}
const STAFF = ["moderador", "administrador"];

/* ---------- Vistas de datos ---------- */
const zonaDe = (bd, id) => bd.zonas.find((z) => z.id === id) ?? { id, nombre: "Sin zona" };

function vistaListado(bd, c) {
  return {
    id: c.id, tipo_animal: c.tipo_animal, descripcion: c.descripcion,
    nivel_urgencia: c.nivel_urgencia, tipo_ayuda: c.tipo_ayuda, estado: c.estado,
    zona: zonaDe(bd, c.zona_id), fecha_publicacion: c.fecha_publicacion,
    foto_principal: c.fotos[0]?.url ?? null, latitud: c.latitud, longitud: c.longitud,
    tiene_donacion: Boolean(c.donacion),
  };
}
function vistaPublica(bd, c) {
  return { ...vistaListado(bd, c), fotos: c.fotos, donacion: c.donacion, contacto_publicante: c.contacto_publicante };
}
function vistaModeracion(bd, c) {
  return { ...vistaPublica(bd, c), codigo_seguimiento: c.codigo_seguimiento, motivo_rechazo: c.motivo_rechazo, historial: c.historial, fecha_moderacion: c.fecha_moderacion };
}

const PUBLICOS = ["aprobado"];
const ORDEN_URG = { critica: 0, media: 1, baja: 2 };

/* ---------- Procesamiento de fotos ---------- */
function fotoADataUrl(archivo) {
  return new Promise((ok, mal) => {
    const lector = new FileReader();
    lector.onerror = () => mal(new Error("No se pudo leer la foto"));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => ok(lector.result);
      img.onload = () => {
        const escala = Math.min(1, 900 / Math.max(img.width, img.height));
        const lienzo = document.createElement("canvas");
        lienzo.width = Math.round(img.width * escala);
        lienzo.height = Math.round(img.height * escala);
        lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
        ok(lienzo.toDataURL("image/jpeg", 0.72));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}

function codigoNuevo(bd) {
  let codigo;
  do { codigo = `PAT-${Math.floor(1000 + Math.random() * 9000)}`; } while (bd.casos.some((c) => c.codigo_seguimiento === codigo));
  return codigo;
}

const TIPOS_ANIMAL_VALIDOS = [
  "Perro/a",
  "Gato/a",
  "Cachorros",
  "Gatitos",
  "Perra embarazada o con cría/s",
  "Gata embarazada o con cría/s",
  "Otro (fauna silvestre o exótica)",
];

/* ================= API ================= */
export const apiMock = {
  reiniciar() {
    memoria = crearSemilla();
    guardar();
  },

  zonas: {
    listar: () => demora([...cargar().zonas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))),
    async crear(nombre) {
      exigir("administrador");
      const bd = cargar();
      nombre = String(nombre ?? "").trim();
      if (!nombre) fallo("Escribí el nombre de la zona.", 400, { nombre: "Escribí el nombre de la zona." });
      if (bd.zonas.some((z) => normalizar(z.nombre) === normalizar(nombre))) fallo("Esa zona ya existe.", 409, { nombre: "Esa zona ya existe." });
      const z = { id: siguienteId(bd.zonas), nombre };
      bd.zonas.push(z); guardar();
      return demora(z);
    },
    async renombrar(id, nombre) {
      exigir("administrador");
      const z = cargar().zonas.find((x) => x.id === id) ?? fallo("No encontramos la zona.", 404);
      z.nombre = String(nombre).trim(); guardar();
      return demora(z);
    },
  },

  casos: {
    async listarPublicos(f = {}) {
      const bd = cargar();
      let lista = bd.casos.filter((c) => PUBLICOS.includes(c.estado));
      if (f.zona_id) lista = lista.filter((c) => c.zona_id === Number(f.zona_id));
      if (f.nivel_urgencia) lista = lista.filter((c) => c.nivel_urgencia === f.nivel_urgencia);
      if (f.tipo_ayuda) lista = lista.filter((c) => c.tipo_ayuda === f.tipo_ayuda);
      if (f.q) lista = lista.filter((c) => normalizar(`${c.tipo_animal} ${c.descripcion}`).includes(normalizar(f.q)));
      lista.sort((a, b) => ORDEN_URG[a.nivel_urgencia] - ORDEN_URG[b.nivel_urgencia] || b.fecha_publicacion.localeCompare(a.fecha_publicacion));
      return demora(lista.map((c) => vistaListado(bd, c)));
    },
    async obtenerPublico(id) {
      const bd = cargar();
      const c = bd.casos.find((x) => x.id === Number(id));
      if (!c || ![...PUBLICOS, "resuelto"].includes(c.estado)) fallo("Este caso no está disponible.", 404);
      return demora(vistaPublica(bd, c));
    },
    async publicar(datos, fotos = []) {
      const bd = cargar();
      const errores = {};
      if (!TIPOS_ANIMAL_VALIDOS.includes(datos.tipo_animal)) errores.tipo_animal = "Elegí qué animal es.";
      if (!datos.descripcion || datos.descripcion.length < 20) errores.descripcion = "Contanos un poco más (mínimo 20 caracteres).";
      if (!ORDEN_URG.hasOwnProperty(datos.nivel_urgencia)) errores.nivel_urgencia = "Elegí qué tan urgente es.";
      if (!datos.tipo_ayuda) errores.tipo_ayuda = "Elegí qué ayuda necesita.";
      if (!datos.contacto_publicante) errores.contacto_publicante = "Dejá un contacto para que podamos verificar el caso.";
      if (!bd.zonas.some((z) => z.id === Number(datos.zona_id))) errores.zona_id = "Elegí la zona.";
      if (Object.keys(errores).length) fallo("Revisá los datos del formulario.", 400, errores);

      const urls = await Promise.all(fotos.slice(0, 3).map(fotoADataUrl));
      const id = siguienteId(bd.casos);
      const c = {
        id, codigo_seguimiento: codigoNuevo(bd),
        tipo_animal: datos.tipo_animal, descripcion: datos.descripcion,
        nivel_urgencia: datos.nivel_urgencia, tipo_ayuda: datos.tipo_ayuda, estado: "pendiente",
        contacto_publicante: datos.contacto_publicante, zona_id: Number(datos.zona_id),
        latitud: datos.latitud ? Number(datos.latitud) : null, longitud: datos.longitud ? Number(datos.longitud) : null,
        moderador_id: null, motivo_rechazo: null, fecha_publicacion: new Date().toISOString(), fecha_moderacion: null,
        fotos: urls.map((url, i) => ({ id: id * 10 + i, url, orden: i + 1 })), historial: [], donacion: null,
      };
      bd.casos.push(c); guardar();
      return demora({ id: c.id, codigo_seguimiento: c.codigo_seguimiento });
    },
    async seguimiento(codigo) {
      const c = cargar().casos.find((x) => x.codigo_seguimiento === String(codigo).trim().toUpperCase());
      if (!c) fallo("No encontramos ningún caso con ese código. Revisalo e intentá de nuevo.", 404);
      return demora({
        codigo_seguimiento: c.codigo_seguimiento, id: c.id, tipo_animal: c.tipo_animal, estado: c.estado,
        motivo_rechazo: c.motivo_rechazo, fecha_publicacion: c.fecha_publicacion, fecha_moderacion: c.fecha_moderacion,
      });
    },
  },

  directorio: {
    async listar(f = {}) {
      const bd = cargar();
      let lista = [...bd.directorio];
      if (f.tipo) lista = lista.filter((d) => d.tipo === f.tipo);
      if (f.zona_id) lista = lista.filter((d) => d.zona_id === Number(f.zona_id));
      if (f.atencion_24hs) lista = lista.filter((d) => d.atencion_24hs);
      lista.sort((a, b) => Number(b.atencion_24hs) - Number(a.atencion_24hs) || a.nombre.localeCompare(b.nombre, "es"));
      return demora(lista.map((d) => ({ ...d, zona: zonaDe(bd, d.zona_id) })));
    },
    async crear(datos) {
      exigir(...STAFF);
      const bd = cargar();
      validarContacto(bd, datos);
      const d = { id: siguienteId(bd.directorio), ...normalizarContacto(datos) };
      bd.directorio.push(d); guardar();
      return demora(d);
    },
    async actualizar(id, datos) {
      exigir(...STAFF);
      const bd = cargar();
      const d = bd.directorio.find((x) => x.id === id) ?? fallo("No encontramos el contacto.", 404);
      validarContacto(bd, datos);
      Object.assign(d, normalizarContacto(datos)); guardar();
      return demora(d);
    },
    async eliminar(id) {
      exigir(...STAFF);
      const bd = cargar();
      bd.directorio = bd.directorio.filter((x) => x.id !== id); guardar();
      return demora(null);
    },
  },

  auth: {
    async login(email, password) {
      const u = cargar().usuarios.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
      if (!u || u.password !== password || !u.activo) fallo("El email o la contraseña no coinciden.", 401);
      const { password: _omitida, ...publico } = u;
      return demora({ access_token: `mock.${u.id}`, usuario: publico });
    },
    async me() {
      const u = exigir(...STAFF);
      const { password: _omitida, ...publico } = u;
      return demora(publico);
    },
  },

  moderacion: {
    async listarCasos(f = {}) {
      exigir(...STAFF);
      const bd = cargar();
      let lista = bd.casos;
      if (f.estado) lista = lista.filter((c) => c.estado === f.estado);
      return demora(lista.map((c) => vistaModeracion(bd, c)));
    },
    async obtenerCaso(id) {
      exigir(...STAFF);
      const bd = cargar();
      const c = bd.casos.find((x) => x.id === id) ?? fallo("No encontramos el caso.", 404);
      return demora(vistaModeracion(bd, c));
    },
    async cambiarEstado(id, accion, motivo) {
      const u = exigir(...STAFF);
      const bd = cargar();
      const c = bd.casos.find((x) => x.id === id) ?? fallo("No encontramos el caso.", 404);
      if (!["aprobado", "rechazado", "en_revision"].includes(accion)) fallo("Acción no válida.", 400);
      if (accion === "rechazado" && !String(motivo ?? "").trim()) fallo("Escribí el motivo del rechazo.", 400, { motivo: "Escribí el motivo del rechazo." });
      c.estado = accion;
      c.moderador_id = u.id;
      c.fecha_moderacion = new Date().toISOString();
      c.motivo_rechazo = accion === "rechazado" ? String(motivo).trim() : null;
      c.historial.unshift({ id: Date.now(), usuario_id: u.id, usuario: u.nombre, accion, motivo: motivo?.trim() || null, fecha: c.fecha_moderacion });
      guardar();
      return demora(vistaModeracion(bd, c));
    },
    async cambiarUrgencia(id, nivel) {
      exigir(...STAFF);
      const bd = cargar();
      const c = bd.casos.find((x) => x.id === id) ?? fallo("No encontramos el caso.", 404);
      if (!(nivel in ORDEN_URG)) fallo("Nivel de urgencia no válido.", 400);
      c.nivel_urgencia = nivel; guardar();
      return demora(vistaModeracion(bd, c));
    },
    async resolver(id) {
      const u = exigir(...STAFF);
      const bd = cargar();
      const c = bd.casos.find((x) => x.id === id) ?? fallo("No encontramos el caso.", 404);
      if (c.estado !== "aprobado") fallo("Solo se pueden marcar como resueltos los casos publicados.", 409);
      c.estado = "resuelto"; c.fecha_moderacion = new Date().toISOString(); c.moderador_id = u.id; guardar();
      return demora(vistaModeracion(bd, c));
    },
    async guardarDonacion(id, datos) {
      const u = exigir(...STAFF);
      const bd = cargar();
      const c = bd.casos.find((x) => x.id === id) ?? fallo("No encontramos el caso.", 404);
      if (!["aprobado", "resuelto"].includes(c.estado)) fallo("La donación se registra cuando el caso ya está publicado.", 409);
      const errores = {};
      const alias = String(datos.alias_donacion ?? "").trim();
      const objetivo = datos.monto_objetivo === "" || datos.monto_objetivo == null ? null : Number(datos.monto_objetivo);
      const recaudado = Number(datos.monto_recaudado ?? 0);
      if (!alias) errores.alias_donacion = "Indicá el alias donde se recibe la donación.";
      if (objetivo !== null && !(objetivo > 0)) errores.monto_objetivo = "El monto objetivo tiene que ser mayor a cero (o dejalo vacío).";
      if (!(recaudado >= 0)) errores.monto_recaudado = "El monto recaudado no puede ser negativo.";
      if (Object.keys(errores).length) fallo("Revisá los datos de la donación.", 400, errores);
      c.donacion = { monto_objetivo: objetivo, monto_recaudado: recaudado, alias_donacion: alias, actualizado_por: u.id, fecha_actualizacion: new Date().toISOString() };
      guardar();
      return demora(vistaModeracion(bd, c));
    },
  },

  usuarios: {
    async listar() {
      exigir("administrador");
      return demora(cargar().usuarios.map(({ password: _omitida, ...u }) => u));
    },
    async crear(datos) {
      exigir("administrador");
      const bd = cargar();
      const errores = {};
      if (!datos.nombre?.trim()) errores.nombre = "Escribí el nombre.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.email ?? "")) errores.email = "Escribí un email válido.";
      else if (bd.usuarios.some((u) => u.email.toLowerCase() === datos.email.toLowerCase())) errores.email = "Ya existe un usuario con ese email.";
      if ((datos.password ?? "").length < 8) errores.password = "La contraseña debe tener al menos 8 caracteres.";
      if (Object.keys(errores).length) fallo("Revisá los datos del usuario.", 400, errores);
      // RF09: el administrador da de alta usuarios con rol moderador.
      const u = { id: siguienteId(bd.usuarios), nombre: datos.nombre.trim(), email: datos.email.trim(), password: datos.password, rol: "moderador", activo: true };
      bd.usuarios.push(u); guardar();
      const { password: _omitida, ...publico } = u;
      return demora(publico);
    },
    async cambiarActivo(id, activo) {
      const yo = exigir("administrador");
      if (yo.id === id) fallo("No podés desactivar tu propio usuario.", 409);
      const u = cargar().usuarios.find((x) => x.id === id) ?? fallo("No encontramos el usuario.", 404);
      u.activo = Boolean(activo); guardar();
      const { password: _omitida, ...publico } = u;
      return demora(publico);
    },
  },
};

function validarContacto(bd, d) {
  const errores = {};
  if (!["veterinaria", "rescatista"].includes(d.tipo)) errores.tipo = "Elegí el tipo de contacto.";
  if (!d.nombre?.trim()) errores.nombre = "Escribí el nombre.";
  if (!d.telefono?.trim()) errores.telefono = "Escribí el teléfono.";
  if (!bd.zonas.some((z) => z.id === Number(d.zona_id))) errores.zona_id = "Elegí la zona.";
  if (Object.keys(errores).length) fallo("Revisá los datos del contacto.", 400, errores);
}
function normalizarContacto(d) {
  return { tipo: d.tipo, nombre: d.nombre.trim(), telefono: d.telefono.trim(), zona_id: Number(d.zona_id), atencion_24hs: Boolean(d.atencion_24hs), especialidad: d.especialidad?.trim() || null };
}
