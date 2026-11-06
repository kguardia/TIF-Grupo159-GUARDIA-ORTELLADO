/**
 * Sesión del personal (moderador / administrador).
 * El token se guarda en sessionStorage: se borra al cerrar la pestaña.
 * Quien publica o consulta un caso nunca necesita sesión.
 */
const CLAVE = "sospatitas.sesion";

function leer() {
  try { return JSON.parse(sessionStorage.getItem(CLAVE)) ?? null; } catch { return null; }
}

export const sesion = {
  guardar(token, usuario) {
    try { sessionStorage.setItem(CLAVE, JSON.stringify({ token, usuario })); } catch { /* sin almacenamiento */ }
  },
  token: () => leer()?.token ?? null,
  usuario: () => leer()?.usuario ?? null,
  activa: () => Boolean(leer()?.token),
  esAdmin: () => leer()?.usuario?.rol === "administrador",
  cerrar() {
    try { sessionStorage.removeItem(CLAVE); } catch { /* nada */ }
  },
};

/**
 * Protege una pantalla del panel. Si no hay sesión o el rol no alcanza,
 * redirige al ingreso. (El servidor vuelve a validar: esto es solo comodidad.)
 */
export function requerirRol(roles, raiz = "../") {
  const u = sesion.usuario();
  if (sesion.activa() && u && roles.includes(u.rol)) return true;
  if (sesion.activa() && u) {
    // Hay sesión pero el rol no alcanza: volvemos a la pantalla que sí puede ver
    // (redirigir a login acá armaría un bucle, porque login reenvía a quien ya ingresó).
    location.replace(`${raiz}panel/moderacion.html?sin_permiso=1`);
    return false;
  }
  const volver = encodeURIComponent(location.pathname.split("/").slice(-2).join("/"));
  location.replace(`${raiz}login.html?volver=${volver}`);
  return false;
}
