import './../config/cargar-env';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { createConnection, Connection } from 'mysql2/promise';

/** Conexión de los scripts: misma lógica de variables que la API (DATABASE_URL o DB_*). */
export async function conectar(): Promise<Connection> {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const ssl = ['1', 'true'].includes((process.env.DB_SSL ?? '').toLowerCase()) ? { rejectUnauthorized: false } : undefined;
  if (url) return createConnection({ uri: url, multipleStatements: true, charset: 'utf8mb4', ssl });
  return createConnection({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD ?? process.env.MYSQLPASSWORD ?? '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'sos_patitas',
    multipleStatements: true,
    charset: 'utf8mb4',
    ssl,
  });
}

/** Carpeta con schema.sql y las migraciones (por defecto ../database, junto a /backend en el repo). */
export const carpetaSql = () => resolve(process.env.DB_SQL_DIR || resolve(__dirname, '../../../database'));

/**
 * schema.sql trae `CREATE DATABASE` y `USE sos_patitas`. En Railway la base se llama distinto
 * (ej. "railway"), así que se las quitamos y el script trabaja sobre la base a la que ya está conectado.
 */
export async function leerSql(archivo: string): Promise<string> {
  const texto = await fs.readFile(resolve(carpetaSql(), archivo), 'utf8');
  return texto.replace(/CREATE\s+DATABASE[\s\S]*?;/gi, '').replace(/^\s*USE\s+[`\w]+\s*;/gim, '');
}

export async function existeTabla(c: Connection, tabla: string): Promise<boolean> {
  const [filas] = await c.query('SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?', [tabla]);
  return (filas as unknown[]).length > 0;
}

export async function existeColumna(c: Connection, tabla: string, columna: string): Promise<boolean> {
  const [filas] = await c.query('SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?', [tabla, columna]);
  return (filas as unknown[]).length > 0;
}
