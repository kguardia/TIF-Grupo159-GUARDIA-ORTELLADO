import { registerDecorator, ValidationOptions } from 'class-validator';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Teléfono (7+ dígitos), email o usuario de red (@algo). Mismo criterio que el frontend. */
export function esContactoValido(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  const t = v.trim();
  return t.replace(/\D/g, '').length >= 7 || EMAIL.test(t) || /^@[\w.]{3,}$/.test(t);
}

export function ContactoValido(opciones?: ValidationOptions) {
  return (objeto: object, propiedad: string) =>
    registerDecorator({
      name: 'contactoValido',
      target: objeto.constructor,
      propertyName: propiedad,
      options: opciones,
      // Si está vacío lo marca @IsNotEmpty con su propio mensaje ("Dejá un teléfono…"): no lo pisamos.
      validator: { validate: (v: unknown) => (typeof v === 'string' && v.trim() === '') || esContactoValido(v) },
    });
}
