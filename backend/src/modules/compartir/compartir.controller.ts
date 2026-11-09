import { Controller, Get, Header, Inject, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Publico } from '../../common/decorators/publico.decorator';
import { IdPipe } from '../../common/utils/id.pipe';
import { escaparHtml as h } from '../../common/utils/html';
import { textoAyuda, textoUrgencia } from '../../common/utils/textos';
import { CONFIGURACION, Configuracion } from '../../config/configuracion';
import { CasosService } from '../casos/casos.service';

/**
 * RF08: enlace compartible por caso, con metadatos para redes sociales.
 *
 * Las vistas previas de WhatsApp, Instagram o Facebook leen las etiquetas Open Graph del HTML
 * SIN ejecutar JavaScript, y el frontend es un sitio estático: por eso este endpoint devuelve una
 * página mínima con esas etiquetas que redirige enseguida al detalle real en el frontend.
 *
 *   Enlace para compartir:  {PUBLIC_BASE_URL}/c/:id
 */
@Publico()
@Controller('c')
export class CompartirController {
  constructor(
    private readonly casos: CasosService,
    @Inject(CONFIGURACION) private readonly cfg: Configuracion,
  ) {}

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=300')
  async compartir(@Param('id', IdPipe) id: number, @Res() res: Response) {
    const r = await this.casos.buscarPublico(id);
    if (!r) return res.redirect(302, `${this.cfg.urlFrontend}/casos.html`); // caso inexistente o aún no publicado: no se revela nada

    const { vista } = r;
    const titulo = `${vista.tipo_animal} en ${vista.zona.nombre} necesita ayuda`;
    const descripcion = `Urgencia ${textoUrgencia(vista.nivel_urgencia)}. ${textoAyuda(vista.tipo_ayuda)}. ${vista.descripcion}`.replace(/\s+/g, ' ').slice(0, 200);
    const destino = `${this.cfg.urlFrontend}/caso.html?id=${vista.id}`;
    const enlace = `${this.cfg.urlPublica}/c/${vista.id}`;
    const imagen = vista.foto_principal ? `<meta property="og:image" content="${h(vista.foto_principal)}">\n<meta name="twitter:image" content="${h(vista.foto_principal)}">` : '';

    res.type('html').send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${h(titulo)} — SOS Patitas</title>
<meta name="description" content="${h(descripcion)}">
<link rel="canonical" href="${h(destino)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="SOS Patitas">
<meta property="og:locale" content="es_AR">
<meta property="og:title" content="${h(titulo)}">
<meta property="og:description" content="${h(descripcion)}">
<meta property="og:url" content="${h(enlace)}">
${imagen}
<meta name="twitter:card" content="${imagen ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${h(titulo)}">
<meta name="twitter:description" content="${h(descripcion)}">
<meta http-equiv="refresh" content="0;url=${h(destino)}">
</head>
<body>
<p>Te llevamos al caso. Si no pasa nada, <a href="${h(destino)}">tocá acá</a>.</p>
</body>
</html>`);
  }
}
