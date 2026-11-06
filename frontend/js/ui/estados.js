import { html, pintar, $ } from "../utils/html.js";

export function mostrarCargando(contenedor, cantidad = 3) {
  contenedor.setAttribute("aria-busy", "true");
  pintar(contenedor, html`${Array.from({ length: cantidad }, () => html`<div class="cargando" aria-hidden="true"></div>`)}<span class="solo-lector">Cargando…</span>`);
}

export function mostrarVacio(contenedor, titulo, texto, accion = "") {
  contenedor.removeAttribute("aria-busy");
  pintar(contenedor, html`<div class="vacio"><h3>${titulo}</h3><p>${texto}</p>${accion}</div>`);
}

/** Error de carga con botón para reintentar. */
export function mostrarError(contenedor, error, reintentar) {
  contenedor.removeAttribute("aria-busy");
  pintar(contenedor, html`<div class="aviso aviso--error" role="alert">
    <p><strong>No pudimos cargar esto.</strong> ${error?.message ?? ""}</p>
    ${reintentar ? html`<p style="margin-top:.75rem"><button type="button" class="btn btn--sec btn--chico" data-reintentar>Probar de nuevo</button></p>` : ""}
  </div>`);
  if (reintentar) $("[data-reintentar]", contenedor)?.addEventListener("click", reintentar);
}
