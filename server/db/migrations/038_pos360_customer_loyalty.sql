-- Migration: 038_pos360_customer_loyalty.sql
-- Phase B.8: Customer, Loyalty, Rewards & Guest Intelligence
-- No DROP TABLE, no DROP COLUMN, no data destruction.
-- Uses CREATE TABLE IF NOT EXISTS throughout.

-- ── Customer Master Profile ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_customers (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  location_id               UUID,
  external_customer_id      TEXT,
  display_name              TEXT,
  first_name                TEXT,
  last_name                 TEXT,
  email                     TEXT,
  phone                     TEXT,
  date_of_birth             DATE,
  anniversary_date          DATE,
  preferred_language        TEXT NOT NULL DEFAULT 'en-US',
  source                    TEXT NOT NULL DEFAULT 'pos360',
  is_anonymous              BOOLEAN NOT NULL DEFAULT FALSE,
  is_merged                 BOOLEAN NOT NULL DEFAULT FALSE,
  merged_into_id            UUID,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  audit_context             JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_customers_venue ON pos360_customers (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_customers_email ON pos360_customers (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pos360_customers_phone ON pos360_customers (phone) WHERE phone IS NOT NULL;

-- ── Guest Profiles ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  location_id               UUID,
  customer_id               UUID NOT NULL REFERENCES pos360_customers(id) ON DELETE CASCADE,
  membership_number         TEXT,
  qr_code_token             TEXT,
  barcode_value             TEXT,
  visit_count               INTEGER NOT NULL DEFAULT 0,
  total_spend_cents         BIGINT NOT NULL DEFAULT 0,
  last_visit_at             TIMESTAMPTZ,
  first_visit_at            TIMESTAMPTZ,
  avg_order_value_cents     BIGINT NOT NULL DEFAULT 0,
  lifetime_value_cents      BIGINT NOT NULL DEFAULT 0,
  churn_risk_score          NUMERIC(5,4) NOT NULL DEFAULT 0,
  value_score               NUMERIC(5,4) NOT NULL DEFAULT 0,
  service_recovery_flag     BOOLEAN NOT NULL DEFAULT FALSE,
  allergy_notes             TEXT,
  dietary_restrictions      JSONB NOT NULL DEFAULT '[]',
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  audit_context             JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_profiles_customer ON pos360_guest_profiles (customer_id);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_profiles_venue ON pos360_guest_profiles (venue_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pos360_guest_profiles_membership ON pos360_guest_profiles (membership_number, venue_id) WHERE membership_number IS NOT NULL;

-- ── Guest Identities ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_identities (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id               UUID NOT NULL REFERENCES pos360_customers(id) ON DELETE CASCADE,
  identity_type             TEXT NOT NULL, -- phone, email, qr, barcode, membership, anonymous_token
  identity_value            TEXT NOT NULL,
  is_primary                BOOLEAN NOT NULL DEFAULT FALSE,
  verified                  BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_identities_customer ON pos360_guest_identities (customer_id);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_identities_lookup ON pos360_guest_identities (identity_type, identity_value, venue_id);

-- ── Guest Preferences ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_preferences (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id               UUID NOT NULL REFERENCES pos360_customers(id) ON DELETE CASCADE,
  preference_type           TEXT NOT NULL,
  preference_key            TEXT NOT NULL,
  preference_value          TEXT,
  preference_data           JSONB NOT NULL DEFAULT '{}',
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_preferences_customer ON pos360_guest_preferences (customer_id);

-- ── Guest Notes ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_notes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id               UUID NOT NULL REFERENCES pos360_customers(id) ON DELETE CASCADE,
  author_id                 UUID NOT NULL,
  note_type                 TEXT NOT NULL DEFAULT 'general',
  note_body                 TEXT NOT NULL,
  is_private                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_notes_customer ON pos360_guest_notes (customer_id);

-- ── Guest Consents ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_consents (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id               UUID NOT NULL REFERENCES pos360_customers(id) ON DELETE CASCADE,
  consent_type              TEXT NOT NULL,
  granted                   BOOLEAN NOT NULL DEFAULT FALSE,
  granted_at                TIMESTAMPTZ,
  revoked_at                TIMESTAMPTZ,
  ip_address                TEXT,
  collection_method         TEXT,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_consents_customer ON pos360_guest_consents (customer_id);

-- ── Guest Activity Timeline ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_activity_timeline (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id               UUID NOT NULL REFERENCES pos360_customers(id) ON DELETE CASCADE,
  event_type                TEXT NOT NULL,
  event_source              TEXT NOT NULL DEFAULT 'pos360',
  reference_id              UUID,
  reference_type            TEXT,
  summary                   TEXT,
  event_data                JSONB NOT NULL DEFAULT '{}',
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  occurred_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_timeline_customer ON pos360_guest_activity_timeline (customer_id, occurred_at DESC);

-- ── Guest Duplicate Candidates ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_duplicate_candidates (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id_a             UUID NOT NULL REFERENCES pos360_customers(id),
  customer_id_b             UUID NOT NULL REFERENCES pos360_customers(id),
  confidence_score          NUMERIC(5,4) NOT NULL DEFAULT 0,
  match_signals             JSONB NOT NULL DEFAULT '[]',
  status                    TEXT NOT NULL DEFAULT 'pending',
  reviewed_by               UUID,
  reviewed_at               TIMESTAMPTZ,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_dup_candidates_venue ON pos360_guest_duplicate_candidates (venue_id, status);

-- ── Guest Merge Requests ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_merge_requests (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  source_customer_id        UUID NOT NULL REFERENCES pos360_customers(id),
  target_customer_id        UUID NOT NULL REFERENCES pos360_customers(id),
  requested_by              UUID NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'pending_manager',
  approved_by               UUID,
  approved_at               TIMESTAMPTZ,
  rejected_at               TIMESTAMPTZ,
  rejection_reason          TEXT,
  merge_plan                JSONB NOT NULL DEFAULT '{}',
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_merge_requests_venue ON pos360_guest_merge_requests (venue_id, status);

-- ── Loyalty Profiles ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_loyalty_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id               UUID NOT NULL REFERENCES pos360_customers(id) ON DELETE CASCADE,
  loyalty_number            TEXT,
  current_tier_id           UUID,
  points_balance            BIGINT NOT NULL DEFAULT 0,
  lifetime_points_earned    BIGINT NOT NULL DEFAULT 0,
  lifetime_points_redeemed  BIGINT NOT NULL DEFAULT 0,
  points_expiring_soon      BIGINT NOT NULL DEFAULT 0,
  next_expiry_at            TIMESTAMPTZ,
  enrolled_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at          TIMESTAMPTZ,
  is_fraud_flagged          BOOLEAN NOT NULL DEFAULT FALSE,
  fraud_review_status       TEXT,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  audit_context             JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_loyalty_profiles_customer ON pos360_loyalty_profiles (customer_id);
CREATE INDEX IF NOT EXISTS idx_pos360_loyalty_profiles_venue ON pos360_loyalty_profiles (venue_id);

-- ── Loyalty Tiers (venue-configurable) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_loyalty_tiers (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  tier_name                 TEXT NOT NULL,
  tier_slug                 TEXT NOT NULL,
  tier_order                INTEGER NOT NULL DEFAULT 0,
  points_threshold          BIGINT NOT NULL DEFAULT 0,
  spend_threshold_cents     BIGINT NOT NULL DEFAULT 0,
  multiplier                NUMERIC(6,4) NOT NULL DEFAULT 1.0,
  benefits                  JSONB NOT NULL DEFAULT '[]',
  member_pricing_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  is_default                BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (venue_id, tier_slug)
);
CREATE INDEX IF NOT EXISTS idx_pos360_loyalty_tiers_venue ON pos360_loyalty_tiers (venue_id, tier_order);

-- ── Loyalty Points Ledger ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_loyalty_points_ledger (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  loyalty_profile_id        UUID NOT NULL REFERENCES pos360_loyalty_profiles(id),
  customer_id               UUID NOT NULL REFERENCES pos360_customers(id),
  transaction_type          TEXT NOT NULL, -- earn, redeem, adjust, expire, reverse, bonus
  points_delta              BIGINT NOT NULL,
  balance_after             BIGINT NOT NULL,
  reference_id              UUID,
  reference_type            TEXT,
  reason                    TEXT,
  requires_manager          BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by               UUID,
  approved_at               TIMESTAMPTZ,
  expiry_at                 TIMESTAMPTZ,
  idempotency_key           TEXT NOT NULL,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key, venue_id)
);
CREATE INDEX IF NOT EXISTS idx_pos360_points_ledger_loyalty ON pos360_loyalty_points_ledger (loyalty_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos360_points_ledger_customer ON pos360_loyalty_points_ledger (customer_id);

-- ── Loyalty Rewards Catalog ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_loyalty_rewards (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  reward_name               TEXT NOT NULL,
  reward_type               TEXT NOT NULL, -- discount, free_item, upgrade, experience, birthday, referral, service_recovery
  points_cost               BIGINT NOT NULL DEFAULT 0,
  discount_cents            BIGINT,
  discount_percent          NUMERIC(5,2),
  min_tier_id               UUID REFERENCES pos360_loyalty_tiers(id),
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  requires_manager          BOOLEAN NOT NULL DEFAULT FALSE,
  valid_from                TIMESTAMPTZ,
  valid_until               TIMESTAMPTZ,
  max_redemptions           INTEGER,
  redemption_count          INTEGER NOT NULL DEFAULT 0,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_loyalty_rewards_venue ON pos360_loyalty_rewards (venue_id, is_active);

-- ── Loyalty Reward Redemptions ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_loyalty_reward_redemptions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id               UUID NOT NULL REFERENCES pos360_customers(id),
  loyalty_profile_id        UUID NOT NULL REFERENCES pos360_loyalty_profiles(id),
  reward_id                 UUID NOT NULL REFERENCES pos360_loyalty_rewards(id),
  order_id                  UUID,
  payment_id                UUID,
  points_spent              BIGINT NOT NULL DEFAULT 0,
  status                    TEXT NOT NULL DEFAULT 'pending',
  reversed                  BOOLEAN NOT NULL DEFAULT FALSE,
  reversed_by               UUID,
  reversed_at               TIMESTAMPTZ,
  reversal_reason           TEXT,
  requires_manager          BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by               UUID,
  approved_at               TIMESTAMPTZ,
  idempotency_key           TEXT NOT NULL,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  redeemed_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key, venue_id)
);
CREATE INDEX IF NOT EXISTS idx_pos360_redemptions_customer ON pos360_loyalty_reward_redemptions (customer_id);
CREATE INDEX IF NOT EXISTS idx_pos360_redemptions_loyalty ON pos360_loyalty_reward_redemptions (loyalty_profile_id);

-- ── Loyalty Adjustments (manager-approved) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_loyalty_adjustments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id               UUID NOT NULL REFERENCES pos360_customers(id),
  loyalty_profile_id        UUID NOT NULL REFERENCES pos360_loyalty_profiles(id),
  requested_by              UUID NOT NULL,
  adjustment_type           TEXT NOT NULL, -- add, subtract, reset, tier_override
  points_delta              BIGINT NOT NULL,
  reason                    TEXT NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'pending_manager',
  approved_by               UUID,
  approved_at               TIMESTAMPTZ,
  rejected_at               TIMESTAMPTZ,
  rejection_reason          TEXT,
  requires_manager          BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key           TEXT NOT NULL,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key, venue_id)
);
CREATE INDEX IF NOT EXISTS idx_pos360_adjustments_venue ON pos360_loyalty_adjustments (venue_id, status);

-- ── Guest SmokeCraft Links ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_smokecraft_links (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id               UUID NOT NULL REFERENCES pos360_customers(id),
  smokecraft_user_id        TEXT,
  smokecraft_passport_id    TEXT,
  link_status               TEXT NOT NULL DEFAULT 'unlinked',
  linked_at                 TIMESTAMPTZ,
  unlinked_at               TIMESTAMPTZ,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_smokecraft_links_customer ON pos360_guest_smokecraft_links (customer_id);

-- ── Guest E.A.T. Insights ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_eat_insights (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id               UUID NOT NULL REFERENCES pos360_customers(id),
  insight_type              TEXT NOT NULL, -- value_score, churn_risk, vip_alert, reward_recommendation, upsell, service_recovery, segmentation
  insight_source            TEXT NOT NULL DEFAULT 'placeholder',
  insight_data              JSONB NOT NULL DEFAULT '{}',
  is_actionable             BOOLEAN NOT NULL DEFAULT FALSE,
  actioned                  BOOLEAN NOT NULL DEFAULT FALSE,
  actioned_at               TIMESTAMPTZ,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_eat_insights_customer ON pos360_guest_eat_insights (customer_id, created_at DESC);

-- ── Guest Service Recovery ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_service_recovery (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id               UUID NOT NULL REFERENCES pos360_customers(id),
  triggered_by              UUID NOT NULL,
  recovery_type             TEXT NOT NULL, -- comp, reward_bonus, apology_note, manager_visit
  order_id                  UUID,
  reason                    TEXT NOT NULL,
  resolution_notes          TEXT,
  status                    TEXT NOT NULL DEFAULT 'open',
  resolved_at               TIMESTAMPTZ,
  requires_manager          BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by               UUID,
  approved_at               TIMESTAMPTZ,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_service_recovery_venue ON pos360_guest_service_recovery (venue_id, status);
CREATE INDEX IF NOT EXISTS idx_pos360_service_recovery_customer ON pos360_guest_service_recovery (customer_id);

-- ── Guest Offline Queue ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_offline_queue (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  action_type               TEXT NOT NULL,
  payload                   JSONB NOT NULL DEFAULT '{}',
  status                    TEXT NOT NULL DEFAULT 'queued',
  replayed_at               TIMESTAMPTZ,
  idempotency_key           TEXT NOT NULL,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key, venue_id)
);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_offline_venue ON pos360_guest_offline_queue (venue_id, status);

-- ── Guest Audit ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_audit (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  actor_id                  UUID NOT NULL,
  customer_id               UUID,
  event_type                TEXT NOT NULL,
  area                      TEXT NOT NULL DEFAULT 'guest',
  payload                   JSONB NOT NULL DEFAULT '{}',
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_audit_venue ON pos360_guest_audit (venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_audit_customer ON pos360_guest_audit (customer_id) WHERE customer_id IS NOT NULL;
