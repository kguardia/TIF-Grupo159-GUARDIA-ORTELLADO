/** Valores permitidos: coinciden exactamente con los ENUM de database/schema.sql. */
export const TIPOS_ANIMAL = ['Perro/a','Gato/a','Cachorros','Gatitos','Perra embarazada o con cría/s','Gata embarazada o con cría/s','Otro (fauna silvestre o exótica)'] as const;
export const NIVELES_URGENCIA = ['critica', 'media', 'baja'] as const;
export const TIPOS_AYUDA = ['veterinaria', 'traslado', 'alimento', 'otro'] as const;
export const ESTADOS_CASO = ['pendiente', 'en_revision', 'aprobado', 'rechazado', 'resuelto'] as const;
export const ACCIONES_MODERACION = ['aprobado', 'rechazado', 'en_revision'] as const;
export const TIPOS_CONTACTO = ['veterinaria', 'rescatista'] as const;
export const ROLES = ['moderador', 'administrador'] as const;

export type NivelUrgencia = (typeof NIVELES_URGENCIA)[number];
export type TipoAyuda = (typeof TIPOS_AYUDA)[number];
export type EstadoCaso = (typeof ESTADOS_CASO)[number];
export type AccionModeracion = (typeof ACCIONES_MODERACION)[number];
export type TipoContacto = (typeof TIPOS_CONTACTO)[number];
export type Rol = (typeof ROLES)[number];

/** Estados que cualquier persona puede ver. `resuelto` solo se ve en el detalle, no en el listado. */
export const ESTADOS_PUBLICOS_LISTADO: EstadoCaso[] = ['aprobado'];
export const ESTADOS_PUBLICOS_DETALLE: EstadoCaso[] = ['aprobado', 'resuelto'];
