import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICO = 'es_publico';
/** Marca una ruta como accesible sin sesión. Todo lo demás exige JWT por defecto. */
export const Publico = () => SetMetadata(ES_PUBLICO, true);
