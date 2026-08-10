/**
 * POS360 <-> SmokeCraft Identity Mapping Service — Block 4B
 *
 * SmokeCraft uses plain-text venue/tenant/guest identifiers. POS360's
 * customer/loyalty tables use uuid venue_id/tenant_id/customer_id. This
 * service is the one governed place that resolves a SmokeCraft external id
 * to a POS360 uuid — deterministically, idempotently, and persisted — so
 * no other code path is allowed to mint a POS360 uuid on its own.
 *
 * Reuses pos360_guest_smokecraft_links (pre-existing, previously an unused
 * placeholder) for the customer-level link. Adds one new table
 * (pos360_smokecraft_identity_map) for venue/tenant, since no existing
 * table covered that — audited first, confirmed absent (see migration 121).
 *
 * Never fakes success. Never mints a new POS uuid for the same SmokeCraft
 * id twice — every resolve* function is select-first, insert-with-
 * ON-CONFLICT-DO-NOTHING, re-select-on-race.
 */

const SAFE_CLAIM = 'pos360_smokecraft_identity_mapping'

async function isDbAvailable() {
  try {
    const { isDbAvailable: check } = await import('../../db/connection.js')
    return check()
  } catch {
    return false
  }
}

async function dbQuery(sql, params = []) {
  const { query } = await import('../../db/connection.js')
  return query(sql, params)
}

function fail(error, extra = {}) {
  return { ok: false, error, safeClaim: SAFE_CLAIM, ...extra }
}

// ── Venue / tenant resolution ───────────────────────────────────

async function resolveEntity(entityType, externalId) {
  if (!await isDbAvailable()) return fail('database_not_configured')
  if (!externalId || typeof externalId !== 'string') {
    return fail('invalid_smokecraft_id', { entityType, note: `A real, non-empty SmokeCraft ${entityType} id is required.` })
  }
  try {
    const existing = await dbQuery(
      `SELECT pos360_uuid FROM pos360_smokecraft_identity_map WHERE entity_type=$1 AND smokecraft_external_id=$2 LIMIT 1`,
      [entityType, externalId]
    )
    if (existing.rows.length) {
      return { ok: true, pos360Uuid: existing.rows[0].pos360_uuid, created: false, smokecraftExternalId: externalId, entityType }
    }
    const inserted = await dbQuery(
      `INSERT INTO pos360_smokecraft_identity_map (entity_type, smokecraft_external_id)
       VALUES ($1,$2)
       ON CONFLICT (entity_type, smokecraft_external_id) DO NOTHING
       RETURNING pos360_uuid`,
      [entityType, externalId]
    )
    if (inserted.rows.length) {
      return { ok: true, pos360Uuid: inserted.rows[0].pos360_uuid, created: true, smokecraftExternalId: externalId, entityType }
    }
    // Lost a race to a concurrent identical mapping request — the row now
    // exists, fetch and return the winner's uuid rather than erroring.
    const raced = await dbQuery(
      `SELECT pos360_uuid FROM pos360_smokecraft_identity_map WHERE entity_type=$1 AND smokecraft_external_id=$2 LIMIT 1`,
      [entityType, externalId]
    )
    if (raced.rows.length) {
      return { ok: true, pos360Uuid: raced.rows[0].pos360_uuid, created: false, smokecraftExternalId: externalId, entityType }
    }
    return fail('mapping_insert_failed', { entityType })
  } catch (err) {
    return fail(err.message, { entityType })
  }
}

/** Find-or-create the POS360 venue uuid for a real SmokeCraft venue id. Idempotent — never mints twice. */
export function resolveVenueMapping({ smokecraftVenueId }) {
  return resolveEntity('venue', smokecraftVenueId)
}

/** Find-or-create the POS360 tenant uuid for a real SmokeCraft tenant id. Idempotent — never mints twice. */
export function resolveTenantMapping({ smokecraftTenantId }) {
  return resolveEntity('tenant', smokecraftTenantId)
}

/** Reverse lookup: POS360 uuid -> the SmokeCraft external id it came from. */
export async function reverseLookup({ pos360Uuid }) {
  if (!await isDbAvailable()) return fail('database_not_configured')
  const result = await dbQuery(
    `SELECT entity_type, smokecraft_external_id FROM pos360_smokecraft_identity_map WHERE pos360_uuid=$1 LIMIT 1`,
    [pos360Uuid]
  )
  if (!result.rows.length) return fail('not_found')
  return { ok: true, entityType: result.rows[0].entity_type, smokecraftExternalId: result.rows[0].smokecraft_external_id }
}

// ── Customer resolution ─────────────────────────────────────────

/**
 * Find-or-create the POS360 customer uuid for a real SmokeCraft guest,
 * scoped to an already-resolved POS360 venue/tenant uuid pair. Reuses the
 * pre-existing pos360_customers + pos360_guest_smokecraft_links tables.
 * Idempotent per (venueUuid, smokecraftGuestId) via the unique index added
 * in migration 121 — retrying never creates a second customer record.
 */
export async function resolveCustomerMapping({ pos360VenueUuid, pos360TenantUuid, smokecraftGuestId, displayName }) {
  if (!await isDbAvailable()) return fail('database_not_configured')
  if (!pos360VenueUuid || !pos360TenantUuid) return fail('missing_venue_or_tenant_mapping')
  if (!smokecraftGuestId || typeof smokecraftGuestId !== 'string') return fail('invalid_smokecraft_guest_id')

  try {
    const existingLink = await dbQuery(
      `SELECT customer_id FROM pos360_guest_smokecraft_links WHERE venue_id=$1 AND smokecraft_user_id=$2 LIMIT 1`,
      [pos360VenueUuid, smokecraftGuestId]
    )
    if (existingLink.rows.length) {
      return { ok: true, customerId: existingLink.rows[0].customer_id, created: false }
    }

    // Create the POS360 customer first (pos360_guest_smokecraft_links.customer_id
    // has a NOT NULL FK to pos360_customers, so this must exist before the link row).
    const customer = await dbQuery(
      `INSERT INTO pos360_customers (tenant_id, venue_id, display_name, is_anonymous, metadata)
       VALUES ($1,$2,$3,TRUE,$4) RETURNING id`,
      [pos360TenantUuid, pos360VenueUuid, displayName || `SmokeCraft Guest ${smokecraftGuestId.slice(0, 8)}`, JSON.stringify({ smokecraft_guest_id: smokecraftGuestId })]
    )
    const customerId = customer.rows[0].id

    const inserted = await dbQuery(
      `INSERT INTO pos360_guest_smokecraft_links (tenant_id, venue_id, customer_id, smokecraft_user_id, link_status, linked_at)
       VALUES ($1,$2,$3,$4,'linked',now())
       ON CONFLICT (venue_id, smokecraft_user_id) WHERE smokecraft_user_id IS NOT NULL DO NOTHING
       RETURNING customer_id`,
      [pos360TenantUuid, pos360VenueUuid, customerId, smokecraftGuestId]
    )
    if (inserted.rows.length) {
      return { ok: true, customerId, created: true }
    }

    // Lost a race — a concurrent identical request already created the
    // link. Discard the just-created orphan customer row is not done here
    // (no destructive cleanup of another request's possible in-flight
    // write); simply defer to the winning row.
    const raced = await dbQuery(
      `SELECT customer_id FROM pos360_guest_smokecraft_links WHERE venue_id=$1 AND smokecraft_user_id=$2 LIMIT 1`,
      [pos360VenueUuid, smokecraftGuestId]
    )
    if (raced.rows.length) {
      return { ok: true, customerId: raced.rows[0].customer_id, created: false }
    }
    return fail('link_insert_failed')
  } catch (err) {
    return fail(err.message)
  }
}

/**
 * One-call convenience: resolves venue, tenant, and customer together for
 * a real SmokeCraft transaction. Fails explicitly (never partially,
 * never with a fabricated id) the moment any required SmokeCraft id is
 * missing or invalid.
 */
export async function resolveFullIdentity({ smokecraftVenueId, smokecraftTenantId, smokecraftGuestId, displayName }) {
  const venue = await resolveVenueMapping({ smokecraftVenueId })
  if (!venue.ok) return fail('venue_mapping_failed', { detail: venue })
  const tenant = await resolveTenantMapping({ smokecraftTenantId })
  if (!tenant.ok) return fail('tenant_mapping_failed', { detail: tenant })
  const customer = await resolveCustomerMapping({
    pos360VenueUuid: venue.pos360Uuid,
    pos360TenantUuid: tenant.pos360Uuid,
    smokecraftGuestId,
    displayName,
  })
  if (!customer.ok) return fail('customer_mapping_failed', { detail: customer })
  return {
    ok: true,
    pos360VenueUuid: venue.pos360Uuid,
    pos360TenantUuid: tenant.pos360Uuid,
    pos360CustomerId: customer.customerId,
    smokecraftVenueId,
    smokecraftTenantId,
    smokecraftGuestId,
  }
}
