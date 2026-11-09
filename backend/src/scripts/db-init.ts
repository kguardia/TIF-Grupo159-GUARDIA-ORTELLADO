import { conectar, existeColumna, existeTabla, leerSql } from './ayudas-bd';

/**
 * Crea las tablas en la base configurada (local o Railway). Se puede correr las veces que haga falta:
 * solo aplica lo que todavía no está.
 *
 *   npm run db:init
 */
async function main() {
  const c = await conectar();
  try {
    if (await existeTabla(c, 'caso')) {
      console.log('· schema.sql: las tablas ya existen, no se toca nada.');
    } else {
      await c.query(await leerSql('schema.sql'));
      console.log('✔ schema.sql aplicado.');
    }
    if (await existeColumna(c, 'caso', 'codigo_seguimiento')) {
      console.log('· migracion_01: ya aplicada.');
    } else {
      await c.query(await leerSql('migracion_01_mapa_y_seguimiento.sql'));
      console.log('✔ migracion_01_mapa_y_seguimiento.sql aplicada.');
    }
  } finally {
    await c.end();
  }
}

main().catch((e) => {
  console.error('✘', e.message);
  process.exit(1);
});
