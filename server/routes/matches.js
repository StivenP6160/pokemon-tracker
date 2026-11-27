import { Router } from 'express';
import pool from '../db.js';

const router = Router();
const RESULTS = ['win', 'loss', 'tie'];

// Historial del usuario
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT m.id,
            m.my_deck_id, mine.name AS my_deck, mine.icons AS my_icons,
            m.opp_deck_id, opp.name AS opp_deck, opp.icons AS opp_icons,
            m.went_first, m.result, m.notes, m.played_at
       FROM matches m
       JOIN decks mine ON mine.id = m.my_deck_id
       JOIN decks opp  ON opp.id  = m.opp_deck_id
      WHERE m.user_id = $1
      ORDER BY m.played_at DESC`,
    [req.user.id]
  );
  res.json({ matches: rows });
});

// Registrar una partida
router.post('/', async (req, res) => {
  const { my_deck_id, opp_deck_id, went_first, result, notes = '' } = req.body ?? {};

  if (!Number.isInteger(my_deck_id) || !Number.isInteger(opp_deck_id)) {
    return res.status(400).json({ error: 'Debes elegir tu deck y el del rival' });
  }
  if (typeof went_first !== 'boolean') {
    return res.status(400).json({ error: 'Indica si empezaste primero o segundo' });
  }
  if (!RESULTS.includes(result)) {
    return res.status(400).json({ error: 'El resultado debe ser win, loss o tie' });
  }
  if (typeof notes !== 'string' || notes.length > 2000) {
    return res.status(400).json({ error: 'Las notas deben ser texto de máximo 2000 caracteres' });
  }

  const ids = [...new Set([my_deck_id, opp_deck_id])];
  const { rows: visible } = await pool.query(
    'SELECT id FROM decks WHERE id = ANY($1) AND (user_id IS NULL OR user_id = $2)',
    [ids, req.user.id]
  );
  if (visible.length !== ids.length) {
    return res.status(400).json({ error: 'Uno de los decks no existe' });
  }

  const { rows } = await pool.query(
    `INSERT INTO matches (user_id, my_deck_id, opp_deck_id, went_first, result, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [req.user.id, my_deck_id, opp_deck_id, went_first, result, notes.trim()]
  );
    // Tu deck entra en tu caja (si ya estaba, no pasa nada)
  await pool.query(
    'INSERT INTO user_decks (user_id, deck_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.user.id, my_deck_id]
  );
  res.status(201).json({ match: rows[0] });
});

// Borrar una partida
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Id inválido' });
  }

  const { rowCount } = await pool.query(
    'DELETE FROM matches WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  );
  if (rowCount === 0) {
    return res.status(404).json({ error: 'Partida no encontrada' });
  }
  res.status(204).end();
});

export default router;