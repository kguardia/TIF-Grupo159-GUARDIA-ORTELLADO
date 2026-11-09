import { NotFoundException, PipeTransform } from '@nestjs/common';

/** Convierte :id a número. Si no es un entero positivo, responde 404 (no existe ese recurso). */
export class IdPipe implements PipeTransform<string, number> {
  transform(valor: string): number {
    const n = Number(valor);
    if (!Number.isInteger(n) || n <= 0) throw new NotFoundException('No encontramos lo que buscabas.');
    return n;
  }
}
