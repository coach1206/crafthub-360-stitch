-- Package 6 closure pass: smoking-technique cadence sessions and
-- immutable pairing-draft revision history. Additive only; does not
-- modify migrations 075-082.

CREATE TABLE IF NOT EXISTS smokecraft_cadence_sessions (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  puff_count INTEGER NOT NULL DEFAULT 0,
  ash_checks INTEGER NOT NULL DEFAULT 0,
  overheating_warnings INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference)
);

-- Append-only revision history — a draft's "live" row in
-- smokecraft_pairing_drafts (migration 082) always reflects the latest
-- revision; each save also writes an immutable snapshot here so earlier
-- revisions are never lost.
CREATE TABLE IF NOT EXISTS smokecraft_pairing_draft_revisions (
  id BIGSERIAL PRIMARY KEY,
  draft_id BIGINT NOT NULL REFERENCES smokecraft_pairing_drafts(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (draft_id, revision_number)
);
CREATE INDEX IF NOT EXISTS idx_spdr_draft ON smokecraft_pairing_draft_revisions (draft_id);

ALTER TABLE smokecraft_pairing_drafts ADD COLUMN IF NOT EXISTS current_revision INTEGER NOT NULL DEFAULT 1;

INSERT INTO xp_award_rules (rule_key, source_type, amount, description, enabled)
VALUES ('smoking_technique_complete', 'session_completion', 20, 'Completed the Smoking Technique cadence exercise', true)
ON CONFLICT (rule_key) DO NOTHING;
