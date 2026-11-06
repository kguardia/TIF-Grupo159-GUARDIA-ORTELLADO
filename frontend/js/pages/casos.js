import "../ui/layout.js";
import { api } from "../api/index.js";
import { html, pintar, esc, $, $$ } from "../utils/html.js";
import { ficha } from "../ui/ficha.js";
import { mostrarCargando, mostrarVacio, mostrarError } from "../ui/estados.js";
import { mapaDisponible, dibujarCasos } from "../ui/mapa.js";

const form = $("#filtros");
const lista = $("#lista");
const mapaCaja = $("#mapa");
const info = $("#info-resultados");
const botonesVista = $$("[data-vista]");
const CAMPOS = ["zona_id", "nivel_urgencia", "tipo_ayuda", "q"];

let casos = [];
let vista = "lista";
let mapa = null;

/* Los filtros viven en la URL: se puede compartir o recargar la búsqueda. */
function filtrosDeUrl() {
  const p = new URLSearchParams(location.search);
  CAMPOS.forEach((c) => { if (form.elements[c]) form.elements[c].value = p.get(c) ?? ""; });
  if (p.get("vista") === "mapa" && mapaDisponible()) vista = "mapa";
}
function filtrosActuales() {
  return Object.fromEntries(CAMPOS.map((c) => [c, form.elements[c].value.trim()]).filter(([, v]) => v));
}
function actualizarUrl() {
  const p = new URLSearchParams(filtrosActuales());
  if (vista === "mapa") p.set("vista", "mapa");
  history.replaceState(null, "", p.toString() ? `?${p}` : location.pathname);
}

async function cargarZonas() {
  try {
    const zonas = await api.zonas.listar();
    const sel = form.elements.zona_id;
    const valor = sel.value;
    sel.insertAdjacentHTML("beforeend", zonas.map((z) => `<option value="${z.id}">${esc(z.nombre)}</option>`).join(""));
    sel.value = valor;
  } catch { /* el filtro de zona queda con "Todas" */ }
}

function pintarVista() {
  const hayFiltros = Object.keys(filtrosActuales()).length > 0;
  info.textContent = casos.length === 1 ? "1 caso encontrado" : `${casos.length} casos encontrados`;

  botonesVista.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.vista === vista)));
  lista.hidden = vista !== "lista";
  mapaCaja.hidden = vista !== "mapa";

  if (!casos.length) {
    lista.hidden = false; mapaCaja.hidden = true;
    mostrarVacio(lista, hayFiltros ? "Ningún caso coincide con estos filtros" : "Por ahora no hay casos publicados",
      hayFiltros ? "Probá con otra zona o sacá algún filtro." : "Cuando un moderador apruebe un caso, va a aparecer acá.",
      hayFiltros ? html`<button type="button" class="btn btn--sec" data-limpiar>Quitar los filtros</button>` : html`<a class="btn" href="publicar.html">Publicar un caso</a>`);
    $("[data-limpiar]", lista)?.addEventListener("click", limpiar);
    return;
  }

  pintar(lista, html`<ul class="grilla-fichas">${casos.map((c) => ficha(c))}</ul>`);
  lista.removeAttribute("aria-busy");

  if (vista === "mapa") {
    mapa?.remove();
    const r = dibujarCasos(mapaCaja, casos);
    mapa = r.mapa;
    const sinPunto = casos.length - r.cantidad;
    if (sinPunto > 0) info.textContent += `. ${sinPunto} no ${sinPunto === 1 ? "tiene" : "tienen"} ubicación exacta y solo ${sinPunto === 1 ? "aparece" : "aparecen"} en la lista.`;
    setTimeout(() => mapa.invalidateSize(), 0);
  }
}

async function cargar() {
  actualizarUrl();
  mostrarCargando(lista, 3);
  lista.hidden = false;
  try {
    casos = await api.casos.listarPublicos(filtrosActuales());
    pintarVista();
  } catch (e) {
    mostrarError(lista, e, cargar);
  }
}

function limpiar() {
  form.reset();
  cargar();
}

let espera;
form.addEventListener("input", (e) => {
  clearTimeout(espera);
  espera = setTimeout(cargar, e.target.name === "q" ? 350 : 0);
});
form.addEventListener("submit", (e) => { e.preventDefault(); cargar(); });
$("[data-limpiar-todo]").addEventListener("click", limpiar);

if (mapaDisponible()) {
  botonesVista.forEach((b) => b.addEventListener("click", () => { vista = b.dataset.vista; actualizarUrl(); pintarVista(); }));
} else {
  $("#vista-toggle").hidden = true;
}

filtrosUrlYArranque();
async function filtrosUrlYArranque() {
  await cargarZonas();
  filtrosDeUrl();
  cargar();
}
