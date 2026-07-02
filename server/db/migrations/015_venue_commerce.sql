-- ============================================================
-- Migration 015 — SmokeCraft Venue Commerce Foundation
-- Phase: Venue Commerce Backend
--
-- New tables:
--   venue_menu_items          — admin-managed menu/inventory per venue
--   smokecraft_guest_sessions — extended session with mode/location/scores
--   staff_handoff_events      — PIN-verified handoff lifecycle
--   smokecraft_carts          — guest cart per session
--   smokecraft_cart_items     — line items in a cart
--   smokecraft_orders         — confirmed orders with payment tracking
--   smokecraft_order_items    — line items in an order
--   pos360_transaction_attachments — loyalty dedup + POS link
--   eat_management_sync_events — E.A.T. signals from SmokeCraft sessions
--   order_tickets             — routed station tickets (kitchen/bar/humidor/server)
--   smokecraft_commerce_audit — immutable audit log for all commerce events
--
-- Safe to run multiple times (all CREATE TABLE IF NOT EXISTS).
-- No migration runner: apply externally before deploy.
-- ============================================================

BEGIN;

-- ── venue_menu_items ─────────────────────────────────────────────────────────
-- Single source of truth for venue menu across cigars, bar, food, bundles.
CREATE TABLE IF NOT EXISTS venue_menu_items (
  id                       BIGSERIAL    PRIMARY KEY,
  item_id                  TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id                 TEXT         NOT NULL,
  pos_item_id              TEXT,                                -- external POS SKU
  item_name                TEXT         NOT NULL,
  item_category            TEXT         NOT NULL
                             CHECK (item_category IN (
                               'cigar','house_cigar','featured_cigar','humidor_match',
                               'liquor','cocktail','wine','beer','drink',
                               'food','dinner','dessert',
                               'pairing_bundle','full_pairing_bundle'
                             )),
  sub_category             TEXT,
  description              TEXT,
  price                    NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url                TEXT,
  available                BOOLEAN      NOT NULL DEFAULT TRUE,
  stock_quantity           INTEGER      NOT NULL DEFAULT 0,
  low_stock_threshold      INTEGER      NOT NULL DEFAULT 3,
  is_house_item            BOOLEAN      NOT NULL DEFAULT FALSE,
  is_featured              BOOLEAN      NOT NULL DEFAULT FALSE,
  is_recommended_pairing   BOOLEAN      NOT NULL DEFAULT FALSE,
  pairing_tags             JSONB        NOT NULL DEFAULT '[]',
  pairing_type             TEXT,        -- 'cigar_liquor' | 'cigar_food' | 'full' | null
  loyalty_action_type      TEXT,        -- maps to LOYALTY_ACTIONS constants
  age_restricted           BOOLEAN      NOT NULL DEFAULT FALSE,
  taxable                  BOOLEAN      NOT NULL DEFAULT TRUE,
  -- Cigar-specific fields
  cigar_brand              TEXT,
  cigar_line               TEXT,
  cigar_vitola             TEXT,
  cigar_wrapper            TEXT,
  cigar_binder             TEXT,
  cigar_filler             TEXT,
  cigar_strength           TEXT,        -- 'mild' | 'medium' | 'full'
  cigar_origin             TEXT,
  cigar_flavor_notes       JSONB        NOT NULL DEFAULT '[]',
  cigar_burn_time          TEXT,
  humidor_location         TEXT,
  recommended_drink_pairings JSONB      NOT NULL DEFAULT '[]',
  recommended_food_pairings  JSONB      NOT NULL DEFAULT '[]',
  -- Bar-specific fields
  spirit_type              TEXT,
  spirit_brand             TEXT,
  spirit_proof             NUMERIC(5,1),
  flavor_profile           JSONB        NOT NULL DEFAULT '[]',
  pairing_notes            TEXT,
  bottle_stock             INTEGER,
  pour_size_oz             NUMERIC(4,1),
  available_by_glass       BOOLEAN      NOT NULL DEFAULT TRUE,
  available_by_bottle      BOOLEAN      NOT NULL DEFAULT FALSE,
  recommended_with_cigars  JSONB        NOT NULL DEFAULT '[]',
  -- Food-specific fields
  cuisine_type             TEXT,
  course_type              TEXT,        -- 'appetizer' | 'entree' | 'dessert'
  allergens                JSONB        NOT NULL DEFAULT '[]',
  food_flavor_profile      JSONB        NOT NULL DEFAULT '[]',
  spice_level              TEXT,
  recommended_cigar_pairings JSONB      NOT NULL DEFAULT '[]',
  recommended_drink_pairings_food JSONB NOT NULL DEFAULT '[]',
  -- Metadata
  sort_order               INTEGER      NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venue_menu_items_venue_category
  ON venue_menu_items(venue_id, item_category);
CREATE INDEX IF NOT EXISTS idx_venue_menu_items_venue_available
  ON venue_menu_items(venue_id, available);

-- ── smokecraft_guest_sessions ─────────────────────────────────────────────────
-- Extended session tracking with commerce mode, location, and scores.
CREATE TABLE IF NOT EXISTS smokecraft_guest_sessions (
  id                   BIGSERIAL    PRIMARY KEY,
  guest_session_id     TEXT         NOT NULL UNIQUE,         -- FK → guest_sessions.session_id
  venue_id             TEXT         NOT NULL DEFAULT 'novee-grand-lounge',
  tablet_id            TEXT,
  current_route        TEXT,
  current_visit        INTEGER      NOT NULL DEFAULT 1,
  current_session_num  INTEGER      NOT NULL DEFAULT 1,
  current_session_id   TEXT,
  completed_steps      JSONB        NOT NULL DEFAULT '[]',
  badges               JSONB        NOT NULL DEFAULT '[]',
  journey_xp           INTEGER      NOT NULL DEFAULT 0,
  skill_score          INTEGER      NOT NULL DEFAULT 0,
  challenge_score      INTEGER      NOT NULL DEFAULT 0,
  loyalty_points       INTEGER      NOT NULL DEFAULT 0,
  passport_stamp_count INTEGER      NOT NULL DEFAULT 0,
  current_mode         TEXT         NOT NULL DEFAULT 'guest'
                         CHECK (current_mode IN ('guest','staff','menu','checkout')),
  last_handoff_id      TEXT,
  active_cart_id       TEXT,
  active_order_id      TEXT,
  table_id             TEXT,
  seat_number          TEXT,
  section_name         TEXT,
  patio_zone           TEXT,
  lounge_zone          TEXT,
  bar_seat             TEXT,
  server_id            TEXT,
  age_verified         BOOLEAN      NOT NULL DEFAULT FALSE,
  age_verified_by      TEXT,
  age_verified_at      TIMESTAMPTZ,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_guest_sessions_venue
  ON smokecraft_guest_sessions(venue_id, updated_at DESC);

-- ── staff_handoff_events ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_handoff_events (
  id                BIGSERIAL    PRIMARY KEY,
  handoff_id        TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  guest_session_id  TEXT         NOT NULL,
  venue_id          TEXT         NOT NULL,
  tablet_id         TEXT,
  source            TEXT         NOT NULL DEFAULT 'smokecraft',
  target            TEXT         NOT NULL CHECK (target IN ('eat','pos360')),
  start_route       TEXT,
  return_route      TEXT,
  current_visit     INTEGER,
  current_session   INTEGER,
  staff_user_id     TEXT,
  pin_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
  status            TEXT         NOT NULL DEFAULT 'started'
                      CHECK (status IN ('started','pin_verified','in_staff_mode','returned_to_guest','cancelled')),
  started_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  pin_verified_at   TIMESTAMPTZ,
  returned_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_staff_handoff_events_session
  ON staff_handoff_events(guest_session_id, started_at DESC);

-- ── smokecraft_carts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_carts (
  id               BIGSERIAL    PRIMARY KEY,
  cart_id          TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  guest_session_id TEXT         NOT NULL,
  venue_id         TEXT         NOT NULL,
  tablet_id        TEXT,
  table_id         TEXT,
  seat_number      TEXT,
  subtotal         NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax              NUMERIC(10,2) NOT NULL DEFAULT 0,
  tip              NUMERIC(10,2) NOT NULL DEFAULT 0,
  service_charge   NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  comp_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  total            NUMERIC(10,2) NOT NULL DEFAULT 0,
  status           TEXT         NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','checkout','paid','cancelled')),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── smokecraft_cart_items ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_cart_items (
  id               BIGSERIAL    PRIMARY KEY,
  cart_item_id     TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  cart_id          TEXT         NOT NULL REFERENCES smokecraft_carts(cart_id) ON DELETE CASCADE,
  item_id          TEXT         NOT NULL,             -- FK → venue_menu_items.item_id
  item_name        TEXT         NOT NULL,
  item_category    TEXT         NOT NULL,
  price            NUMERIC(10,2) NOT NULL,
  quantity         INTEGER      NOT NULL DEFAULT 1,
  modifiers        JSONB        NOT NULL DEFAULT '[]',
  notes            TEXT,
  destination      TEXT         NOT NULL DEFAULT 'bar'
                     CHECK (destination IN ('humidor','bar','kitchen','server','retail')),
  is_house_item    BOOLEAN      NOT NULL DEFAULT FALSE,
  is_recommended_pairing BOOLEAN NOT NULL DEFAULT FALSE,
  loyalty_action_type TEXT,
  age_restricted   BOOLEAN      NOT NULL DEFAULT FALSE,
  reservation_id   TEXT,                             -- inventory reservation token
  added_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_cart_items_cart ON smokecraft_cart_items(cart_id);

-- ── smokecraft_orders ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_orders (
  id                      BIGSERIAL    PRIMARY KEY,
  order_id                TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  guest_session_id        TEXT         NOT NULL,
  cart_id                 TEXT,
  venue_id                TEXT         NOT NULL,
  tablet_id               TEXT,
  table_id                TEXT,
  seat_number             TEXT,
  payment_intent_id       TEXT         UNIQUE,
  payment_status          TEXT         NOT NULL DEFAULT 'pending'
                            CHECK (payment_status IN ('pending','authorized','paid','failed','cancelled','refunded')),
  subtotal                NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax                     NUMERIC(10,2) NOT NULL DEFAULT 0,
  tip                     NUMERIC(10,2) NOT NULL DEFAULT 0,
  service_charge          NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount                NUMERIC(10,2) NOT NULL DEFAULT 0,
  comp_amount             NUMERIC(10,2) NOT NULL DEFAULT 0,
  total                   NUMERIC(10,2) NOT NULL DEFAULT 0,
  loyalty_points_awarded  INTEGER      NOT NULL DEFAULT 0,
  age_verified            BOOLEAN      NOT NULL DEFAULT FALSE,
  status                  TEXT         NOT NULL DEFAULT 'open',
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_orders_session
  ON smokecraft_orders(guest_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sc_orders_payment_intent
  ON smokecraft_orders(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;

-- ── smokecraft_order_items ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_order_items (
  id               BIGSERIAL    PRIMARY KEY,
  order_item_id    TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  order_id         TEXT         NOT NULL REFERENCES smokecraft_orders(order_id) ON DELETE CASCADE,
  item_id          TEXT         NOT NULL,
  item_name        TEXT         NOT NULL,
  item_category    TEXT         NOT NULL,
  price            NUMERIC(10,2) NOT NULL,
  quantity         INTEGER      NOT NULL DEFAULT 1,
  modifiers        JSONB        NOT NULL DEFAULT '[]',
  notes            TEXT,
  destination      TEXT         NOT NULL DEFAULT 'bar',
  is_house_item    BOOLEAN      NOT NULL DEFAULT FALSE,
  is_recommended_pairing BOOLEAN NOT NULL DEFAULT FALSE,
  loyalty_action_type TEXT,
  voided           BOOLEAN      NOT NULL DEFAULT FALSE,
  comped           BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_order_items_order ON smokecraft_order_items(order_id);

-- ── pos360_transaction_attachments ────────────────────────────────────────────
-- Links a real POS transaction to a SmokeCraft session for loyalty dedup.
CREATE TABLE IF NOT EXISTS pos360_transaction_attachments (
  id                      BIGSERIAL    PRIMARY KEY,
  attachment_id           TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  guest_session_id        TEXT         NOT NULL,
  handoff_id              TEXT,
  order_id                TEXT,
  pos_transaction_id      TEXT         NOT NULL UNIQUE,  -- dedup key
  payment_intent_id       TEXT,
  venue_id                TEXT         NOT NULL,
  item_id                 TEXT,
  item_name               TEXT,
  item_category           TEXT,
  subtotal                NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity                INTEGER      NOT NULL DEFAULT 1,
  is_house_item           BOOLEAN      NOT NULL DEFAULT FALSE,
  is_recommended_pairing  BOOLEAN      NOT NULL DEFAULT FALSE,
  loyalty_points_awarded  INTEGER      NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_txn_session
  ON pos360_transaction_attachments(guest_session_id);

-- ── eat_management_sync_events ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eat_management_sync_events (
  id                        BIGSERIAL    PRIMARY KEY,
  sync_id                   TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  guest_session_id          TEXT         NOT NULL,
  handoff_id                TEXT,
  venue_id                  TEXT         NOT NULL,
  staff_user_id             TEXT,
  sync_type                 TEXT         NOT NULL,
  notes                     TEXT,
  vip_candidate_signal      BOOLEAN      NOT NULL DEFAULT FALSE,
  recommended_follow_up     TEXT,
  inventory_demand_signal   JSONB        NOT NULL DEFAULT '[]',
  status                    TEXT         NOT NULL DEFAULT 'sent',
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eat_sync_venue
  ON eat_management_sync_events(venue_id, created_at DESC);

-- ── order_tickets ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_tickets (
  id                BIGSERIAL    PRIMARY KEY,
  ticket_id         TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  order_id          TEXT         NOT NULL,
  venue_id          TEXT         NOT NULL,
  table_id          TEXT,
  seat_number       TEXT,
  items             JSONB        NOT NULL DEFAULT '[]',
  destination_queue TEXT         NOT NULL
                      CHECK (destination_queue IN ('humidor','bar','kitchen','server','management')),
  status            TEXT         NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','started','ready','delivered','cancelled')),
  priority          INTEGER      NOT NULL DEFAULT 5,
  notes             TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_tickets_venue_queue
  ON order_tickets(venue_id, destination_queue, status, created_at);
CREATE INDEX IF NOT EXISTS idx_order_tickets_order
  ON order_tickets(order_id);

-- ── smokecraft_commerce_audit ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_commerce_audit (
  id               BIGSERIAL    PRIMARY KEY,
  event_id         TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id         TEXT         NOT NULL,
  guest_session_id TEXT,
  staff_user_id    TEXT,
  action_type      TEXT         NOT NULL,
  source           TEXT,
  before_state     JSONB        NOT NULL DEFAULT '{}',
  after_state      JSONB        NOT NULL DEFAULT '{}',
  metadata         JSONB        NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_audit_venue_action
  ON smokecraft_commerce_audit(venue_id, action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sc_audit_session
  ON smokecraft_commerce_audit(guest_session_id, created_at DESC)
  WHERE guest_session_id IS NOT NULL;

-- ── inventory_reservations ────────────────────────────────────────────────────
-- Short-lived locks during checkout. Released on cancel/failure/timeout.
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id               BIGSERIAL    PRIMARY KEY,
  reservation_id   TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id         TEXT         NOT NULL,
  item_id          TEXT         NOT NULL,
  quantity         INTEGER      NOT NULL DEFAULT 1,
  cart_id          TEXT,
  order_id         TEXT,
  status           TEXT         NOT NULL DEFAULT 'held'
                     CHECK (status IN ('held','committed','released','expired')),
  expires_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_item
  ON inventory_reservations(item_id, status, expires_at);

COMMIT;
