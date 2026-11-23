import { mkdir, writeFile } from 'node:fs/promises';
import pool from '../db.js';

// Las imágenes van a la carpeta pública del frontend
const OUT_DIR = new URL('../../client/public/pokemon/', import.meta.url);
await mkdir(OUT_DIR, { recursive: true });

// Nombres de Limitless que en PokeAPI se escriben distinto
const ALIASES = {
  dudunsparce: 'dudunsparce-two-segment',
  toxtricity: 'toxtricity-amped',
};

function candidates(slug) {
  const list = [ALIASES[slug] ?? slug];
  if (slug.startsWith('mega-')) list.push(`${slug.slice(5)}-mega`); // mega-lucario → lucario-mega
  return list;
}

// Todos los Pokémon usados en los decks, sin repetir
const { rows } = await pool.query('SELECT DISTINCT unnest(icons) AS slug FROM decks ORDER BY slug');
await pool.end();

for (const { slug } of rows) {
  let saved = false;

  for (const name of candidates(slug)) {
    const info = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!info.ok) continue;

    const { sprites } = await info.json();
    if (!sprites.front_default) continue;

    const img = await fetch(sprites.front_default);
    if (!img.ok) continue;

    // Se guarda con el nombre de Limitless, que es el que está en la BD
    await writeFile(new URL(`${slug}.png`, OUT_DIR), Buffer.from(await img.arrayBuffer()));
    console.log(`✅ ${slug}${name !== slug ? ` (como ${name})` : ''}`);
    saved = true;
    break;
  }

  if (!saved) console.log(`❌ ${slug}: no lo encontré en PokeAPI. Agrégalo a ALIASES.`);
}