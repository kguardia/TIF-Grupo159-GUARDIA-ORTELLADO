import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { AccionModeracion, NivelUrgencia } from '../../common/enums';
import type { UsuarioSesion } from '../../common/decorators/usuario-actual.decorator';
import { ErrorDeNegocio, errorCampo } from '../../common/utils/errores';
import { Caso, HistorialModeracion } from '../../entities';
import { RELACIONES_COMPLETAS } from '../casos/casos.service';
import { VistasCaso } from '../casos/vistas-caso';
import { DonacionesService } from '../donaciones/donaciones.service';
import { GuardarDonacionDto } from '../donaciones/dto/donacion.dto';

/**
 * Panel de moderación (RF02, RF03, RF04, RF07). Todas las acciones devuelven el caso completo
 * actualizado (vista de moderación) para que el panel refresque sin volver a pedir la lista.
 */
@Injectable()
export class ModeracionService {
  constructor(
    @InjectRepository(Caso) private readonly casos: Repository<Caso>,
    @InjectDataSource() private readonly ds: DataSource,
    private readonly vistas: VistasCaso,
    private readonly donaciones: DonacionesService,
  ) {}

  async listar(estado?: string) {
    const lista = await this.casos.find({
      where: estado ? { estado: estado as Caso['estado'] } : {},
      relations: RELACIONES_COMPLETAS,
      order: { fecha_publicacion: 'DESC', id: 'DESC' },
      take: 1000,
    });
    return lista.map((c) => this.vistas.moderacion(c));
  }

  async obtener(id: number) {
    return this.vistas.moderacion(await this.cargar(id));
  }

  private async cargar(id: number): Promise<Caso> {
    const c = await this.casos.findOne({ where: { id }, relations: RELACIONES_COMPLETAS });
    if (!c) throw new NotFoundException('No encontramos el caso.');
    return c;
  }

  /**
   * RF03: aprobar, rechazar o marcar "en revisión". Deja constancia en historial_moderacion.
   * Corre en una transacción con el caso bloqueado: si dos moderadores actúan a la vez sobre el
   * mismo caso, el segundo espera y ve el estado ya actualizado (no se pisan ni duplican historial).
   */
  async cambiarEstado(id: number, accion: AccionModeracion, motivo: string | null | undefined, usuario: UsuarioSesion) {
    const motivoLimpio = motivo?.trim() || null;
    if (accion === 'rechazado' && !motivoLimpio) throw errorCampo(HttpStatus.BAD_REQUEST, 'motivo', 'Escribí el motivo del rechazo.');

    await this.ds.transaction(async (m) => {
      const caso = await m.findOne(Caso, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!caso) throw new NotFoundException('No encontramos el caso.');
      if (caso.estado === 'resuelto') throw new ErrorDeNegocio(HttpStatus.CONFLICT, 'Un caso resuelto ya no se puede modificar.');
      if (caso.estado === accion) throw new ErrorDeNegocio(HttpStatus.CONFLICT, `El caso ya está ${accion === 'en_revision' ? 'en revisión' : accion === 'aprobado' ? 'aprobado' : 'rechazado'}.`);

      const ahora = new Date();
      caso.estado = accion;
      caso.moderador_id = usuario.id;
      caso.fecha_moderacion = ahora;
      caso.motivo_rechazo = accion === 'rechazado' ? motivoLimpio : null;
      await m.save(caso);
      await m.save(m.create(HistorialModeracion, { caso_id: id, usuario_id: usuario.id, accion, motivo: motivoLimpio, fecha: ahora }));
    });
    return this.obtener(id);
  }

  /** RF04: marcar (o quitar) la urgencia crítica para priorizar la cola. */
  async cambiarUrgencia(id: number, nivel: NivelUrgencia) {
    const caso = await this.casos.findOne({ where: { id } });
    if (!caso) throw new NotFoundException('No encontramos el caso.');
    if (caso.estado === 'resuelto') throw new ErrorDeNegocio(HttpStatus.CONFLICT, 'Un caso resuelto ya no se puede modificar.');
    caso.nivel_urgencia = nivel;
    await this.casos.save(caso);
    return this.obtener(id);
  }

  /** Cierra un caso publicado cuyo animal ya fue ayudado. */
  async resolver(id: number, usuario: UsuarioSesion) {
    const caso = await this.casos.findOne({ where: { id } });
    if (!caso) throw new NotFoundException('No encontramos el caso.');
    if (caso.estado !== 'aprobado') throw new ErrorDeNegocio(HttpStatus.CONFLICT, 'Solo se pueden marcar como resueltos los casos publicados.');
    caso.estado = 'resuelto';
    caso.moderador_id = usuario.id;
    caso.fecha_moderacion = new Date();
    await this.casos.save(caso);
    return this.obtener(id);
  }

  /** RF07: alta/actualización manual de la donación del caso. */
  async guardarDonacion(id: number, dto: GuardarDonacionDto, usuario: UsuarioSesion) {
    await this.donaciones.guardar(id, dto, usuario.id);
    return this.obtener(id);
  }
}
