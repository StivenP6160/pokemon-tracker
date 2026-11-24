import pool from '../db.js';

const API = 'https://play.limitlesstcg.com/api';
const FORMAT = process.env.LIMITLESS_FORMAT ?? 'STANDARD';
const TOURNAMENTS = 15; // cuántos torneos usar
const FETCH_LIMIT = 40; // cuántos pedir, para poder filtrar los pequeños
const MIN_PLAYERS = 32; // ignorar torneos con menos jugadores
const TOP_DECKS = 30;   // cuántos decks guardar en la tabla decks

async function getJson(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`Limitless respondió ${res.status} en ${path}`);
  return res.json();
}

const pause = () => new Promise((resolve) => setTimeout(resolve, 500)); // para no saturar a Limitless

// 1. Torneos recientes del formato, con suficientes jugadores
const recent = await getJson(`/tournaments?game=PTCG&format=${FORMAT}&limit=${FETCH_LIMIT}`);

if (recent.length === 0) {
  const sample = await getJson('/tournaments?game=PTCG&limit=20');
  const formats = [...new Set(sample.map((t) => t.format))];
  console.log(`❌ No hay torneos con format=${FORMAT}. Formatos que sí existen:`, formats);
  process.exit(1);
}

const tournaments = recent.filter((t) => t.players >= MIN_PLAYERS).slice(0, TOURNAMENTS);
console.log(`Usando ${tournaments.length} torneos de ${MIN_PLAYERS} o más jugadores...`);

// 2. Recorrer cada torneo
const deckCounts = new Map(); // id del deck → { id, name, icons, players }
const matchups = new Map();   // "deckA|deckB" → { wins, losses, ties }
let matchesCounted = 0;

function addResult(a, b, field) {
  const key = `${a}|${b}`;
  const entry = matchups.get(key) ?? { wins: 0, losses: 0, ties: 0 };
  entry[field] += 1;
  matchups.set(key, entry);
}

for (const t of tournaments) {
  const standings = await getJson(`/tournaments/${t.id}/standings`);
  await pause();
  const pairings = await getJson(`/tournaments/${t.id}/pairings`);
  await pause();

  // 2a. El deck de cada jugador, y cuántas veces se usó cada deck
  const deckOf = new Map(); // usuario → id del deck
  for (const player of standings) {
    const deck = player.deck;
    if (!deck?.id) continue;

    deckOf.set(player.player, deck.id);

    const entry = deckCounts.get(deck.id) ?? { ...deck, players: 0 };
    entry.players += 1;
    deckCounts.set(deck.id, entry);
  }

  // 2b. El resultado de cada partida, deck contra deck
  for (const p of pairings) {
    if (!p.player2) continue; // bye: no hubo rival

    const a = deckOf.get(p.player1);
    const b = deckOf.get(p.player2);
    if (!a || !b) continue; // algún jugador sin deck conocido

    if (p.winner === p.player1) {
      addResult(a, b, 'wins');
      addResult(b, a, 'losses');
    } else if (p.winner === p.player2) {
      addResult(b, a, 'wins');
      addResult(a, b, 'losses');
    } else if (p.winner === 0) {
      addResult(a, b, 'ties');
      addResult(b, a, 'ties');
    } else {
      continue; // -1: sin ganador
    }
    matchesCounted++;
  }
}

// 3. Guardar los decks más usados (igual que antes)
const top = [...deckCounts.values()]
  .sort((a, b) => b.players - a.players)
  .slice(0, TOP_DECKS);

let created = 0;
let updated = 0;

for (const deck of top) {
  const icons = deck.icons ?? [];

  try {
    const byId = await pool.query(
      'UPDATE decks SET name = $2, icons = $3 WHERE limitless_id = $1',
      [deck.id, deck.name, icons]
    );
    if (byId.rowCount > 0) { updated++; continue; }

    const byName = await pool.query(
      `UPDATE decks SET limitless_id = $1, icons = $3
        WHERE user_id IS NULL AND limitless_id IS NULL AND lower(name) = lower($2)`,
      [deck.id, deck.name, icons]
    );
    if (byName.rowCount > 0) { updated++; continue; }

    await pool.query(
      'INSERT INTO decks (name, icons, limitless_id) VALUES ($1, $2, $3)',
      [deck.name, icons, deck.id]
    );
    created++;
  } catch (err) {
    console.log(`⚠️  ${deck.name}: ${err.message}`);
  }
}

console.log(`✅ Decks: ${created} nuevos, ${updated} actualizados.`);

// 4. Guardar los matchups (reemplaza los anteriores, todo o nada)
const rows = [...matchups.entries()].map(([key, r]) => {
  const [deckA, deckB] = key.split('|');
  return { deckA, deckB, ...r };
});

const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('DELETE FROM meta_matchups');
  await client.query(
    `INSERT INTO meta_matchups (deck_a, deck_b, wins, losses, ties)
     SELECT * FROM unnest($1::text[], $2::text[], $3::int[], $4::int[], $5::int[])`,
    [
      rows.map((r) => r.deckA),
      rows.map((r) => r.deckB),
      rows.map((r) => r.wins),
      rows.map((r) => r.losses),
      rows.map((r) => r.ties),
    ]
  );
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}

console.log(`⚔️  ${matchesCounted} partidas contadas, ${rows.length} matchups guardados.`);
await pool.end();