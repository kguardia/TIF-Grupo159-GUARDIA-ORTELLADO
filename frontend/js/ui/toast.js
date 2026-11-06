/** Avisos breves. La región es aria-live, así que los lectores de pantalla los anuncian. */
function region() {
  let r = document.getElementById("avisos");
  if (!r) {
    r = document.createElement("div");
    r.id = "avisos";
    r.className = "avisos";
    r.setAttribute("role", "status");
    r.setAttribute("aria-live", "polite");
    document.body.append(r);
  }
  return r;
}

export function avisar(mensaje, { error = false, ms = 4500 } = {}) {
  const t = document.createElement("div");
  t.className = error ? "toast toast--error" : "toast";
  t.textContent = mensaje;
  region().append(t);
  setTimeout(() => t.remove(), ms);
}
