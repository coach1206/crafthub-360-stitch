-- Minimal, self-contained extraction from recovery's
-- 085_filler_arrangement_and_progression_events.sql — only the
-- smokecraft_progression_events table, actually required by
-- progressionEventService.js's recordEvent() (called from the
-- pairing-engine's recommend/rank handlers, among others). Root-cause
-- fix for a genuine 42P01 (undefined_table) blocker found during
-- Block 8 self-QA rerun 6, which kept the canonical journey stuck at
-- /smokecraft/pairing-recommendations even after the pairingType and
-- route-mount fixes.

CREATE TABLE IF NOT EXISTS smokecraft_progression_events (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL DEFAULT gen_random_uuid(),
  guest_reference TEXT NOT NULL,
  venue_id TEXT,
  source_screen TEXT NOT NULL,
  source_route TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INT NOT NULL DEFAULT 1,
  idempotency_key TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'processed' CHECK (processing_status IN ('pending', 'processed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_spe_guest ON smokecraft_progression_events (guest_reference);
CREATE INDEX IF NOT EXISTS idx_spe_type ON smokecraft_progression_events (event_type);
