import "../ui/layout.js";
import { montarPanel } from "../ui/layout.js";
import { api } from "../api/index.js";
import { requerirRol, sesion } from "../state/session.js";
import { html, pintar, $ } from "../utils/html.js";
import { mostrarCargando, mostrarVacio, mostrarError } from "../ui/estados.js";
import { mostrarErrores, limpiarErrores, textoDe, emailValido, bloquearEnvio } from "../utils/forms.js";
import { abrir, cerrar, preparar } from "../ui/dialogo.js";
import { avisar } from "../ui/toast.js";

if (!requerirRol(["administrador"])) await new Promise(() => {}); // la redirección ya está en curso: detenemos el resto del módulo
montarPanel();

const tablaUsuarios = $("#tabla-usuarios");
const tablaZonas = $("#tabla-zonas");
const dUsuario = preparar($("#dialogo-usuario"));
const fUsuario = $("#form-usuario");
const dZona = preparar($("#dialogo-zona"));
const fZona = $("#form-zona");

let zonaEditando = null;

/* ---------- Usuarios (RF09) ---------- */
async function cargarUsuarios() {
  mostrarCargando(tablaUsuarios, 2);
  try {
    const lista = await api.usuarios.listar();
    tablaUsuarios.removeAttribute("aria-busy");
    const yo = sesion.usuario();
    pintar(tablaUsuarios, html`<div class="tabla-caja"><table>
      <caption class="solo-lector">Usuarios del panel</caption>
      <thead><tr><th scope="col">Nombre</th><th scope="col">Email</th><th scope="col">Rol</th><th scope="col">Estado</th><th scope="col"><span class="solo-lector">Acciones</span></th></tr></thead>
      <tbody>${lista.map((u) => html`<tr>
        <td><strong>${u.nombre}</strong></td><td>${u.email}</td><td>${u.rol === "administrador" ? "Administrador" : "Moderador"}</td>
        <td><span class="etiqueta ${u.activo ? "etiqueta--ok" : ""}">${u.activo ? "Activo" : "Desactivado"}</span></td>
        <td class="col-acciones">${u.id === yo.id ? html`<span class="suave texto-chico">Es tu usuario</span>`
          : html`<button type="button" class="btn btn--sec btn--chico" data-toggle="${u.id}" data-activo="${u.activo}" aria-label="${u.activo ? "Desactivar" : "Activar"} a ${u.nombre}">${u.activo ? "Desactivar" : "Activar"}</button>`}</td>
      </tr>`)}</tbody></table></div>`);
  } catch (e) { mostrarError(tablaUsuarios, e, cargarUsuarios); }
}

tablaUsuarios.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-toggle]");
  if (!b) return;
  try {
    await api.usuarios.cambiarActivo(Number(b.dataset.toggle), b.dataset.activo !== "true");
    avisar(b.dataset.activo === "true" ? "Usuario desactivado" : "Usuario activado");
    await cargarUsuarios();
  } catch (err) { avisar(err.message, { error: true }); }
});

$("#nuevo-usuario").addEventListener("click", () => { fUsuario.reset(); limpiarErrores(fUsuario); abrir(dUsuario); fUsuario.elements.nombre.focus(); });

fUsuario.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const e = {};
  if (!textoDe(fUsuario, "nombre")) e.nombre = "Escribí el nombre.";
  if (!emailValido(textoDe(fUsuario, "email"))) e.email = "Escribí un email válido.";
  if (fUsuario.elements.password.value.length < 8) e.password = "La contraseña debe tener al menos 8 caracteres.";
  if (!mostrarErrores(fUsuario, e)) return;
  const restaurar = bloquearEnvio($("button[type=submit]", fUsuario), "Creando…");
  try {
    await api.usuarios.crear({ nombre: textoDe(fUsuario, "nombre"), email: textoDe(fUsuario, "email"), password: fUsuario.elements.password.value });
    cerrar(dUsuario);
    avisar("Moderador creado");
    await cargarUsuarios();
  } catch (err) {
    if (err.detalles) mostrarErrores(fUsuario, err.detalles); else avisar(err.message, { error: true });
  } finally { restaurar(); }
});

/* ---------- Zonas (RNF04) ---------- */
async function cargarZonas() {
  mostrarCargando(tablaZonas, 2);
  try {
    const zonas = await api.zonas.listar();
    tablaZonas.removeAttribute("aria-busy");
    if (!zonas.length) { mostrarVacio(tablaZonas, "Todavía no hay zonas", "Agregá la primera para poder publicar casos."); return; }
    pintar(tablaZonas, html`<div class="tabla-caja"><table>
      <caption class="solo-lector">Zonas disponibles</caption>
      <thead><tr><th scope="col">Zona</th><th scope="col"><span class="solo-lector">Acciones</span></th></tr></thead>
      <tbody>${zonas.map((z) => html`<tr><td>${z.nombre}</td><td class="col-acciones"><button type="button" class="btn btn--sec btn--chico" data-renombrar="${z.id}" data-nombre="${z.nombre}" aria-label="Renombrar ${z.nombre}">Renombrar</button></td></tr>`)}</tbody></table></div>`);
  } catch (e) { mostrarError(tablaZonas, e, cargarZonas); }
}

function abrirZona(z = null) {
  zonaEditando = z;
  fZona.reset(); limpiarErrores(fZona);
  $("#titulo-zona").textContent = z ? "Renombrar zona" : "Agregar zona";
  fZona.elements.nombre.value = z?.nombre ?? "";
  abrir(dZona); fZona.elements.nombre.focus();
}
$("#nueva-zona").addEventListener("click", () => abrirZona());
tablaZonas.addEventListener("click", (e) => {
  const b = e.target.closest("[data-renombrar]");
  if (b) abrirZona({ id: Number(b.dataset.renombrar), nombre: b.dataset.nombre });
});

fZona.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  if (!mostrarErrores(fZona, textoDe(fZona, "nombre") ? {} : { nombre: "Escribí el nombre de la zona." })) return;
  const restaurar = bloquearEnvio($("button[type=submit]", fZona), "Guardando…");
  try {
    if (zonaEditando) await api.zonas.renombrar(zonaEditando.id, textoDe(fZona, "nombre")); else await api.zonas.crear(textoDe(fZona, "nombre"));
    cerrar(dZona);
    avisar(zonaEditando ? "Zona actualizada" : "Zona agregada");
    await cargarZonas();
  } catch (err) {
    if (err.detalles) mostrarErrores(fZona, err.detalles); else avisar(err.message, { error: true });
  } finally { restaurar(); }
});

/* ---------- Pestañas ---------- */
const tabs = [...document.querySelectorAll("[data-tab]")];
function mostrarTab(clave) {
  tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === clave)));
  $("#panel-usuarios").hidden = clave !== "usuarios";
  $("#panel-zonas").hidden = clave !== "zonas";
}
tabs.forEach((t) => t.addEventListener("click", () => mostrarTab(t.dataset.tab)));

cargarUsuarios();
cargarZonas();
