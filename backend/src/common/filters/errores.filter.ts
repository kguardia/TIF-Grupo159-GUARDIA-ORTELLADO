import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { esDuplicado, esFkInexistente } from '../utils/errores';

/**
 * Todas las respuestas de error salen con la misma forma:
 *   { statusCode, message: string, errors?: { campo: mensaje } }
 * que es la que lee el frontend (js/api/http.js).
 */
@Catch()
export class ErroresFilter implements ExceptionFilter {
  private readonly log = new Logger('Errores');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const req = host.switchToHttp().getRequest();

    // Errores de multer (subida de fotos)
    const mensajeMulter = this.mensajeSubida(exception);
    if (mensajeMulter) return res.status(mensajeMulter.estado).json({ statusCode: mensajeMulter.estado, message: mensajeMulter.mensaje, errors: { fotos: mensajeMulter.mensaje } });

    if (exception instanceof HttpException) {
      const estado = exception.getStatus();
      const cuerpo = exception.getResponse();
      if (typeof cuerpo === 'string') return res.status(estado).json({ statusCode: estado, message: cuerpo });
      const c = cuerpo as { message?: string | string[]; errors?: Record<string, string> };
      const message = Array.isArray(c.message) ? c.message.join('. ') : (c.message ?? exception.message);
      return res.status(estado).json({ statusCode: estado, message: this.traducir(estado, message), ...(c.errors ? { errors: c.errors } : {}) });
    }

    if (esDuplicado(exception)) return res.status(409).json({ statusCode: 409, message: 'Ya existe un registro con esos datos.' });
    if (esFkInexistente(exception)) return res.status(400).json({ statusCode: 400, message: 'Alguno de los datos hace referencia a algo que no existe.' });

    this.log.error(`${req.method} ${req.url}`, exception instanceof Error ? exception.stack : String(exception));
    return res.status(500).json({ statusCode: 500, message: 'Algo falló de nuestro lado. Probá de nuevo en unos minutos.' });
  }

  /** Mensajes por defecto de Nest (en inglés) → español. */
  private traducir(estado: number, mensaje: string): string {
    const m: Record<string, string> = {
      'Not Found': 'No encontramos lo que buscabas.',
      'Forbidden resource': 'No tenés permiso para hacer esto.',
      Unauthorized: 'Tu sesión venció. Ingresá de nuevo.',
      'Bad Request': 'Revisá los datos enviados.',
      'Payload Too Large': 'El archivo es demasiado grande.',
    };
    if (/^Cannot (GET|POST|PUT|PATCH|DELETE)/.test(mensaje)) return 'No encontramos lo que buscabas.';
    if (/ThrottlerException|Too Many Requests/i.test(mensaje)) return 'Hiciste demasiados intentos. Esperá un momento y probá otra vez.';
    return m[mensaje] ?? (estado === HttpStatus.TOO_MANY_REQUESTS ? 'Hiciste demasiados intentos. Esperá un momento y probá otra vez.' : mensaje);
  }

  private mensajeSubida(e: unknown): { estado: number; mensaje: string } | null {
    const err = e as { name?: string; code?: string; message?: string; getResponse?: () => unknown };
    const texto = `${err?.code ?? ''} ${err?.message ?? ''}`;
    if (/LIMIT_FILE_SIZE|File too large/i.test(texto)) return { estado: 413, mensaje: 'Una de las fotos pesa más de 5 MB. Elegí una más liviana.' };
    if (/LIMIT_UNEXPECTED_FILE|LIMIT_FILE_COUNT|Unexpected field|Too many files/i.test(texto)) return { estado: 400, mensaje: 'Podés subir hasta 3 fotos.' };
    return null;
  }
}
