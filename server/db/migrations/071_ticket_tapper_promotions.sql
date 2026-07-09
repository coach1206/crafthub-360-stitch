-- Migration 071: Ticket Tapper Promotions Backend
-- Safe: CREATE TABLE IF NOT EXISTS only. No DROP, no TRUNCATE, no ALTER DROP.

CREATE TABLE IF NOT EXISTS ticket_tapper_promotions (
  promotion_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id            TEXT NOT NULL,
  tenant_id           TEXT,
  title               TEXT NOT NULL,
  subtitle            TEXT,
  description         TEXT,
  promotion_type      TEXT NOT NULL CHECK (promotion_type IN ('cigar_special','drink_special','food_pairing','partner_special','house_feature')),
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','ended','archived')),
  promoted_by_role    TEXT CHECK (promoted_by_role IN ('manager','bartender','cook','server','owner','admin')),
  special_price       NUMERIC(10,2),
  regular_price       NUMERIC(10,2),
  discount_amount     NUMERIC(10,2),
  call_to_action      TEXT,
  image_path          TEXT,
  badge_label         TEXT,
  starts_at           TIMESTAMPTZ,
  ends_at             TIMESTAMPTZ,
  created_by_staff_id TEXT,
  approval_status     TEXT DEFAULT 'auto_approved' CHECK (approval_status IN ('auto_approved','pending_approval','approved','rejected')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_tapper_promotion_rules (
  rule_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id        UUID NOT NULL REFERENCES ticket_tapper_promotions(promotion_id) ON DELETE CASCADE,
  rule_type           TEXT NOT NULL CHECK (rule_type IN ('inventory_guard','approval_required','partner_opt_in','time_window','quantity_limit')),
  rule_config         JSONB NOT NULL DEFAULT '{}',
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_tapper_promotion_redemptions (
  redemption_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id        UUID NOT NULL REFERENCES ticket_tapper_promotions(promotion_id) ON DELETE CASCADE,
  venue_id            TEXT NOT NULL,
  guest_id            TEXT,
  smokecraft_session_id TEXT,
  redemption_mode     TEXT NOT NULL DEFAULT 'smokecraft_guest' CHECK (redemption_mode IN ('smokecraft_guest','staff_applied','manager_comp','system_auto')),
  quantity            INTEGER NOT NULL DEFAULT 1,
  unit_price          NUMERIC(10,2),
  metadata            JSONB DEFAULT '{}',
  redeemed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_tapper_management_audit_log (
  audit_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id        UUID REFERENCES ticket_tapper_promotions(promotion_id) ON DELETE SET NULL,
  venue_id            TEXT,
  event_type          TEXT NOT NULL,
  performed_by        TEXT,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tt_promotions_venue_status ON ticket_tapper_promotions(venue_id, status);
CREATE INDEX IF NOT EXISTS idx_tt_redemptions_promotion ON ticket_tapper_promotion_redemptions(promotion_id);
CREATE INDEX IF NOT EXISTS idx_tt_audit_log_created ON ticket_tapper_management_audit_log(created_at DESC);
