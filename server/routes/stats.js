import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const COUNTS = `
  count(*)::int                                  AS total,
  count(*) FILTER (WHERE m.result = 'win')::int  AS wins,
  count(*) FILTER (WHERE m.result = 'loss')::int AS losses,
  count(*) FILTER (WHERE m.result = 'tie')::int  AS ties`;

const EMPTY = { total: 0, wins: 0, losses: 0, ties: 0 };

function withRates(row) {
  const pct = (n) => (row.total === 0 ? 0 : Math.round((n / row.total) * 1000) / 10);
  return { ...row, win_rate: pct(row.wins), loss_rate: pct(row.losses), tie_rate: pct(row.ties) };
}

// Busca el matchup del meta entre dos decks (por su id de Limitless)
async function getMetaMatchup(myDeckId, oppDeckId) {
  const { rows } = await pool.query(
    `SELECT mm.wins, mm.losses, mm.ties, mm.updated_at,
            a.limitless_id = b.limitless_id AS mirror
       FROM decks a
       JOIN decks b ON b.id = $2
       JOIN meta_matchups mm ON mm.deck_a = a.limitless_id AND mm.deck_b = b.limitless_id
      WHERE a.id = $1`,
    [myDeckId, oppDeckId]
  );
  if (rows.length === 0) return null; // algún deck no es de Limitless, o no hay datos

  const r = rows[0];
  // En un espejo cada partida se anotó dos veces en la misma fila: dividimos entre 2
  const div = r.mirror ? 2 : 1;
  const wins = r.wins / div;
  const losses = r.losses / div;
  const ties = r.ties / div;

  return {
    ...withRates({ total: wins + losses + ties, wins, losses, ties }),
    updated_at: r.updated_at,
  };
}

router.get('/', async (req, res) => {
  const params = [req.user.id];
  const filters = {};
  let where = 'm.user_id = $1';

  for (const field of ['my_deck_id', 'opp_deck_id']) {
    const value = req.query[field];
    if (value === undefined) continue;

    const id = Number(value);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: `${field} debe ser un número` });
    }
    filters[field] = id;
    params.push(id);
    where += ` AND m.${field} = $${params.length}`;
  }

  const overall = await pool.query(
    `SELECT ${COUNTS} FROM matches m WHERE ${where}`,
    params
  );

  const byTurn = await pool.query(
    `SELECT m.went_first, ${COUNTS} FROM matches m WHERE ${where} GROUP BY m.went_first`,
    params
  );

  const byMatchup = await pool.query(
    `SELECT m.my_deck_id, mine.name AS my_deck, mine.icons AS my_icons,
            m.opp_deck_id, opp.name AS opp_deck, opp.icons AS opp_icons, ${COUNTS}
       FROM matches m
       JOIN decks mine ON mine.id = m.my_deck_id
       JOIN decks opp  ON opp.id  = m.opp_deck_id
      WHERE ${where}
      GROUP BY m.my_deck_id, mine.name, mine.icons, m.opp_deck_id, opp.name, opp.icons
      ORDER BY total DESC`,
    params
  );

  // El dato del meta solo tiene sentido con un matchup concreto (los dos filtros)
  const meta =
    filters.my_deck_id && filters.opp_deck_id
      ? await getMetaMatchup(filters.my_deck_id, filters.opp_deck_id)
      : null;

  const first  = byTurn.rows.find((r) => r.went_first === true)  ?? EMPTY;
  const second = byTurn.rows.find((r) => r.went_first === false) ?? EMPTY;

  res.json({
    overall: withRates(overall.rows[0]),
    going_first: withRates(first),
    going_second: withRates(second),
    by_matchup: byMatchup.rows.map(withRates),
    meta,
  });
});

export default router;