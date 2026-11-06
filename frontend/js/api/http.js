/**
 * Cliente HTTP real: habla con el backend NestJS.
 * Tiene exactamente los mismos métodos que mock.js; las pantallas no saben cuál usan.
 *
 * CONTRATO ESPERADO DE LA API (resumen; el detalle está en frontend/README.md)
 *   GET    /zonas
 *   POST   /zonas                         {nombre}                      (administrador)
 *   PUT    /zonas/:id                     {nombre}                      (administrador)
 *   GET    /casos?zona_id&nivel_urgencia&tipo_ayuda&q                   (solo aprobados)
 *   GET    /casos/:id                                                   (aprobado o resuelto)
 *   POST   /casos                         multipart/form-data           (público)
 *   GET    /casos/seguimiento/:codigo                                   (público)
 *   GET    /directorio?tipo&zona_id
 *   POST   /directorio | PUT /directorio/:id | DELETE /directorio/:id   (moderador+)
 *   POST   /auth/login                    {email, password} → {access_token, usuario}
 *   GET    /auth/me
 *   GET    /moderacion/casos?estado                                     (moderador+)
 *   GET    /moderacion/casos/:id
 *   PATCH  /moderacion/casos/:id/estado   {accion, motivo}
 *   PATCH  /moderacion/casos/:id/urgencia {nivel_urgencia}
 *   PATCH  /moderacion/casos/:id/resolver
 *   PUT    /moderacion/casos/:id/donacion {monto_objetivo, monto_recaudado, alias_donacion}
 *   GET    /usuarios | POST /usuarios | PATCH /usuarios/:id             (administrador)
 */
import { CONFIG } from "../config.js";
import { sesion } from "../state/session.js";

export class ErrorApi extends Error {
  constructor(mensaje, estado = 0, detalles = null) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estado = estado;
    this.detalles = detalles; // p. ej. { campo: "mensaje" } cuando el servidor valida
  }
}

const MENSAJES = {
  0: "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.",
  401: "Tu sesión venció. Ingresá de nuevo.",
  403: "No tenés permiso para hacer esto.",
  404: "No encontramos lo que buscabas.",
  429: "Hiciste demasiados intentos. Esperá un momento y probá otra vez.",
  500: "Algo falló de nuestro lado. Probá de nuevo en unos minutos.",
};

function consulta(params = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== "" && v != null) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function pedir(metodo, ruta, { cuerpo, params } = {}) {
  const cabeceras = { Accept: "application/json" };
  const token = sesion.token();
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let body;
  if (cuerpo instanceof FormData) body = cuerpo;
  else if (cuerpo !== undefined) { cabeceras["Content-Type"] = "application/json"; body = JSON.stringify(cuerpo); }

  let respuesta;
  try {
    respuesta = await fetch(`${CONFIG.API_URL}${ruta}${consulta(params)}`, { method: metodo, headers: cabeceras, body });
  } catch {
    throw new ErrorApi(MENSAJES[0], 0);
  }

  if (respuesta.status === 204) return null;
  let datos = null;
  try { datos = await respuesta.json(); } catch { /* sin cuerpo JSON */ }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) sesion.cerrar();
    // NestJS devuelve { message: string | string[] }, o { message, errors: {campo: msg} }
    const msg = Array.isArray(datos?.message) ? datos.message.join(". ") : datos?.message;
    throw new ErrorApi(msg || MENSAJES[respuesta.status] || MENSAJES[500], respuesta.status, datos?.errors ?? null);
  }
  return datos;
}

const get = (r, params) => pedir("GET", r, { params });
const post = (r, cuerpo) => pedir("POST", r, { cuerpo });
const put = (r, cuerpo) => pedir("PUT", r, { cuerpo });
const patch = (r, cuerpo) => pedir("PATCH", r, { cuerpo });
const del = (r) => pedir("DELETE", r);

export const apiHttp = {
  zonas: {
    listar: () => get("/zonas"),
    crear: (nombre) => post("/zonas", { nombre }),
    renombrar: (id, nombre) => put(`/zonas/${id}`, { nombre }),
  },
  casos: {
    listarPublicos: (filtros) => get("/casos", filtros),
    obtenerPublico: (id) => get(`/casos/${id}`),
    /** datos: objeto plano; fotos: array de File */
    publicar(datos, fotos = []) {
      const fd = new FormData();
      for (const [k, v] of Object.entries(datos)) if (v != null && v !== "") fd.append(k, v);
      fotos.forEach((f) => fd.append("fotos", f));
      return pedir("POST", "/casos", { cuerpo: fd });
    },
    seguimiento: (codigo) => get(`/casos/seguimiento/${encodeURIComponent(codigo)}`),
  },
  directorio: {
    listar: (filtros) => get("/directorio", filtros),
    crear: (datos) => post("/directorio", datos),
    actualizar: (id, datos) => put(`/directorio/${id}`, datos),
    eliminar: (id) => del(`/directorio/${id}`),
  },
  auth: {
    login: (email, password) => post("/auth/login", { email, password }),
    me: () => get("/auth/me"),
  },
  moderacion: {
    listarCasos: (filtros) => get("/moderacion/casos", filtros),
    obtenerCaso: (id) => get(`/moderacion/casos/${id}`),
    cambiarEstado: (id, accion, motivo) => patch(`/moderacion/casos/${id}/estado`, { accion, motivo }),
    cambiarUrgencia: (id, nivel_urgencia) => patch(`/moderacion/casos/${id}/urgencia`, { nivel_urgencia }),
    resolver: (id) => patch(`/moderacion/casos/${id}/resolver`),
    guardarDonacion: (id, datos) => put(`/moderacion/casos/${id}/donacion`, datos),
  },
  usuarios: {
    listar: () => get("/usuarios"),
    crear: (datos) => post("/usuarios", datos),
    cambiarActivo: (id, activo) => patch(`/usuarios/${id}`, { activo }),
  },
};
