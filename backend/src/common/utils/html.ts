const MAPA: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escapa texto para meterlo en HTML o en atributos. */
export const escaparHtml = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => MAPA[c]);
