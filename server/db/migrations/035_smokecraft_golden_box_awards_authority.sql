-- Holistic Fix 5C-2B-2 — Golden Box award-issuance authority.
-- Additive only.
--
-- golden_box_awards is the per-entry award-detail record: which
-- placement award (first/second/third — objective descriptors of a
-- real, immutable placement, never invented content) an entry
-- received, the rule id/version that decided it, and — separately per
-- reward TYPE — whether XP/badge/Passport stamp was actually issued
-- ('issued') or is genuinely unavailable because no approved rule/
-- catalog entry exists for it yet ('unavailable'). This is the audit
-- detail table; golden_box_award_issuances (below) is the atomic
-- one-issuance-per-finalized-result-version gate, mirroring the
-- golden_box_result_finalizations pattern from 5C-2B-1.
CREATE TABLE IF NOT EXISTS golden_box_awards (
  id                      BIGSERIAL PRIMARY KEY,
  competition_id          BIGINT NOT NULL REFERENCES golden_box_competitions(id) ON DELETE CASCADE,
  entry_id                UUID NOT NULL REFERENCES golden_box_entries(entry_id) ON DELETE CASCADE,
  result_version          INT NOT NULL,
  placement               INT NOT NULL,
  award_type              TEXT NOT NULL CHECK (award_type IN ('first_place','second_place','third_place')),
  rule_id                 TEXT NOT NULL,
  rule_version             INT NOT NULL,
  xp_status               TEXT NOT NULL DEFAULT 'unavailable' CHECK (xp_status IN ('issued','unavailable')),
  xp_transaction_id       BIGINT REFERENCES xp_transactions(id),
  badge_status            TEXT NOT NULL DEFAULT 'unavailable' CHECK (badge_status IN ('issued','unavailable')),
  badge_reference         TEXT,
  passport_stamp_status   TEXT NOT NULL DEFAULT 'unavailable' CHECK (passport_stamp_status IN ('issued','unavailable')),
  passport_stamp_reference TEXT,
  issued_by               TEXT NOT NULL,
  issued_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, entry_id, result_version)
);
CREATE INDEX IF NOT EXISTS idx_gba_entry ON golden_box_awards (entry_id);

CREATE TABLE IF NOT EXISTS golden_box_award_issuances (
  id              BIGSERIAL PRIMARY KEY,
  competition_id  BIGINT NOT NULL REFERENCES golden_box_competitions(id) ON DELETE CASCADE,
  result_version  INT NOT NULL,
  issued_by       TEXT NOT NULL,
  idempotency_key TEXT,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, result_version)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gbai_idempotency_key
  ON golden_box_award_issuances (idempotency_key) WHERE idempotency_key IS NOT NULL;
