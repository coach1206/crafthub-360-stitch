-- BLOCK 4B: closes the SmokeCraft (text ids) <-> POS360 (uuid ids) identity
-- gap with a real, persisted, idempotent mapping layer — not a SmokeCraft
-- uuid migration.
--
-- Audit finding: no existing table maps SmokeCraft's text venue_id/tenant_id
-- to a POS360 uuid venue/tenant. pos360_customers.venue_id/tenant_id are
-- uuid columns with NO foreign key to any canonical venues/tenants
-- registry anywhere in this schema (verified via pg_constraint) — POS360's
-- venue/tenant uuids are an opaque, self-consistent namespace used only to
-- key its own module tables, not validated against an external registry.
-- Reused pos360_guest_smokecraft_links (already existed as an unused
-- placeholder, see pos360CustomerLoyaltyService.getSmokecraftLink) for the
-- customer-level link instead of inventing a parallel table.

-- ── Venue / tenant identity map ─────────────────────────────────
-- One governed, append-only table: given a SmokeCraft external id
-- (venue or tenant), always resolves to exactly one POS360 uuid, minted
-- once and reused on every subsequent call — never regenerated.
CREATE TABLE IF NOT EXISTS pos360_smokecraft_identity_map (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type         text NOT NULL CHECK (entity_type IN ('venue', 'tenant')),
  smokecraft_external_id text NOT NULL,
  pos360_uuid         uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos360_smokecraft_identity_map_forward
  ON pos360_smokecraft_identity_map (entity_type, smokecraft_external_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos360_smokecraft_identity_map_reverse
  ON pos360_smokecraft_identity_map (pos360_uuid);

-- ── Customer link idempotency ───────────────────────────────────
-- pos360_guest_smokecraft_links already existed (migration 038) but had
-- no unique constraint, so a naive "insert if not found" caller could
-- still race a duplicate. This makes the existing table genuinely
-- idempotent per (venue, SmokeCraft user) without altering its shape.
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos360_guest_smokecraft_links_idem
  ON pos360_guest_smokecraft_links (venue_id, smokecraft_user_id)
  WHERE smokecraft_user_id IS NOT NULL;
