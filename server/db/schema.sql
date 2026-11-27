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

-- Matchups del meta calculados desde Limitless.
-- Cada partida se guarda en las dos direcciones: A vs B y B vs A.
CREATE TABLE IF NOT EXISTS meta_matchups (
  deck_a     TEXT NOT NULL,
  deck_b     TEXT NOT NULL,
  wins       INTEGER NOT NULL DEFAULT 0,
  losses     INTEGER NOT NULL DEFAULT 0,
  ties       INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (deck_a, deck_b)
);

-- Los decks que juega cada usuario (su "caja de decks")
CREATE TABLE IF NOT EXISTS user_decks (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deck_id    INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, deck_id)
);

-- Todo deck con el que el usuario ya registró partidas, entra en su caja
INSERT INTO user_decks (user_id, deck_id)
SELECT DISTINCT user_id, my_deck_id FROM matches
ON CONFLICT DO NOTHING;