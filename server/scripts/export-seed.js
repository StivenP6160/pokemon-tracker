import { writeFile } from 'node:fs/promises';
import pool from '../db.js';

// Los decks globales que vinieron de Limitless
const { rows } = await pool.query(
  `SELECT name, icons, limitless_id FROM decks
    WHERE user_id IS NULL AND limitless_id IS NOT NULL
    ORDER BY name`
);
await pool.end();

if (rows.length === 0) {
  console.log('❌ No hay decks de Limitless en la BD. Corre primero: npm run meta:sync');
  process.exit(1);
}

// Convierte un texto en texto SQL seguro: N's → 'N''s'
const sql = (text) => `'${text.replaceAll("'", "''")}'`;

// Convierte una lista en arreglo SQL: ['ogerpon','meganium'] → ARRAY['ogerpon', 'meganium']
const arr = (list) => (list.length ? `ARRAY[${list.map(sql).join(', ')}]` : `'{}'`);

const values = rows
  .map((d) => `  (${sql(d.name)}, ${arr(d.icons)}, ${sql(d.limitless_id)})`)
  .join(',\n');

const today = new Date().toISOString().slice(0, 10);

const content = `-- Archivo generado con: npm run seed:export (${today})
-- Decks iniciales tomados de Limitless. No lo edites a mano:
-- corre npm run meta:sync y luego npm run seed:export.

INSERT INTO decks (name, icons, limitless_id) VALUES
${values}
ON CONFLICT DO NOTHING;
`;

await writeFile(new URL('../db/seed.sql', import.meta.url), content);
console.log(`✅ seed.sql generado con ${rows.length} decks.`);