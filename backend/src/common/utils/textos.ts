export const textoUrgencia = (n: string) => ({ critica: 'crítica', media: 'media', baja: 'baja' })[n] ?? n;
export const textoAyuda = (t: string) => ({ veterinaria: 'Atención veterinaria', traslado: 'Traslado', alimento: 'Alimento', otro: 'Otra ayuda' })[t] ?? t;
