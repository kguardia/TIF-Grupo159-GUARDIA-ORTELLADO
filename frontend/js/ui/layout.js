import { CONFIG } from "../config.js";
import { html, pintar, $, $$ } from "../utils/html.js";
import { sesion } from "../state/session.js";

/**
 * Encabezado, pie y barra del panel compartidos por todas las páginas.
 * Cada HTML declara en <body>:
 *   data-raiz="../"   prefijo hacia la raíz del frontend (vacío en la raíz)
 *   data-pagina="..." clave de la sección actual para marcarla en el menú
 */
const raiz = document.body.dataset.raiz ?? "";
const actual = document.body.dataset.pagina ?? "";

const ENLACES = [
  { clave: "casos", href: "casos.html", texto: "Casos activos" },
  { clave: "directorio", href: "directorio.html", texto: "Directorio" },
  { clave: "seguimiento", href: "seguimiento.html", texto: "Seguir mi caso" },
];

function cabecera() {
  const u = sesion.usuario();
  return html`
    <a class="saltar" href="#contenido">Saltar al contenido</a>
    ${CONFIG.USE_MOCK ? html`<div class="panel-barra" role="note"><div class="contenedor"><span>Modo de prueba: los casos son ficticios y se guardan solo en este navegador.</span></div></div>` : ""}
    <header class="cabecera">
      <div class="contenedor cabecera__fila">
        <a class="marca" href="${raiz}index.html"><img src="${raiz}assets/img/logo.svg" alt="" width="32" height="32">SOS <span>Patitas</span></a>
        <button type="button" class="btn btn--sec btn--chico nav__menu-btn" aria-expanded="false" aria-controls="nav-principal">Menú</button>
        <nav class="nav" id="nav-principal" aria-label="Principal">
          ${ENLACES.map((e) => html`<a href="${raiz}${e.href}" ${e.clave === actual ? html`aria-current="page"` : ""}>${e.texto}</a>`)}
          <span class="nav__sep" aria-hidden="true"></span>
          ${u
            ? html`<a href="${raiz}panel/moderacion.html" ${actual.startsWith("panel") ? html`aria-current="page"` : ""}>Panel</a>`
            : html`<a href="${raiz}login.html" ${actual === "login" ? html`aria-current="page"` : ""}>Ingresar</a>`}
          <a class="btn btn--chico" href="${raiz}publicar.html">Publicar un caso</a>
        </nav>
      </div>
    </header>`;
}

function pie() {
  return html`
    <footer class="pie">
      <div class="contenedor pie__fila">
        <div>
          <p><strong>SOS Patitas</strong></p>
          <p>Casos de animales en situación de calle en CABA, verificados por moderadores antes de publicarse.</p>
        </div>
        <div>
          <p>Trabajo Final Integrador, Grupo 159<br>Tecnicatura Universitaria en Programación, UTN</p>
          ${CONFIG.USE_MOCK ? html`<p><button type="button" class="btn btn--texto btn--chico" style="color:#fff" data-reiniciar>Restablecer datos de ejemplo</button></p>` : ""}
        </div>
      </div>
    </footer>`;
}

export function montarLayout() {
  const cab = document.createElement("div");
  pintar(cab, cabecera());
  document.body.prepend(...cab.childNodes);
  const p = document.createElement("div");
  pintar(p, pie());
  document.body.append(...p.childNodes);

  const boton = $(".nav__menu-btn");
  const nav = $("#nav-principal");
  boton?.addEventListener("click", () => {
    const abierto = nav.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", String(abierto));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("abierto")) { nav.classList.remove("abierto"); boton.setAttribute("aria-expanded", "false"); boton.focus(); }
  });

  $("[data-reiniciar]")?.addEventListener("click", async () => {
    const { apiMock } = await import("../api/mock.js");
    apiMock.reiniciar();
    sesion.cerrar();
    location.href = `${raiz}index.html`;
  });
}

const PANEL = [
  { clave: "panel-moderacion", href: "moderacion.html", texto: "Moderación", roles: ["moderador", "administrador"] },
  { clave: "panel-directorio", href: "directorio.html", texto: "Directorio", roles: ["moderador", "administrador"] },
  { clave: "panel-usuarios", href: "usuarios.html", texto: "Usuarios y zonas", roles: ["administrador"] },
];

/** Barra superior con el usuario y la navegación interna del panel. */
export function montarPanel() {
  const u = sesion.usuario();
  const destino = $("#panel-nav");
  if (!u || !destino) return;
  pintar(destino, html`
    <div class="fila" style="justify-content:space-between;margin-bottom:var(--e-4)">
      <p class="suave texto-chico" style="margin:0">Sesión de <strong>${u.nombre}</strong> (${u.rol})</p>
      <button type="button" class="btn btn--sec btn--chico" data-salir>Cerrar sesión</button>
    </div>
    <nav class="panel-nav" aria-label="Secciones del panel">
      ${PANEL.filter((s) => s.roles.includes(u.rol)).map((s) => html`<a href="${s.href}" ${s.clave === actual ? html`aria-current="page"` : ""}>${s.texto}</a>`)}
    </nav>`);
  $("[data-salir]", destino).addEventListener("click", () => {
    sesion.cerrar();
    location.href = `${raiz}index.html`;
  });
}

montarLayout();
