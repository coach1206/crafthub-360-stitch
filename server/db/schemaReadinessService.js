/**
 * EPRL — Schema Readiness Service
 * Validates Phase 14/15 table and column presence without running migrations.
 */

async function checkTableExists(pool, tableName) {
  try {
    const res = await pool.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
      [tableName]
    )
    return res.rows.length > 0
  } catch { return false }
}

function schemaResult(tables, missing) {
  return {
    ok:     missing.length === 0,
    status: missing.length === 0 ? 'schema_ready' : 'table_missing',
    tables,
    missing,
    degradedMode: missing.length > 0,
  }
}

export async function validateInventorySchema(pool) {
  if (!pool) return { ok: false, status: 'database_required', degradedMode: true }
  const tables  = ['inventory_records','inventory_adjustments','inventory_audit_events']
  const missing = []
  for (const t of tables) {
    if (!await checkTableExists(pool, t)) missing.push(t)
  }
  return schemaResult(tables, missing)
}

export async function validateReorderSchema(pool) {
  if (!pool) return { ok: false, status: 'database_required', degradedMode: true }
  const tables  = ['reorder_recommendations','reorder_demand_signals','purchase_order_drafts','purchase_order_items','reorder_vendors']
  const missing = []
  for (const t of tables) {
    if (!await checkTableExists(pool, t)) missing.push(t)
  }
  return schemaResult(tables, missing)
}

export async function validateReceivingSchema(pool) {
  if (!pool) return { ok: false, status: 'database_required', degradedMode: true }
  const tables  = ['receiving_records','receiving_items','inventory_receiving_previews']
  const missing = []
  for (const t of tables) {
    if (!await checkTableExists(pool, t)) missing.push(t)
  }
  return schemaResult(tables, missing)
}

export async function validateOperationalSyncSchema(pool) {
  if (!pool) return { ok: false, status: 'database_required', degradedMode: true }
  const tables  = ['operational_sync_events']
  const missing = []
  for (const t of tables) {
    if (!await checkTableExists(pool, t)) missing.push(t)
  }
  return schemaResult(tables, missing)
}

export async function validateVendorSchema(pool) {
  if (!pool) return { ok: false, status: 'database_required', degradedMode: true }
  const tables  = ['reorder_vendors','reorder_approvals']
  const missing = []
  for (const t of tables) {
    if (!await checkTableExists(pool, t)) missing.push(t)
  }
  return schemaResult(tables, missing)
}

export async function validatePaymentSchema(pool) {
  if (!pool) return { ok: false, status: 'database_required', degradedMode: true }
  const tables  = ['stripe_connect_accounts','payment_intents','payment_ledger_entries']
  const missing = []
  for (const t of tables) {
    if (!await checkTableExists(pool, t)) missing.push(t)
  }
  return schemaResult(tables, missing)
}

export async function validatePOS360Schema(pool) {
  if (!pool) return { ok: false, status: 'database_required', degradedMode: true }
  const tables  = ['pos360_sessions','pos360_orders']
  const missing = []
  for (const t of tables) {
    if (!await checkTableExists(pool, t)) missing.push(t)
  }
  return schemaResult(tables, missing)
}

export async function buildSchemaReadinessReport(pool) {
  if (!pool) {
    return {
      ok: false,
      status: 'database_required',
      inventory: { ok: false, status: 'database_required' },
      reorder:   { ok: false, status: 'database_required' },
      receiving: { ok: false, status: 'database_required' },
      sync:      { ok: false, status: 'database_required' },
      vendor:    { ok: false, status: 'database_required' },
      payment:   { ok: false, status: 'database_required' },
      pos360:    { ok: false, status: 'database_required' },
      degradedMode: true,
    }
  }
  const [inventory, reorder, receiving, sync, vendor, payment, pos360] = await Promise.all([
    validateInventorySchema(pool),
    validateReorderSchema(pool),
    validateReceivingSchema(pool),
    validateOperationalSyncSchema(pool),
    validateVendorSchema(pool),
    validatePaymentSchema(pool),
    validatePOS360Schema(pool),
  ])
  const allOk = [inventory, reorder, receiving, sync, vendor, payment, pos360].every(r => r.ok)
  return {
    ok:          allOk,
    status:      allOk ? 'schema_ready' : 'schema_partial',
    inventory,
    reorder,
    receiving,
    sync,
    vendor,
    payment,
    pos360,
    degradedMode: !allOk,
  }
}
