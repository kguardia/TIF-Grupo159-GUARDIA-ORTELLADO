/**
 * Configuración central del frontend.
 * Es el único archivo que hay que tocar para conectar con el backend real.
 */
export const CONFIG = {
  /**
   * true  → usa datos de prueba guardados en el navegador (no hace falta backend).
   * false → habla con la API de NestJS en API_URL.
   */
  USE_MOCK: false,

  /** URL base del backend (en Railway, algo como https://sos-patitas.up.railway.app). */
  API_URL: ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:3000"
  : "https://tif-grupo159-guardia-ortellado-production.up.railway.app",

  /**
   * Mapa y ubicación exacta. El esquema de base de datos aprobado todavía no tiene
   * latitud/longitud en `caso`. Si el equipo decide no agregarlas, poné esto en false:
   * se oculta el mapa y el botón "usar mi ubicación", y todo sigue funcionando por zona.
   */
  USAR_COORDENADAS: true,

  /** Centro inicial del mapa (CABA). */
  MAPA_CENTRO: [-34.6037, -58.4116],
  MAPA_ZOOM: 12,

  /** Fotos por caso y tamaño máximo (el servidor debería validar lo mismo). */
  MAX_FOTOS: 3,
  MAX_FOTO_MB: 5,
};
