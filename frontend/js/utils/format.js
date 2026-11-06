/** Textos y formatos que se repiten en varias pantallas. */

export const URGENCIA = {
  critica: { texto: "Crítica", orden: 0 },
  media: { texto: "Media", orden: 1 },
  baja: { texto: "Baja", orden: 2 },
};

export const TIPO_AYUDA = {
  veterinaria: "Atención veterinaria",
  traslado: "Traslado",
  alimento: "Alimento",
  otro: "Otra ayuda",
};

export const ESTADO = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  aprobado: "Publicado",
  rechazado: "Rechazado",
  resuelto: "Resuelto",
};

export const TIPO_CONTACTO = {
  veterinaria: "Veterinaria",
  rescatista: "Rescatista",
};

export const textoUrgencia = (nivel) => URGENCIA[nivel]?.texto ?? nivel;
export const textoAyuda = (tipo) => TIPO_AYUDA[tipo] ?? tipo;
export const textoEstado = (estado) => ESTADO[estado] ?? estado;

const rtf = new Intl.RelativeTimeFormat("es-AR", { numeric: "always" });
const fechaCorta = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });
const fechaHora = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function hace(iso) {
  const segundos = (new Date(iso).getTime() - Date.now()) / 1000;
  const tramos = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unidad, s] of tramos) {
    if (Math.abs(segundos) >= s) return rtf.format(Math.round(segundos / s), unidad);
  }
  return "hace instantes";
}

export const formatearFecha = (iso) => fechaCorta.format(new Date(iso));
export const formatearFechaHora = (iso) => fechaHora.format(new Date(iso));

const peso = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
export const formatearMonto = (n) => peso.format(Number(n) || 0);

/** Primera frase del texto, para títulos de ficha. */
export function resumir(texto, max = 90) {
  const limpio = String(texto ?? "").replace(/\s+/g, " ").trim();
  return limpio.length > max ? limpio.slice(0, max - 1).trimEnd() + "…" : limpio;
}

/** Normaliza para buscar sin importar tildes ni mayúsculas. */
export const normalizar = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
