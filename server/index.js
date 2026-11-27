import path from 'node:path';
import { existsSync } from 'node:fs';
import express from 'express';
import cookieParser from 'cookie-parser';
import { requireAuth } from './middleware/requireAuth.js';
import authRoutes from './routes/auth.js';
import deckRoutes from './routes/decks.js';
import matchRoutes from './routes/matches.js';
import statsRoutes from './routes/stats.js';
import myDeckRoutes from './routes/myDecks.js';

if (!process.env.JWT_SECRET) {
  throw new Error('Falta JWT_SECRET en el archivo .env');
}

const app = express();
app.set('trust proxy', 1); 
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/decks', requireAuth, deckRoutes);
app.use('/api/matches', requireAuth, matchRoutes);
app.use('/api/stats', requireAuth, statsRoutes);
app.use('/api/my-decks', requireAuth, myDeckRoutes);

// Cualquier otra ruta /api que no exista → 404 en JSON
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Si existe el frontend construido (en Docker sí), Express también lo sirve
const clientDist = path.join(import.meta.dirname, '../client/dist');

if (existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // Cualquier otra página GET devuelve la app de React
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});