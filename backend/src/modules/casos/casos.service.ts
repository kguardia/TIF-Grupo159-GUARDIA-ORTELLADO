import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ESTADOS_PUBLICOS_DETALLE, ESTADOS_PUBLICOS_LISTADO } from '../../common/enums';
import { generarCodigoSeguimiento } from '../../common/utils/codigo';
import { ErrorDeNegocio, errorCampo, esDuplicado } from '../../common/utils/errores';
import { CONFIGURACION, Configuracion } from '../../config/configuracion';
import { Caso, CasoFoto } from '../../entities';
import { AlmacenamientoService } from '../almacenamiento/almacenamiento.service';
import { ZonasService } from '../zonas/zonas.service';
import { CrearCasoDto, ListarCasosQuery } from './dto/casos.dto';
import { VistasCaso } from './vistas-caso';

/** Relaciones que necesitan las vistas. */
export const RELACIONES_COMPLETAS = { zona: true, fotos: true, donacion: true, historial: { usuario: true } } as const;

const escaparLike = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`);

@Injectable()
export class CasosService {
  constructor(
    @InjectRepository(Caso) private readonly casos: Repository<Caso>,
    @InjectDataSource() private readonly ds: DataSource,
    @Inject(CONFIGURACION) private readonly cfg: Configuracion,
    private readonly zonas: ZonasService,
    private readonly almacen: AlmacenamientoService,
    private readonly vistas: VistasCaso,
  ) {}

  /* ---------------- RF05: listado público ---------------- */

  /**
   * Solo casos APROBADOS (RF02): ningún filtro puede traer pendientes, en revisión ni rechazados.
   * Orden: urgencia crítica primero y, dentro de cada nivel, lo más reciente.
   */
  async listarPublicos(f: ListarCasosQuery) {
    const limite = f.limite ?? 100;
    const pagina = f.pagina ?? 1;

    const qb = this.casos
      .createQueryBuilder('c')
      .select('c.id', 'id')
      .addSelect("CASE c.nivel_urgencia WHEN 'critica' THEN 0 WHEN 'media' THEN 1 ELSE 2 END", 'orden_urgencia')
      .where('c.estado IN (:...estados)', { estados: ESTADOS_PUBLICOS_LISTADO });
    if (f.zona_id) qb.andWhere('c.zona_id = :zona', { zona: f.zona_id });
    if (f.nivel_urgencia) qb.andWhere('c.nivel_urgencia = :urg', { urg: f.nivel_urgencia });
    if (f.tipo_ayuda) qb.andWhere('c.tipo_ayuda = :ayuda', { ayuda: f.tipo_ayuda });
    if (f.q) qb.andWhere('(c.descripcion LIKE :q OR c.tipo_animal LIKE :q)', { q: `%${escaparLike(f.q)}%` });
    qb.orderBy('orden_urgencia', 'ASC').addOrderBy('c.fecha_publicacion', 'DESC').addOrderBy('c.id', 'DESC').limit(limite).offset((pagina - 1) * limite);

    const ids = (await qb.getRawMany<{ id: number }>()).map((r) => Number(r.id));
    if (!ids.length) return [];
    const casos = await this.casos.find({ where: { id: In(ids) }, relations: { zona: true, fotos: true, donacion: true } });
    const porId = new Map(casos.map((c) => [c.id, c]));
    return ids.map((id) => this.vistas.listado(porId.get(id)!));
  }

  async obtenerPublico(id: number) {
    const c = await this.casos.findOne({ where: { id }, relations: { zona: true, fotos: true, donacion: true } });
    if (!c || !ESTADOS_PUBLICOS_DETALLE.includes(c.estado)) throw new NotFoundException('Este caso no está disponible.');
    return this.vistas.publica(c);
  }

  /** Para el enlace compartible: devuelve el caso solo si es público. */
  async buscarPublico(id: number) {
    const c = await this.casos.findOne({ where: { id }, relations: { zona: true, fotos: true } });
    return c && ESTADOS_PUBLICOS_DETALLE.includes(c.estado) ? { caso: c, vista: this.vistas.listado(c) } : null;
  }

  /* ---------------- RF01: publicar sin cuenta ---------------- */

  async publicar(dto: CrearCasoDto, archivos: Express.Multer.File[] = []) {
    const errores: Record<string, string> = {};
    if (!(await this.zonas.existe(dto.zona_id))) errores.zona_id = 'Elegí una zona que exista.';
    if ((dto.latitud == null) !== (dto.longitud == null)) errores.latitud = 'La ubicación está incompleta.';
    if (archivos.length > this.cfg.maxFotos) errores.fotos = `Podés subir hasta ${this.cfg.maxFotos} fotos.`;

    // Validamos el contenido real de cada archivo antes de guardar nada.
    const tipos = archivos.map((a) => this.almacen.detectarTipo(a.buffer));
    if (tipos.some((t) => t === null)) errores.fotos = 'Las fotos tienen que ser imágenes JPG, PNG o WEBP.';
    if (Object.keys(errores).length) throw new ErrorDeNegocio(HttpStatus.BAD_REQUEST, 'Revisá los datos enviados.', errores);

    const guardadas: string[] = [];
    try {
      return await this.ds.transaction(async (m) => {
        let caso: Caso | null = null;
        for (let intento = 0; intento < 5 && !caso; intento++) {
          try {
            caso = await m.save(
              m.create(Caso, {
                codigo_seguimiento: generarCodigoSeguimiento(),
                tipo_animal: dto.tipo_animal,
                descripcion: dto.descripcion,
                nivel_urgencia: dto.nivel_urgencia,
                tipo_ayuda: dto.tipo_ayuda,
                estado: 'pendiente', // RF02: nace oculto hasta que un moderador lo apruebe
                contacto_publicante: dto.contacto_publicante,
                zona_id: dto.zona_id,
                latitud: dto.latitud ?? null,
                longitud: dto.longitud ?? null,
                moderador_id: null,
                motivo_rechazo: null,
                fecha_publicacion: new Date(),
                fecha_moderacion: null,
              }),
            );
          } catch (e) {
            if (!esDuplicado(e)) throw e; // choque (casi imposible) de código: reintenta con otro
          }
        }
        if (!caso) throw new Error('No se pudo generar un código de seguimiento único');

        for (let i = 0; i < archivos.length; i++) {
          const ruta = await this.almacen.guardar(archivos[i].buffer, tipos[i]!);
          guardadas.push(ruta);
          await m.save(m.create(CasoFoto, { caso_id: caso.id, url: ruta, orden: i + 1 }));
        }
        return { id: caso.id, codigo_seguimiento: caso.codigo_seguimiento };
      });
    } catch (e) {
      await Promise.all(guardadas.map((r) => this.almacen.borrar(r))); // no dejamos fotos huérfanas
      throw e;
    }
  }

  /* ---------------- Seguimiento del publicante ---------------- */

  /**
   * Con el código, quien publicó ve SOLO el estado (y el motivo si fue rechazado).
   * Nunca devuelve el contacto ni datos de moderación.
   */
  async seguimiento(codigoCrudo: string) {
    const codigo = codigoCrudo.trim().toUpperCase();
    const c = /^PAT-[A-Z0-9]{4,10}$/.test(codigo) ? await this.casos.findOne({ where: { codigo_seguimiento: codigo } }) : null;
    if (!c) throw new NotFoundException('No encontramos ningún caso con ese código. Revisalo e intentá de nuevo.');
    return {
      codigo_seguimiento: c.codigo_seguimiento,
      id: c.id,
      tipo_animal: c.tipo_animal,
      estado: c.estado,
      motivo_rechazo: c.estado === 'rechazado' ? c.motivo_rechazo : null,
      fecha_publicacion: c.fecha_publicacion,
      fecha_moderacion: c.fecha_moderacion,
    };
  }
}
