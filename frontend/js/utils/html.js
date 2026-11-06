/**
 * Plantillas HTML seguras: todo lo que se interpola se escapa,
 * salvo que sea el resultado de otra plantilla html`` o de raw().
 * Así evitamos XSS con texto que cargan los usuarios (descripciones, nombres, etc.).
 */
class Seguro {
  constructor(texto) { this.texto = texto; }
  toString() { return this.texto; }
}

const MAPA = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (valor) => String(valor ?? "").replace(/[&<>"']/g, (c) => MAPA[c]);

function convertir(valor) {
  if (valor instanceof Seguro) return valor.texto;
  if (Array.isArray(valor)) return valor.map(convertir).join("");
  if (valor === null || valor === undefined || valor === false) return "";
  return esc(valor);
}

export function html(textos, ...valores) {
  let salida = "";
  textos.forEach((t, i) => {
    salida += t;
    if (i < valores.length) salida += convertir(valores[i]);
  });
  return new Seguro(salida);
}

/** Marca un string como ya seguro (usar solo con contenido propio). */
export const raw = (texto) => new Seguro(texto);

/** Reemplaza el contenido de un elemento. */
export function pintar(elemento, contenido) {
  elemento.innerHTML = contenido instanceof Seguro ? contenido.texto : esc(contenido);
}

export const $ = (selector, raiz = document) => raiz.querySelector(selector);
export const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];
