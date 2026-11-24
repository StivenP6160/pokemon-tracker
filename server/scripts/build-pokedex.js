import { mkdir, writeFile, readdir } from 'node:fs/promises';
import pool from '../db.js';

const SPRITES_DIR = new URL('../../client/public/pokemon/', import.meta.url);
const DATA_DIR = new URL('../../client/src/data/', import.meta.url);
const SPRITE_URL = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

// Formas especiales que sí queremos: megas y regionales
const FORM_RE = /-(mega(-[xy])?|alola|galar|hisui|paldea)$/;

await mkdir(SPRITES_DIR, { recursive: true });
await mkdir(DATA_DIR, { recursive: true });

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PokeAPI respondió ${res.status} en ${url}`);
  return res.json();
}

// El id viene al final de la URL: .../pokemon-species/887/ → 887
const idFromUrl = (url) => Number(url.split('/').filter(Boolean).at(-1));

// 1. Todas las especies (nombre simple: "dragapult", "dudunsparce")
const species = await getJson('https://pokeapi.co/api/v2/pokemon-species?limit=2000');

// 2. Las formas especiales (megas y regionales)
const pokemon = await getJson('https://pokeapi.co/api/v2/pokemon?limit=2000');

const entries = [
  ...species.results.map((s) => ({ name: s.name, id: idFromUrl(s.url) })),
  ...pokemon.results
    .map((p) => ({ name: p.name, id: idFromUrl(p.url) }))
    .filter((p) => p.id > 10000 && FORM_RE.test(p.name)),
];

console.log(`Encontré ${entries.length} Pokémon. Descargando los sprites que faltan...`);

// 3. Descargar los sprites que no tenemos
const existing = new Set(await readdir(SPRITES_DIR));
const list = [];
let downloaded = 0;
let missing = 0;

for (const [i, p] of entries.entries()) {
  const file = `${p.name}.png`;

  if (!existing.has(file)) {
    const res = await fetch(SPRITE_URL(p.id));
    if (!res.ok) {
      missing++;
      continue; // PokeAPI no tiene imagen de este: lo dejamos fuera de la lista
    }
    await writeFile(new URL(file, SPRITES_DIR), Buffer.from(await res.arrayBuffer()));
    downloaded++;
  }

  list.push(p.name);
  if ((i + 1) % 100 === 0) console.log(`  ... ${i + 1}/${entries.length}`);
}

// 4. Guardar la lista para el buscador
list.sort();
await writeFile(new URL('pokemon.json', DATA_DIR), JSON.stringify(list));
console.log(`✅ ${list.length} Pokémon en la lista (${downloaded} imágenes nuevas, ${missing} sin imagen).`);

// 5. ¿Algún ícono de los decks quedó sin imagen?
const { rows } = await pool.query('SELECT DISTINCT unnest(icons) AS slug FROM decks');
await pool.end();

const available = new Set([...list.map((n) => `${n}.png`), ...existing]);
const noSprite = rows.map((r) => r.slug).filter((s) => !available.has(`${s}.png`));
if (noSprite.length > 0) console.log('⚠️  Íconos de decks sin imagen:', noSprite.join(', '));