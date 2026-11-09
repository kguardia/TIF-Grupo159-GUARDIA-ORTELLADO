import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caso, Donacion } from '../../entities';
import { ErrorDeNegocio } from '../../common/utils/errores';
import { GuardarDonacionDto } from './dto/donacion.dto';

/**
 * RF07: monto objetivo / recaudado por caso, cargado a mano por el equipo.
 * No hay pasarela de pago: las personas transfieren al alias y un moderador actualiza el monto.
 */
@Injectable()
export class DonacionesService {
  constructor(
    @InjectRepository(Donacion) private readonly donaciones: Repository<Donacion>,
    @InjectRepository(Caso) private readonly casos: Repository<Caso>,
  ) {}

  /** Crea o actualiza el único registro de donación del caso (UNIQUE caso_id). */
  async guardar(casoId: number, dto: GuardarDonacionDto, usuarioId: number): Promise<Donacion> {
    const caso = await this.casos.findOne({ where: { id: casoId } });
    if (!caso) throw new NotFoundException('No encontramos el caso.');
    if (!['aprobado', 'resuelto'].includes(caso.estado)) {
      throw new ErrorDeNegocio(HttpStatus.CONFLICT, 'La donación se registra cuando el caso ya está publicado.');
    }
    const existente = await this.donaciones.findOne({ where: { caso_id: casoId } });
    const d = existente ?? this.donaciones.create({ caso_id: casoId });
    d.alias_donacion = dto.alias_donacion;
    d.monto_objetivo = dto.monto_objetivo ?? null;
    d.monto_recaudado = dto.monto_recaudado;
    d.actualizado_por = usuarioId;
    d.fecha_actualizacion = new Date();
    return this.donaciones.save(d);
  }
}
