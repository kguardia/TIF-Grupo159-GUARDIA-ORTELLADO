import { Caso } from './caso.entity';
import { CasoFoto } from './caso-foto.entity';
import { DirectorioContacto } from './directorio-contacto.entity';
import { Donacion } from './donacion.entity';
import { HistorialModeracion } from './historial-moderacion.entity';
import { Usuario } from './usuario.entity';
import { Zona } from './zona.entity';

export { Caso, CasoFoto, DirectorioContacto, Donacion, HistorialModeracion, Usuario, Zona };
export const ENTIDADES = [Zona, Usuario, Caso, CasoFoto, HistorialModeracion, DirectorioContacto, Donacion];
