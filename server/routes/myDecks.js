import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Tus decks, el que usaste (o agregaste) más recientemente primero
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT d.id, d.name, d.icons,
            count(m.id)::int AS matches,
            max(m.played_at) AS last_played
       FROM user_decks ud
       JOIN decks d ON d.id = ud.deck_id
       LEFT JOIN matches m ON m.my_deck_id = d.id AND m.user_id = ud.user_id
      WHERE ud.user_id = $1
      GROUP BY d.id, ud.created_at
      ORDER BY greatest(max(m.played_at), ud.created_at) DESC`,
    [req.user.id]
  );
  res.json({ decks: rows });
});

// Agrega un deck a tu caja
router.post('/', async (req, res) => {
  const deckId = req.body?.deck_id;
  if (!Number.isInteger(deckId)) {
    return res.status(400).json({ error: 'deck_id inválido' });
  }

  // El deck debe existir y ser global o tuyo
  const { rows: visible } = await pool.query(
    'SELECT id FROM decks WHERE id = $1 AND (user_id IS NULL OR user_id = $2)',
    [deckId, req.user.id]
  );
  if (visible.length === 0) {
    return res.status(404).json({ error: 'Deck no encontrado' });
  }

  await pool.query(
    'INSERT INTO user_decks (user_id, deck_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.user.id, deckId]
  );
  res.status(201).json({ ok: true });
});

// Quita un deck de tu caja (solo si no tiene partidas)
router.delete('/:deckId', async (req, res) => {
  const deckId = Number(req.params.deckId);
  if (!Number.isInteger(deckId)) {
    return res.status(400).json({ error: 'Id inválido' });
  }

  const { rows } = await pool.query(
    'SELECT count(*)::int AS n FROM matches WHERE user_id = $1 AND my_deck_id = $2',
    [req.user.id, deckId]
  );
  if (rows[0].n > 0) {
    return res.status(409).json({ error: 'Este deck tiene partidas registradas: no se puede quitar' });
  }

  const { rowCount } = await pool.query(
    'DELETE FROM user_decks WHERE user_id = $1 AND deck_id = $2',
    [req.user.id, deckId]
  );
  if (rowCount === 0) {
    return res.status(404).json({ error: 'Ese deck no está en tu caja' });
  }
  res.status(204).end();
});

export default router;