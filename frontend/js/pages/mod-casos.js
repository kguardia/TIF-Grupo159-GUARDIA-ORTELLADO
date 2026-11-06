import "../ui/layout.js";
import { montarPanel } from "../ui/layout.js";
import { api } from "../api/index.js";
import { requerirRol } from "../state/session.js";
import { html, pintar, $, $$ } from "../utils/html.js";
import { textoUrgencia, textoAyuda, textoEstado, hace, formatearFecha, formatearFechaHora, resumir, URGENCIA } from "../utils/format.js";
import { mostrarCargando, mostrarVacio, mostrarError } from "../ui/estados.js";
import { mostrarErrores, textoDe, bloquearEnvio } from "../utils/forms.js";
import { abrir, cerrar, preparar } from "../ui/dialogo.js";
import { avisar } from "../ui/toast.js";

if (!requerirRol(["moderador", "administrador"])) await new Promise(() => {}); // la redirección ya está en curso: detenemos el resto del módulo
montarPanel();
if (new URLSearchParams(location.search).has("sin_permiso")) avisar("Esa sección es solo para administradores.", { error: true });

const TABS = [
  { estado: "pendiente", texto: "Pendientes" },
  { estado: "en_revision", texto: "En revisión" },
  { estado: "aprobado", texto: "Publicados" },
  { estado: "resuelto", texto: "Resueltos" },
  { estado: "rechazado", texto: "Rechazados" },
];

const pestanas = $("#pestanas");
const cuerpo = $("#tabla-casos");
const orden = $("#orden");
const dialogo = preparar($("#dialogo-caso"));
const contenidoDialogo = $("#dialogo-contenido");

let casos = [];
let tab = "pendiente";
let abierto = null; // id del caso abierto en el diálogo

/* ---------- Lista ---------- */
function ordenar(lista) {
  const porFecha = (a, b) => a.fecha_publicacion.localeCompare(b.fecha_publicacion);
  const copia = [...lista];
  if (orden.value === "antiguos") return copia.sort(porFecha);
  if (orden.value === "recientes") return copia.sort((a, b) => porFecha(b, a));
  return copia.sort((a, b) => URGENCIA[a.nivel_urgencia].orden - URGENCIA[b.nivel_urgencia].orden || porFecha(a, b));
}

function pintarPestanas() {
  pintar(pestanas, html`${TABS.map((t) => {
    const n = casos.filter((c) => c.estado === t.estado).length;
    return html`<button type="button" role="tab" id="tab-${t.estado}" aria-selected="${t.estado === tab}" aria-controls="tabla-casos" data-tab="${t.estado}" tabindex="${t.estado === tab ? 0 : -1}">${t.texto}<span class="cuenta" aria-label="${n} casos">${n}</span></button>`;
  })}`);
}

function pintarTabla() {
  cuerpo.setAttribute("aria-labelledby", `tab-${tab}`);
  cuerpo.removeAttribute("aria-busy");
  const lista = ordenar(casos.filter((c) => c.estado === tab));
  if (!lista.length) {
    mostrarVacio(cuerpo, tab === "pendiente" ? "No hay casos esperando revisión" : "No hay casos en este estado", tab === "pendiente" ? "Cuando alguien publique un caso nuevo, aparece acá." : "Cambiá de pestaña para ver otros casos.");
    return;
  }
  pintar(cuerpo, html`<div class="tabla-caja"><table>
    <caption class="solo-lector">Casos en estado ${textoEstado(tab).toLowerCase()}</caption>
    <thead><tr><th scope="col">Urgencia</th><th scope="col">Caso</th><th scope="col">Ayuda</th><th scope="col">Recibido</th><th scope="col"><span class="solo-lector">Acciones</span></th></tr></thead>
    <tbody>${lista.map((c) => html`<tr>
      <td><span class="etiqueta etiqueta--${c.nivel_urgencia}">${textoUrgencia(c.nivel_urgencia)}</span></td>
      <td><strong>${c.tipo_animal} en ${c.zona.nombre}</strong><br><span class="suave">${resumir(c.descripcion, 110)}</span></td>
      <td>${textoAyuda(c.tipo_ayuda)}</td>
      <td title="${formatearFechaHora(c.fecha_publicacion)}">${hace(c.fecha_publicacion)}</td>
      <td class="col-acciones"><button type="button" class="btn btn--chico" data-revisar="${c.id}" aria-label="Revisar: ${c.tipo_animal} en ${c.zona.nombre}">Revisar</button></td>
    </tr>`)}</tbody></table></div>`);
}

function pintarTodo() { pintarPestanas(); pintarTabla(); }

async function cargar() {
  mostrarCargando(cuerpo, 3);
  try {
    casos = await api.moderacion.listarCasos();
    pintarTodo();
  } catch (e) {
    if (e.estado === 401 || e.estado === 403) { location.replace("../login.html"); return; }
    mostrarError(cuerpo, e, cargar);
  }
}

pestanas.addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]");
  if (!b) return;
  tab = b.dataset.tab; pintarTodo(); $(`[data-tab="${tab}"]`).focus();
});
pestanas.addEventListener("keydown", (e) => {
  if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return;
  const i = TABS.findIndex((t) => t.estado === tab);
  const n = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
  tab = n.estado; pintarTodo(); $(`[data-tab="${tab}"]`).focus();
});
orden.addEventListener("change", pintarTabla);
cuerpo.addEventListener("click", (e) => {
  const b = e.target.closest("[data-revisar]");
  if (b) abrirCaso(Number(b.dataset.revisar));
});

/* ---------- Detalle ---------- */
function formDonacion(c) {
  const d = c.donacion;
  return html`<form id="form-donacion" novalidate class="form-bloque">
    <h3>Donaciones</h3>
    <p class="suave texto-chico">Se actualizan a mano. No hay pasarela de pago: las personas transfieren al alias.</p>
    <div data-resumen-errores></div>
    <div class="campo"><label for="alias_donacion">Alias de donación</label><input class="entrada" id="alias_donacion" name="alias_donacion" value="${d?.alias_donacion ?? ""}" autocomplete="off"></div>
    <div class="campo"><label for="monto_objetivo">Monto objetivo <span class="opcional">(opcional)</span></label><input class="entrada" id="monto_objetivo" name="monto_objetivo" inputmode="numeric" value="${d?.monto_objetivo ?? ""}"></div>
    <div class="campo"><label for="monto_recaudado">Monto recaudado hasta ahora</label><input class="entrada" id="monto_recaudado" name="monto_recaudado" inputmode="numeric" value="${d?.monto_recaudado ?? 0}"></div>
    <div class="form-acciones" style="margin-top:var(--e-4)"><button type="submit" class="btn">Guardar donación</button></div>
  </form>`;
}

function acciones(c) {
  const e = c.estado;
  return html`<div class="form-bloque">
    <h3>Decisión</h3>
    <div class="fila">
      ${e !== "aprobado" && e !== "resuelto" ? html`<button type="button" class="btn" data-accion="aprobado">Aprobar y publicar</button>` : ""}
      ${e !== "en_revision" && e !== "resuelto" ? html`<button type="button" class="btn btn--sec" data-accion="en_revision">Marcar en revisión</button>` : ""}
      ${e !== "rechazado" && e !== "resuelto" ? html`<button type="button" class="btn btn--sec" data-mostrar-rechazo>${e === "aprobado" ? "Retirar (rechazar)" : "Rechazar"}</button>` : ""}
      ${e === "aprobado" ? html`<button type="button" class="btn btn--sec" data-resolver>Marcar como resuelto</button>` : ""}
    </div>
    <form id="form-rechazo" hidden novalidate style="margin-top:var(--e-4)">
      <div data-resumen-errores></div>
      <div class="campo"><label for="motivo">Motivo del rechazo</label>
        <textarea class="entrada" id="motivo" name="motivo" rows="3" aria-describedby="ayuda-motivo"></textarea>
        <p class="ayuda" id="ayuda-motivo">Quien publicó el caso va a poder leer este motivo.</p></div>
      <div class="form-acciones" style="margin-top:var(--e-3)"><button type="submit" class="btn btn--peligro">Confirmar rechazo</button><button type="button" class="btn btn--texto" data-cancelar-rechazo>Cancelar</button></div>
    </form>
  </div>`;
}

function pintarDetalle(c) {
  const puedeDonar = ["aprobado", "resuelto"].includes(c.estado);
  pintar(contenidoDialogo, html`
    <div class="dialogo__cab">
      <div>
        <h2 id="dialogo-titulo" tabindex="-1">${c.tipo_animal} en ${c.zona.nombre}</h2>
        <div class="fila" style="margin-top:var(--e-2)">
          <span class="etiqueta etiqueta--${CLASE_ESTADO[c.estado]}">${textoEstado(c.estado)}</span>
          <span class="etiqueta etiqueta--${c.nivel_urgencia}">Urgencia ${textoUrgencia(c.nivel_urgencia).toLowerCase()}</span>
          <span class="etiqueta">${textoAyuda(c.tipo_ayuda)}</span>
        </div>
      </div>
      <button type="button" class="btn btn--sec btn--chico" data-cerrar>Cerrar</button>
    </div>
    <div class="dialogo__cuerpo detalle-mod">
      <p style="margin:0">${c.descripcion}</p>
      ${c.fotos.length ? html`<div class="galeria">${c.fotos.map((f, i) => html`<img src="${f.url}" alt="Foto ${i + 1} del caso">`)}</div>` : html`<p class="suave texto-chico" style="margin:0">Sin fotos.</p>`}
      <div class="contacto-privado"><strong>Contacto de quien publicó (solo lo ve el equipo)</strong>${c.contacto_publicante}</div>
      <dl class="datos">
        <dt>Código</dt><dd>${c.codigo_seguimiento}</dd>
        <dt>Recibido</dt><dd>${formatearFechaHora(c.fecha_publicacion)}</dd>
        ${c.latitud != null ? html`<dt>Ubicación</dt><dd><a href="https://www.openstreetmap.org/?mlat=${c.latitud}&mlon=${c.longitud}#map=17/${c.latitud}/${c.longitud}" target="_blank" rel="noopener">Ver en el mapa (se abre en otra pestaña)</a></dd>` : ""}
        ${c.motivo_rechazo ? html`<dt>Motivo</dt><dd>${c.motivo_rechazo}</dd>` : ""}
      </dl>
      <div class="campo"><label for="cambiar-urgencia">Urgencia</label>
        <select class="entrada" id="cambiar-urgencia" style="max-width:14rem">${Object.entries(URGENCIA).map(([k, v]) => html`<option value="${k}" ${k === c.nivel_urgencia ? html`selected` : ""}>${v.texto}</option>`)}</select>
        <p class="ayuda">Las críticas aparecen primero en la cola y en la portada.</p></div>
      ${acciones(c)}
      ${puedeDonar ? formDonacion(c) : ""}
      ${c.historial.length ? html`<div class="form-bloque"><h3>Historial de moderación</h3><ul class="historial">${c.historial.map((h) => html`<li><strong>${textoEstado(h.accion)}</strong> por ${h.usuario}, ${formatearFechaHora(h.fecha)}${h.motivo ? html`<br><span class="suave">${h.motivo}</span>` : ""}</li>`)}</ul></div>` : ""}
      ${c.estado === "aprobado" || c.estado === "resuelto" ? html`<p style="margin:0"><a href="../caso.html?id=${c.id}" target="_blank" rel="noopener">Ver cómo se ve públicamente (se abre en otra pestaña)</a></p>` : ""}
    </div>`);
}

const CLASE_ESTADO = { pendiente: "pendiente", en_revision: "media", aprobado: "ok", rechazado: "rechazado", resuelto: "ok" };

async function abrirCaso(id) {
  abierto = id;
  const c = casos.find((x) => x.id === id);
  pintarDetalle(c);
  abrir(dialogo);
  $("#dialogo-titulo").focus();
}

/** Aplica un cambio, refresca lista y detalle, y avisa. */
async function aplicar(promesa, mensaje, { cerrarAlTerminar = false } = {}) {
  try {
    const actualizado = await promesa;
    const i = casos.findIndex((c) => c.id === actualizado.id);
    casos[i] = actualizado;
    pintarTodo();
    avisar(mensaje);
    if (cerrarAlTerminar) cerrar(dialogo);
    else { pintarDetalle(actualizado); $("#dialogo-titulo").focus(); }
    return true;
  } catch (e) {
    if (e.detalles) return e;
    avisar(e.message, { error: true });
    return false;
  }
}

dialogo.addEventListener("close", () => { abierto = null; });

dialogo.addEventListener("click", async (ev) => {
  const t = ev.target;
  const accion = t.closest("[data-accion]")?.dataset.accion;
  if (accion) {
    const msg = { aprobado: "Caso publicado", en_revision: "Caso marcado en revisión" }[accion];
    t.closest("button").disabled = true;
    await aplicar(api.moderacion.cambiarEstado(abierto, accion), msg);
  } else if (t.closest("[data-mostrar-rechazo]")) {
    $("#form-rechazo").hidden = false; $("#motivo").focus();
  } else if (t.closest("[data-cancelar-rechazo]")) {
    $("#form-rechazo").hidden = true;
  } else if (t.closest("[data-resolver]")) {
    await aplicar(api.moderacion.resolver(abierto), "Caso marcado como resuelto");
  }
});

dialogo.addEventListener("change", async (ev) => {
  if (ev.target.id === "cambiar-urgencia") {
    await aplicar(api.moderacion.cambiarUrgencia(abierto, ev.target.value), `Urgencia: ${textoUrgencia(ev.target.value).toLowerCase()}`);
    $("#cambiar-urgencia")?.focus();
  }
});

dialogo.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const form = ev.target;
  if (form.id === "form-rechazo") {
    if (!mostrarErrores(form, textoDe(form, "motivo") ? {} : { motivo: "Escribí el motivo del rechazo." })) return;
    await aplicar(api.moderacion.cambiarEstado(abierto, "rechazado", textoDe(form, "motivo")), "Caso rechazado");
  } else if (form.id === "form-donacion") {
    const datos = { alias_donacion: textoDe(form, "alias_donacion"), monto_objetivo: textoDe(form, "monto_objetivo"), monto_recaudado: textoDe(form, "monto_recaudado") || "0" };
    const e = {};
    if (!datos.alias_donacion) e.alias_donacion = "Indicá el alias donde se recibe la donación.";
    if (datos.monto_objetivo && !(Number(datos.monto_objetivo) > 0)) e.monto_objetivo = "Escribí un número mayor a cero, o dejalo vacío.";
    if (!(Number(datos.monto_recaudado) >= 0)) e.monto_recaudado = "Escribí un número, por ejemplo 15000.";
    if (!mostrarErrores(form, e)) return;
    const restaurar = bloquearEnvio($("button[type=submit]", form), "Guardando…");
    const r = await aplicar(api.moderacion.guardarDonacion(abierto, datos), "Donación guardada");
    if (r && r !== true) { restaurar(); mostrarErrores(form, r.detalles); }
  }
});

cargar();
