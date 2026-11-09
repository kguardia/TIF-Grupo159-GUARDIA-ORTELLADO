import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zona } from '../../entities';
import { errorCampo, esDuplicado } from '../../common/utils/errores';

@Injectable()
export class ZonasService {
  constructor(@InjectRepository(Zona) private readonly zonas: Repository<Zona>) {}

  listar(): Promise<Zona[]> {
    return this.zonas.find({ order: { nombre: 'ASC' } });
  }

  async existe(id: number): Promise<boolean> {
    return (await this.zonas.count({ where: { id } })) > 0;
  }

  /** RNF04: sumar una zona es insertar una fila, sin tocar el modelo. */
  async crear(nombre: string): Promise<Zona> {
    try {
      return await this.zonas.save(this.zonas.create({ nombre }));
    } catch (e) {
      if (esDuplicado(e)) throw errorCampo(HttpStatus.CONFLICT, 'nombre', 'Esa zona ya existe.');
      throw e;
    }
  }

  async renombrar(id: number, nombre: string): Promise<Zona> {
    const z = await this.zonas.findOne({ where: { id } });
    if (!z) throw new NotFoundException('No encontramos la zona.');
    z.nombre = nombre;
    try {
      return await this.zonas.save(z);
    } catch (e) {
      if (esDuplicado(e)) throw errorCampo(HttpStatus.CONFLICT, 'nombre', 'Esa zona ya existe.');
      throw e;
    }
  }
}
