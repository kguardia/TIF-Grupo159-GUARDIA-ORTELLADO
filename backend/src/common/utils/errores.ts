import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Error con un mensaje general y, opcionalmente, el detalle por campo.
 * El frontend usa `errors` para marcar el campo exacto del formulario.
 */
export class ErrorDeNegocio extends HttpException {
  constructor(estado: HttpStatus, mensaje: string, errores?: Record<string, string>) {
    super({ statusCode: estado, message: mensaje, ...(errores ? { errors: errores } : {}) }, estado);
  }
}

export const errorCampo = (estado: HttpStatus, campo: string, mensaje: string) => new ErrorDeNegocio(estado, mensaje, { [campo]: mensaje });

/** ¿Es un error de clave duplicada de MySQL/MariaDB? */
export function esDuplicado(e: unknown): boolean {
  const err = e as { code?: string; driverError?: { code?: string } };
  return err?.code === 'ER_DUP_ENTRY' || err?.driverError?.code === 'ER_DUP_ENTRY';
}

export function esFkInexistente(e: unknown): boolean {
  const err = e as { code?: string; driverError?: { code?: string } };
  return err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.driverError?.code === 'ER_NO_REFERENCED_ROW_2';
}
