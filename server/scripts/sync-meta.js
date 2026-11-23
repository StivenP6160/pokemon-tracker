import pool from '../db.js';

const API = 'https://play.limitlesstcg.com/api';
const FORMAT = process.env.LIMITLESS_FORMAT ?? 'STANDARD';
const TOURNAMENTS = 15; // cuántos torneos recientes revisar
const TOP_DECKS = 30;   // cuántos decks guardar

async function getJson(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`Limitless respondió ${res.status} en ${path}`);
  return res.json();
}

// 1. Torneos recientes del formato
const tournaments = await getJson(`/tournaments?game=PTCG&format=${FORMAT}&limit=${TOURNAMENTS}`);

if (tournaments.length === 0) {
  const sample = await getJson('/tournaments?game=PTCG&limit=20');
  const formats = [...new Set(sample.map((t) => t.format))];
  console.log(`❌ No hay torneos con format=${FORMAT}. Formatos que sí existen:`, formats);
  process.exit(1);
}

// 2. Contar cuántos jugadores usaron cada deck
const counts = new Map();

for (const t of tournaments) {
  const standings = await getJson(`/tournaments/${t.id}/standings`);

  for (const player of standings) {
    const deck = player.deck;
    if (!deck?.id) continue;

    const entry = counts.get(deck.id) ?? { ...deck, players: 0 };
    entry.players += 1;
    counts.set(deck.id, entry);
  }

  await new Promise((resolve) => setTimeout(resolve, 500)); // pausa para no saturar a Limitless
}

// 3. Los más usados primero
const top = [...counts.values()]
  .sort((a, b) => b.players - a.players)
  .slice(0, TOP_DECKS);

// 4. Guardar en la BD
let created = 0;
let updated = 0;

for (const deck of top) {
  const icons = deck.icons ?? [];

  try {
    // a) Ya se había sincronizado → actualizar nombre e íconos
    const byId = await pool.query(
      'UPDATE decks SET name = $2, icons = $3 WHERE limitless_id = $1',
      [deck.id, deck.name, icons]
    );
    if (byId.rowCount > 0) { updated++; continue; }

    // b) Es uno de los decks iniciales (mismo nombre) → vincularlo
    const byName = await pool.query(
      `UPDATE decks SET limitless_id = $1, icons = $3
        WHERE user_id IS NULL AND limitless_id IS NULL AND lower(name) = lower($2)`,
      [deck.id, deck.name, icons]
    );
    if (byName.rowCount > 0) { updated++; continue; }

    // c) Es nuevo → crearlo como deck global
    await pool.query(
      'INSERT INTO decks (name, icons, limitless_id) VALUES ($1, $2, $3)',
      [deck.name, icons, deck.id]
    );
    created++;
  } catch (err) {
    console.log(`⚠️  ${deck.name}: ${err.message}`);
  }
}

console.log(`✅ ${tournaments.length} torneos revisados. Decks: ${created} nuevos, ${updated} actualizados.`);
await pool.end();