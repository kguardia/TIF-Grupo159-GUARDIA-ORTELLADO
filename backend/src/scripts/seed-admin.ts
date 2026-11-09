import * as bcrypt from 'bcryptjs';
import { COSTE_BCRYPT } from '../modules/usuarios/usuarios.service';
import { conectar } from './ayudas-bd';

/**
 * Crea el primer administrador. La API no permite crear administradores (RF09 solo da de alta
 * moderadores), así que el primero se siembra acá con ADMIN_EMAIL / ADMIN_PASSWORD.
 *
 *   npm run seed:admin
 * Si el usuario ya existe no hace nada (para cambiar la clave: `npm run seed:admin -- --reset`).
 */
async function main() {
  const nombre = process.env.ADMIN_NOMBRE || 'Administración';
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const clave = process.env.ADMIN_PASSWORD || '';
  if (!email || clave.length < 12 || /cambiar/i.test(clave)) {
    throw new Error('Definí ADMIN_EMAIL y una ADMIN_PASSWORD propia de al menos 12 caracteres (ver .env.example).');
  }
  const reset = process.argv.includes('--reset');

  const c = await conectar();
  try {
    const hash = await bcrypt.hash(clave, COSTE_BCRYPT);
    const [filas] = await c.query('SELECT id FROM usuario WHERE email = ?', [email]);
    if ((filas as unknown[]).length) {
      if (!reset) return console.log(`· ${email} ya existe. Usá --reset para cambiarle la contraseña.`);
      await c.query("UPDATE usuario SET password_hash = ?, rol = 'administrador', activo = 1 WHERE email = ?", [hash, email]);
      return console.log(`✔ Contraseña de ${email} actualizada.`);
    }
    await c.query("INSERT INTO usuario (nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, 'administrador', 1)", [nombre, email, hash]);
    console.log(`✔ Administrador creado: ${email}`);
  } finally {
    await c.end();
  }
}

main().catch((e) => {
  console.error('✘', e.message);
  process.exit(1);
});
