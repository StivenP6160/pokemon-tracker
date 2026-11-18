import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Lista los decks globales + los propios del usuario
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, format, user_id IS NOT NULL AS is_custom
       FROM decks
      WHERE user_id IS NULL OR user_id = $1
      ORDER BY is_custom, name`,
    [req.user.id]
  );
  res.json({ decks: rows });
});

// Crea un deck propio
router.post('/', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({ error: 'El nombre del deck debe tener entre 2 y 50 caracteres' });
  }

  // ¿Ya existe un deck con ese nombre (sin importar mayúsculas)?
  const { rows: existing } = await pool.query(
    `SELECT id, name FROM decks
      WHERE lower(name) = lower($1) AND (user_id IS NULL OR user_id = $2)`,
    [name, req.user.id]
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Ese deck ya existe', deck: existing[0] });
  }

  const { rows } = await pool.query(
    `INSERT INTO decks (name, user_id) VALUES ($1, $2)
     RETURNING id, name, format, true AS is_custom`,
    [name, req.user.id]
  );
  res.status(201).json({ deck: rows[0] });
});

export default router;