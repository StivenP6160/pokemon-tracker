import { readFile } from 'node:fs/promises';
import pool from '../db.js';

const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
const seed   = await readFile(new URL('../db/seed.sql', import.meta.url), 'utf8');

await pool.query(schema); // crea las tablas
await pool.query(seed);   // carga los 20 decks

const { rows } = await pool.query('SELECT count(*) FROM decks WHERE user_id IS NULL');
console.log(`✅ Tablas listas. Decks globales: ${rows[0].count}`);

await pool.end(); // cierra las conexiones para que el programa termine