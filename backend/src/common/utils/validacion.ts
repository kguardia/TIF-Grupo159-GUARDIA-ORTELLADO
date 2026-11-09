import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

/** Convierte los errores de class-validator en { campo: "mensaje" } (primer error de cada campo). */
function aplanar(errores: ValidationError[], prefijo = ''): Record<string, string> {
  const salida: Record<string, string> = {};
  for (const e of errores) {
    const campo = prefijo ? `${prefijo}.${e.property}` : e.property;
    if (e.constraints) salida[campo] = Object.values(e.constraints)[0];
    if (e.children?.length) Object.assign(salida, aplanar(e.children, campo));
  }
  return salida;
}

export const crearPipeDeValidacion = () =>
  new ValidationPipe({
    whitelist: true, // descarta campos que el DTO no declara (evita asignación masiva)
    transform: true,
    stopAtFirstError: true,
    exceptionFactory: (errores) => {
      const detalle = aplanar(errores);
      return new BadRequestException({ statusCode: 400, message: 'Revisá los datos enviados.', errors: detalle });
    },
  });
