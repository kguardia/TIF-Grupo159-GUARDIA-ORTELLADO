/** Carga el archivo .env si existe (desarrollo local). En Railway las variables ya vienen del entorno. */
try {
  (process as unknown as { loadEnvFile: (p?: string) => void }).loadEnvFile('.env');
} catch {
  /* sin .env: se usan las variables del entorno */
}
