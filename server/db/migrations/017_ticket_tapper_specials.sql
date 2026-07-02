-- ============================================================
-- Migration 017 — Ticket Tapper Specials Production Schema
-- Phase: 9 — Production Readiness
--
-- New tables:
--   ticket_tapper_specials         — staff-created specials per venue
--   ticket_tapper_special_events   — customer/staff tracking events
--   ticket_tapper_inventory        — per-venue special item inventory
--   money_bridge_partner_food_events — partner food commission ledger
--   venue_tax_config               — per-venue/state tax configuration
--   venue_feature_settings         — per-venue feature opt-in/opt-out
--
-- Safe to run multiple times (all CREATE TABLE IF NOT EXISTS).
-- Apply externally before deploy.
-- ============================================================

BEGIN;

-- ── ticket_tapper_specials ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_tapper_specials (
  id                    BIGSERIAL     PRIMARY KEY,
  special_id            TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id              TEXT          NOT NULL,
  title                 TEXT          NOT NULL,
  subtitle              TEXT,
  description           TEXT,
  special_type          TEXT          NOT NULL,          -- drink_special | cigar_special | partner_food_pairing | partner_food_special
  source_type           TEXT          NOT NULL DEFAULT 'venue',  -- venue | partner_network
  source_screen         TEXT,                             -- venue_commerce | ticket_tapper
  badge_label           TEXT,
  image_url             TEXT,
  call_to_action_label  TEXT,
  staff_role            TEXT,                             -- manager | bartender | cook | server | owner | admin
  staff_id              TEXT,
  staff_name            TEXT,
  partner_id            TEXT,
  partner_name          TEXT,
  partner_logo_url      TEXT,
  partner_order_url     TEXT,
  is_partner_special    BOOLEAN       NOT NULL DEFAULT FALSE,
  commission_eligible   BOOLEAN       NOT NULL DEFAULT FALSE,
  retail_price          NUMERIC(10,2),
  special_price         NUMERIC(10,2),
  discount_amount       NUMERIC(10,2) GENERATED ALWAYS AS (
                          GREATEST(0, COALESCE(retail_price, 0) - COALESCE(special_price, 0))
                        ) STORED,
  quantity_limit        INTEGER,
  active_quantity       INTEGER       NOT NULL DEFAULT 0,
  low_stock_threshold   INTEGER       NOT NULL DEFAULT 3,
  allow_oversell        BOOLEAN       NOT NULL DEFAULT FALSE,
  status                TEXT          NOT NULL DEFAULT 'draft',
    -- draft | pending_approval | approved | active | paused | ended | rejected | expired | sold_out | hidden
  priority              INTEGER       NOT NULL DEFAULT 1,
  promoted_by_role      TEXT,
  approval_required     BOOLEAN       NOT NULL DEFAULT FALSE,
  approval_status       TEXT,
    -- pending_approval | approved | rejected
  approval_submitted_by_id   TEXT,
  approval_submitted_by_name TEXT,
  approval_submitted_by_role TEXT,
  approval_reviewed_by_id    TEXT,
  approval_reviewed_by_name  TEXT,
  approval_reviewed_by_role  TEXT,
  approval_reviewed_at       TIMESTAMPTZ,
  approval_note              TEXT,
  rejection_reason           TEXT,
  money_bridge_active   BOOLEAN       NOT NULL DEFAULT FALSE,
  money_bridge_json     JSONB,
  items_json            JSONB,
  starts_at             TIMESTAMPTZ,
  ends_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by            TEXT,
  updated_by            TEXT
);

CREATE INDEX IF NOT EXISTS idx_tts_venue_status   ON ticket_tapper_specials (venue_id, status);
CREATE INDEX IF NOT EXISTS idx_tts_venue_type     ON ticket_tapper_specials (venue_id, special_type);
CREATE INDEX IF NOT EXISTS idx_tts_approval       ON ticket_tapper_specials (venue_id, approval_status) WHERE approval_required = TRUE;
CREATE INDEX IF NOT EXISTS idx_tts_partner        ON ticket_tapper_specials (partner_id) WHERE is_partner_special = TRUE;

-- ── ticket_tapper_special_events ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_tapper_special_events (
  id                          BIGSERIAL     PRIMARY KEY,
  event_id                    TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id                    TEXT          NOT NULL,
  special_id                  TEXT,
  event_type                  TEXT          NOT NULL,
    -- special_view | special_tap | special_added | special_sold_out_blocked
    -- special_inventory_low | special_checkout | special_removed
    -- special_draft_created | special_submitted_for_approval
    -- special_approved | special_rejected | special_published_live
  customer_session_id         TEXT,
  staff_id                    TEXT,
  staff_role                  TEXT,
  cart_id                     TEXT,
  order_id                    TEXT,
  quantity                    INTEGER       NOT NULL DEFAULT 1,
  revenue_amount              NUMERIC(10,2) NOT NULL DEFAULT 0,
  smokecraft_commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  venue_referral_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  partner_payout_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  money_bridge_json           JSONB,
  settlement_status           TEXT          NOT NULL DEFAULT 'pending_preview',
    -- pending_preview | settlement_pending | integration_required
  source_screen               TEXT,
  order_mode                  TEXT,         -- customer_self_order | staff_assisted_order | waitress_handoff
  metadata_json               JSONB,
  created_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ttse_venue_type    ON ticket_tapper_special_events (venue_id, event_type);
CREATE INDEX IF NOT EXISTS idx_ttse_special       ON ticket_tapper_special_events (special_id);
CREATE INDEX IF NOT EXISTS idx_ttse_order         ON ticket_tapper_special_events (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ttse_created       ON ticket_tapper_special_events (created_at DESC);

-- ── ticket_tapper_inventory ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_tapper_inventory (
  id                   BIGSERIAL     PRIMARY KEY,
  inventory_id         TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id             TEXT          NOT NULL,
  item_id              TEXT          NOT NULL,
  item_name            TEXT          NOT NULL,
  item_type            TEXT          NOT NULL,   -- cigar | drink | food | partner_food | bundle
  source_type          TEXT          NOT NULL DEFAULT 'venue',
  source_screen        TEXT,
  partner_id           TEXT,
  total_quantity       INTEGER       NOT NULL DEFAULT 0,
  reserved_quantity    INTEGER       NOT NULL DEFAULT 0,
  sold_quantity        INTEGER       NOT NULL DEFAULT 0,
  available_quantity   INTEGER       GENERATED ALWAYS AS (
                         GREATEST(0, total_quantity - reserved_quantity - sold_quantity)
                       ) STORED,
  low_stock_threshold  INTEGER       NOT NULL DEFAULT 3,
  allow_oversell       BOOLEAN       NOT NULL DEFAULT FALSE,
  status               TEXT          NOT NULL DEFAULT 'available',
    -- available | low_stock | sold_out | discontinued | pos_sync_required
  pos_sync_status      TEXT          NOT NULL DEFAULT 'provider_not_connected',
    -- provider_not_connected | preview_inventory | connected_pending_sync | synced_from_provider | sync_required
  last_pos_sync_at     TIMESTAMPTZ,
  pos_provider         TEXT,         -- square | toast | clover | lightspeed | shopify_pos | custom_pos360 | manual_eat
  pos_item_ref         TEXT,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (venue_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_tti_venue_status   ON ticket_tapper_inventory (venue_id, status);
CREATE INDEX IF NOT EXISTS idx_tti_pos_sync       ON ticket_tapper_inventory (venue_id, pos_sync_status);

-- ── money_bridge_partner_food_events ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS money_bridge_partner_food_events (
  id                          BIGSERIAL     PRIMARY KEY,
  event_id                    TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id                    TEXT          NOT NULL,
  partner_id                  TEXT          NOT NULL,
  partner_name                TEXT,
  source_screen               TEXT,
  special_id                  TEXT,
  cart_id                     TEXT,
  order_id                    TEXT,
  partner_food_subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
  smokecraft_commission_rate  NUMERIC(5,4)  NOT NULL DEFAULT 0.10,
  venue_referral_rate         NUMERIC(5,4)  NOT NULL DEFAULT 0.05,
  partner_payout_rate         NUMERIC(5,4)  NOT NULL DEFAULT 0.85,
  smokecraft_commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  venue_referral_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  partner_payout_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_routing_fee        NUMERIC(10,2) NOT NULL DEFAULT 4.50,
  taxable_base                NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate                    NUMERIC(6,4)  NOT NULL DEFAULT 0.085,
  tax_amount                  NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_status                  TEXT          NOT NULL DEFAULT 'preview_only',
    -- preview_only | venue_config | state_config
  total_customer_charge       NUMERIC(10,2) NOT NULL DEFAULT 0,
  settlement_status           TEXT          NOT NULL DEFAULT 'pending_preview',
    -- pending_preview | settlement_pending | integration_required
  settlement_processor        TEXT,         -- null until real integration exists
  settlement_reference        TEXT,         -- null until real integration exists
  money_bridge_json           JSONB,
  created_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mbpfe_venue        ON money_bridge_partner_food_events (venue_id);
CREATE INDEX IF NOT EXISTS idx_mbpfe_partner      ON money_bridge_partner_food_events (partner_id);
CREATE INDEX IF NOT EXISTS idx_mbpfe_order        ON money_bridge_partner_food_events (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mbpfe_settlement   ON money_bridge_partner_food_events (settlement_status);

-- ── venue_tax_config ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venue_tax_config (
  id                          BIGSERIAL     PRIMARY KEY,
  config_id                   TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id                    TEXT          NOT NULL UNIQUE,
  state                       TEXT,                          -- e.g. 'TX', 'CA', 'NY'
  local_tax_rate              NUMERIC(6,4),                  -- e.g. 0.0825 for 8.25%
  state_tax_rate              NUMERIC(6,4),
  county_tax_rate             NUMERIC(6,4),
  combined_tax_rate           NUMERIC(6,4),                  -- computed or overridden
  partner_food_taxable        BOOLEAN       NOT NULL DEFAULT TRUE,
  delivery_fee_taxable        BOOLEAN       NOT NULL DEFAULT FALSE,
  fallback_preview_rate       NUMERIC(6,4)  NOT NULL DEFAULT 0.085,
  taxable_base_rules          JSONB,
  is_verified                 BOOLEAN       NOT NULL DEFAULT FALSE,
  verified_at                 TIMESTAMPTZ,
  verified_by                 TEXT,
  created_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── venue_feature_settings ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venue_feature_settings (
  id                               BIGSERIAL     PRIMARY KEY,
  settings_id                      TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id                         TEXT          NOT NULL UNIQUE,
  ticket_tapper_partner_specials_enabled   BOOLEAN  NOT NULL DEFAULT FALSE,
  enabled_at                       TIMESTAMPTZ,
  trial_expires_at                 TIMESTAMPTZ,   -- enabled_at + 30 days
  auto_renew_enabled               BOOLEAN       NOT NULL DEFAULT TRUE,
  cancellation_requested_at        TIMESTAMPTZ,
  cancelled_at                     TIMESTAMPTZ,
  status                           TEXT          NOT NULL DEFAULT 'disabled',
    -- disabled | trial_active | cancellation_pending | active_renewing | cancelled | expired
  enabled_by                       TEXT,
  cancelled_by                     TEXT,
  notes                            TEXT,
  created_at                       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMIT;
