import { Transform } from 'class-transformer';

/** Recorta espacios al principio y al final de los textos. */
export const Recortar = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

/** '' o null → null (campos opcionales que el formulario manda vacíos). */
export const VacioANulo = () => Transform(({ value }) => (value === '' || value === undefined ? null : typeof value === 'string' ? value.trim() || null : value));

/** '' / null → null; texto numérico → número. */
export const NumeroONulo = () =>
  Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return null;
    if (typeof value === 'string') return value.trim() === '' ? null : Number(value.replace(',', '.'));
    return value;
  });

/**
 * 'true' / '1' / true → true; 'false' / '0' / false → false.
 * Cualquier otro valor se deja tal cual para que la validación lo rechace
 * (un texto raro NO se interpreta como "false": podría desactivar algo sin querer).
 */
export const ABooleano = () =>
  Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : value;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (['true', '1', 'on', 'si', 'sí'].includes(v)) return true;
      if (['false', '0', 'off', 'no', ''].includes(v)) return false;
    }
    return value;
  });
