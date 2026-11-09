import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { CONFIGURACION, Configuracion } from '../../config/configuracion';

export type ExtensionFoto = 'jpg' | 'png' | 'webp';

/**
 * Guarda las fotos en disco (UPLOADS_DIR). En Railway el disco del contenedor se borra en
 * cada deploy: hay que montar un Volume y apuntar UPLOADS_DIR ahí, o cambiar esta clase por
 * una que suba a S3/Cloudinary. Es el único lugar que sabe dónde viven las fotos.
 */
@Injectable()
export class AlmacenamientoService {
  private readonly log = new Logger('Almacenamiento');
  readonly raiz: string;

  constructor(@Inject(CONFIGURACION) private readonly cfg: Configuracion) {
    this.raiz = resolve(cfg.carpetaFotos);
  }

  /**
   * Identifica la imagen por sus primeros bytes ("firma"), no por el nombre ni por el
   * Content-Type que declara el cliente, que se pueden falsear.
   */
  detectarTipo(b: Buffer): ExtensionFoto | null {
    if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
    if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
    if (b.length >= 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
    return null;
  }

  /** Devuelve la ruta relativa que se guarda en caso_foto.url. */
  async guardar(buffer: Buffer, ext: ExtensionFoto): Promise<string> {
    const carpeta = join(this.raiz, 'casos');
    await fs.mkdir(carpeta, { recursive: true });
    const nombre = `${randomBytes(16).toString('hex')}.${ext}`; // nombre aleatorio: nunca el del cliente
    await fs.writeFile(join(carpeta, nombre), buffer, { flag: 'wx' });
    return `/uploads/casos/${nombre}`;
  }

  async borrar(rutaRelativa: string): Promise<void> {
    const nombre = rutaRelativa.split('/').pop() ?? '';
    if (!/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(nombre)) return; // solo borramos lo que generamos nosotros
    try {
      await fs.unlink(join(this.raiz, 'casos', nombre));
    } catch (e) {
      this.log.warn(`No se pudo borrar ${nombre}: ${(e as Error).message}`);
    }
  }

  urlAbsoluta(rutaRelativa: string): string {
    return /^https?:\/\//.test(rutaRelativa) ? rutaRelativa : `${this.cfg.urlPublica}${rutaRelativa}`;
  }
}
