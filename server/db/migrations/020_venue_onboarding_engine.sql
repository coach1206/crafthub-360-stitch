-- Migration 020: Venue Onboarding Engine
-- Tables: venue_profiles, venue_onboarding_status, venue_operating_settings,
--         venue_pos_preferences, venue_partner_specials_settings,
--         venue_staff_policy_settings, venue_onboarding_audit_logs

-- 1. Venue Profiles
CREATE TABLE IF NOT EXISTS venue_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id         TEXT UNIQUE NOT NULL,
  venue_name       TEXT NOT NULL,
  venue_type       TEXT,
  ownership_group_id TEXT,
  region           TEXT,
  market           TEXT,
  timezone         TEXT,
  address_line_1   TEXT,
  address_line_2   TEXT,
  city             TEXT,
  state            TEXT,
  postal_code      TEXT,
  country          TEXT DEFAULT 'US',
  phone            TEXT,
  website_url      TEXT,
  status           TEXT NOT NULL DEFAULT 'venue_profile_required',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  created_by       TEXT,
  updated_by       TEXT,
  CONSTRAINT venue_profiles_type_check
    CHECK (venue_type IN ('cigar_lounge','restaurant','bar','private_club','hotel',
      'event_venue','retailer','hybrid_venue','demo_venue') OR venue_type IS NULL),
  CONSTRAINT venue_profiles_status_check
    CHECK (status IN ('venue_profile_required','onboarding_in_progress','onboarding_complete',
      'paused','disabled','demo_only'))
);

CREATE INDEX IF NOT EXISTS idx_venue_profiles_venue_id ON venue_profiles (venue_id);

-- 2. Venue Onboarding Status
CREATE TABLE IF NOT EXISTS venue_onboarding_status (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                   TEXT UNIQUE NOT NULL,
  profile_status             TEXT DEFAULT 'venue_profile_required',
  pos_status                 TEXT DEFAULT 'pos_provider_required',
  payment_status             TEXT DEFAULT 'payment_onboarding_required',
  tax_status                 TEXT DEFAULT 'tax_profile_required',
  staff_status               TEXT DEFAULT 'staff_rules_required',
  partner_specials_status    TEXT DEFAULT 'partner_specials_disabled',
  manual_pos360_status       TEXT DEFAULT 'manual_mode_available',
  ticket_tapper_status       TEXT DEFAULT 'preview_fallback',
  money_bridge_status        TEXT DEFAULT 'settlement_pending_preview',
  eat_command_hub_status     TEXT DEFAULT 'contract_only',
  overall_status             TEXT DEFAULT 'onboarding_required',
  readiness_score            INTEGER DEFAULT 0,
  readiness_warnings_json    JSONB DEFAULT '[]',
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT venue_onboarding_overall_status_check
    CHECK (overall_status IN ('onboarding_required','onboarding_in_progress',
      'onboarding_complete','paused','blocked','demo_only'))
);

CREATE INDEX IF NOT EXISTS idx_venue_onboarding_status_venue_id ON venue_onboarding_status (venue_id);

-- 3. Venue Operating Settings
CREATE TABLE IF NOT EXISTS venue_operating_settings (
  id                                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                                     TEXT UNIQUE NOT NULL,
  default_order_mode                           TEXT DEFAULT 'manual_pos360',
  allow_customer_direct_order                  BOOLEAN DEFAULT TRUE,
  allow_staff_assisted_order                   BOOLEAN DEFAULT TRUE,
  require_staff_confirmation                   BOOLEAN DEFAULT TRUE,
  require_manager_approval_for_partner_items   BOOLEAN DEFAULT TRUE,
  allow_trusted_staff_publish_specials         BOOLEAN DEFAULT FALSE,
  default_routing_mode                         TEXT DEFAULT 'routing_preview',
  manual_mode_enabled                          BOOLEAN DEFAULT TRUE,
  customer_visible_sync_status                 BOOLEAN DEFAULT FALSE,
  staff_visible_sync_status                    BOOLEAN DEFAULT TRUE,
  created_at                                   TIMESTAMPTZ DEFAULT NOW(),
  updated_at                                   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT venue_operating_order_mode_check
    CHECK (default_order_mode IN ('manual_pos360','pos_provider','preview_only','hybrid')),
  CONSTRAINT venue_operating_routing_mode_check
    CHECK (default_routing_mode IN ('routing_preview','manual_route','pos_route','kds_route','partner_route'))
);

CREATE INDEX IF NOT EXISTS idx_venue_operating_settings_venue_id ON venue_operating_settings (venue_id);

-- 4. Venue POS Preferences
CREATE TABLE IF NOT EXISTS venue_pos_preferences (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                 TEXT UNIQUE NOT NULL,
  preferred_provider_name  TEXT DEFAULT 'manual_pos360',
  fallback_provider_name   TEXT DEFAULT 'manual_pos360',
  pos_connection_required  BOOLEAN DEFAULT FALSE,
  allow_manual_fallback    BOOLEAN DEFAULT TRUE,
  menu_sync_required       BOOLEAN DEFAULT FALSE,
  inventory_sync_required  BOOLEAN DEFAULT FALSE,
  order_push_required      BOOLEAN DEFAULT FALSE,
  selected_at              TIMESTAMPTZ,
  selected_by              TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT venue_pos_preferred_provider_check
    CHECK (preferred_provider_name IN ('square','toast','clover','lightspeed',
      'shopify_pos','manual_pos360','future_provider'))
);

CREATE INDEX IF NOT EXISTS idx_venue_pos_preferences_venue_id ON venue_pos_preferences (venue_id);

-- 5. Venue Partner Specials Settings
CREATE TABLE IF NOT EXISTS venue_partner_specials_settings (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                     TEXT UNIQUE NOT NULL,
  partner_specials_enabled     BOOLEAN DEFAULT FALSE,
  status                       TEXT DEFAULT 'partner_specials_disabled',
  enabled_at                   TIMESTAMPTZ,
  trial_started_at             TIMESTAMPTZ,
  trial_expires_at             TIMESTAMPTZ,
  auto_renew_enabled           BOOLEAN DEFAULT FALSE,
  cancellation_requested_at    TIMESTAMPTZ,
  cancelled_at                 TIMESTAMPTZ,
  require_manager_approval     BOOLEAN DEFAULT TRUE,
  allow_partner_food           BOOLEAN DEFAULT FALSE,
  allow_partner_merch          BOOLEAN DEFAULT FALSE,
  allow_partner_events         BOOLEAN DEFAULT FALSE,
  created_at                   TIMESTAMPTZ DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT venue_partner_specials_status_check
    CHECK (status IN ('partner_specials_disabled','partner_specials_trial_active',
      'cancellation_pending','partner_specials_active','cancelled','expired','blocked'))
);

CREATE INDEX IF NOT EXISTS idx_venue_partner_specials_venue_id ON venue_partner_specials_settings (venue_id);

-- 6. Venue Staff Policy Settings
CREATE TABLE IF NOT EXISTS venue_staff_policy_settings (
  id                                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                                        TEXT UNIQUE NOT NULL,
  manager_can_publish                             BOOLEAN DEFAULT TRUE,
  owner_can_publish                               BOOLEAN DEFAULT TRUE,
  admin_can_publish                               BOOLEAN DEFAULT TRUE,
  bartender_can_suggest                           BOOLEAN DEFAULT TRUE,
  cook_can_suggest                                BOOLEAN DEFAULT TRUE,
  server_can_suggest                              BOOLEAN DEFAULT TRUE,
  bartender_can_publish                           BOOLEAN DEFAULT FALSE,
  cook_can_publish                                BOOLEAN DEFAULT FALSE,
  server_can_publish                              BOOLEAN DEFAULT FALSE,
  require_manager_approval_for_staff_specials     BOOLEAN DEFAULT TRUE,
  require_manager_approval_for_inventory_adjustments BOOLEAN DEFAULT TRUE,
  created_at                                      TIMESTAMPTZ DEFAULT NOW(),
  updated_at                                      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venue_staff_policy_venue_id ON venue_staff_policy_settings (venue_id);

-- 7. Venue Onboarding Audit Logs
CREATE TABLE IF NOT EXISTS venue_onboarding_audit_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id             TEXT,
  actor_id             TEXT,
  actor_role           TEXT,
  action_type          TEXT,
  target_type          TEXT,
  target_id            TEXT,
  previous_value_json  JSONB DEFAULT '{}',
  new_value_json       JSONB DEFAULT '{}',
  status               TEXT DEFAULT 'audit_logged',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT venue_onboarding_audit_status_check
    CHECK (status IN ('audit_logged','preview_fallback','failed'))
);
