-- Phase B.17: POS360 Customer Self-Ordering, QR Menus, Handheld POS Flow,
-- Table Ordering & Guest Checkout Handoff
-- CREATE TABLE IF NOT EXISTS only — safe, additive migration. No destructive changes.

-- QR menu sessions (guest scans QR at table)
CREATE TABLE IF NOT EXISTS pos360_qr_menu_sessions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  table_id                  UUID,
  section_id                UUID,
  reservation_id            UUID,
  waitlist_entry_id         UUID,
  private_event_id          UUID,
  qr_code_token             TEXT NOT NULL,
  session_status            TEXT NOT NULL DEFAULT 'active',
  menu_version_ref          TEXT,
  locale                    TEXT NOT NULL DEFAULT 'en-US',
  device_type               TEXT,
  guest_profile_id          UUID,
  customer_id               UUID,
  order_id                  UUID,
  smokecraft_session_id     UUID,
  generated_from_real_order BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Self-order carts (guest builds order before submitting)
CREATE TABLE IF NOT EXISTS pos360_self_order_carts (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  qr_session_id             UUID,
  table_id                  UUID,
  guest_profile_id          UUID,
  customer_id               UUID,
  cart_status               TEXT NOT NULL DEFAULT 'open',
  locale                    TEXT NOT NULL DEFAULT 'en-US',
  order_id                  UUID,
  payment_record_id         UUID,
  package_selection_id      UUID,
  smokecraft_session_id     UUID,
  self_order_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  payment_captured          BOOLEAN NOT NULL DEFAULT FALSE,
  kds_accepted              BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_deducted        BOOLEAN NOT NULL DEFAULT FALSE,
  external_sync_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  age_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Self-order cart items
CREATE TABLE IF NOT EXISTS pos360_self_order_cart_items (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  cart_id                   UUID NOT NULL,
  menu_item_id              UUID,
  inventory_item_id         UUID,
  item_name                 TEXT NOT NULL,
  item_type                 TEXT NOT NULL DEFAULT 'food',
  quantity                  INTEGER NOT NULL DEFAULT 1,
  unit_price_cents          INTEGER NOT NULL DEFAULT 0,
  modifier_snapshot         JSONB,
  special_instructions      TEXT,
  item_status               TEXT NOT NULL DEFAULT 'pending',
  requires_age_verification BOOLEAN NOT NULL DEFAULT FALSE,
  age_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_deducted        BOOLEAN NOT NULL DEFAULT FALSE,
  kds_accepted              BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Self-order submissions (cart → submitted order)
CREATE TABLE IF NOT EXISTS pos360_self_order_submissions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  cart_id                   UUID NOT NULL,
  table_id                  UUID,
  guest_profile_id          UUID,
  customer_id               UUID,
  qr_session_id             UUID,
  order_id                  UUID,
  submission_status         TEXT NOT NULL DEFAULT 'submitted_placeholder',
  staff_acknowledged        BOOLEAN NOT NULL DEFAULT FALSE,
  kds_accepted              BOOLEAN NOT NULL DEFAULT FALSE,
  self_order_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  payment_captured          BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_deducted        BOOLEAN NOT NULL DEFAULT FALSE,
  external_sync_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key           TEXT,
  submitted_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Handheld POS sessions (server/staff uses handheld device)
CREATE TABLE IF NOT EXISTS pos360_handheld_pos_sessions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  staff_profile_id          UUID,
  device_id                 TEXT,
  device_type               TEXT NOT NULL DEFAULT 'handheld',
  section_id                UUID,
  table_id                  UUID,
  session_status            TEXT NOT NULL DEFAULT 'active',
  order_id                  UUID,
  reservation_id            UUID,
  private_event_id          UUID,
  smokecraft_session_id     UUID,
  printer_connected         BOOLEAN NOT NULL DEFAULT FALSE,
  kds_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  external_sync_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key           TEXT,
  started_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at                  TIMESTAMPTZ,
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Handheld order entries (orders placed via handheld)
CREATE TABLE IF NOT EXISTS pos360_handheld_order_entries (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  handheld_session_id       UUID NOT NULL,
  table_id                  UUID,
  section_id                UUID,
  order_id                  UUID,
  staff_profile_id          UUID,
  entry_status              TEXT NOT NULL DEFAULT 'draft',
  kds_sent                  BOOLEAN NOT NULL DEFAULT FALSE,
  kds_accepted              BOOLEAN NOT NULL DEFAULT FALSE,
  printer_sent              BOOLEAN NOT NULL DEFAULT FALSE,
  printer_connected         BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_deducted        BOOLEAN NOT NULL DEFAULT FALSE,
  external_sync_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Table ordering sessions (server assigns orders to tables)
CREATE TABLE IF NOT EXISTS pos360_table_ordering_sessions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  table_id                  UUID NOT NULL,
  section_id                UUID,
  order_id                  UUID,
  reservation_id            UUID,
  waitlist_entry_id         UUID,
  private_event_id          UUID,
  package_selection_id      UUID,
  guest_profile_id          UUID,
  customer_id               UUID,
  staff_profile_id          UUID,
  session_status            TEXT NOT NULL DEFAULT 'open',
  cover_count               INTEGER NOT NULL DEFAULT 0,
  smokecraft_session_id     UUID,
  kds_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  printer_connected         BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_deducted        BOOLEAN NOT NULL DEFAULT FALSE,
  external_sync_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key           TEXT,
  opened_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at                 TIMESTAMPTZ,
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Guest checkout handoffs (self-order → checkout flow)
CREATE TABLE IF NOT EXISTS pos360_guest_checkout_handoffs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  cart_id                   UUID,
  submission_id             UUID,
  table_id                  UUID,
  order_id                  UUID,
  payment_record_id         UUID,
  guest_profile_id          UUID,
  customer_id               UUID,
  handoff_status            TEXT NOT NULL DEFAULT 'pending',
  payment_captured          BOOLEAN NOT NULL DEFAULT FALSE,
  checkout_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  external_sync_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- QR code registry (venue-level QR codes for tables/sections/menus)
CREATE TABLE IF NOT EXISTS pos360_qr_code_registry (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  qr_code_token             TEXT NOT NULL UNIQUE,
  target_type               TEXT NOT NULL DEFAULT 'table',
  table_id                  UUID,
  section_id                UUID,
  menu_version_ref          TEXT,
  private_event_id          UUID,
  qr_status                 TEXT NOT NULL DEFAULT 'active',
  scan_count                INTEGER NOT NULL DEFAULT 0,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Menu availability snapshots (what's available at time of self-order)
CREATE TABLE IF NOT EXISTS pos360_menu_availability_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  qr_session_id             UUID,
  table_id                  UUID,
  snapshot_status           TEXT NOT NULL DEFAULT 'draft_placeholder',
  menu_item_count           INTEGER NOT NULL DEFAULT 0,
  unavailable_item_count    INTEGER NOT NULL DEFAULT 0,
  inventory_deducted        BOOLEAN NOT NULL DEFAULT FALSE,
  external_sync_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  snapshot_data             JSONB,
  idempotency_key           TEXT,
  taken_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Age verification records (for alcohol/cigar items)
CREATE TABLE IF NOT EXISTS pos360_age_verification_records (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  cart_id                   UUID,
  cart_item_id              UUID,
  guest_profile_id          UUID,
  customer_id               UUID,
  verification_method       TEXT NOT NULL DEFAULT 'staff_visual_placeholder',
  verification_status       TEXT NOT NULL DEFAULT 'pending',
  staff_profile_id          UUID,
  age_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason           TEXT,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Self-ordering modifier selections
CREATE TABLE IF NOT EXISTS pos360_self_order_modifier_selections (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  cart_item_id              UUID NOT NULL,
  modifier_group_id         UUID,
  modifier_option_id        UUID,
  modifier_name             TEXT NOT NULL,
  price_adjustment_cents    INTEGER NOT NULL DEFAULT 0,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Guest checkout audit log
CREATE TABLE IF NOT EXISTS pos360_guest_checkout_audit (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  actor_user_id             TEXT,
  action                    TEXT NOT NULL,
  entity_type               TEXT NOT NULL,
  entity_id                 UUID,
  before_snapshot           JSONB,
  after_snapshot            JSONB,
  reason                    TEXT,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Self-order offline queue (offline actions during connectivity loss)
CREATE TABLE IF NOT EXISTS pos360_self_order_offline_queue (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  actor_user_id             TEXT,
  action_type               TEXT NOT NULL,
  payload                   JSONB NOT NULL DEFAULT '{}',
  queue_status              TEXT NOT NULL DEFAULT 'pending',
  synced_at                 TIMESTAMPTZ,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Menu item availability overrides (86'd items etc.)
CREATE TABLE IF NOT EXISTS pos360_menu_item_availability_overrides (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  menu_item_id              UUID,
  inventory_item_id         UUID,
  override_type             TEXT NOT NULL DEFAULT '86ed',
  override_status           TEXT NOT NULL DEFAULT 'active',
  staff_profile_id          UUID,
  reason                    TEXT,
  external_sync_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at                TIMESTAMPTZ,
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Handheld POS offline queue
CREATE TABLE IF NOT EXISTS pos360_handheld_offline_queue (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  handheld_session_id       UUID,
  actor_user_id             TEXT,
  action_type               TEXT NOT NULL,
  payload                   JSONB NOT NULL DEFAULT '{}',
  queue_status              TEXT NOT NULL DEFAULT 'pending',
  synced_at                 TIMESTAMPTZ,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- Self-order visibility insights
CREATE TABLE IF NOT EXISTS pos360_self_order_visibility_insights (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  insight_type              TEXT NOT NULL DEFAULT 'cart_abandonment',
  table_id                  UUID,
  section_id                UUID,
  order_id                  UUID,
  insight_data              JSONB,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  external_sync_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- SmokeCraft self-order hooks (cigar items routed through SmokeCraft humidor)
CREATE TABLE IF NOT EXISTS pos360_smokecraft_self_order_hooks (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  cart_id                   UUID,
  cart_item_id              UUID,
  smokecraft_session_id     UUID,
  inventory_item_id         UUID,
  hook_status               TEXT NOT NULL DEFAULT 'pending_placeholder',
  smokecraft_sync_completed BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_deducted        BOOLEAN NOT NULL DEFAULT FALSE,
  kds_accepted              BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

-- E.A.T. self-order handoff records
CREATE TABLE IF NOT EXISTS pos360_eat_self_order_handoffs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  cart_id                   UUID,
  submission_id             UUID,
  order_id                  UUID,
  eat_handoff_status        TEXT NOT NULL DEFAULT 'pending_placeholder',
  external_sync_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  kds_accepted              BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_deducted        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
