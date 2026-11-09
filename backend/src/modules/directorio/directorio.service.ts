import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectorioContacto } from '../../entities';
import { errorCampo } from '../../common/utils/errores';
import { ZonasService } from '../zonas/zonas.service';
import { ContactoDto, ListarDirectorioQuery } from './dto/directorio.dto';

const aVista = (d: DirectorioContacto) => ({
  id: d.id,
  tipo: d.tipo,
  nombre: d.nombre,
  telefono: d.telefono,
  zona_id: d.zona_id,
  zona: d.zona ? { id: d.zona.id, nombre: d.zona.nombre } : undefined,
  atencion_24hs: d.atencion_24hs,
  especialidad: d.especialidad,
});

@Injectable()
export class DirectorioService {
  constructor(
    @InjectRepository(DirectorioContacto) private readonly contactos: Repository<DirectorioContacto>,
    private readonly zonas: ZonasService,
  ) {}

  /** RF06: filtrable por zona (y por tipo / 24 hs). Las guardias de 24 hs van primero. */
  async listar(f: ListarDirectorioQuery) {
    const qb = this.contactos.createQueryBuilder('d').leftJoinAndSelect('d.zona', 'z');
    if (f.tipo) qb.andWhere('d.tipo = :tipo', { tipo: f.tipo });
    if (f.zona_id) qb.andWhere('d.zona_id = :zona', { zona: f.zona_id });
    if (f.atencion_24hs) qb.andWhere('d.atencion_24hs = 1');
    qb.orderBy('d.atencion_24hs', 'DESC').addOrderBy('d.nombre', 'ASC');
    return (await qb.getMany()).map(aVista);
  }

  private async exigirZona(id: number) {
    if (!(await this.zonas.existe(id))) throw errorCampo(HttpStatus.BAD_REQUEST, 'zona_id', 'Elegí una zona que exista.');
  }

  async crear(dto: ContactoDto) {
    await this.exigirZona(dto.zona_id);
    const d = await this.contactos.save(this.contactos.create({ ...dto, especialidad: dto.especialidad ?? null }));
    return aVista(await this.contactos.findOneOrFail({ where: { id: d.id }, relations: { zona: true } }));
  }

  async actualizar(id: number, dto: ContactoDto) {
    const d = await this.contactos.findOne({ where: { id } });
    if (!d) throw new NotFoundException('No encontramos el contacto.');
    await this.exigirZona(dto.zona_id);
    await this.contactos.save(Object.assign(d, { ...dto, especialidad: dto.especialidad ?? null }));
    return aVista(await this.contactos.findOneOrFail({ where: { id }, relations: { zona: true } }));
  }

  async eliminar(id: number) {
    const r = await this.contactos.delete({ id });
    if (!r.affected) throw new NotFoundException('No encontramos el contacto.');
  }
}
