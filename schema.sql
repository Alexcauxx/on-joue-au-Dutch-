-- ============================================================
-- DUTCH APP — Schéma de base de données Supabase
-- À copier-coller dans : Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Extension UUID (normalement déjà activée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- TABLE : games
-- Une ligne = une partie
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS games (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  code         TEXT        UNIQUE NOT NULL,          -- code à 6 caractères ex: "ABK4Z2"
  status       TEXT        NOT NULL DEFAULT 'waiting'
                           CHECK (status IN ('waiting', 'playing', 'finished')),
  host_id      UUID,                                  -- ID du joueur créateur
  settings     JSONB       NOT NULL DEFAULT '{}',     -- règles de la partie
  game_state   JSONB,                                 -- état complet du jeu (deck, mains, etc.)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABLE : players
-- Une ligne = un joueur dans une partie
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id      UUID        NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  is_host      BOOLEAN     NOT NULL DEFAULT FALSE,
  is_connected BOOLEAN     NOT NULL DEFAULT TRUE,
  turn_order   INTEGER,                               -- ordre de jeu (0, 1, 2...)
  session_key  TEXT,                                  -- clé unique par navigateur (localStorage)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TRIGGER : met à jour updated_at automatiquement
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- SÉCURITÉ : Row Level Security
-- Pour le MVP, on autorise tout (on vérifiera côté client)
-- On ajoutera des règles strictes à l'Étape Sécurité
-- ────────────────────────────────────────────────────────────
ALTER TABLE games   ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Autoriser lecture pour tout le monde (authentifié ou non)
CREATE POLICY "Lecture publique games"   ON games   FOR SELECT USING (true);
CREATE POLICY "Lecture publique players" ON players FOR SELECT USING (true);

-- Autoriser insertions
CREATE POLICY "Insertion games"   ON games   FOR INSERT WITH CHECK (true);
CREATE POLICY "Insertion players" ON players FOR INSERT WITH CHECK (true);

-- Autoriser mises à jour
CREATE POLICY "Mise à jour games"   ON games   FOR UPDATE USING (true);
CREATE POLICY "Mise à jour players" ON players FOR UPDATE USING (true);

-- ────────────────────────────────────────────────────────────
-- REALTIME : activer la synchronisation en temps réel
-- ────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- ────────────────────────────────────────────────────────────
-- INDEX : pour accélérer les recherches par code
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_games_code       ON games(code);
CREATE INDEX IF NOT EXISTS idx_players_game_id  ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_session  ON players(session_key);
