-- CraftHub unified gamification + NOVEE OS event bridge.
-- Additive only; no destructive DDL.

CREATE TABLE IF NOT EXISTS crafthub_game_player_state (
  participant_ref TEXT NOT NULL,
  academy_key TEXT NOT NULL,
  xp_total INTEGER NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
  rank_label TEXT NOT NULL DEFAULT 'Novice',
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (participant_ref, academy_key)
);

CREATE TABLE IF NOT EXISTS crafthub_game_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ref TEXT NOT NULL,
  academy_key TEXT NOT NULL,
  lesson_key TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_ref, academy_key, lesson_key)
);

CREATE TABLE IF NOT EXISTS crafthub_game_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ref TEXT NOT NULL,
  academy_key TEXT NOT NULL,
  lesson_key TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL UNIQUE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_ref, academy_key, lesson_key)
);

CREATE TABLE IF NOT EXISTS crafthub_game_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ref TEXT NOT NULL,
  academy_key TEXT NOT NULL,
  award_type TEXT NOT NULL,
  award_key TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_ref, academy_key, award_type, award_key)
);

CREATE TABLE IF NOT EXISTS crafthub_game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ref TEXT NOT NULL,
  academy_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_key TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crafthub_game_events_participant
  ON crafthub_game_events(participant_ref, academy_key, created_at DESC);

CREATE TABLE IF NOT EXISTS novee_os_ecosystem_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_platform TEXT NOT NULL,
  source_module TEXT NOT NULL,
  participant_ref TEXT,
  event_type TEXT NOT NULL,
  entity_key TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_ecosystem_events_source
  ON novee_os_ecosystem_events(source_platform, source_module, created_at DESC);

-- SmokeCraft remains authoritative in its existing tables. These triggers
-- mirror material completion/award events into NOVEE OS without changing
-- SmokeCraft scoring or award semantics.
CREATE OR REPLACE FUNCTION mirror_smokecraft_completion_to_novee()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO novee_os_ecosystem_events
    (source_platform, source_module, participant_ref, event_type, entity_key, payload, idempotency_key)
  VALUES
    ('craft_hub_360', 'smokecraft_360', NEW.guest_reference, 'lesson.completed', NEW.session_id,
     jsonb_build_object('xp_awarded', NEW.xp_awarded, 'completed_at', NEW.completed_at),
     'smokecraft:completion:' || NEW.id::text)
  ON CONFLICT (idempotency_key) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_smokecraft_completion_novee ON smokecraft_session_completions;
CREATE TRIGGER trg_smokecraft_completion_novee
AFTER INSERT ON smokecraft_session_completions
FOR EACH ROW EXECUTE FUNCTION mirror_smokecraft_completion_to_novee();

CREATE OR REPLACE FUNCTION mirror_smokecraft_award_to_novee()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO novee_os_ecosystem_events
    (source_platform, source_module, participant_ref, event_type, entity_key, payload, idempotency_key)
  VALUES
    ('craft_hub_360', 'smokecraft_360', NEW.guest_reference, 'award.granted', NEW.award_key,
     jsonb_build_object('award_type', NEW.award_type, 'amount', NEW.amount),
     'smokecraft:award:' || NEW.id::text)
  ON CONFLICT (idempotency_key) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_smokecraft_award_novee ON smokecraft_awards;
CREATE TRIGGER trg_smokecraft_award_novee
AFTER INSERT ON smokecraft_awards
FOR EACH ROW EXECUTE FUNCTION mirror_smokecraft_award_to_novee();
