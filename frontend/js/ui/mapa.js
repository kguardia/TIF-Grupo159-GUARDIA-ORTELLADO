import { CONFIG } from "../config.js";
import { esc } from "../utils/html.js";
import { textoUrgencia } from "../utils/format.js";

/**
 * Mapa con Leaflet (cargado como script clásico en la página → global `L`).
 * Solo dibuja los casos que tengan latitud y longitud.
 */
export function mapaDisponible() {
  return CONFIG.USAR_COORDENADAS && typeof window.L !== "undefined";
}

function icono(nivel) {
  return L.divIcon({ className: "", html: `<div class="pin pin--${nivel}"></div>`, iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -24] });
}

function base(contenedor) {
  const mapa = L.map(contenedor, { scrollWheelZoom: false }).setView(CONFIG.MAPA_CENTRO, CONFIG.MAPA_ZOOM);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa);
  return mapa;
}

export function dibujarCasos(contenedor, casos, raiz = "") {
  const mapa = base(contenedor);
  const puntos = [];
  for (const c of casos) {
    if (c.latitud == null || c.longitud == null) continue;
    const p = [c.latitud, c.longitud];
    puntos.push(p);
    L.marker(p, { icon: icono(c.nivel_urgencia), title: `${c.tipo_animal} en ${c.zona?.nombre ?? ""}`, alt: `${c.tipo_animal}, urgencia ${textoUrgencia(c.nivel_urgencia).toLowerCase()}` })
      .addTo(mapa)
      .bindPopup(`<strong>${esc(c.tipo_animal)} en ${esc(c.zona?.nombre ?? "")}</strong><br>Urgencia ${esc(textoUrgencia(c.nivel_urgencia).toLowerCase())}<br><a href="${raiz}caso.html?id=${c.id}">Ver el caso</a>`);
  }
  if (puntos.length) mapa.fitBounds(puntos, { padding: [40, 40], maxZoom: 15 });
  return { mapa, cantidad: puntos.length };
}

export function dibujarUno(contenedor, caso) {
  const mapa = base(contenedor);
  const p = [caso.latitud, caso.longitud];
  L.marker(p, { icon: icono(caso.nivel_urgencia), title: `${caso.tipo_animal} en ${caso.zona?.nombre ?? ""}` }).addTo(mapa);
  mapa.setView(p, 15);
  return mapa;
}
