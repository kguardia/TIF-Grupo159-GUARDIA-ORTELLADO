import { conectar } from './ayudas-bd';

/** Los 48 barrios de CABA (el MVP cubre CABA). Se pueden sumar más zonas desde el panel (RNF04). */
export const BARRIOS_CABA = [
  'Agronomía', 'Almagro', 'Balvanera', 'Barracas', 'Belgrano', 'Boedo', 'Caballito', 'Chacarita', 'Coghlan', 'Colegiales',
  'Constitución', 'Flores', 'Floresta', 'La Boca', 'La Paternal', 'Liniers', 'Mataderos', 'Monte Castro', 'Montserrat',
  'Nueva Pompeya', 'Núñez', 'Palermo', 'Parque Avellaneda', 'Parque Chacabuco', 'Parque Chas', 'Parque Patricios', 'Puerto Madero',
  'Recoleta', 'Retiro', 'Saavedra', 'San Cristóbal', 'San Nicolás', 'San Telmo', 'Vélez Sarsfield', 'Versalles', 'Villa Crespo',
  'Villa del Parque', 'Villa Devoto', 'Villa General Mitre', 'Villa Lugano', 'Villa Luro', 'Villa Ortúzar', 'Villa Pueyrredón',
  'Villa Real', 'Villa Riachuelo', 'Villa Santa Rita', 'Villa Soldati', 'Villa Urquiza',
];

async function main() {
  const c = await conectar();
  try {
    const [r] = await c.query('INSERT IGNORE INTO zona (nombre) VALUES ?', [BARRIOS_CABA.map((n) => [n])]);
    console.log(`✔ Zonas: ${(r as { affectedRows: number }).affectedRows} nuevas (${BARRIOS_CABA.length} en total en el catálogo de CABA).`);
  } finally {
    await c.end();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error('✘', e.message);
    process.exit(1);
  });
}
