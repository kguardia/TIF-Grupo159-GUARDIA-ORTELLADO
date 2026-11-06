import "../ui/layout.js";
import { api } from "../api/index.js";
import { CONFIG } from "../config.js";
import { html, pintar, esc, $, $$ } from "../utils/html.js";
import { mostrarErrores, limpiarErrores, textoDe, contactoValido, bloquearEnvio } from "../utils/forms.js";
import { avisar } from "../ui/toast.js";

const form = $("#form-caso");
const zona = form.elements.zona_id;
const botonEnviar = $("#enviar");
const fotosInput = $("#fotos");
const prev = $("#fotos-prev");
const ubicBtn = $("#usar-ubicacion");
const ubicEstado = $("#ubicacion-estado");

let fotos = [];

/* ---------- Zonas ---------- */
(async () => {
  try {
    const zonas = await api.zonas.listar();
    zona.insertAdjacentHTML("beforeend", zonas.map((z) => `<option value="${z.id}">${esc(z.nombre)}</option>`).join(""));
  } catch (e) {
    avisar("No pudimos cargar las zonas. Recargá la página.", { error: true });
  }
})();

/* ---------- Fotos ---------- */
function pintarFotos() {
  pintar(prev, html`${fotos.map((f, i) => html`<div class="foto-prev">
    <img src="${URL.createObjectURL(f)}" alt="Foto ${i + 1} elegida">
    <button type="button" data-quitar="${i}" aria-label="Quitar foto ${i + 1}">×</button>
  </div>`)}`);
  $$("[data-quitar]", prev).forEach((b) => b.addEventListener("click", () => {
    fotos.splice(Number(b.dataset.quitar), 1);
    pintarFotos();
    fotosInput.focus();
  }));
  $("#fotos-contador").textContent = `${fotos.length} de ${CONFIG.MAX_FOTOS} fotos`;
}

fotosInput.addEventListener("change", () => {
  const nuevas = [...fotosInput.files];
  fotosInput.value = "";
  const aviso = [];
  for (const f of nuevas) {
    if (!f.type.startsWith("image/")) { aviso.push(`${f.name} no es una imagen.`); continue; }
    if (f.size > CONFIG.MAX_FOTO_MB * 1024 * 1024) { aviso.push(`${f.name} pesa más de ${CONFIG.MAX_FOTO_MB} MB.`); continue; }
    if (fotos.length >= CONFIG.MAX_FOTOS) { aviso.push(`Podés subir hasta ${CONFIG.MAX_FOTOS} fotos.`); break; }
    fotos.push(f);
  }
  if (aviso.length) avisar(aviso[0], { error: true });
  pintarFotos();
});
pintarFotos();

/* ---------- Ubicación (opcional) ---------- */
if (!CONFIG.USAR_COORDENADAS || !("geolocation" in navigator)) {
  $("#bloque-ubicacion").hidden = true;
} else {
  ubicBtn.addEventListener("click", () => {
    ubicEstado.textContent = "Buscando tu ubicación…";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.elements.latitud.value = pos.coords.latitude.toFixed(6);
        form.elements.longitud.value = pos.coords.longitude.toFixed(6);
        ubicEstado.textContent = "Ubicación guardada. Si no estás donde está el animal, quitala.";
        $("#quitar-ubicacion").hidden = false;
      },
      () => { ubicEstado.textContent = "No pudimos obtener tu ubicación. Podés seguir sin ella e indicar la dirección en la descripción."; },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
  $("#quitar-ubicacion").addEventListener("click", () => {
    form.elements.latitud.value = ""; form.elements.longitud.value = "";
    ubicEstado.textContent = "Ubicación quitada.";
    $("#quitar-ubicacion").hidden = true;
  });
}

/* ---------- Validación y envío ---------- */
function validar() {
  const e = {};
  if (!textoDe(form, "tipo_animal")) e.tipo_animal = "Indicá qué animal es (perro, gato…).";
  if (textoDe(form, "descripcion").length < 20) e.descripcion = "Contanos un poco más: qué le pasa y dónde está (mínimo 20 caracteres).";
  if (!form.elements.nivel_urgencia.value) e.nivel_urgencia = "Elegí qué tan urgente es.";
  if (!form.elements.tipo_ayuda.value) e.tipo_ayuda = "Elegí qué tipo de ayuda necesita.";
  if (!form.elements.zona_id.value) e.zona_id = "Elegí la zona donde está.";
  const contacto = textoDe(form, "contacto_publicante");
  if (!contacto) e.contacto_publicante = "Dejá un teléfono o email para que el moderador pueda verificar el caso.";
  else if (!contactoValido(contacto)) e.contacto_publicante = "Escribí un teléfono (con código de área), un email o un usuario que empiece con @.";
  return e;
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const errores = validar();
  if (!mostrarErrores(form, errores)) return;

  const datos = {
    tipo_animal: textoDe(form, "tipo_animal"),
    descripcion: textoDe(form, "descripcion"),
    nivel_urgencia: form.elements.nivel_urgencia.value,
    tipo_ayuda: form.elements.tipo_ayuda.value,
    zona_id: form.elements.zona_id.value,
    contacto_publicante: textoDe(form, "contacto_publicante"),
  };
  if (CONFIG.USAR_COORDENADAS && form.elements.latitud.value) {
    datos.latitud = form.elements.latitud.value;
    datos.longitud = form.elements.longitud.value;
  }

  const restaurar = bloquearEnvio(botonEnviar, "Enviando…");
  try {
    const r = await api.casos.publicar(datos, fotos);
    guardarCodigo(r.codigo_seguimiento, datos.tipo_animal);
    mostrarConfirmacion(r);
  } catch (e) {
    restaurar();
    if (e.detalles) mostrarErrores(form, e.detalles);
    else avisar(e.message, { error: true });
  }
});

function guardarCodigo(codigo, animal) {
  try {
    const previos = JSON.parse(localStorage.getItem("sospatitas.mis-casos") ?? "[]");
    localStorage.setItem("sospatitas.mis-casos", JSON.stringify([{ codigo, animal, fecha: Date.now() }, ...previos].slice(0, 5)));
  } catch { /* sin almacenamiento: el código igual se muestra en pantalla */ }
}

function mostrarConfirmacion(r) {
  const cont = $("#contenido-form");
  pintar(cont, html`<div class="confirmacion" role="status" tabindex="-1" id="confirmacion">
    <h2>Recibimos tu caso</h2>
    <p>Un moderador lo va a revisar antes de publicarlo. Guardá este código para ver cómo avanza:</p>
    <p><span class="codigo">${r.codigo_seguimiento}</span></p>
    <div class="fila">
      <a class="btn" href="seguimiento.html?codigo=${encodeURIComponent(r.codigo_seguimiento)}">Ver el estado de mi caso</a>
      <button type="button" class="btn btn--sec" data-copiar>Copiar código</button>
      <a class="btn btn--texto" href="publicar.html">Publicar otro caso</a>
    </div>
  </div>`);
  $("#confirmacion").focus();
  window.scrollTo({ top: 0 });
  $("[data-copiar]").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(r.codigo_seguimiento); avisar("Código copiado"); }
    catch { avisar("No pudimos copiarlo. Anotalo a mano.", { error: true }); }
  });
}

/* Limpia el error de un campo apenas la persona lo corrige */
form.addEventListener("input", (e) => {
  const c = e.target;
  if (c.getAttribute?.("aria-invalid") === "true") {
    c.removeAttribute("aria-invalid");
    document.getElementById(`err-${c.name}`)?.remove();
  }
});
form.addEventListener("change", (e) => {
  if (e.target.type === "radio") {
    $$(`[name="${e.target.name}"]`, form).forEach((r) => r.removeAttribute("aria-invalid"));
    document.getElementById(`err-${e.target.name}`)?.remove();
  }
});
