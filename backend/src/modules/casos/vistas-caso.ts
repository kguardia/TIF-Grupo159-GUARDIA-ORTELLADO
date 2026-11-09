import { Inject, Injectable } from '@nestjs/common';
import { CONFIGURACION, Configuracion } from '../../config/configuracion';
import { Caso } from '../../entities';
import { AlmacenamientoService } from '../almacenamiento/almacenamiento.service';

/**
 * Las tres "caras" de un caso. Cada una decide qué datos se exponen:
 *  - listado:    lo mínimo para una ficha
 *  - publica:    detalle para cualquier visitante
 *  - moderacion: todo, incluido contacto privado e historial (solo con sesión)
 * Todas esperan el caso cargado con sus relaciones (zona, fotos, donacion, historial).
 */
@Injectable()
export class VistasCaso {
  constructor(
    @Inject(CONFIGURACION) private readonly cfg: Configuracion,
    private readonly almacen: AlmacenamientoService,
  ) {}

  private fotosOrdenadas(c: Caso) {
    return [...(c.fotos ?? [])].sort((a, b) => a.orden - b.orden || a.id - b.id).map((f) => ({ id: f.id, url: this.almacen.urlAbsoluta(f.url), orden: f.orden }));
  }

  private donacion(c: Caso) {
    const d = c.donacion;
    return d ? { monto_objetivo: d.monto_objetivo, monto_recaudado: d.monto_recaudado, alias_donacion: d.alias_donacion, fecha_actualizacion: d.fecha_actualizacion } : null;
  }

  listado(c: Caso) {
    return {
      id: c.id,
      tipo_animal: c.tipo_animal,
      descripcion: c.descripcion,
      nivel_urgencia: c.nivel_urgencia,
      tipo_ayuda: c.tipo_ayuda,
      estado: c.estado,
      zona: { id: c.zona.id, nombre: c.zona.nombre },
      fecha_publicacion: c.fecha_publicacion,
      foto_principal: this.fotosOrdenadas(c)[0]?.url ?? null,
      latitud: c.latitud ?? null,
      longitud: c.longitud ?? null,
      tiene_donacion: Boolean(c.donacion),
    };
  }

  publica(c: Caso) {
    return {
      ...this.listado(c),
      fotos: this.fotosOrdenadas(c),
      donacion: this.donacion(c),
      // Decisión de privacidad configurable (MOSTRAR_CONTACTO_PUBLICO). Un caso resuelto nunca lo muestra.
      ...(this.cfg.mostrarContactoPublico && c.estado !== 'resuelto' ? { contacto_publicante: c.contacto_publicante } : {}),
    };
  }

  moderacion(c: Caso) {
    return {
      ...this.listado(c),
      fotos: this.fotosOrdenadas(c),
      donacion: this.donacion(c),
      contacto_publicante: c.contacto_publicante,
      codigo_seguimiento: c.codigo_seguimiento,
      motivo_rechazo: c.motivo_rechazo,
      fecha_moderacion: c.fecha_moderacion,
      moderador_id: c.moderador_id,
      historial: [...(c.historial ?? [])]
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime() || b.id - a.id)
        .map((h) => ({ id: h.id, usuario_id: h.usuario_id, usuario: h.usuario?.nombre ?? '', accion: h.accion, motivo: h.motivo, fecha: h.fecha })),
    };
  }
}
