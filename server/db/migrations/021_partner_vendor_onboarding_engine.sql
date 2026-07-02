-- Migration 021: Partner Vendor Onboarding Engine
-- Tables: partner_vendor_profiles, partner_vendor_onboarding_status,
--         partner_vendor_venue_relationships, partner_vendor_products,
--         partner_vendor_product_availability, partner_vendor_fulfillment_rules,
--         partner_vendor_commission_agreements, partner_vendor_audit_logs

-- 1. Partner Vendor Profiles
CREATE TABLE IF NOT EXISTS partner_vendor_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id           TEXT UNIQUE NOT NULL,
  partner_name         TEXT NOT NULL,
  partner_type         TEXT NOT NULL,
  legal_business_name  TEXT,
  business_email       TEXT,
  business_phone       TEXT,
  website_url          TEXT,
  logo_url             TEXT,
  region               TEXT,
  market               TEXT,
  city                 TEXT,
  state                TEXT,
  country              TEXT DEFAULT 'US',
  status               TEXT NOT NULL DEFAULT 'partner_profile_required',
  onboarding_status    TEXT NOT NULL DEFAULT 'partner_onboarding_required',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  created_by           TEXT,
  updated_by           TEXT,
  CONSTRAINT partner_vendor_type_check
    CHECK (partner_type IN ('outside_food_vendor','cigar_distributor','cigar_manufacturer',
      'beverage_distributor','merch_vendor','event_partner','service_partner','demo_partner')),
  CONSTRAINT partner_vendor_status_check
    CHECK (status IN ('partner_profile_required','partner_pending_approval','partner_approved',
      'partner_blocked','partner_paused','demo_only')),
  CONSTRAINT partner_vendor_onboarding_status_check
    CHECK (onboarding_status IN ('partner_onboarding_required','partner_onboarding_in_progress',
      'partner_onboarding_complete','blocked','demo_only'))
);

CREATE INDEX IF NOT EXISTS idx_partner_vendor_profiles_partner_id ON partner_vendor_profiles (partner_id);

-- 2. Partner Vendor Onboarding Status
CREATE TABLE IF NOT EXISTS partner_vendor_onboarding_status (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id               TEXT UNIQUE NOT NULL,
  profile_status           TEXT DEFAULT 'partner_profile_required',
  payout_status            TEXT DEFAULT 'payout_onboarding_required',
  menu_status              TEXT DEFAULT 'menu_required',
  product_status           TEXT DEFAULT 'product_setup_required',
  availability_status      TEXT DEFAULT 'availability_required',
  fulfillment_status       TEXT DEFAULT 'fulfillment_rules_required',
  agreement_status         TEXT DEFAULT 'agreement_required',
  venue_approval_status    TEXT DEFAULT 'venue_approval_required',
  overall_status           TEXT DEFAULT 'partner_onboarding_required',
  readiness_score          INTEGER DEFAULT 0,
  readiness_warnings_json  JSONB DEFAULT '[]',
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT partner_vendor_overall_status_check
    CHECK (overall_status IN ('partner_onboarding_required','partner_onboarding_in_progress',
      'partner_onboarding_complete','blocked','demo_only'))
);

-- 3. Partner Vendor Venue Relationships
CREATE TABLE IF NOT EXISTS partner_vendor_venue_relationships (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id              TEXT NOT NULL,
  venue_id                TEXT NOT NULL,
  relationship_type       TEXT DEFAULT 'partner_specials',
  approval_status         TEXT DEFAULT 'venue_approval_required',
  approved_by             TEXT,
  approved_at             TIMESTAMPTZ,
  rejected_by             TEXT,
  rejected_at             TIMESTAMPTZ,
  rejection_reason        TEXT,
  commission_agreement_id TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT partner_venue_relationship_type_check
    CHECK (relationship_type IN ('partner_specials','food_fulfillment','distributor_supply',
      'manufacturer_campaign','event_partner','merch_sales','service_partner')),
  CONSTRAINT partner_venue_approval_status_check
    CHECK (approval_status IN ('venue_approval_required','partner_pending_approval','partner_approved',
      'partner_rejected','partner_blocked','partner_paused'))
);

CREATE INDEX IF NOT EXISTS idx_partner_venue_rel_partner_id ON partner_vendor_venue_relationships (partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_venue_rel_venue_id ON partner_vendor_venue_relationships (venue_id);

-- 4. Partner Vendor Products
CREATE TABLE IF NOT EXISTS partner_vendor_products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id           TEXT NOT NULL,
  product_id           TEXT UNIQUE NOT NULL,
  product_name         TEXT NOT NULL,
  product_type         TEXT NOT NULL,
  brand_name           TEXT,
  distributor_name     TEXT,
  manufacturer_name    TEXT,
  category             TEXT,
  subcategory          TEXT,
  description          TEXT,
  image_url            TEXT,
  base_price           INTEGER,
  currency             TEXT DEFAULT 'usd',
  tax_category         TEXT,
  commission_eligible  BOOLEAN DEFAULT TRUE,
  status               TEXT DEFAULT 'product_setup_required',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  created_by           TEXT,
  updated_by           TEXT,
  CONSTRAINT partner_product_type_check
    CHECK (product_type IN ('food_item','cigar_product','beverage_item','merchandise',
      'event_offer','service_offer','distributor_offer','manufacturer_offer')),
  CONSTRAINT partner_product_status_check
    CHECK (status IN ('product_setup_required','draft','pending_approval','active','paused','rejected','retired'))
);

CREATE INDEX IF NOT EXISTS idx_partner_products_partner_id ON partner_vendor_products (partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_product_id ON partner_vendor_products (product_id);

-- 5. Partner Vendor Product Availability
CREATE TABLE IF NOT EXISTS partner_vendor_product_availability (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id                   TEXT NOT NULL,
  product_id                   TEXT NOT NULL,
  venue_id                     TEXT,
  availability_status          TEXT DEFAULT 'availability_required',
  available_days_json          JSONB DEFAULT '[]',
  start_time                   TEXT,
  end_time                     TEXT,
  blackout_dates_json          JSONB DEFAULT '[]',
  quantity_limit               INTEGER,
  current_available_quantity   INTEGER,
  cutoff_minutes_before_close  INTEGER,
  created_at                   TIMESTAMPTZ DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT partner_availability_status_check
    CHECK (availability_status IN ('availability_required','available','unavailable','sold_out','paused','venue_specific'))
);

CREATE INDEX IF NOT EXISTS idx_partner_availability_partner_id ON partner_vendor_product_availability (partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_availability_product_id ON partner_vendor_product_availability (product_id);
CREATE INDEX IF NOT EXISTS idx_partner_availability_venue_id ON partner_vendor_product_availability (venue_id);

-- 6. Partner Vendor Fulfillment Rules
CREATE TABLE IF NOT EXISTS partner_vendor_fulfillment_rules (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id                      TEXT NOT NULL,
  venue_id                        TEXT,
  fulfillment_mode                TEXT DEFAULT 'management_review',
  default_destination_station     TEXT DEFAULT 'management_review',
  delivery_available              BOOLEAN DEFAULT FALSE,
  pickup_available                BOOLEAN DEFAULT TRUE,
  venue_pickup_allowed            BOOLEAN DEFAULT TRUE,
  estimated_prep_minutes          INTEGER,
  delivery_fee                    INTEGER DEFAULT 0,
  routing_fee                     INTEGER DEFAULT 450,
  requires_management_approval    BOOLEAN DEFAULT TRUE,
  requires_staff_acknowledgement  BOOLEAN DEFAULT TRUE,
  created_at                      TIMESTAMPTZ DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT partner_fulfillment_mode_check
    CHECK (fulfillment_mode IN ('partner_direct','venue_pickup','staff_assisted',
      'management_review','manual_pos360','future_kds')),
  CONSTRAINT partner_destination_station_check
    CHECK (default_destination_station IN ('partner','kitchen','bar','humidor',
      'server_pickup','management_review','manual_pos360'))
);

-- 7. Partner Vendor Commission Agreements
CREATE TABLE IF NOT EXISTS partner_vendor_commission_agreements (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id             TEXT UNIQUE NOT NULL,
  partner_id               TEXT NOT NULL,
  venue_id                 TEXT,
  agreement_type           TEXT DEFAULT 'partner_food_specials',
  smokecraft_commission_rate NUMERIC DEFAULT 0.10,
  venue_referral_rate      NUMERIC DEFAULT 0.05,
  partner_payout_rate      NUMERIC DEFAULT 0.85,
  routing_fee              INTEGER DEFAULT 450,
  tax_handling_status      TEXT DEFAULT 'tax_preview',
  agreement_status         TEXT DEFAULT 'agreement_required',
  starts_at                TIMESTAMPTZ,
  ends_at                  TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  created_by               TEXT,
  updated_by               TEXT,
  CONSTRAINT partner_agreement_type_check
    CHECK (agreement_type IN ('partner_food_specials','distributor_offer','manufacturer_campaign',
      'merch_sales','event_partner','service_partner')),
  CONSTRAINT partner_agreement_status_check
    CHECK (agreement_status IN ('agreement_required','draft','pending_approval','active','paused','expired','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_partner_agreements_partner_id ON partner_vendor_commission_agreements (partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_agreements_venue_id ON partner_vendor_commission_agreements (venue_id);

-- 8. Partner Vendor Audit Logs
CREATE TABLE IF NOT EXISTS partner_vendor_audit_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id           TEXT,
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
  CONSTRAINT partner_audit_status_check
    CHECK (status IN ('audit_logged','preview_fallback','failed'))
);
