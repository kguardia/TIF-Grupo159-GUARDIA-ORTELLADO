import "../ui/layout.js";
import { api } from "../api/index.js";
import { html, pintar, $ } from "../utils/html.js";
import { ficha } from "../ui/ficha.js";
import { mostrarCargando, mostrarVacio, mostrarError } from "../ui/estados.js";

const lista = $("#casos-criticos");

async function cargar() {
  mostrarCargando(lista, 2);
  try {
    const casos = await api.casos.listarPublicos({ nivel_urgencia: "critica" });
    lista.removeAttribute("aria-busy");
    if (!casos.length) {
      mostrarVacio(lista, "No hay casos críticos abiertos", "Cuando se publique uno, aparece acá primero.");
      return;
    }
    pintar(lista, html`<ul class="grilla-fichas">${casos.slice(0, 3).map((c) => ficha(c, { conFoto: false }))}</ul>`);
  } catch (e) {
    mostrarError(lista, e, cargar);
  }
}

cargar();
