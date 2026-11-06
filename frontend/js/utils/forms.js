import { $, $$, html, pintar } from "./html.js";

/**
 * Validación de formularios accesible:
 *  - mensajes junto a cada campo (aria-describedby + aria-invalid)
 *  - un resumen arriba que lleva el foco, con enlaces a cada campo con error
 */

export function limpiarErrores(form) {
  $$("[aria-invalid]", form).forEach((c) => c.removeAttribute("aria-invalid"));
  $$(".error-campo", form).forEach((e) => e.remove());
  $("[data-resumen-errores]", form)?.replaceChildren();
}

export function mostrarErrores(form, errores) {
  limpiarErrores(form);
  const lista = [];
  for (const [nombre, mensaje] of Object.entries(errores)) {
    const campo = form.elements[nombre];
    const primero = campo instanceof RadioNodeList ? campo[0] : campo;
    if (!primero) { lista.push({ id: null, mensaje }); continue; }
    const contenedor = primero.closest(".campo, .grupo") ?? primero.parentElement;
    const idError = `err-${nombre}`;
    const p = document.createElement("p");
    p.className = "error-campo";
    p.id = idError;
    p.textContent = mensaje;
    contenedor.append(p);
    (campo instanceof RadioNodeList ? [...campo] : [campo]).forEach((c) => {
      c.setAttribute("aria-invalid", "true");
      const previo = c.getAttribute("aria-describedby");
      c.setAttribute("aria-describedby", previo && !previo.includes(idError) ? `${previo} ${idError}` : idError);
    });
    if (!primero.id) primero.id = `campo-${nombre}`;
    lista.push({ id: primero.id, mensaje });
  }
  const resumen = $("[data-resumen-errores]", form);
  if (resumen && lista.length) {
    pintar(resumen, html`<div class="resumen-errores" role="alert" tabindex="-1">
      <h2>Revisá ${lista.length === 1 ? "este dato" : `estos ${lista.length} datos`} antes de seguir</h2>
      <ul>${lista.map((e) => (e.id ? html`<li><a href="#${e.id}">${e.mensaje}</a></li>` : html`<li>${e.mensaje}</li>`))}</ul>
    </div>`);
    $(".resumen-errores", resumen).focus();
    $$("a", resumen).forEach((a) => a.addEventListener("click", (ev) => {
      ev.preventDefault();
      document.getElementById(a.getAttribute("href").slice(1))?.focus();
    }));
  }
  return lista.length === 0;
}

export const textoDe = (form, nombre) => String(form.elements[nombre]?.value ?? "").trim();

/** Devuelve true si el email tiene forma razonable (la validación real la hace el servidor). */
export const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/** Teléfono (7+ dígitos) o email o usuario de red (@algo). */
export function contactoValido(v) {
  const digitos = v.replace(/\D/g, "");
  return digitos.length >= 7 || emailValido(v) || /^@[\w.]{3,}$/.test(v);
}

export function bloquearEnvio(boton, textoEnvio) {
  const original = boton.textContent;
  boton.disabled = true;
  boton.textContent = textoEnvio;
  return () => { boton.disabled = false; boton.textContent = original; };
}
