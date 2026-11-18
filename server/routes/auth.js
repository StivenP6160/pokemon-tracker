import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { rateLimit } from 'express-rate-limit';

const router = Router();

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

// Máximo 20 intentos de login/registro cada 15 minutos por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' },
});

// Crea la "manilla" (JWT) y la guarda en una cookie
function setSessionCookie(res, user) {
  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SEVEN_DAYS_MS,
  });
}

// REGISTRO
router.post('/register',authLimiter, async (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'El usuario debe tener entre 3 y 20 caracteres: letras, números o _' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const { rows } = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username.toLowerCase(), passwordHash]
    );
    setSessionCookie(res, rows[0]);
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese nombre de usuario ya existe' });
    }
    throw err;
  }
});

// LOGIN
router.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Faltan usuario o contraseña' });
  }

  const { rows } = await pool.query(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [username.toLowerCase()]
  );
  const user = rows[0];
  const passwordOk = user && (await bcrypt.compare(password, user.password_hash));

  if (!passwordOk) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  setSessionCookie(res, user);
  res.json({ user: { id: user.id, username: user.username } });
});

// LOGOUT
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// ¿QUIÉN SOY? (ruta protegida por el guardia)
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;