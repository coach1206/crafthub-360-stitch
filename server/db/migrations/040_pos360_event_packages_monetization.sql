-- Migration 040: POS360 Event Packages, Deposits, Minimum Spend, Venue Monetization & Contract Intelligence
-- Phase B.10 Prompt W
-- Uses CREATE TABLE IF NOT EXISTS. No DROP TABLE. No destructive column changes.

-- Event package categories
CREATE TABLE IF NOT EXISTS pos360_event_package_categories (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  name                TEXT NOT NULL,
  category_type       TEXT NOT NULL CHECK (category_type IN ('kitchen','bar','humidor','cigar','lounge','patio','room','service','entertainment','custom','other')),
  description         TEXT,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  display_order       INTEGER NOT NULL DEFAULT 0,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_by          TEXT,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_event_pkg_categories_venue ON pos360_event_package_categories(venue_id);
CREATE INDEX IF NOT EXISTS idx_event_pkg_categories_type ON pos360_event_package_categories(category_type);

-- Event packages
CREATE TABLE IF NOT EXISTS pos360_event_packages (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  category_id                 INTEGER REFERENCES pos360_event_package_categories(id),
  package_name                TEXT NOT NULL,
  package_code                TEXT,
  description                 TEXT,
  package_type                TEXT NOT NULL DEFAULT 'custom',
  base_price                  NUMERIC(12,2) NOT NULL DEFAULT 0,
  pricing_model               TEXT NOT NULL DEFAULT 'flat_fee' CHECK (pricing_model IN ('flat_fee','per_person','tiered','minimum_spend','custom_quote')),
  min_guest_count             INTEGER,
  max_guest_count             INTEGER,
  taxable                     BOOLEAN NOT NULL DEFAULT TRUE,
  service_fee_applicable      BOOLEAN NOT NULL DEFAULT FALSE,
  gratuity_applicable         BOOLEAN NOT NULL DEFAULT FALSE,
  requires_manager_approval   BOOLEAN NOT NULL DEFAULT FALSE,
  active                      BOOLEAN NOT NULL DEFAULT TRUE,
  status                      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','inactive','archived')),
  terms_snapshot              JSONB NOT NULL DEFAULT '{}',
  inventory_forecast_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                    JSONB NOT NULL DEFAULT '{}',
  idempotency_key             TEXT UNIQUE,
  created_by                  TEXT,
  updated_by                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_event_packages_venue ON pos360_event_packages(venue_id);
CREATE INDEX IF NOT EXISTS idx_event_packages_category ON pos360_event_packages(category_id);
CREATE INDEX IF NOT EXISTS idx_event_packages_status ON pos360_event_packages(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_packages_idem ON pos360_event_packages(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Package items
CREATE TABLE IF NOT EXISTS pos360_event_package_items (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  package_id          INTEGER NOT NULL REFERENCES pos360_event_packages(id),
  item_name           TEXT NOT NULL,
  item_type           TEXT NOT NULL DEFAULT 'other' CHECK (item_type IN ('food','beverage','cigar','humidor','room','staffing','entertainment','service','other')),
  quantity            NUMERIC(12,4) NOT NULL DEFAULT 1,
  unit                TEXT,
  included            BOOLEAN NOT NULL DEFAULT TRUE,
  upcharge_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  inventory_item_id   TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  idempotency_key     TEXT,
  created_by          TEXT,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_event_pkg_items_venue ON pos360_event_package_items(venue_id);
CREATE INDEX IF NOT EXISTS idx_event_pkg_items_package ON pos360_event_package_items(package_id);

-- Package pricing rules
CREATE TABLE IF NOT EXISTS pos360_event_package_pricing_rules (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  package_id                  INTEGER NOT NULL REFERENCES pos360_event_packages(id),
  rule_name                   TEXT NOT NULL,
  rule_type                   TEXT NOT NULL CHECK (rule_type IN ('guest_count','date_time','day_of_week','season','room','custom','manager_override')),
  condition_payload           JSONB NOT NULL DEFAULT '{}',
  price_adjustment_type       TEXT NOT NULL CHECK (price_adjustment_type IN ('flat','percent','per_person')),
  price_adjustment_value      NUMERIC(12,4) NOT NULL DEFAULT 0,
  active                      BOOLEAN NOT NULL DEFAULT TRUE,
  requires_manager_approval   BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                    JSONB NOT NULL DEFAULT '{}',
  idempotency_key             TEXT,
  created_by                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_event_pricing_rules_venue ON pos360_event_package_pricing_rules(venue_id);
CREATE INDEX IF NOT EXISTS idx_event_pricing_rules_package ON pos360_event_package_pricing_rules(package_id);

-- Private event package selections (links Prompt V private_events to packages)
CREATE TABLE IF NOT EXISTS pos360_private_event_package_selections (
  id                      SERIAL PRIMARY KEY,
  tenant_id               TEXT,
  venue_id                TEXT NOT NULL,
  private_event_id        TEXT NOT NULL,
  package_id              INTEGER NOT NULL REFERENCES pos360_event_packages(id),
  selected_by             TEXT,
  selected_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  guest_count_snapshot    INTEGER,
  quoted_price            NUMERIC(12,2),
  final_price             NUMERIC(12,2),
  discount_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_reason         TEXT,
  approval_status         TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected','cancelled')),
  manager_approved_by     TEXT,
  manager_approved_at     TIMESTAMPTZ,
  status                  TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','proposed','approved','declined','cancelled','locked')),
  idempotency_key         TEXT,
  exposes_financial_data  BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                JSONB NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pkg_selections_venue ON pos360_private_event_package_selections(venue_id);
CREATE INDEX IF NOT EXISTS idx_pkg_selections_event ON pos360_private_event_package_selections(private_event_id);
CREATE INDEX IF NOT EXISTS idx_pkg_selections_package ON pos360_private_event_package_selections(package_id);
CREATE INDEX IF NOT EXISTS idx_pkg_selections_status ON pos360_private_event_package_selections(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pkg_selections_idem ON pos360_private_event_package_selections(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Package selection items (snapshot of included items at selection time)
CREATE TABLE IF NOT EXISTS pos360_private_event_package_selection_items (
  id              SERIAL PRIMARY KEY,
  tenant_id       TEXT,
  venue_id        TEXT NOT NULL,
  selection_id    INTEGER NOT NULL REFERENCES pos360_private_event_package_selections(id),
  item_snapshot   JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pkg_sel_items_selection ON pos360_private_event_package_selection_items(selection_id);

-- Deposit policies
CREATE TABLE IF NOT EXISTS pos360_event_deposit_policies (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  policy_name                 TEXT NOT NULL,
  deposit_type                TEXT NOT NULL DEFAULT 'flat_fee' CHECK (deposit_type IN ('flat_fee','percent_of_total','per_person','custom')),
  deposit_value               NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_days_before_event       INTEGER NOT NULL DEFAULT 30,
  refundable                  BOOLEAN NOT NULL DEFAULT FALSE,
  refund_policy_days          INTEGER,
  requires_manager_approval   BOOLEAN NOT NULL DEFAULT FALSE,
  active                      BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                    JSONB NOT NULL DEFAULT '{}',
  idempotency_key             TEXT,
  created_by                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deposit_policies_venue ON pos360_event_deposit_policies(venue_id);

-- Deposit records
CREATE TABLE IF NOT EXISTS pos360_event_deposit_records (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  private_event_id            TEXT NOT NULL,
  deposit_policy_id           INTEGER REFERENCES pos360_event_deposit_policies(id),
  deposit_amount              NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposit_due_date            DATE,
  deposit_status              TEXT NOT NULL DEFAULT 'pending' CHECK (deposit_status IN ('not_required','pending','marked_paid_external','waived','refunded_external','failed','cancelled')),
  payment_provider            TEXT,
  external_payment_reference  TEXT,
  processed_externally        BOOLEAN NOT NULL DEFAULT FALSE,
  manager_approval_required   BOOLEAN NOT NULL DEFAULT FALSE,
  manager_approved_by         TEXT,
  manager_approved_at         TIMESTAMPTZ,
  reason                      TEXT,
  idempotency_key             TEXT,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                    JSONB NOT NULL DEFAULT '{}',
  created_by                  TEXT,
  updated_by                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deposit_records_venue ON pos360_event_deposit_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_deposit_records_event ON pos360_event_deposit_records(private_event_id);
CREATE INDEX IF NOT EXISTS idx_deposit_records_status ON pos360_event_deposit_records(deposit_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deposit_records_idem ON pos360_event_deposit_records(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Deposit status history
CREATE TABLE IF NOT EXISTS pos360_event_deposit_status_history (
  id              SERIAL PRIMARY KEY,
  tenant_id       TEXT,
  venue_id        TEXT NOT NULL,
  deposit_id      INTEGER NOT NULL REFERENCES pos360_event_deposit_records(id),
  from_status     TEXT,
  to_status       TEXT NOT NULL,
  changed_by      TEXT,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deposit_hist_deposit ON pos360_event_deposit_status_history(deposit_id);

-- Minimum spend rules
CREATE TABLE IF NOT EXISTS pos360_event_minimum_spend_rules (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  private_event_id    TEXT NOT NULL,
  rule_name           TEXT,
  minimum_spend_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  applies_to          TEXT NOT NULL DEFAULT 'total_event' CHECK (applies_to IN ('total_event','food_only','beverage_only','package_only','custom')),
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  metadata            JSONB NOT NULL DEFAULT '{}',
  idempotency_key     TEXT,
  created_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_min_spend_rules_venue ON pos360_event_minimum_spend_rules(venue_id);
CREATE INDEX IF NOT EXISTS idx_min_spend_rules_event ON pos360_event_minimum_spend_rules(private_event_id);

-- Minimum spend progress
CREATE TABLE IF NOT EXISTS pos360_event_minimum_spend_progress (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  private_event_id            TEXT NOT NULL UNIQUE,
  minimum_spend_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_linked_order_total  NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_manual_credit_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  remaining_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  satisfied                   BOOLEAN NOT NULL DEFAULT FALSE,
  satisfaction_source         TEXT NOT NULL DEFAULT 'none' CHECK (satisfaction_source IN ('none','linked_pos_orders','manual_manager_credit','imported','external')),
  manager_override_required   BOOLEAN NOT NULL DEFAULT FALSE,
  manager_approved_by         TEXT,
  manager_approved_at         TIMESTAMPTZ,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                    JSONB NOT NULL DEFAULT '{}',
  updated_by                  TEXT,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_min_spend_progress_venue ON pos360_event_minimum_spend_progress(venue_id);
CREATE INDEX IF NOT EXISTS idx_min_spend_progress_event ON pos360_event_minimum_spend_progress(private_event_id);

-- Contract templates
CREATE TABLE IF NOT EXISTS pos360_event_contract_templates (
  id              SERIAL PRIMARY KEY,
  tenant_id       TEXT,
  venue_id        TEXT NOT NULL,
  template_name   TEXT NOT NULL,
  template_body   TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  metadata        JSONB NOT NULL DEFAULT '{}',
  idempotency_key TEXT,
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contract_templates_venue ON pos360_event_contract_templates(venue_id);

-- Contract snapshots
CREATE TABLE IF NOT EXISTS pos360_event_contract_snapshots (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  private_event_id            TEXT NOT NULL,
  contract_template_id        INTEGER REFERENCES pos360_event_contract_templates(id),
  contract_snapshot_version   INTEGER NOT NULL DEFAULT 1,
  contract_status             TEXT NOT NULL DEFAULT 'draft' CHECK (contract_status IN ('draft','generated_placeholder','sent_external','viewed_external','signed_external','declined_external','expired','cancelled')),
  signer_name                 TEXT,
  signer_email                TEXT,
  signer_phone                TEXT,
  signed_externally           BOOLEAN NOT NULL DEFAULT FALSE,
  external_contract_provider  TEXT,
  external_contract_reference TEXT,
  terms_snapshot              JSONB NOT NULL DEFAULT '{}',
  cancellation_policy_snapshot JSONB NOT NULL DEFAULT '{}',
  deposit_policy_snapshot     JSONB NOT NULL DEFAULT '{}',
  package_snapshot            JSONB NOT NULL DEFAULT '{}',
  exposes_private_data        BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key             TEXT,
  created_by                  TEXT,
  updated_by                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contract_snapshots_venue ON pos360_event_contract_snapshots(venue_id);
CREATE INDEX IF NOT EXISTS idx_contract_snapshots_event ON pos360_event_contract_snapshots(private_event_id);
CREATE INDEX IF NOT EXISTS idx_contract_snapshots_status ON pos360_event_contract_snapshots(contract_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contract_snapshots_idem ON pos360_event_contract_snapshots(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Contract status history
CREATE TABLE IF NOT EXISTS pos360_event_contract_status_history (
  id              SERIAL PRIMARY KEY,
  tenant_id       TEXT,
  venue_id        TEXT NOT NULL,
  contract_id     INTEGER NOT NULL REFERENCES pos360_event_contract_snapshots(id),
  from_status     TEXT,
  to_status       TEXT NOT NULL,
  changed_by      TEXT,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contract_hist_contract ON pos360_event_contract_status_history(contract_id);

-- Cancellation policies
CREATE TABLE IF NOT EXISTS pos360_event_cancellation_policies (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  policy_name         TEXT NOT NULL,
  description         TEXT,
  cancellation_window_days INTEGER,
  fee_type            TEXT NOT NULL DEFAULT 'none' CHECK (fee_type IN ('none','flat_fee','percent_of_total','forfeited_deposit','custom')),
  fee_value           NUMERIC(12,2) NOT NULL DEFAULT 0,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  metadata            JSONB NOT NULL DEFAULT '{}',
  idempotency_key     TEXT,
  created_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cancel_policies_venue ON pos360_event_cancellation_policies(venue_id);

-- Package approval requests
CREATE TABLE IF NOT EXISTS pos360_event_package_approval_requests (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  private_event_id            TEXT,
  package_selection_id        INTEGER REFERENCES pos360_private_event_package_selections(id),
  deposit_record_id           INTEGER REFERENCES pos360_event_deposit_records(id),
  minimum_spend_progress_id   INTEGER REFERENCES pos360_event_minimum_spend_progress(id),
  approval_type               TEXT NOT NULL CHECK (approval_type IN ('package_discount','custom_package','deposit_waiver','deposit_refund','minimum_spend_override','signed_contract_change','cancellation_fee_waiver','package_price_override')),
  requested_by                TEXT NOT NULL,
  requested_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approval_status             TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected','cancelled')),
  manager_user_id             TEXT,
  manager_decision_at         TIMESTAMPTZ,
  reason                      TEXT,
  before_snapshot             JSONB NOT NULL DEFAULT '{}',
  after_snapshot              JSONB NOT NULL DEFAULT '{}',
  idempotency_key             TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approval_requests_venue ON pos360_event_package_approval_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_event ON pos360_event_package_approval_requests(private_event_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON pos360_event_package_approval_requests(approval_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_approval_requests_idem ON pos360_event_package_approval_requests(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Inventory forecasts
CREATE TABLE IF NOT EXISTS pos360_event_package_inventory_forecasts (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  private_event_id      TEXT NOT NULL,
  package_id            INTEGER REFERENCES pos360_event_packages(id),
  forecast_type         TEXT NOT NULL CHECK (forecast_type IN ('kitchen','bar','humidor','cigar','staffing','supplies','room','other')),
  forecast_payload      JSONB NOT NULL DEFAULT '{}',
  inventory_reserved    BOOLEAN NOT NULL DEFAULT FALSE,
  reservation_source    TEXT NOT NULL DEFAULT 'none' CHECK (reservation_source IN ('none','forecast_only','manual','external')),
  reviewed_by           TEXT,
  reviewed_at           TIMESTAMPTZ,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inv_forecasts_venue ON pos360_event_package_inventory_forecasts(venue_id);
CREATE INDEX IF NOT EXISTS idx_inv_forecasts_event ON pos360_event_package_inventory_forecasts(private_event_id);
CREATE INDEX IF NOT EXISTS idx_inv_forecasts_type ON pos360_event_package_inventory_forecasts(forecast_type);

-- POS order links
CREATE TABLE IF NOT EXISTS pos360_event_package_pos_order_links (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  private_event_id            TEXT NOT NULL,
  pos_order_id                TEXT,
  external_order_reference    TEXT,
  linked_order_total          NUMERIC(12,2) NOT NULL DEFAULT 0,
  counts_toward_minimum_spend BOOLEAN NOT NULL DEFAULT TRUE,
  link_status                 TEXT NOT NULL DEFAULT 'pending' CHECK (link_status IN ('pending','linked','removed','unavailable')),
  source                      TEXT,
  idempotency_key             TEXT,
  created_by                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pos_order_links_venue ON pos360_event_package_pos_order_links(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos_order_links_event ON pos360_event_package_pos_order_links(private_event_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_order_links_idem ON pos360_event_package_pos_order_links(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Monetization insights
CREATE TABLE IF NOT EXISTS pos360_event_monetization_insights (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  private_event_id            TEXT,
  insight_type                TEXT NOT NULL,
  insight_payload             JSONB NOT NULL DEFAULT '{}',
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  ai_confidence               NUMERIC(5,4),
  source                      TEXT NOT NULL DEFAULT 'system',
  honest_state                TEXT NOT NULL DEFAULT 'placeholder',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_monetization_insights_venue ON pos360_event_monetization_insights(venue_id);
CREATE INDEX IF NOT EXISTS idx_monetization_insights_event ON pos360_event_monetization_insights(private_event_id);
CREATE INDEX IF NOT EXISTS idx_monetization_insights_type ON pos360_event_monetization_insights(insight_type);

-- Offline queue
CREATE TABLE IF NOT EXISTS pos360_event_package_offline_queue (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  device_id           TEXT,
  actor_user_id       TEXT,
  action_type         TEXT NOT NULL,
  entity_type         TEXT,
  entity_id           TEXT,
  payload             JSONB NOT NULL DEFAULT '{}',
  sync_status         TEXT NOT NULL DEFAULT 'queued' CHECK (sync_status IN ('queued','syncing','synced','failed','conflict')),
  retry_count         INTEGER NOT NULL DEFAULT 0,
  idempotency_key     TEXT,
  synced_by           TEXT,
  synced_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_epkg_offline_venue ON pos360_event_package_offline_queue(venue_id);
CREATE INDEX IF NOT EXISTS idx_epkg_offline_status ON pos360_event_package_offline_queue(sync_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_epkg_offline_idem ON pos360_event_package_offline_queue(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Audit
CREATE TABLE IF NOT EXISTS pos360_event_package_audit (
  id                      SERIAL PRIMARY KEY,
  tenant_id               TEXT,
  venue_id                TEXT NOT NULL,
  actor_user_id           TEXT,
  action                  TEXT NOT NULL,
  entity_type             TEXT,
  entity_id               TEXT,
  before_snapshot         JSONB NOT NULL DEFAULT '{}',
  after_snapshot          JSONB NOT NULL DEFAULT '{}',
  reason                  TEXT,
  manager_override        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data    BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_epkg_audit_venue ON pos360_event_package_audit(venue_id);
CREATE INDEX IF NOT EXISTS idx_epkg_audit_entity ON pos360_event_package_audit(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_epkg_audit_created ON pos360_event_package_audit(created_at);
