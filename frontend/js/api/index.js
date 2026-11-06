/**
 * Punto único de acceso a datos. Las pantallas importan `api` de acá
 * y no saben si detrás hay un backend real o datos de prueba.
 */
import { CONFIG } from "../config.js";
import { apiHttp } from "./http.js";
import { apiMock } from "./mock.js";

export { ErrorApi } from "./http.js";
export const api = CONFIG.USE_MOCK ? apiMock : apiHttp;
