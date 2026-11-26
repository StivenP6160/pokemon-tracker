import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Lista los decks globales + los propios del usuario
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, format, icons, user_id IS NOT NULL AS is_custom
       FROM decks
      WHERE user_id IS NULL OR user_id = $1
      ORDER BY is_custom, name`,
    [req.user.id]
  );
  res.json({ decks: rows });
});

// Encuentra el deck de 1 o 2 Pokémon, o lo crea si no existe
router.post('/resolve', async (req, res) => {
  const icons = req.body?.icons;

  const valid =
    Array.isArray(icons) &&
    icons.length >= 1 &&
    icons.length <= 2 &&
    icons.every((p) => typeof p === 'string' && /^[a-z0-9-]{1,40}$/.test(p));

  if (!valid) {
    return res.status(400).json({ error: 'Elige 1 o 2 Pokémon' });
  }
  if (icons.length === 2 && icons[0] === icons[1]) {
    return res.status(400).json({ error: 'Elige dos Pokémon distintos' });
  }

  // 1. ¿Ya existe un deck con exactamente esos Pokémon, sin importar el orden?
  const { rows: found } = await pool.query(
    `SELECT id, name, format, icons, user_id IS NOT NULL AS is_custom
       FROM decks
      WHERE icons @> $1::text[] AND icons <@ $1::text[]
        AND (user_id IS NULL OR user_id = $2)
      ORDER BY user_id NULLS FIRST, id
      LIMIT 1`,
    [icons, req.user.id]
  );
  if (found.length > 0) {
    return res.json({ deck: found[0], created: false });
  }

  // 2. No existe → crearlo como deck propio, con el nombre de los Pokémon
  const pretty = (slug) =>
    slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  const name = icons.map(pretty).join(' / ');

  const { rows } = await pool.query(
    `INSERT INTO decks (name, icons, user_id) VALUES ($1, $2, $3)
     ON CONFLICT (name, format, user_id) DO UPDATE SET icons = EXCLUDED.icons
     RETURNING id, name, format, icons, true AS is_custom`,
    [name, icons, req.user.id]
  );
  res.status(201).json({ deck: rows[0], created: true });
});

export default router;  