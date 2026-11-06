import "../ui/layout.js";
import { montarPanel } from "../ui/layout.js";
import { api } from "../api/index.js";
import { requerirRol } from "../state/session.js";
import { html, pintar, esc, $ } from "../utils/html.js";
import { TIPO_CONTACTO } from "../utils/format.js";
import { mostrarCargando, mostrarVacio, mostrarError } from "../ui/estados.js";
import { mostrarErrores, limpiarErrores, textoDe, bloquearEnvio } from "../utils/forms.js";
import { abrir, cerrar, preparar } from "../ui/dialogo.js";
import { avisar } from "../ui/toast.js";

if (!requerirRol(["moderador", "administrador"])) await new Promise(() => {}); // la redirección ya está en curso: detenemos el resto del módulo
montarPanel();

const cuerpo = $("#tabla");
const dialogo = preparar($("#dialogo-contacto"));
const form = $("#form-contacto");
const confirmar = preparar($("#dialogo-borrar"));

let items = [];
let editando = null;
let aBorrar = null;

async function cargar() {
  mostrarCargando(cuerpo, 2);
  try {
    items = await api.directorio.listar();
    pintarTabla();
  } catch (e) { mostrarError(cuerpo, e, cargar); }
}

function pintarTabla() {
  cuerpo.removeAttribute("aria-busy");
  if (!items.length) {
    mostrarVacio(cuerpo, "El directorio está vacío", "Agregá la primera veterinaria o rescatista para que aparezca en el sitio público.");
    return;
  }
  pintar(cuerpo, html`<div class="tabla-caja"><table>
    <caption class="solo-lector">Contactos del directorio</caption>
    <thead><tr><th scope="col">Nombre</th><th scope="col">Tipo</th><th scope="col">Zona</th><th scope="col">Teléfono</th><th scope="col">24 hs</th><th scope="col"><span class="solo-lector">Acciones</span></th></tr></thead>
    <tbody>${items.map((d) => html`<tr>
      <td><strong>${d.nombre}</strong>${d.especialidad ? html`<br><span class="suave">${d.especialidad}</span>` : ""}</td>
      <td>${TIPO_CONTACTO[d.tipo]}</td><td>${d.zona.nombre}</td><td>${d.telefono}</td><td>${d.atencion_24hs ? "Sí" : "No"}</td>
      <td class="col-acciones">
        <button type="button" class="btn btn--sec btn--chico" data-editar="${d.id}" aria-label="Editar ${d.nombre}">Editar</button>
        <button type="button" class="btn btn--texto btn--chico" data-borrar="${d.id}" aria-label="Eliminar ${d.nombre}">Eliminar</button>
      </td></tr>`)}</tbody></table></div>`);
}

function abrirForm(d = null) {
  editando = d;
  form.reset(); limpiarErrores(form);
  $("#titulo-contacto").textContent = d ? "Editar contacto" : "Agregar contacto";
  if (d) {
    form.elements.tipo.value = d.tipo; form.elements.nombre.value = d.nombre; form.elements.telefono.value = d.telefono;
    form.elements.zona_id.value = d.zona_id; form.elements.atencion_24hs.checked = d.atencion_24hs; form.elements.especialidad.value = d.especialidad ?? "";
  }
  abrir(dialogo);
  form.elements.nombre.focus();
}

$("#agregar").addEventListener("click", () => abrirForm());
cuerpo.addEventListener("click", (e) => {
  const ed = e.target.closest("[data-editar]");
  const bo = e.target.closest("[data-borrar]");
  if (ed) abrirForm(items.find((d) => d.id === Number(ed.dataset.editar)));
  if (bo) {
    aBorrar = items.find((d) => d.id === Number(bo.dataset.borrar));
    $("#borrar-nombre").textContent = aBorrar.nombre;
    abrir(confirmar);
  }
});

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const e = {};
  if (!form.elements.tipo.value) e.tipo = "Elegí si es veterinaria o rescatista.";
  if (!textoDe(form, "nombre")) e.nombre = "Escribí el nombre.";
  if (textoDe(form, "telefono").replace(/\D/g, "").length < 7) e.telefono = "Escribí un teléfono con código de área.";
  if (!form.elements.zona_id.value) e.zona_id = "Elegí la zona.";
  if (!mostrarErrores(form, e)) return;
  const datos = {
    tipo: form.elements.tipo.value, nombre: textoDe(form, "nombre"), telefono: textoDe(form, "telefono"),
    zona_id: Number(form.elements.zona_id.value), atencion_24hs: form.elements.atencion_24hs.checked, especialidad: textoDe(form, "especialidad"),
  };
  const restaurar = bloquearEnvio($("button[type=submit]", form), "Guardando…");
  try {
    if (editando) await api.directorio.actualizar(editando.id, datos); else await api.directorio.crear(datos);
    cerrar(dialogo);
    avisar(editando ? "Contacto actualizado" : "Contacto agregado");
    await cargar();
  } catch (err) {
    if (err.detalles) mostrarErrores(form, err.detalles); else avisar(err.message, { error: true });
  } finally { restaurar(); }
});

$("#confirmar-borrar").addEventListener("click", async () => {
  try {
    await api.directorio.eliminar(aBorrar.id);
    cerrar(confirmar);
    avisar("Contacto eliminado");
    await cargar();
    $("#agregar").focus();
  } catch (err) { avisar(err.message, { error: true }); }
});

(async () => {
  try {
    const zonas = await api.zonas.listar();
    form.elements.zona_id.insertAdjacentHTML("beforeend", zonas.map((z) => `<option value="${z.id}">${esc(z.nombre)}</option>`).join(""));
  } catch { avisar("No pudimos cargar las zonas.", { error: true }); }
  cargar();
})();
