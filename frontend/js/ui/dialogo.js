/** Utilidades para <dialog> nativo: el navegador ya maneja foco, Esc y capa modal. */
export function abrir(dialogo) {
  if (!dialogo.open) dialogo.showModal();
}

export function cerrar(dialogo) {
  if (dialogo.open) dialogo.close();
}

/** Cierra al hacer clic fuera de la caja y con los botones [data-cerrar]. */
export function preparar(dialogo) {
  dialogo.addEventListener("click", (e) => {
    if (e.target === dialogo || e.target.closest("[data-cerrar]")) dialogo.close();
  });
  return dialogo;
}
