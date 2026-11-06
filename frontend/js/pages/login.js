import "../ui/layout.js";
import { api } from "../api/index.js";
import { $ } from "../utils/html.js";
import { CONFIG } from "../config.js";
import { sesion } from "../state/session.js";
import { mostrarErrores, textoDe, emailValido, bloquearEnvio } from "../utils/forms.js";
import { avisar } from "../ui/toast.js";

const form = $("#form-login");

/* Las credenciales de prueba solo existen en modo de prueba */
if (!CONFIG.USE_MOCK) $("#ayuda-prueba")?.remove();

/* Solo se vuelve a pantallas del panel (evita redirecciones a sitios externos) */
function destino() {
  const v = new URLSearchParams(location.search).get("volver") ?? "";
  return /^panel\/[a-z-]+\.html$/.test(v) ? v : "panel/moderacion.html";
}

if (sesion.activa()) location.replace(destino());

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const email = textoDe(form, "email");
  const password = form.elements.password.value;
  const e = {};
  if (!emailValido(email)) e.email = "Escribí tu email.";
  if (!password) e.password = "Escribí tu contraseña.";
  if (!mostrarErrores(form, e)) return;

  const restaurar = bloquearEnvio($("button[type=submit]", form), "Ingresando…");
  try {
    const { access_token, usuario } = await api.auth.login(email, password);
    sesion.guardar(access_token, usuario);
    location.href = destino();
  } catch (err) {
    restaurar();
    if (err.estado === 401 || err.estado === 400) mostrarErrores(form, { password: err.message });
    else avisar(err.message, { error: true });
  }
});
