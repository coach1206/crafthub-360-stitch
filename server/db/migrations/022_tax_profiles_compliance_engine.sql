-- Migration 022: Tax Profiles and Compliance Engine
-- Tables: venue_tax_profiles, venue_tax_jurisdictions, venue_tax_categories,
--         venue_tax_rules, partner_vendor_tax_profiles, order_tax_calculation_logs,
--         tax_exemption_records, tax_audit_logs
--
-- This migration supports tax calculation previews and readiness checks.
-- It does not provide legal tax advice or guarantee tax compliance.

-- 1. Venue Tax Profiles
CREATE TABLE IF NOT EXISTS venue_tax_profiles (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                   TEXT UNIQUE NOT NULL,
  profile_status             TEXT NOT NULL DEFAULT 'tax_profile_required',
  tax_collection_status      TEXT NOT NULL DEFAULT 'tax_collection_pending',
  default_state              TEXT,
  default_city               TEXT,
  default_county             TEXT,
  business_tax_id_status     TEXT NOT NULL DEFAULT 'tax_id_not_verified',
  compliance_review_status   TEXT NOT NULL DEFAULT 'compliance_review_required',
  notes                      TEXT,
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT venue_tax_profile_status_check
    CHECK (profile_status IN ('tax_profile_required','tax_config_required',
      'tax_calculation_ready','compliance_review_required')),
  CONSTRAINT venue_tax_collection_status_check
    CHECK (tax_collection_status IN ('tax_collection_pending','tax_not_collected',
      'tax_collection_active','compliance_review_required'))
);

CREATE INDEX IF NOT EXISTS idx_venue_tax_profiles_venue_id ON venue_tax_profiles (venue_id);

-- 2. Venue Tax Jurisdictions
CREATE TABLE IF NOT EXISTS venue_tax_jurisdictions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id            TEXT NOT NULL,
  country             TEXT DEFAULT 'US',
  state               TEXT,
  county              TEXT,
  city                TEXT,
  postal_code         TEXT,
  jurisdiction_status TEXT NOT NULL DEFAULT 'jurisdiction_required',
  source_status       TEXT NOT NULL DEFAULT 'manual_config_required',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT venue_tax_jurisdiction_status_check
    CHECK (jurisdiction_status IN ('jurisdiction_required','jurisdiction_configured',
      'jurisdiction_verified','compliance_review_required')),
  CONSTRAINT venue_tax_jurisdiction_source_check
    CHECK (source_status IN ('manual_config_required','manual_configured',
      'third_party_required','third_party_configured'))
);

CREATE INDEX IF NOT EXISTS idx_venue_tax_jurisdictions_venue_id ON venue_tax_jurisdictions (venue_id);

-- 3. Venue Tax Categories
CREATE TABLE IF NOT EXISTS venue_tax_categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id         TEXT NOT NULL,
  category_code    TEXT NOT NULL,
  category_name    TEXT NOT NULL,
  applies_to       TEXT,
  category_status  TEXT NOT NULL DEFAULT 'tax_category_required',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT venue_tax_category_code_check
    CHECK (category_code IN ('tobacco','cigar','alcohol','food','beverage','merchandise',
      'ticket','service_fee','delivery_fee','membership','tasting_flight','event_admission',
      'general')),
  CONSTRAINT venue_tax_category_status_check
    CHECK (category_status IN ('tax_category_required','tax_category_configured',
      'tax_exemption_required','compliance_review_required'))
);

CREATE INDEX IF NOT EXISTS idx_venue_tax_categories_venue_id ON venue_tax_categories (venue_id);

-- 4. Venue Tax Rules
CREATE TABLE IF NOT EXISTS venue_tax_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id          TEXT NOT NULL,
  jurisdiction_id   UUID,
  category_code     TEXT NOT NULL,
  rate_basis        TEXT DEFAULT 'percentage',
  tax_rate          NUMERIC,
  fixed_fee         INTEGER DEFAULT 0,
  compound_tax      BOOLEAN DEFAULT FALSE,
  included_in_price BOOLEAN DEFAULT FALSE,
  rule_status       TEXT NOT NULL DEFAULT 'tax_rule_missing',
  effective_start   TIMESTAMPTZ,
  effective_end     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT venue_tax_rule_status_check
    CHECK (rule_status IN ('tax_rule_missing','tax_rule_configured',
      'tax_rule_pending','compliance_review_required')),
  CONSTRAINT venue_tax_rule_rate_basis_check
    CHECK (rate_basis IN ('percentage','fixed','compound','included'))
);

CREATE INDEX IF NOT EXISTS idx_venue_tax_rules_venue_id ON venue_tax_rules (venue_id);

-- 5. Partner Vendor Tax Profiles
CREATE TABLE IF NOT EXISTS partner_vendor_tax_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id                  TEXT NOT NULL,
  venue_id                    TEXT,
  profile_status              TEXT NOT NULL DEFAULT 'partner_tax_profile_required',
  tax_collection_status       TEXT NOT NULL DEFAULT 'tax_collection_pending',
  merchant_of_record_status   TEXT NOT NULL DEFAULT 'merchant_of_record_required',
  notes                       TEXT,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT partner_tax_profile_status_check
    CHECK (profile_status IN ('partner_tax_profile_required','partner_tax_profile_configured',
      'compliance_review_required')),
  CONSTRAINT partner_merchant_of_record_check
    CHECK (merchant_of_record_status IN ('merchant_of_record_required','venue_is_merchant_of_record',
      'partner_is_merchant_of_record','compliance_review_required'))
);

CREATE INDEX IF NOT EXISTS idx_partner_tax_profiles_partner_id ON partner_vendor_tax_profiles (partner_id);

-- 6. Order Tax Calculation Logs
CREATE TABLE IF NOT EXISTS order_tax_calculation_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              TEXT,
  venue_id              TEXT,
  partner_id            TEXT,
  calculation_status    TEXT NOT NULL DEFAULT 'tax_preview',
  subtotal_amount       INTEGER,
  taxable_amount        INTEGER,
  tax_amount            INTEGER,
  fees_tax_amount       INTEGER,
  total_amount          INTEGER,
  jurisdiction_snapshot JSONB DEFAULT '{}',
  rule_snapshot         JSONB DEFAULT '{}',
  line_item_snapshot    JSONB DEFAULT '[]',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT order_tax_calc_status_check
    CHECK (calculation_status IN ('tax_preview','tax_estimate','tax_calculation_ready',
      'tax_rule_missing','jurisdiction_required','compliance_review_required'))
);

-- 7. Tax Exemption Records
CREATE TABLE IF NOT EXISTS tax_exemption_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id              TEXT,
  partner_id            TEXT,
  exemption_status      TEXT NOT NULL DEFAULT 'tax_exemption_required',
  exemption_type        TEXT,
  certificate_reference TEXT,
  effective_start       TIMESTAMPTZ,
  effective_end         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tax_exemption_status_check
    CHECK (exemption_status IN ('tax_exemption_required','tax_exemption_pending',
      'tax_exempt','exemption_expired','compliance_review_required'))
);

-- 8. Tax Audit Logs
CREATE TABLE IF NOT EXISTS tax_audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     TEXT,
  actor_role   TEXT,
  entity_type  TEXT,
  entity_id    TEXT,
  action       TEXT,
  status       TEXT DEFAULT 'audit_logged',
  details      JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tax_audit_status_check
    CHECK (status IN ('audit_logged','audit_preview','failed'))
);
