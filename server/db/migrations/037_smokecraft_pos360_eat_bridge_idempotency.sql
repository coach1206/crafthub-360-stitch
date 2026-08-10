-- BLOCK 4A: adds real idempotency protection to the two already-built,
-- already-mounted, but never-called-from-SmokeCraft bridges
-- (pos360_smokecraft_order_intents, eat_smokecraft_session_sync).
-- Neither table had any duplicate-submit protection — a retried or
-- double-clicked request would previously create a second, distinct
-- row. A caller-supplied idempotency key, unique per (tenant, key),
-- lets the service layer detect and return the original row instead of
-- inserting a duplicate.

ALTER TABLE pos360_smokecraft_order_intents
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos360_smokecraft_order_intents_idem
  ON pos360_smokecraft_order_intents (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE eat_smokecraft_session_sync
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_eat_smokecraft_session_sync_idem
  ON eat_smokecraft_session_sync (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
