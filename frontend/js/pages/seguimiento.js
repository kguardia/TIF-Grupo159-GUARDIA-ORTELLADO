import "../ui/layout.js";
import { api } from "../api/index.js";
import { html, pintar, $ } from "../utils/html.js";
import { textoEstado, formatearFecha } from "../utils/format.js";
import { mostrarErrores, textoDe, bloquearEnvio } from "../utils/forms.js";

const form = $("#form-seguimiento");
const resultado = $("#resultado");
const recientes = $("#recientes");

const EXPLICACION = {
  pendiente: "Todavía no lo revisó ningún moderador. Los casos urgentes se revisan primero.",
  en_revision: "Un moderador lo está verificando. Es posible que se comuniquen con vos al contacto que dejaste.",
  aprobado: "Ya está publicado y cualquier persona puede verlo y ofrecer ayuda.",
  rechazado: "No pudimos publicarlo.",
  resuelto: "El caso se resolvió. Gracias por avisar.",
};
const CLASE = { pendiente: "pendiente", en_revision: "media", aprobado: "ok", rechazado: "rechazado", resuelto: "ok" };

async function consultar(codigo) {
  const boton = $("button[type=submit]", form);
  const restaurar = bloquearEnvio(boton, "Buscando…");
  try {
    const c = await api.casos.seguimiento(codigo);
    pintar(resultado, html`<section class="estado-grande" aria-labelledby="t-estado" tabindex="-1" id="estado-foco">
      <div>
        <p class="texto-chico suave" style="margin:0">Caso ${c.codigo_seguimiento}, ${c.tipo_animal.toLowerCase()}, enviado el ${formatearFecha(c.fecha_publicacion)}</p>
        <h2 id="t-estado" style="margin:var(--e-2) 0">Estado: <span class="etiqueta etiqueta--${CLASE[c.estado]}" style="font-size:var(--t-base)">${textoEstado(c.estado)}</span></h2>
        <p style="margin:0">${EXPLICACION[c.estado]}</p>
        ${c.estado === "rechazado" && c.motivo_rechazo ? html`<div class="aviso aviso--error" style="margin-top:var(--e-3)"><p><strong>Motivo:</strong> ${c.motivo_rechazo}</p></div>` : ""}
        ${c.estado === "aprobado" || c.estado === "resuelto" ? html`<p style="margin:var(--e-4) 0 0"><a class="btn" href="caso.html?id=${c.id}">Ver la publicación</a></p>` : ""}
      </div>
    </section>`);
    $("#estado-foco").focus();
  } catch (e) {
    if (e.estado === 404) mostrarErrores(form, { codigo: e.message });
    else pintar(resultado, html`<div class="aviso aviso--error" role="alert"><p>${e.message}</p></div>`);
  } finally { restaurar(); }
}

form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const codigo = textoDe(form, "codigo");
  resultado.replaceChildren();
  if (!codigo) { mostrarErrores(form, { codigo: "Escribí el código que te dimos al publicar (por ejemplo, PAT-7K3M9Q)." }); return; }
  mostrarErrores(form, {});
  consultar(codigo);
});

/* Códigos de casos publicados desde este navegador */
try {
  const guardados = JSON.parse(localStorage.getItem("sospatitas.mis-casos") ?? "[]");
  if (guardados.length) {
    pintar(recientes, html`<h2 style="font-size:var(--t-base)">Publicados desde este dispositivo</h2>
      <ul>${guardados.map((g) => html`<li><button type="button" class="btn btn--texto btn--chico" data-codigo="${g.codigo}">${g.codigo}</button> ${g.animal}</li>`)}</ul>`);
    recientes.querySelectorAll("[data-codigo]").forEach((b) => b.addEventListener("click", () => { form.elements.codigo.value = b.dataset.codigo; consultar(b.dataset.codigo); }));
  }
} catch { /* nada guardado */ }

const inicial = new URLSearchParams(location.search).get("codigo");
if (inicial) { form.elements.codigo.value = inicial; consultar(inicial); }
