import { randomInt } from 'crypto';

/** Sin caracteres confusos (0/O, 1/I/L): el código se dicta o se copia a mano. */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Código de seguimiento, ej. PAT-7K3M9Q. 31^6 ≈ 887 millones de combinaciones,
 * generado con aleatoriedad criptográfica: no se puede adivinar ni recorrer.
 */
export function generarCodigoSeguimiento(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALFABETO[randomInt(ALFABETO.length)];
  return `PAT-${s}`;
}
