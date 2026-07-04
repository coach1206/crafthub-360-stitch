-- Migration 030: smokecraft_orders schema backfill
--
-- Migration 015 created smokecraft_orders with a narrow commerce schema.
-- Migration 029 used CREATE TABLE IF NOT EXISTS, which is a no-op when the
-- table already exists, so the new columns were never added on Railway.
-- Migration 029 is already recorded in schema_migrations on Railway, so
-- changes to that file are silently skipped.
--
-- This migration applies the required backfill as a fresh, idempotent operation.
-- Safe to run multiple times (all ADD COLUMN IF NOT EXISTS / DROP NOT NULL is
-- idempotent once NOT NULL is already removed).

-- ── Add columns introduced by migration 029 that may be absent ────────────────
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS user_id                 TEXT;
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS session_id              TEXT;
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS visit_id                TEXT;
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS server_id               TEXT;
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS order_mode              TEXT;
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS order_status            TEXT        NOT NULL DEFAULT 'draft';
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS items                   JSONB       NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS pairing_recommendations JSONB       NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS customer_notes          TEXT        NOT NULL DEFAULT '';
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS staff_notes             TEXT        NOT NULL DEFAULT '';
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS source_module           TEXT        NOT NULL DEFAULT 'smokecraft-experience';
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS target_system           TEXT;
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS sync_status             TEXT        NOT NULL DEFAULT 'not_connected';
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS pos_sync_status         TEXT        NOT NULL DEFAULT 'not_connected';
ALTER TABLE smokecraft_orders ADD COLUMN IF NOT EXISTS eat_sync_status         TEXT        NOT NULL DEFAULT 'not_connected';

-- ── Relax NOT NULL constraints from migration 015 ─────────────────────────────
-- The persistence hardening schema treats guest_session_id and venue_id as
-- optional identifiers. The activation INSERT only provides
-- (order_id, order_mode, order_status, source_module), so these two NOT NULL
-- columns without defaults cause a constraint violation.
ALTER TABLE smokecraft_orders ALTER COLUMN guest_session_id DROP NOT NULL;
ALTER TABLE smokecraft_orders ALTER COLUMN venue_id         DROP NOT NULL;

-- ── Indexes (CREATE INDEX IF NOT EXISTS is always safe) ───────────────────────
CREATE INDEX IF NOT EXISTS idx_sc_orders_venue_id   ON smokecraft_orders(venue_id);
CREATE INDEX IF NOT EXISTS idx_sc_orders_user_id    ON smokecraft_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_sc_orders_session_id ON smokecraft_orders(session_id);
