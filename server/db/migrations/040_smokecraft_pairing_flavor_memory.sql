-- Minimal, self-contained migration extracted from recovery's
-- 029_smokecraft_persistence_hardening.sql — only the two tables
-- actually required by the tested canonical journey's Flavor Memory
-- screen (server/routes/smokecraftPairingRoutes.js): saving flavor
-- selections and the pairing profile they feed. Root-cause fix for a
-- genuine blocker found during Block 8 self-QA rerun 2 (journey stuck
-- at /smokecraft/flavor-memory because handleContinue()'s
-- Promise.all([saveToBackend, saveToPassport]) 404'd against these
-- missing tables via the just-mounted /api/modules/smokecraft/pairing
-- route).

CREATE TABLE IF NOT EXISTS smokecraft_pairing_profiles (
  id          SERIAL PRIMARY KEY,
  profile_id  TEXT        NOT NULL UNIQUE,
  user_id     TEXT,
  data        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_pairing_profiles_user ON smokecraft_pairing_profiles(user_id);

CREATE TABLE IF NOT EXISTS smokecraft_flavor_memory (
  id          SERIAL PRIMARY KEY,
  memory_id   TEXT        NOT NULL UNIQUE,
  session_id  TEXT,
  user_id     TEXT,
  data        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_flavor_memory_user    ON smokecraft_flavor_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_sc_flavor_memory_session ON smokecraft_flavor_memory(session_id);
