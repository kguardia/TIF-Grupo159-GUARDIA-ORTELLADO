import "../ui/layout.js";
import { api } from "../api/index.js";
import { html, pintar, esc, $ } from "../utils/html.js";
import { TIPO_CONTACTO } from "../utils/format.js";
import { mostrarCargando, mostrarVacio, mostrarError } from "../ui/estados.js";

const form = $("#filtros");
const lista = $("#lista");
const info = $("#info-resultados");

function filtros() {
  const f = {};
  for (const n of ["tipo", "zona_id"]) if (form.elements[n].value) f[n] = form.elements[n].value;
  if (form.elements.atencion_24hs.checked) f.atencion_24hs = "1";
  return f;
}

async function cargar() {
  const f = filtros();
  history.replaceState(null, "", Object.keys(f).length ? `?${new URLSearchParams(f)}` : location.pathname);
  mostrarCargando(lista, 3);
  try {
    const items = await api.directorio.listar(f);
    lista.removeAttribute("aria-busy");
    info.textContent = items.length === 1 ? "1 contacto" : `${items.length} contactos`;
    if (!items.length) {
      mostrarVacio(lista, "No hay contactos con esos filtros", "Probá con otra zona o quitá el filtro de atención las 24 horas.");
      return;
    }
    pintar(lista, html`<ul class="grilla-contactos">${items.map((d) => html`<li class="contacto">
      <div class="fila" style="gap:var(--e-2)">
        <span class="etiqueta">${TIPO_CONTACTO[d.tipo]}</span>
        ${d.atencion_24hs ? html`<span class="etiqueta etiqueta--ok">Atiende las 24 horas</span>` : ""}
      </div>
      <h3>${d.nombre}</h3>
      <p class="suave texto-chico" style="margin:0">${d.zona.nombre}${d.especialidad ? html`. ${d.especialidad}` : ""}</p>
      <a class="tel" href="tel:${d.telefono.replace(/[^\d+]/g, "")}">${d.telefono}</a>
    </li>`)}</ul>`);
  } catch (e) { mostrarError(lista, e, cargar); }
}

(async () => {
  try {
    const zonas = await api.zonas.listar();
    form.elements.zona_id.insertAdjacentHTML("beforeend", zonas.map((z) => `<option value="${z.id}">${esc(z.nombre)}</option>`).join(""));
  } catch { /* queda "Todas" */ }
  const p = new URLSearchParams(location.search);
  form.elements.tipo.value = p.get("tipo") ?? "";
  form.elements.zona_id.value = p.get("zona_id") ?? "";
  form.elements.atencion_24hs.checked = p.get("atencion_24hs") === "1";
  cargar();
})();

form.addEventListener("input", cargar);
form.addEventListener("submit", (e) => { e.preventDefault(); cargar(); });
