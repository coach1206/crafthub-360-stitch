-- Migration 024: KDS / Kitchen Routing and Fulfillment Station Engine
-- Phase 9 — backend routing foundation for station dispatch in preview-safe mode.
-- No live kitchen, bar, humidor, or partner station is claimed here.

-- 1. kds_station_profiles
CREATE TABLE IF NOT EXISTS kds_station_profiles (
  station_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id           TEXT NOT NULL,
  station_name       TEXT NOT NULL,
  station_type       TEXT NOT NULL CHECK (station_type IN (
    'kitchen','bar','humidor','partner_window','expo',
    'service_runner','patio_runner','pickup_handoff','delivery_handoff','custom'
  )),
  station_status     TEXT NOT NULL DEFAULT 'station_config_required',
  routing_mode       TEXT NOT NULL DEFAULT 'routing_preview',
  accepts_categories JSONB,
  display_priority   INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. kds_station_mappings
CREATE TABLE IF NOT EXISTS kds_station_mappings (
  mapping_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id         TEXT NOT NULL,
  station_id       UUID REFERENCES kds_station_profiles(station_id),
  item_category    TEXT NOT NULL,
  fulfillment_owner TEXT NOT NULL DEFAULT 'venue',
  partner_id       TEXT,
  mapping_status   TEXT NOT NULL DEFAULT 'station_mapping_required',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. kds_routing_rules
CREATE TABLE IF NOT EXISTS kds_routing_rules (
  rule_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id     TEXT NOT NULL,
  rule_name    TEXT NOT NULL,
  item_category TEXT NOT NULL,
  order_type   TEXT NOT NULL DEFAULT 'venue_order',
  station_type TEXT NOT NULL,
  priority     INTEGER NOT NULL DEFAULT 0,
  rule_status  TEXT NOT NULL DEFAULT 'routing_rule_required',
  conditions   JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. kds_order_dispatches
CREATE TABLE IF NOT EXISTS kds_order_dispatches (
  dispatch_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        TEXT NOT NULL,
  venue_id        TEXT NOT NULL,
  dispatch_status TEXT NOT NULL DEFAULT 'dispatch_pending',
  dispatch_mode   TEXT NOT NULL DEFAULT 'dispatch_preview',
  routing_status  TEXT NOT NULL DEFAULT 'kds_routing_pending',
  station_count   INTEGER NOT NULL DEFAULT 0,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. kds_line_item_dispatches
CREATE TABLE IF NOT EXISTS kds_line_item_dispatches (
  dispatch_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id      UUID REFERENCES kds_order_dispatches(dispatch_id),
  order_id         TEXT NOT NULL,
  line_item_id     TEXT NOT NULL,
  venue_id         TEXT NOT NULL,
  partner_id       TEXT,
  station_id       UUID,
  station_type     TEXT NOT NULL,
  item_category    TEXT NOT NULL,
  dispatch_status  TEXT NOT NULL DEFAULT 'dispatch_pending',
  fulfillment_status TEXT NOT NULL DEFAULT 'fulfillment_pending',
  routing_reason   TEXT,
  metadata         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. kds_station_health_logs
CREATE TABLE IF NOT EXISTS kds_station_health_logs (
  health_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id    UUID,
  venue_id      TEXT NOT NULL,
  health_status TEXT NOT NULL DEFAULT 'station_unavailable',
  last_seen_at  TIMESTAMPTZ,
  details       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. kds_fulfillment_handoffs
CREATE TABLE IF NOT EXISTS kds_fulfillment_handoffs (
  handoff_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        TEXT NOT NULL,
  line_item_id    TEXT,
  venue_id        TEXT NOT NULL,
  partner_id      TEXT,
  from_station_id UUID,
  to_station_id   UUID,
  handoff_type    TEXT NOT NULL,
  handoff_status  TEXT NOT NULL DEFAULT 'handoff_pending',
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. kds_routing_audit_logs
CREATE TABLE IF NOT EXISTS kds_routing_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    TEXT,
  actor_role  TEXT,
  order_id    TEXT,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  action      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'audit_logged',
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
