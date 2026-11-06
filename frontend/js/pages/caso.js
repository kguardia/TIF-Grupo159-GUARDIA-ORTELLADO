import "../ui/layout.js";
import { api } from "../api/index.js";
import { html, pintar, $ } from "../utils/html.js";
import { textoUrgencia, textoAyuda, formatearFecha, formatearMonto, hace } from "../utils/format.js";
import { mostrarCargando, mostrarError } from "../ui/estados.js";
import { CONFIG } from "../config.js";
import { avisar } from "../ui/toast.js";
import { mapaDisponible, dibujarUno } from "../ui/mapa.js";

const contenedor = $("#caso");
const id = new URLSearchParams(location.search).get("id");

function bloqueDonacion(d) {
  const pct = d.monto_objetivo ? Math.min(100, Math.round((d.monto_recaudado / d.monto_objetivo) * 100)) : null;
  return html`<section class="avance" aria-labelledby="t-don">
    <h2 id="t-don" class="texto-chico" style="font-family:var(--fuente-texto);margin-bottom:var(--e-2)">Donaciones para este caso</h2>
    <div class="avance__cifras">
      <span class="avance__monto">${formatearMonto(d.monto_recaudado)}</span>
      ${d.monto_objetivo ? html`<span class="suave texto-chico">de ${formatearMonto(d.monto_objetivo)}</span>` : html`<span class="suave texto-chico">sin monto objetivo</span>`}
    </div>
    ${pct !== null ? html`<div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Avance de la donación"><i style="width:${pct}%"></i></div>` : ""}
    <div class="alias">
      <span class="texto-chico">Alias:</span> <code id="alias-txt">${d.alias_donacion}</code>
      <button type="button" class="btn btn--sec btn--chico" data-copiar-alias>Copiar alias</button>
    </div>
    <p class="suave texto-chico" style="margin:var(--e-3) 0 0">La transferencia se hace desde tu banco o billetera. El monto se actualiza a mano, puede tardar en reflejarse.</p>
  </section>`;
}

function pintarCaso(c) {
  const titulo = `${c.tipo_animal} en ${c.zona.nombre}`;
  document.title = `${titulo} — SOS Patitas`;
  const resuelto = c.estado === "resuelto";
  const unaFoto = c.fotos?.length === 1;

  pintar(contenedor, html`
    <article class="caso">
      <div>
        <header class="caso__cab">
          <div class="fila">
            ${resuelto ? html`<span class="etiqueta etiqueta--ok">Caso resuelto</span>` : html`<span class="etiqueta etiqueta--${c.nivel_urgencia}">Urgencia ${textoUrgencia(c.nivel_urgencia).toLowerCase()}</span>`}
            <span class="etiqueta">${textoAyuda(c.tipo_ayuda)}</span>
          </div>
          <h1>${titulo}</h1>
        </header>
        ${resuelto ? html`<div class="aviso aviso--ok" style="margin-bottom:var(--e-5)"><p><strong>Este caso ya se resolvió.</strong> Gracias a quienes ayudaron.</p></div>` : ""}
        ${c.fotos?.length ? html`<div class="galeria ${unaFoto ? "galeria--una" : ""}">${c.fotos.map((f, i) => html`<img src="${f.url}" alt="Foto ${i + 1} de ${c.fotos.length}: ${c.tipo_animal.toLowerCase()} en ${c.zona.nombre}" loading="${i ? "lazy" : "eager"}">`)}</div>` : ""}
        <p class="caso__descripcion">${c.descripcion}</p>
        ${c.latitud != null && mapaDisponible() ? html`<div class="mapa" id="mapa-caso" role="region" aria-label="Ubicación aproximada en el mapa" style="height:18rem;margin-top:var(--e-5)"></div>` : ""}
      </div>
      <aside class="lateral" aria-label="Datos del caso">
        ${!resuelto && c.donacion ? bloqueDonacion(c.donacion) : ""}
        <section class="panel-info">
          <h2>Datos</h2>
          <dl class="datos">
            <dt>Zona</dt><dd>${c.zona.nombre}</dd>
            <dt>Ayuda</dt><dd>${textoAyuda(c.tipo_ayuda)}</dd>
            <dt>Publicado</dt><dd>${formatearFecha(c.fecha_publicacion)} <span class="suave" style="font-weight:400">(${hace(c.fecha_publicacion)})</span></dd>
          </dl>
        </section>
        ${!resuelto && c.contacto_publicante ? html`<section class="panel-info">
          <h2>Quiero ayudar</h2>
          <p class="texto-chico suave">Quien publicó este caso dejó un contacto. Usalo solo para coordinar la ayuda.</p>
          <div id="contacto-zona"><button type="button" class="btn" data-ver-contacto>Ver contacto</button></div>
        </section>` : ""}
        <div class="fila">
          <button type="button" class="btn btn--sec" data-compartir>Compartir este caso</button>
          <a class="btn btn--texto" href="directorio.html">Ver directorio</a>
        </div>
      </aside>
    </article>`);

  $("[data-copiar-alias]")?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(c.donacion.alias_donacion); avisar("Alias copiado"); }
    catch { avisar("No pudimos copiarlo. Seleccionalo y copialo a mano.", { error: true }); }
  });

  $("[data-ver-contacto]")?.addEventListener("click", () => {
    const zona = $("#contacto-zona");
    const esTel = c.contacto_publicante.replace(/\D/g, "").length >= 7 && !c.contacto_publicante.includes("@");
    pintar(zona, html`<p style="margin:0"><strong style="font-size:var(--t-lg)">${esTel
      ? html`<a href="tel:${c.contacto_publicante.replace(/[^\d+]/g, "")}">${c.contacto_publicante}</a>` : c.contacto_publicante}</strong></p>`);
  });

  $("[data-compartir]").addEventListener("click", async () => {
    // Con backend real se comparte /c/:id, que trae las etiquetas Open Graph para la vista previa en redes (RF08).
    const url = CONFIG.USE_MOCK ? location.href : `${CONFIG.API_URL}/c/${c.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: titulo, text: "Este animal necesita ayuda", url }); return; } catch { return; }
    }
    try { await navigator.clipboard.writeText(url); avisar("Enlace copiado"); }
    catch { avisar("No pudimos copiar el enlace. Copialo de la barra del navegador.", { error: true }); }
  });

  if (c.latitud != null && mapaDisponible()) dibujarUno($("#mapa-caso"), c);
}

async function cargar() {
  if (!id) {
    pintar(contenedor, html`<div class="vacio"><h1 style="font-size:var(--t-xl)">Falta indicar qué caso mostrar</h1><p>Entrá desde el listado de casos activos.</p><a class="btn" href="casos.html">Ver casos activos</a></div>`);
    return;
  }
  mostrarCargando(contenedor, 1);
  try {
    pintarCaso(await api.casos.obtenerPublico(id));
    contenedor.removeAttribute("aria-busy");
  } catch (e) {
    if (e.estado === 404) {
      pintar(contenedor, html`<div class="vacio"><h1 style="font-size:var(--t-xl)">Este caso no está disponible</h1><p>Puede que todavía no haya sido revisado, que se haya dado de baja o que el enlace esté incompleto.</p><a class="btn" href="casos.html">Ver casos activos</a></div>`);
      contenedor.removeAttribute("aria-busy");
    } else mostrarError(contenedor, e, cargar);
  }
}

cargar();
