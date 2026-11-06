import { html } from "../utils/html.js";
import { textoUrgencia, textoAyuda, hace, resumir } from "../utils/format.js";

/**
 * Ficha de caso: una "etiqueta de triage". La banda lateral lleva la urgencia
 * escrita (no solo con color) y el resto resume el caso.
 * @param {object} caso   objeto de listado de la API
 * @param {object} opts   { raiz: prefijo de rutas, conFoto: boolean }
 */
export function ficha(caso, { raiz = "", conFoto = true } = {}) {
  const titulo = `${caso.tipo_animal} en ${caso.zona?.nombre ?? "zona sin definir"}`;
  return html`<li>
    <a class="ficha ficha--${caso.nivel_urgencia}" href="${raiz}caso.html?id=${caso.id}">
      <span class="ficha__banda"><span>Urgencia ${textoUrgencia(caso.nivel_urgencia).toLowerCase()}</span></span>
      <span class="ficha__cuerpo">
        ${conFoto && caso.foto_principal ? html`<span class="ficha__foto"><img src="${caso.foto_principal}" alt="" loading="lazy" width="640" height="400"></span>` : ""}
        <span class="ficha__titulo">${titulo}</span>
        <span class="ficha__texto">${resumir(caso.descripcion, 200)}</span>
        <span class="ficha__meta">
          <span class="etiqueta">${textoAyuda(caso.tipo_ayuda)}</span>
          <span class="etiqueta">${hace(caso.fecha_publicacion)}</span>
          ${caso.tiene_donacion ? html`<span class="etiqueta etiqueta--ok">Acepta donaciones</span>` : ""}
        </span>
      </span>
    </a>
  </li>`;
}
