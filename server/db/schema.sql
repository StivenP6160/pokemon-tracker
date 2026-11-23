-- USUARIOS
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DECKS (user_id vacío = deck global del meta; con user_id = deck propio de alguien)
CREATE TABLE IF NOT EXISTS decks (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  format     TEXT NOT NULL DEFAULT 'TEF-30C',
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (name, format, user_id)
);

-- PARTIDAS
CREATE TABLE IF NOT EXISTS matches (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  my_deck_id  INTEGER NOT NULL REFERENCES decks(id),
  opp_deck_id INTEGER NOT NULL REFERENCES decks(id),
  went_first  BOOLEAN NOT NULL,
  result      TEXT NOT NULL CHECK (result IN ('win', 'loss', 'tie')),
  notes       TEXT NOT NULL DEFAULT '',
  played_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS matches_user_idx ON matches (user_id, played_at DESC);

-- Íconos de cada deck (nombres de Pokémon) y el id del deck en Limitless
ALTER TABLE decks ADD COLUMN IF NOT EXISTS icons TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE decks ADD COLUMN IF NOT EXISTS limitless_id TEXT UNIQUE;