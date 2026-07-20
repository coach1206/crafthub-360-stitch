-- Package 1: Golden Box Challenge — foundational backend schema.
-- Reuses (not duplicated): venues (System 1), system_users,
-- passport_360_guest_profiles (guest identity), passport_360_badges,
-- passport_stamps, smoke_leaderboard_entries, audit_logs,
-- smokecraft_management_sync_journeys (eligibility source-of-truth).
-- Entrant identity reuses the exact soft-user_id/guest_reference pattern
-- from smokecraft_management_sync_journeys (migration 074).

-- ── Audit category extension ────────────────────────────────────────
-- Postgres has no ALTER CHECK; drop and recreate with GOLDEN_BOX added.
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_category_check;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_category_check
  CHECK (action_category IN (
    'AUTH','ROLE','ADMIN','POS','EAT','INVENTORY','TICKER','PAYMENT',
    'DEVELOPER','FOUNDER','MENTOR','PASSPORT_CONNECTION','VENUE',
    'SYSTEM_SETTINGS','FEATURE_FLAGS','GOLDEN_BOX'
  ));

-- ── XP foundation (Decision 5) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  guest_reference TEXT,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_xp_account_identity CHECK (user_id IS NOT NULL OR guest_reference IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_xp_accounts_user ON xp_accounts (user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_xp_accounts_guest ON xp_accounts (guest_reference) WHERE guest_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS xp_award_rules (
  id BIGSERIAL PRIMARY KEY,
  rule_key TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'session_completion','quiz','golden_box','manual_adjustment','reversal'
  )),
  amount INTEGER NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only. XP transactions are the only source of truth for balance
-- changes — xp_accounts.balance is a maintained cache, never written
-- directly by application code outside the transaction-insert path.
CREATE TABLE IF NOT EXISTS xp_transactions (
  id BIGSERIAL PRIMARY KEY,
  xp_account_id BIGINT NOT NULL REFERENCES xp_accounts(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'session_completion','quiz','golden_box','manual_adjustment','reversal'
  )),
  source_id TEXT,
  reason TEXT NOT NULL,
  award_rule_key TEXT REFERENCES xp_award_rules(rule_key),
  idempotency_key TEXT NOT NULL,
  venue_id TEXT REFERENCES venues(venue_id) ON DELETE SET NULL,
  administrator_id TEXT,
  reversal_of BIGINT REFERENCES xp_transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_account ON xp_transactions (xp_account_id);

CREATE OR REPLACE FUNCTION xp_transactions_no_delete_or_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'xp_transactions rows are append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_xp_transactions_no_delete ON xp_transactions;
CREATE TRIGGER trg_xp_transactions_no_delete
  BEFORE DELETE OR UPDATE ON xp_transactions
  FOR EACH ROW EXECUTE FUNCTION xp_transactions_no_delete_or_update();

-- ── Leaderboard integration (Step 13) ────────────────────────────────
-- Minimal, additive columns on the existing venue-scoped leaderboard
-- table so Golden Box results can publish into it without a parallel
-- leaderboard system. smoke_session_id becomes nullable because a
-- Golden Box result has no smoke_sessions row; existing rows/behavior
-- are unaffected (all existing rows keep their non-null smoke_session_id).
ALTER TABLE smoke_leaderboard_entries ALTER COLUMN smoke_session_id DROP NOT NULL;
ALTER TABLE smoke_leaderboard_entries ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'smokecraft_session';
ALTER TABLE smoke_leaderboard_entries ADD COLUMN IF NOT EXISTS participant_ref TEXT;
ALTER TABLE smoke_leaderboard_entries ADD COLUMN IF NOT EXISTS metadata JSONB;
CREATE INDEX IF NOT EXISTS idx_smoke_leaderboard_entries_category ON smoke_leaderboard_entries (category, venue_id, final_score DESC);

-- ── Golden Box: competitions & scoping (Decision 2) ─────────────────
CREATE TABLE IF NOT EXISTS golden_box_competitions (
  id BIGSERIAL PRIMARY KEY,
  competition_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL CHECK (scope IN ('global','venue','cohort','event','private_invitation')),
  scope_venue_id TEXT REFERENCES venues(venue_id) ON DELETE SET NULL,
  scope_cohort_id TEXT,
  scope_event_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','scheduled','registration_open','registration_closed','active',
    'submission_closed','judging','results_pending','completed','cancelled','archived'
  )),
  registration_opens_at TIMESTAMPTZ,
  registration_closes_at TIMESTAMPTZ,
  submission_closes_at TIMESTAMPTZ,
  max_entries_per_entrant INTEGER NOT NULL DEFAULT 1,
  scoring_config JSONB NOT NULL DEFAULT '{}',
  blind_judging BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_gbc_scope_venue CHECK (scope != 'venue' OR scope_venue_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_gbc_status ON golden_box_competitions (status);
CREATE INDEX IF NOT EXISTS idx_gbc_scope ON golden_box_competitions (scope, scope_venue_id);

-- Private-invitation entrant allowlist.
CREATE TABLE IF NOT EXISTS golden_box_competition_invitations (
  id BIGSERIAL PRIMARY KEY,
  competition_id BIGINT NOT NULL REFERENCES golden_box_competitions(id) ON DELETE CASCADE,
  invited_user_id TEXT,
  invited_guest_reference TEXT,
  invited_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_gbci_identity CHECK (invited_user_id IS NOT NULL OR invited_guest_reference IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_gbci_competition ON golden_box_competition_invitations (competition_id);

CREATE TABLE IF NOT EXISTS golden_box_rounds (
  id BIGSERIAL PRIMARY KEY,
  competition_id BIGINT NOT NULL REFERENCES golden_box_competitions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number > 0),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed')),
  UNIQUE (competition_id, round_number)
);

-- ── Eligibility (Step 7) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS golden_box_eligibility_rules (
  id BIGSERIAL PRIMARY KEY,
  competition_id BIGINT NOT NULL REFERENCES golden_box_competitions(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'required_sessions','min_quiz_score','min_xp','required_badge',
    'required_passport_stamp','venue_membership','registration_window',
    'max_entries','admin_approval'
  )),
  rule_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gber_competition ON golden_box_eligibility_rules (competition_id);

CREATE TABLE IF NOT EXISTS golden_box_eligibility_results (
  id BIGSERIAL PRIMARY KEY,
  competition_id BIGINT NOT NULL REFERENCES golden_box_competitions(id) ON DELETE CASCADE,
  user_id TEXT,
  guest_reference TEXT,
  eligibility_rule_id BIGINT REFERENCES golden_box_eligibility_rules(id) ON DELETE SET NULL,
  result TEXT NOT NULL CHECK (result IN ('eligible','ineligible')),
  reason TEXT NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_snapshot JSONB,
  override_status TEXT CHECK (override_status IN ('none','granted','revoked')),
  override_administrator_id TEXT,
  override_reason TEXT,
  CONSTRAINT chk_gber_identity CHECK (user_id IS NOT NULL OR guest_reference IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_gbe_results_lookup ON golden_box_eligibility_results (competition_id, user_id, guest_reference);

-- ── Entries, versions, blends (Step 8/9) ────────────────────────────
CREATE TABLE IF NOT EXISTS golden_box_entries (
  id BIGSERIAL PRIMARY KEY,
  entry_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  competition_id BIGINT NOT NULL REFERENCES golden_box_competitions(id) ON DELETE CASCADE,
  round_id BIGINT REFERENCES golden_box_rounds(id) ON DELETE SET NULL,
  user_id TEXT,
  guest_reference TEXT NOT NULL,
  cigar_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','incomplete','eligible','ineligible','submitted','locked',
    'under_review','finalist','winner','not_selected','withdrawn','disqualified'
  )),
  current_version INTEGER NOT NULL DEFAULT 1 CHECK (current_version > 0),
  submitted_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, guest_reference)
);
CREATE INDEX IF NOT EXISTS idx_gbe_competition_status ON golden_box_entries (competition_id, status);
CREATE INDEX IF NOT EXISTS idx_gbe_guest ON golden_box_entries (guest_reference);

-- Immutable snapshot per version — once an entry is submitted/locked,
-- the official version's row is never mutated (only a new version can
-- be created before lock, matching the mandate's "must not silently
-- mutate" rule).
CREATE TABLE IF NOT EXISTS golden_box_entry_versions (
  id BIGSERIAL PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES golden_box_entries(entry_id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  presentation_payload JSONB NOT NULL DEFAULT '{}',
  pairing_selection JSONB,
  pairing_defense TEXT,
  predicted_profile JSONB,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entry_id, version_number)
);

CREATE TABLE IF NOT EXISTS golden_box_blend_components (
  id BIGSERIAL PRIMARY KEY,
  entry_version_id BIGINT NOT NULL REFERENCES golden_box_entry_versions(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL CHECK (component_type IN (
    'seed_genetics','origin','country','region','soil','terroir','plant_variety',
    'leaf_priming','wrapper','binder','filler','curing_method','fermentation_method',
    'aging_method','vitola','ring_gauge','length','strength','body','flavor_note',
    'construction_characteristic'
  )),
  component_key TEXT NOT NULL,
  component_value JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_gbbc_entry_version ON golden_box_blend_components (entry_version_id);

-- Kept for API-contract clarity (mandate names golden_box_blends as a
-- distinct entity); an entry_version IS the versioned blend snapshot —
-- this view avoids a duplicate parallel table for the same data.
CREATE OR REPLACE VIEW golden_box_blends AS
  SELECT id AS blend_id, entry_id, version_number, presentation_payload,
         pairing_selection, pairing_defense, predicted_profile, created_by, created_at
  FROM golden_box_entry_versions;

CREATE TABLE IF NOT EXISTS golden_box_submissions (
  id BIGSERIAL PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES golden_box_entries(entry_id) ON DELETE CASCADE,
  entry_version_id BIGINT NOT NULL REFERENCES golden_box_entry_versions(id) ON DELETE RESTRICT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  validation_passed BOOLEAN NOT NULL,
  validation_errors JSONB,
  UNIQUE (entry_id)
);

-- ── Curated starter component catalog (Step 9 — not authoritative) ──
CREATE TABLE IF NOT EXISTS golden_box_component_catalog (
  id BIGSERIAL PRIMARY KEY,
  component_type TEXT NOT NULL,
  component_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_curated_platform_content BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (component_type, component_key)
);

-- ── Judging (Step 10, Decision 3) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS golden_box_judges (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS golden_box_judge_assignments (
  id BIGSERIAL PRIMARY KEY,
  competition_id BIGINT NOT NULL REFERENCES golden_box_competitions(id) ON DELETE CASCADE,
  judge_id BIGINT NOT NULL REFERENCES golden_box_judges(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES golden_box_entries(entry_id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (judge_id, entry_id)
);
CREATE INDEX IF NOT EXISTS idx_gbja_entry ON golden_box_judge_assignments (entry_id);

CREATE TABLE IF NOT EXISTS golden_box_scorecards (
  id BIGSERIAL PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES golden_box_entries(entry_id) ON DELETE CASCADE,
  judge_id BIGINT NOT NULL REFERENCES golden_box_judges(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','locked','amended','voided')),
  submitted_at TIMESTAMPTZ,
  amended_from BIGINT REFERENCES golden_box_scorecards(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entry_id, judge_id, amended_from)
);

-- Individual category scores per scorecard — never overwritten by an
-- aggregate; golden_box_results (below) stores the computed aggregate
-- separately, per the mandate's explicit "never overwrite individual
-- scores with an aggregate" rule.
CREATE TABLE IF NOT EXISTS golden_box_scores (
  id BIGSERIAL PRIMARY KEY,
  scorecard_id BIGINT NOT NULL REFERENCES golden_box_scorecards(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 10,
  comment TEXT,
  scorer_type TEXT NOT NULL DEFAULT 'human_judge' CHECK (scorer_type IN ('human_judge','administrative_adjustment','tie_break','disqualification')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_gbs_score_range CHECK (score >= 0 AND score <= max_score)
);
CREATE INDEX IF NOT EXISTS idx_gbs_scorecard ON golden_box_scores (scorecard_id);

-- ── AI educational analysis (Step 11, Decision 3) ───────────────────
-- Deliberately separate from golden_box_scores — AI output can never
-- become an official score by construction (no FK/path exists from this
-- table into the scoring aggregate).
CREATE TABLE IF NOT EXISTS golden_box_ai_analyses (
  id BIGSERIAL PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES golden_box_entries(entry_id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN (
    'educational_feedback','blend_balance','flavor_comparison',
    'completeness_check','rule_validation','consistency_analysis',
    'mentor_commentary','improvement_suggestions','judging_anomaly_flag'
  )),
  provider_identifier TEXT,
  prompt_version TEXT,
  input_reference JSONB,
  output_text TEXT,
  limitation_notes TEXT NOT NULL DEFAULT 'Generated by an AI system with no physical tasting data; educational analysis only, not an official score.',
  visibility TEXT NOT NULL DEFAULT 'entrant' CHECK (visibility IN ('entrant','judges','administrators','public')),
  human_review_status TEXT NOT NULL DEFAULT 'not_reviewed' CHECK (human_review_status IN ('not_reviewed','reviewed','flagged')),
  status TEXT NOT NULL DEFAULT 'not_configured' CHECK (status IN (
    'not_configured','queued','processing','completed','failed','review_required'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gbaa_entry ON golden_box_ai_analyses (entry_id);

CREATE TABLE IF NOT EXISTS golden_box_feedback (
  id BIGSERIAL PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES golden_box_entries(entry_id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('mentor','judge','administrator')),
  author_id TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'entrant' CHECK (visibility IN ('entrant','judges','administrators','public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Results, rewards, visibility, activity log ──────────────────────
CREATE TABLE IF NOT EXISTS golden_box_results (
  id BIGSERIAL PRIMARY KEY,
  competition_id BIGINT NOT NULL REFERENCES golden_box_competitions(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES golden_box_entries(entry_id) ON DELETE CASCADE,
  aggregate_score NUMERIC(6,2),
  placement INTEGER,
  is_finalist BOOLEAN NOT NULL DEFAULT false,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  tie_break_reason TEXT,
  disqualified BOOLEAN NOT NULL DEFAULT false,
  disqualification_reason TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, entry_id)
);

CREATE TABLE IF NOT EXISTS golden_box_rewards (
  id BIGSERIAL PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES golden_box_entries(entry_id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('badge','passport_stamp','xp','leaderboard_entry')),
  reference_id TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entry_id, reward_type)
);

-- Central, explicit visibility policy per entry — enforced server-side
-- by the authorization service, this table is the auditable record of
-- what was granted, not the enforcement mechanism itself.
CREATE TABLE IF NOT EXISTS golden_box_visibility_rules (
  id BIGSERIAL PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES golden_box_entries(entry_id) ON DELETE CASCADE,
  viewer_role TEXT NOT NULL CHECK (viewer_role IN (
    'entrant','assigned_judge','mentor','venue_administrator',
    'competition_administrator','platform_administrator','authorized_viewer','public'
  )),
  can_view_recipe BOOLEAN NOT NULL DEFAULT false,
  can_view_scores BOOLEAN NOT NULL DEFAULT false,
  can_view_personal_info BOOLEAN NOT NULL DEFAULT false,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entry_id, viewer_role)
);

CREATE TABLE IF NOT EXISTS golden_box_activity_log (
  id BIGSERIAL PRIMARY KEY,
  entry_id UUID REFERENCES golden_box_entries(entry_id) ON DELETE SET NULL,
  competition_id BIGINT REFERENCES golden_box_competitions(id) ON DELETE SET NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gbal_entry ON golden_box_activity_log (entry_id);

CREATE OR REPLACE FUNCTION golden_box_activity_log_no_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'golden_box_activity_log rows cannot be deleted';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_gbal_no_delete ON golden_box_activity_log;
CREATE TRIGGER trg_gbal_no_delete
  BEFORE DELETE ON golden_box_activity_log
  FOR EACH ROW EXECUTE FUNCTION golden_box_activity_log_no_delete();
