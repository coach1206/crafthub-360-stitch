/**
 * pos360EventPackageMonetizationService.js — Phase B.10 Prompt W
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable, query } from '../../db/connection.js'
import {
  DEPOSIT_STATUSES,
  CONTRACT_STATUSES,
  PACKAGE_SELECTION_STATUSES,
  APPROVAL_STATUSES,
  APPROVAL_TYPES,
  isValidDepositStatus,
  isValidContractStatus,
  isValidPackageSelectionStatus,
  isValidApprovalStatus,
  isValidApprovalType,
  isValidPackageCategoryType,
  isValidForecastType,
  isValidMonetizationInsightType,
} from './pos360EventPackageContracts.js'

const AREA = 'event_packages_monetization'
const LOCAL_PREVIEW = { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }

async function auditRecord(venueId, actorUserId, action, entityType, entityId, before, after, reason, managerOverride = false) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_event_package_audit
       (venue_id, actor_user_id, action, entity_type, entity_id, before_snapshot, after_snapshot, reason, manager_override, contains_secrets, exposes_private_data, exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE,FALSE,FALSE)`,
    [venueId, actorUserId, action, entityType, entityId,
     JSON.stringify(before || {}), JSON.stringify(after || {}), reason, !!managerOverride]
  )
}

async function writeDepositStatusHistory(depositId, venueId, fromStatus, toStatus, changedBy, reason) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_event_deposit_status_history (venue_id, deposit_id, from_status, to_status, changed_by, reason)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [venueId, depositId, fromStatus, toStatus, changedBy, reason]
  )
}

async function writeContractStatusHistory(contractId, venueId, fromStatus, toStatus, changedBy, reason) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_event_contract_status_history (venue_id, contract_id, from_status, to_status, changed_by, reason)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [venueId, contractId, fromStatus, toStatus, changedBy, reason]
  )
}

// ── Package categories ────────────────────────────────────────────────────────

export async function createPackageCategory({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  if (payload.category_type && !isValidPackageCategoryType(payload.category_type))
    return { ok: false, error: 'invalid_category_type' }
  const result = await query(
    `INSERT INTO pos360_event_package_categories
       (tenant_id, venue_id, name, category_type, description, active, display_order, metadata, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [payload.tenantId ?? null, venueId, payload.name, payload.category_type ?? 'other',
     payload.description ?? null, payload.active !== false, payload.display_order ?? 0,
     JSON.stringify(payload.metadata ?? {}), actorUserId]
  )
  const cat = result.rows[0]
  await auditRecord(venueId, actorUserId, 'create_package_category', 'package_category', String(cat.id), {}, cat, null)
  return { ok: true, category: cat }
}

export async function listPackageCategories({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, categories: [], note: 'No event package categories are configured for this venue.' }
  let sql = `SELECT * FROM pos360_event_package_categories WHERE venue_id=$1`
  const params = [venueId]
  if (filters.active !== undefined) { params.push(filters.active); sql += ` AND active=$${params.length}` }
  if (filters.category_type) { params.push(filters.category_type); sql += ` AND category_type=$${params.length}` }
  sql += ' ORDER BY display_order, created_at'
  const result = await query(sql, params)
  return { ok: true, categories: result.rows }
}

export async function updatePackageCategory({ venueId, categoryId, payload, actorUserId, idempotencyKey }) {
  if (!venueId || !categoryId) return { ok: false, error: 'venue_id_and_category_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const prev = await query(`SELECT * FROM pos360_event_package_categories WHERE id=$1 AND venue_id=$2`, [categoryId, venueId])
  if (!prev.rows.length) return { ok: false, error: 'category_not_found' }
  const sets = []; const vals = []
  if (payload.name !== undefined) { vals.push(payload.name); sets.push(`name=$${vals.length}`) }
  if (payload.active !== undefined) { vals.push(payload.active); sets.push(`active=$${vals.length}`) }
  if (payload.description !== undefined) { vals.push(payload.description); sets.push(`description=$${vals.length}`) }
  if (payload.display_order !== undefined) { vals.push(payload.display_order); sets.push(`display_order=$${vals.length}`) }
  vals.push(actorUserId); sets.push(`updated_by=$${vals.length}`)
  vals.push('NOW()'); sets.push(`updated_at=$${vals.length}`)
  vals.push(categoryId); vals.push(venueId)
  const result = await query(
    `UPDATE pos360_event_package_categories SET ${sets.join(', ')} WHERE id=$${vals.length-1} AND venue_id=$${vals.length} RETURNING *`, vals
  )
  await auditRecord(venueId, actorUserId, 'update_package_category', 'package_category', String(categoryId), prev.rows[0], result.rows[0], null)
  return { ok: true, category: result.rows[0] }
}

// ── Event packages ────────────────────────────────────────────────────────────

export async function createEventPackage({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const dup = await query(
    `SELECT id FROM pos360_event_packages WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId]
  )
  if (dup.rows.length) return { ok: true, package: dup.rows[0], duplicate: true }
  const result = await query(
    `INSERT INTO pos360_event_packages
       (tenant_id, venue_id, category_id, package_name, package_code, description, package_type,
        base_price, pricing_model, min_guest_count, max_guest_count, taxable,
        service_fee_applicable, gratuity_applicable, requires_manager_approval,
        active, status, terms_snapshot, inventory_forecast_enabled, metadata, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
    [payload.tenantId ?? null, venueId, payload.category_id ?? null,
     payload.package_name, payload.package_code ?? null, payload.description ?? null,
     payload.package_type ?? 'custom', payload.base_price ?? 0,
     payload.pricing_model ?? 'flat_fee', payload.min_guest_count ?? null,
     payload.max_guest_count ?? null, payload.taxable !== false,
     !!payload.service_fee_applicable, !!payload.gratuity_applicable,
     !!payload.requires_manager_approval, payload.active !== false,
     payload.status ?? 'draft', JSON.stringify(payload.terms_snapshot ?? {}),
     !!payload.inventory_forecast_enabled, JSON.stringify(payload.metadata ?? {}),
     idempotencyKey, actorUserId]
  )
  const pkg = result.rows[0]
  await auditRecord(venueId, actorUserId, 'create_event_package', 'event_package', String(pkg.id), {}, pkg, null)
  return { ok: true, package: pkg }
}

export async function listEventPackages({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, packages: [], note: 'No event packages are configured for this venue.' }
  let sql = `SELECT * FROM pos360_event_packages WHERE venue_id=$1`
  const params = [venueId]
  if (filters.status) { params.push(filters.status); sql += ` AND status=$${params.length}` }
  if (filters.category_id) { params.push(filters.category_id); sql += ` AND category_id=$${params.length}` }
  if (filters.active !== undefined) { params.push(filters.active); sql += ` AND active=$${params.length}` }
  sql += ' ORDER BY created_at DESC'
  const result = await query(sql, params)
  return { ok: true, packages: result.rows }
}

export async function getEventPackage({ venueId, packageId }) {
  if (!venueId || !packageId) return { ok: false, error: 'venue_id_and_package_id_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(`SELECT * FROM pos360_event_packages WHERE id=$1 AND venue_id=$2`, [packageId, venueId])
  if (!result.rows.length) return { ok: false, error: 'package_not_found' }
  return { ok: true, package: result.rows[0] }
}

export async function updateEventPackage({ venueId, packageId, payload, actorUserId, idempotencyKey }) {
  if (!venueId || !packageId) return { ok: false, error: 'venue_id_and_package_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const prev = await query(`SELECT * FROM pos360_event_packages WHERE id=$1 AND venue_id=$2`, [packageId, venueId])
  if (!prev.rows.length) return { ok: false, error: 'package_not_found' }
  const sets = []; const vals = []
  const updatable = ['package_name','description','base_price','pricing_model','min_guest_count',
    'max_guest_count','taxable','service_fee_applicable','gratuity_applicable',
    'requires_manager_approval','active','status','terms_snapshot','metadata']
  for (const k of updatable) {
    if (payload[k] !== undefined) { vals.push(k === 'terms_snapshot' || k === 'metadata' ? JSON.stringify(payload[k]) : payload[k]); sets.push(`${k}=$${vals.length}`) }
  }
  vals.push(actorUserId); sets.push(`updated_by=$${vals.length}`)
  vals.push('NOW()'); sets.push(`updated_at=$${vals.length}`)
  vals.push(packageId); vals.push(venueId)
  const result = await query(
    `UPDATE pos360_event_packages SET ${sets.join(', ')} WHERE id=$${vals.length-1} AND venue_id=$${vals.length} RETURNING *`, vals
  )
  await auditRecord(venueId, actorUserId, 'update_event_package', 'event_package', String(packageId), prev.rows[0], result.rows[0], null)
  return { ok: true, package: result.rows[0] }
}

export async function archiveEventPackage({ venueId, packageId, actorUserId, reason, idempotencyKey }) {
  if (!venueId || !packageId) return { ok: false, error: 'venue_id_and_package_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `UPDATE pos360_event_packages SET status='archived', active=FALSE, updated_by=$3, updated_at=NOW() WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [packageId, venueId, actorUserId]
  )
  if (!result.rows.length) return { ok: false, error: 'package_not_found' }
  await auditRecord(venueId, actorUserId, 'archive_event_package', 'event_package', String(packageId), {}, result.rows[0], reason)
  return { ok: true, package: result.rows[0] }
}

// ── Package items ─────────────────────────────────────────────────────────────

export async function addPackageItem({ venueId, packageId, payload, actorUserId, idempotencyKey }) {
  if (!venueId || !packageId) return { ok: false, error: 'venue_id_and_package_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `INSERT INTO pos360_event_package_items
       (tenant_id, venue_id, package_id, item_name, item_type, quantity, unit, included, upcharge_amount, inventory_item_id, metadata, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [payload.tenantId ?? null, venueId, packageId, payload.item_name, payload.item_type ?? 'other',
     payload.quantity ?? 1, payload.unit ?? null, payload.included !== false,
     payload.upcharge_amount ?? 0, payload.inventory_item_id ?? null,
     JSON.stringify(payload.metadata ?? {}), idempotencyKey, actorUserId]
  )
  const item = result.rows[0]
  await auditRecord(venueId, actorUserId, 'add_package_item', 'package_item', String(item.id), {}, item, null)
  return { ok: true, item }
}

export async function listPackageItems({ venueId, packageId }) {
  if (!venueId || !packageId) return { ok: false, error: 'venue_id_and_package_id_required' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, items: [], note: 'No items configured for this package.' }
  const result = await query(`SELECT * FROM pos360_event_package_items WHERE venue_id=$1 AND package_id=$2 ORDER BY created_at`, [venueId, packageId])
  return { ok: true, items: result.rows }
}

export async function updatePackageItem({ venueId, packageItemId, payload, actorUserId, idempotencyKey }) {
  if (!venueId || !packageItemId) return { ok: false, error: 'venue_id_and_item_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const prev = await query(`SELECT * FROM pos360_event_package_items WHERE id=$1 AND venue_id=$2`, [packageItemId, venueId])
  if (!prev.rows.length) return { ok: false, error: 'item_not_found' }
  const sets = []; const vals = []
  for (const k of ['item_name','item_type','quantity','unit','included','upcharge_amount']) {
    if (payload[k] !== undefined) { vals.push(payload[k]); sets.push(`${k}=$${vals.length}`) }
  }
  vals.push(actorUserId); sets.push(`updated_by=$${vals.length}`)
  vals.push('NOW()'); sets.push(`updated_at=$${vals.length}`)
  vals.push(packageItemId); vals.push(venueId)
  const result = await query(
    `UPDATE pos360_event_package_items SET ${sets.join(', ')} WHERE id=$${vals.length-1} AND venue_id=$${vals.length} RETURNING *`, vals
  )
  await auditRecord(venueId, actorUserId, 'update_package_item', 'package_item', String(packageItemId), prev.rows[0], result.rows[0], null)
  return { ok: true, item: result.rows[0] }
}

// ── Pricing rules ─────────────────────────────────────────────────────────────

export async function createPricingRule({ venueId, packageId, payload, actorUserId, idempotencyKey }) {
  if (!venueId || !packageId) return { ok: false, error: 'venue_id_and_package_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `INSERT INTO pos360_event_package_pricing_rules
       (tenant_id, venue_id, package_id, rule_name, rule_type, condition_payload, price_adjustment_type, price_adjustment_value, active, requires_manager_approval, metadata, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [payload.tenantId ?? null, venueId, packageId, payload.rule_name, payload.rule_type ?? 'custom',
     JSON.stringify(payload.condition_payload ?? {}), payload.price_adjustment_type ?? 'flat',
     payload.price_adjustment_value ?? 0, payload.active !== false,
     !!payload.requires_manager_approval, JSON.stringify(payload.metadata ?? {}), idempotencyKey, actorUserId]
  )
  const rule = result.rows[0]
  await auditRecord(venueId, actorUserId, 'create_pricing_rule', 'pricing_rule', String(rule.id), {}, rule, null)
  return { ok: true, rule }
}

export async function listPricingRules({ venueId, packageId }) {
  if (!venueId || !packageId) return { ok: false, error: 'venue_id_and_package_id_required' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, rules: [], note: 'No pricing rules configured.' }
  const result = await query(`SELECT * FROM pos360_event_package_pricing_rules WHERE venue_id=$1 AND package_id=$2 AND active=TRUE ORDER BY created_at`, [venueId, packageId])
  return { ok: true, rules: result.rows }
}

export async function calculatePackageQuote({ venueId, packageId, quotePayload }) {
  if (!venueId || !packageId) return { ok: false, error: 'venue_id_and_package_id_required' }
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', note: 'Package quote cannot be calculated without a database connection.' }
  const pkg = await query(`SELECT * FROM pos360_event_packages WHERE id=$1 AND venue_id=$2`, [packageId, venueId])
  if (!pkg.rows.length) return { ok: false, error: 'package_not_found' }
  const p = pkg.rows[0]
  const guestCount = quotePayload.guest_count ?? p.min_guest_count ?? 1
  let baseQuote = p.pricing_model === 'per_person' ? p.base_price * guestCount : p.base_price
  const rules = await query(
    `SELECT * FROM pos360_event_package_pricing_rules WHERE venue_id=$1 AND package_id=$2 AND active=TRUE`,
    [venueId, packageId]
  )
  let adjustments = []
  for (const rule of rules.rows) {
    if (rule.requires_manager_approval) {
      adjustments.push({ ruleId: rule.id, ruleName: rule.rule_name, skipped: true, reason: 'requires_manager_approval' })
      continue
    }
    adjustments.push({ ruleId: rule.id, ruleName: rule.rule_name, applied: true, type: rule.price_adjustment_type, value: rule.price_adjustment_value })
  }
  return {
    ok: true,
    packageId,
    guestCount,
    baseQuote,
    pricingModel: p.pricing_model,
    adjustments,
    quotedTotal: baseQuote,
    note: 'This is a price estimate only. No payment has been processed. Final pricing requires manager confirmation.',
  }
}

// ── Package selections ────────────────────────────────────────────────────────

export async function selectPackageForPrivateEvent({ venueId, privateEventId, packageId, payload, actorUserId, idempotencyKey }) {
  if (!venueId || !privateEventId || !packageId) return { ok: false, error: 'venue_id_private_event_id_and_package_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const dup = await query(
    `SELECT id FROM pos360_private_event_package_selections WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId]
  )
  if (dup.rows.length) return { ok: true, selection: dup.rows[0], duplicate: true }
  const pkg = await query(`SELECT * FROM pos360_event_packages WHERE id=$1 AND venue_id=$2`, [packageId, venueId])
  if (!pkg.rows.length) return { ok: false, error: 'package_not_found' }
  if (pkg.rows[0].requires_manager_approval) {
    return { ok: false, error: 'manager_approval_required', managerApprovalRequired: true, action: APPROVAL_TYPES.CUSTOM_PACKAGE }
  }
  const result = await query(
    `INSERT INTO pos360_private_event_package_selections
       (tenant_id, venue_id, private_event_id, package_id, selected_by, guest_count_snapshot,
        quoted_price, final_price, discount_amount, status, idempotency_key, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [payload.tenantId ?? null, venueId, privateEventId, packageId, actorUserId,
     payload.guest_count ?? null, payload.quoted_price ?? null, payload.final_price ?? null,
     payload.discount_amount ?? 0, 'draft', idempotencyKey, JSON.stringify(payload.metadata ?? {})]
  )
  const sel = result.rows[0]
  await auditRecord(venueId, actorUserId, 'select_package_for_event', 'package_selection', String(sel.id), {}, sel, null)
  return {
    ok: true, selection: sel,
    note: 'Package selected. No payment has been processed. No contract has been generated. Manager confirmation required to finalize.',
  }
}

export async function listPrivateEventPackageSelections({ venueId, privateEventId }) {
  if (!venueId || !privateEventId) return { ok: false, error: 'venue_id_and_private_event_id_required' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, selections: [], note: 'No package selections for this event.' }
  const result = await query(
    `SELECT * FROM pos360_private_event_package_selections WHERE venue_id=$1 AND private_event_id=$2 ORDER BY created_at DESC`,
    [venueId, privateEventId]
  )
  return { ok: true, selections: result.rows }
}

export async function updatePackageSelectionStatus({ venueId, packageSelectionId, status, actorUserId, reason, idempotencyKey }) {
  if (!venueId || !packageSelectionId) return { ok: false, error: 'venue_id_and_selection_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isValidPackageSelectionStatus(status)) return { ok: false, error: 'invalid_selection_status' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const prev = await query(`SELECT * FROM pos360_private_event_package_selections WHERE id=$1 AND venue_id=$2`, [packageSelectionId, venueId])
  if (!prev.rows.length) return { ok: false, error: 'selection_not_found' }
  const result = await query(
    `UPDATE pos360_private_event_package_selections SET status=$3, updated_at=NOW() WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [packageSelectionId, venueId, status]
  )
  await auditRecord(venueId, actorUserId, 'update_selection_status', 'package_selection', String(packageSelectionId), prev.rows[0], result.rows[0], reason)
  return { ok: true, selection: result.rows[0] }
}

export async function approvePackageSelection({ venueId, packageSelectionId, managerUserId, reason, idempotencyKey }) {
  if (!venueId || !packageSelectionId) return { ok: false, error: 'venue_id_and_selection_id_required' }
  if (!managerUserId) return { ok: false, error: 'manager_user_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `UPDATE pos360_private_event_package_selections
       SET approval_status='approved', manager_approved_by=$3, manager_approved_at=NOW(), status='approved', updated_at=NOW()
     WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [packageSelectionId, venueId, managerUserId]
  )
  if (!result.rows.length) return { ok: false, error: 'selection_not_found' }
  await auditRecord(venueId, managerUserId, 'approve_package_selection', 'package_selection', String(packageSelectionId), {}, result.rows[0], reason, true)
  return { ok: true, selection: result.rows[0] }
}

// ── Deposits ──────────────────────────────────────────────────────────────────

export async function createDepositPolicy({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `INSERT INTO pos360_event_deposit_policies
       (tenant_id, venue_id, policy_name, deposit_type, deposit_value, due_days_before_event, refundable, refund_policy_days, requires_manager_approval, active, metadata, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [payload.tenantId ?? null, venueId, payload.policy_name, payload.deposit_type ?? 'flat_fee',
     payload.deposit_value ?? 0, payload.due_days_before_event ?? 30,
     !!payload.refundable, payload.refund_policy_days ?? null,
     !!payload.requires_manager_approval, payload.active !== false,
     JSON.stringify(payload.metadata ?? {}), idempotencyKey, actorUserId]
  )
  const policy = result.rows[0]
  await auditRecord(venueId, actorUserId, 'create_deposit_policy', 'deposit_policy', String(policy.id), {}, policy, null)
  return { ok: true, policy }
}

export async function listDepositPolicies({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, policies: [], note: 'No deposit policies configured.' }
  let sql = `SELECT * FROM pos360_event_deposit_policies WHERE venue_id=$1`
  const params = [venueId]
  if (filters.active !== undefined) { params.push(filters.active); sql += ` AND active=$${params.length}` }
  sql += ' ORDER BY created_at DESC'
  const result = await query(sql, params)
  return { ok: true, policies: result.rows }
}

export async function createDepositRecord({ venueId, privateEventId, payload, actorUserId, idempotencyKey }) {
  if (!venueId || !privateEventId) return { ok: false, error: 'venue_id_and_private_event_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const dup = await query(`SELECT id FROM pos360_event_deposit_records WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
  if (dup.rows.length) return { ok: true, deposit: dup.rows[0], duplicate: true }
  const result = await query(
    `INSERT INTO pos360_event_deposit_records
       (tenant_id, venue_id, private_event_id, deposit_policy_id, deposit_amount, deposit_due_date,
        deposit_status, manager_approval_required, reason, idempotency_key, metadata, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [payload.tenantId ?? null, venueId, privateEventId, payload.deposit_policy_id ?? null,
     payload.deposit_amount ?? 0, payload.deposit_due_date ?? null,
     payload.deposit_status ?? 'pending', !!payload.manager_approval_required,
     payload.reason ?? null, idempotencyKey, JSON.stringify(payload.metadata ?? {}), actorUserId]
  )
  const dep = result.rows[0]
  await writeDepositStatusHistory(dep.id, venueId, null, dep.deposit_status, actorUserId, 'created')
  await auditRecord(venueId, actorUserId, 'create_deposit_record', 'deposit_record', String(dep.id), {}, dep, null)
  return {
    ok: true, deposit: dep,
    note: 'Deposit record created. No payment has been processed. Payment integration is not connected.',
  }
}

export async function updateDepositStatus({ venueId, depositRecordId, depositStatus, actorUserId, reason, idempotencyKey }) {
  if (!venueId || !depositRecordId) return { ok: false, error: 'venue_id_and_deposit_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isValidDepositStatus(depositStatus)) return { ok: false, error: 'invalid_deposit_status' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const prev = await query(`SELECT * FROM pos360_event_deposit_records WHERE id=$1 AND venue_id=$2`, [depositRecordId, venueId])
  if (!prev.rows.length) return { ok: false, error: 'deposit_record_not_found' }
  if (prev.rows[0].manager_approval_required && !actorUserId)
    return { ok: false, error: 'manager_approval_required', managerApprovalRequired: true }
  const result = await query(
    `UPDATE pos360_event_deposit_records SET deposit_status=$3, updated_by=$4, updated_at=NOW() WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [depositRecordId, venueId, depositStatus, actorUserId]
  )
  await writeDepositStatusHistory(depositRecordId, venueId, prev.rows[0].deposit_status, depositStatus, actorUserId, reason)
  await auditRecord(venueId, actorUserId, 'update_deposit_status', 'deposit_record', String(depositRecordId), prev.rows[0], result.rows[0], reason)
  return {
    ok: true, deposit: result.rows[0],
    note: depositStatus === 'marked_paid_external'
      ? 'Deposit marked as paid externally. No payment has been processed through this system.'
      : depositStatus === 'refunded_external'
      ? 'Deposit marked as refunded externally. No refund has been processed through this system.'
      : undefined,
  }
}

export async function approveDepositWaiver({ venueId, depositRecordId, managerUserId, reason, idempotencyKey }) {
  if (!venueId || !depositRecordId) return { ok: false, error: 'venue_id_and_deposit_id_required' }
  if (!managerUserId) return { ok: false, error: 'manager_user_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const prev = await query(`SELECT * FROM pos360_event_deposit_records WHERE id=$1 AND venue_id=$2`, [depositRecordId, venueId])
  if (!prev.rows.length) return { ok: false, error: 'deposit_record_not_found' }
  const result = await query(
    `UPDATE pos360_event_deposit_records
       SET deposit_status='waived', manager_approved_by=$3, manager_approved_at=NOW(), updated_at=NOW()
     WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [depositRecordId, venueId, managerUserId]
  )
  await writeDepositStatusHistory(depositRecordId, venueId, prev.rows[0].deposit_status, 'waived', managerUserId, reason)
  await auditRecord(venueId, managerUserId, 'approve_deposit_waiver', 'deposit_record', String(depositRecordId), prev.rows[0], result.rows[0], reason, true)
  return { ok: true, deposit: result.rows[0], note: 'Deposit waived by manager. No refund has been processed.' }
}

export async function approveDepositRefund({ venueId, depositRecordId, managerUserId, reason, idempotencyKey }) {
  if (!venueId || !depositRecordId) return { ok: false, error: 'venue_id_and_deposit_id_required' }
  if (!managerUserId) return { ok: false, error: 'manager_user_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const prev = await query(`SELECT * FROM pos360_event_deposit_records WHERE id=$1 AND venue_id=$2`, [depositRecordId, venueId])
  if (!prev.rows.length) return { ok: false, error: 'deposit_record_not_found' }
  const result = await query(
    `UPDATE pos360_event_deposit_records
       SET deposit_status='refunded_external', manager_approved_by=$3, manager_approved_at=NOW(), updated_at=NOW()
     WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [depositRecordId, venueId, managerUserId]
  )
  await writeDepositStatusHistory(depositRecordId, venueId, prev.rows[0].deposit_status, 'refunded_external', managerUserId, reason)
  await auditRecord(venueId, managerUserId, 'approve_deposit_refund', 'deposit_record', String(depositRecordId), prev.rows[0], result.rows[0], reason, true)
  return {
    ok: true, deposit: result.rows[0],
    note: 'Deposit refund approved by manager. No refund has been processed through this system. Refund must be executed externally.',
  }
}

// ── Minimum spend ─────────────────────────────────────────────────────────────

export async function createMinimumSpendRule({ venueId, privateEventId, payload, actorUserId, idempotencyKey }) {
  if (!venueId || !privateEventId) return { ok: false, error: 'venue_id_and_private_event_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `INSERT INTO pos360_event_minimum_spend_rules
       (tenant_id, venue_id, private_event_id, rule_name, minimum_spend_amount, applies_to, active, metadata, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [payload.tenantId ?? null, venueId, privateEventId, payload.rule_name ?? null,
     payload.minimum_spend_amount ?? 0, payload.applies_to ?? 'total_event',
     payload.active !== false, JSON.stringify(payload.metadata ?? {}), idempotencyKey, actorUserId]
  )
  const rule = result.rows[0]
  await query(
    `INSERT INTO pos360_event_minimum_spend_progress
       (tenant_id, venue_id, private_event_id, minimum_spend_amount, remaining_amount)
     VALUES ($1,$2,$3,$4,$4)
     ON CONFLICT (private_event_id) DO UPDATE SET minimum_spend_amount=$4, remaining_amount=$4, updated_at=NOW()`,
    [payload.tenantId ?? null, venueId, privateEventId, payload.minimum_spend_amount ?? 0]
  )
  await auditRecord(venueId, actorUserId, 'create_minimum_spend_rule', 'minimum_spend_rule', String(rule.id), {}, rule, null)
  return { ok: true, rule, note: 'Minimum spend rule created. No orders are linked yet. Minimum spend is not satisfied.' }
}

export async function getMinimumSpendProgress({ venueId, privateEventId }) {
  if (!venueId || !privateEventId) return { ok: false, error: 'venue_id_and_private_event_id_required' }
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', note: 'Minimum spend progress unavailable. No linked POS orders.' }
  const result = await query(`SELECT * FROM pos360_event_minimum_spend_progress WHERE venue_id=$1 AND private_event_id=$2`, [venueId, privateEventId])
  if (!result.rows.length) return { ok: true, progress: null, note: 'No minimum spend rule has been set for this event.' }
  return { ok: true, progress: result.rows[0] }
}

export async function updateMinimumSpendManualCredit({ venueId, privateEventId, payload, actorUserId, idempotencyKey }) {
  if (!venueId || !privateEventId) return { ok: false, error: 'venue_id_and_private_event_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const prev = await query(`SELECT * FROM pos360_event_minimum_spend_progress WHERE venue_id=$1 AND private_event_id=$2`, [venueId, privateEventId])
  if (!prev.rows.length) return { ok: false, error: 'minimum_spend_progress_not_found' }
  const p = prev.rows[0]
  const newManual = (Number(p.current_manual_credit_total) || 0) + (Number(payload.credit_amount) || 0)
  const newTotal = (Number(p.current_linked_order_total) || 0) + newManual
  const remaining = Math.max(0, Number(p.minimum_spend_amount) - newTotal)
  const satisfied = remaining === 0
  const result = await query(
    `UPDATE pos360_event_minimum_spend_progress
       SET current_manual_credit_total=$3, remaining_amount=$4, satisfied=$5,
           satisfaction_source=$6, manager_approved_by=$7, manager_approved_at=NOW(), updated_by=$8, updated_at=NOW()
     WHERE venue_id=$1 AND private_event_id=$2 RETURNING *`,
    [venueId, privateEventId, newManual, remaining, satisfied,
     satisfied ? 'manual_manager_credit' : 'none', actorUserId, actorUserId]
  )
  await auditRecord(venueId, actorUserId, 'update_minimum_spend_manual_credit', 'minimum_spend_progress', String(p.id), p, result.rows[0], payload.reason, true)
  return {
    ok: true, progress: result.rows[0],
    note: satisfied
      ? 'Minimum spend satisfied via manager manual credit. No POS orders are linked.'
      : 'Manual credit applied. Minimum spend is not yet satisfied.',
  }
}

export async function approveMinimumSpendOverride({ venueId, privateEventId, managerUserId, reason, idempotencyKey }) {
  if (!venueId || !privateEventId) return { ok: false, error: 'venue_id_and_private_event_id_required' }
  if (!managerUserId) return { ok: false, error: 'manager_user_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `UPDATE pos360_event_minimum_spend_progress
       SET satisfied=TRUE, satisfaction_source='manual_manager_credit', manager_override_required=FALSE,
           manager_approved_by=$3, manager_approved_at=NOW(), updated_at=NOW()
     WHERE venue_id=$1 AND private_event_id=$2 RETURNING *`,
    [venueId, privateEventId, managerUserId]
  )
  if (!result.rows.length) return { ok: false, error: 'minimum_spend_progress_not_found' }
  await auditRecord(venueId, managerUserId, 'approve_minimum_spend_override', 'minimum_spend_progress', String(result.rows[0].id), {}, result.rows[0], reason, true)
  return {
    ok: true, progress: result.rows[0],
    note: 'Minimum spend override approved by manager. No POS orders have been linked. No revenue has been recorded.',
  }
}

// ── Contracts ─────────────────────────────────────────────────────────────────

export async function createContractTemplate({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `INSERT INTO pos360_event_contract_templates
       (tenant_id, venue_id, template_name, template_body, version, active, metadata, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [payload.tenantId ?? null, venueId, payload.template_name, payload.template_body ?? null,
     payload.version ?? 1, payload.active !== false, JSON.stringify(payload.metadata ?? {}), idempotencyKey, actorUserId]
  )
  const tmpl = result.rows[0]
  await auditRecord(venueId, actorUserId, 'create_contract_template', 'contract_template', String(tmpl.id), {}, tmpl, null)
  return { ok: true, template: tmpl }
}

export async function listContractTemplates({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, templates: [], note: 'No contract templates configured.' }
  let sql = `SELECT * FROM pos360_event_contract_templates WHERE venue_id=$1`
  const params = [venueId]
  if (filters.active !== undefined) { params.push(filters.active); sql += ` AND active=$${params.length}` }
  sql += ' ORDER BY created_at DESC'
  const result = await query(sql, params)
  return { ok: true, templates: result.rows }
}

export async function createContractSnapshot({ venueId, privateEventId, payload, actorUserId, idempotencyKey }) {
  if (!venueId || !privateEventId) return { ok: false, error: 'venue_id_and_private_event_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const dup = await query(`SELECT id FROM pos360_event_contract_snapshots WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
  if (dup.rows.length) return { ok: true, contract: dup.rows[0], duplicate: true }
  const result = await query(
    `INSERT INTO pos360_event_contract_snapshots
       (tenant_id, venue_id, private_event_id, contract_template_id, contract_snapshot_version,
        contract_status, signer_name, signer_email, signer_phone, terms_snapshot,
        cancellation_policy_snapshot, deposit_policy_snapshot, package_snapshot, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [payload.tenantId ?? null, venueId, privateEventId, payload.contract_template_id ?? null,
     payload.contract_snapshot_version ?? 1, 'generated_placeholder',
     payload.signer_name ?? null, payload.signer_email ?? null, payload.signer_phone ?? null,
     JSON.stringify(payload.terms_snapshot ?? {}), JSON.stringify(payload.cancellation_policy_snapshot ?? {}),
     JSON.stringify(payload.deposit_policy_snapshot ?? {}), JSON.stringify(payload.package_snapshot ?? {}),
     idempotencyKey, actorUserId]
  )
  const c = result.rows[0]
  await writeContractStatusHistory(c.id, venueId, null, 'generated_placeholder', actorUserId, 'created')
  await auditRecord(venueId, actorUserId, 'create_contract_snapshot', 'contract_snapshot', String(c.id), {}, c, null)
  return {
    ok: true, contract: c,
    note: 'Contract snapshot generated as placeholder. No contract has been sent. No contract has been signed. Contract provider is not connected.',
  }
}

export async function updateContractStatus({ venueId, contractSnapshotId, contractStatus, actorUserId, reason, idempotencyKey }) {
  if (!venueId || !contractSnapshotId) return { ok: false, error: 'venue_id_and_contract_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isValidContractStatus(contractStatus)) return { ok: false, error: 'invalid_contract_status' }
  if (contractStatus === 'signed_external')
    return { ok: false, error: 'external_signing_not_supported', note: 'Contract signing must be completed through an external contract provider. No contract has been signed through this system.' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const prev = await query(`SELECT * FROM pos360_event_contract_snapshots WHERE id=$1 AND venue_id=$2`, [contractSnapshotId, venueId])
  if (!prev.rows.length) return { ok: false, error: 'contract_not_found' }
  const result = await query(
    `UPDATE pos360_event_contract_snapshots SET contract_status=$3, updated_by=$4, updated_at=NOW() WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [contractSnapshotId, venueId, contractStatus, actorUserId]
  )
  await writeContractStatusHistory(contractSnapshotId, venueId, prev.rows[0].contract_status, contractStatus, actorUserId, reason)
  await auditRecord(venueId, actorUserId, 'update_contract_status', 'contract_snapshot', String(contractSnapshotId), prev.rows[0], result.rows[0], reason)
  return { ok: true, contract: result.rows[0] }
}

// ── Cancellation policies ─────────────────────────────────────────────────────

export async function createCancellationPolicy({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `INSERT INTO pos360_event_cancellation_policies
       (tenant_id, venue_id, policy_name, description, cancellation_window_days, fee_type, fee_value, active, metadata, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [payload.tenantId ?? null, venueId, payload.policy_name, payload.description ?? null,
     payload.cancellation_window_days ?? null, payload.fee_type ?? 'none',
     payload.fee_value ?? 0, payload.active !== false, JSON.stringify(payload.metadata ?? {}), idempotencyKey, actorUserId]
  )
  const pol = result.rows[0]
  await auditRecord(venueId, actorUserId, 'create_cancellation_policy', 'cancellation_policy', String(pol.id), {}, pol, null)
  return { ok: true, policy: pol }
}

export async function listCancellationPolicies({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, policies: [], note: 'No cancellation policies configured.' }
  let sql = `SELECT * FROM pos360_event_cancellation_policies WHERE venue_id=$1`
  const params = [venueId]
  if (filters.active !== undefined) { params.push(filters.active); sql += ` AND active=$${params.length}` }
  sql += ' ORDER BY created_at DESC'
  const result = await query(sql, params)
  return { ok: true, policies: result.rows }
}

// ── Approvals ─────────────────────────────────────────────────────────────────

export async function createApprovalRequest({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!actorUserId) return { ok: false, error: 'actor_user_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isValidApprovalType(payload.approval_type)) return { ok: false, error: 'invalid_approval_type' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const dup = await query(`SELECT id FROM pos360_event_package_approval_requests WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
  if (dup.rows.length) return { ok: true, approval: dup.rows[0], duplicate: true }
  const result = await query(
    `INSERT INTO pos360_event_package_approval_requests
       (tenant_id, venue_id, private_event_id, package_selection_id, deposit_record_id,
        minimum_spend_progress_id, approval_type, requested_by, approval_status,
        reason, before_snapshot, after_snapshot, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [payload.tenantId ?? null, venueId, payload.private_event_id ?? null,
     payload.package_selection_id ?? null, payload.deposit_record_id ?? null,
     payload.minimum_spend_progress_id ?? null, payload.approval_type, actorUserId,
     'pending', payload.reason ?? null,
     JSON.stringify(payload.before_snapshot ?? {}), JSON.stringify(payload.after_snapshot ?? {}),
     idempotencyKey]
  )
  const req = result.rows[0]
  await auditRecord(venueId, actorUserId, 'create_approval_request', 'approval_request', String(req.id), {}, req, null)
  return { ok: true, approval: req }
}

export async function listApprovalRequests({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, approvals: [], note: 'No approval requests.' }
  let sql = `SELECT * FROM pos360_event_package_approval_requests WHERE venue_id=$1`
  const params = [venueId]
  if (filters.approval_status) { params.push(filters.approval_status); sql += ` AND approval_status=$${params.length}` }
  if (filters.approval_type) { params.push(filters.approval_type); sql += ` AND approval_type=$${params.length}` }
  if (filters.private_event_id) { params.push(filters.private_event_id); sql += ` AND private_event_id=$${params.length}` }
  sql += ' ORDER BY created_at DESC'
  const result = await query(sql, params)
  return { ok: true, approvals: result.rows }
}

export async function decideApprovalRequest({ venueId, approvalRequestId, managerUserId, decision, reason, idempotencyKey }) {
  if (!venueId || !approvalRequestId) return { ok: false, error: 'venue_id_and_approval_id_required' }
  if (!managerUserId) return { ok: false, error: 'manager_user_id_required' }
  if (!isValidApprovalStatus(decision)) return { ok: false, error: 'invalid_decision_status' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `UPDATE pos360_event_package_approval_requests
       SET approval_status=$3, manager_user_id=$4, manager_decision_at=NOW(), reason=$5, updated_at=NOW()
     WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [approvalRequestId, venueId, decision, managerUserId, reason]
  )
  if (!result.rows.length) return { ok: false, error: 'approval_request_not_found' }
  await auditRecord(venueId, managerUserId, `decide_approval_${decision}`, 'approval_request', String(approvalRequestId), {}, result.rows[0], reason, true)
  return { ok: true, approval: result.rows[0] }
}

// ── Inventory forecasts ───────────────────────────────────────────────────────

export async function createInventoryForecast({ venueId, privateEventId, payload, actorUserId, idempotencyKey }) {
  if (!venueId || !privateEventId) return { ok: false, error: 'venue_id_and_private_event_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isValidForecastType(payload.forecast_type)) return { ok: false, error: 'invalid_forecast_type' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `INSERT INTO pos360_event_package_inventory_forecasts
       (tenant_id, venue_id, private_event_id, package_id, forecast_type, forecast_payload, inventory_reserved, reservation_source, metadata, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [payload.tenantId ?? null, venueId, privateEventId, payload.package_id ?? null,
     payload.forecast_type, JSON.stringify(payload.forecast_payload ?? {}),
     false, 'forecast_only', JSON.stringify(payload.metadata ?? {}), actorUserId]
  )
  const fc = result.rows[0]
  await auditRecord(venueId, actorUserId, 'create_inventory_forecast', 'inventory_forecast', String(fc.id), {}, fc, null)
  return {
    ok: true, forecast: fc,
    note: 'Inventory forecast created. No inventory has been reserved. This is a planning estimate only.',
  }
}

export async function listInventoryForecasts({ venueId, privateEventId }) {
  if (!venueId || !privateEventId) return { ok: false, error: 'venue_id_and_private_event_id_required' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, forecasts: [], note: 'No inventory forecasts. No inventory has been reserved.' }
  const result = await query(
    `SELECT * FROM pos360_event_package_inventory_forecasts WHERE venue_id=$1 AND private_event_id=$2 ORDER BY created_at DESC`,
    [venueId, privateEventId]
  )
  return { ok: true, forecasts: result.rows }
}

export async function markForecastReviewed({ venueId, forecastId, actorUserId, idempotencyKey }) {
  if (!venueId || !forecastId) return { ok: false, error: 'venue_id_and_forecast_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `UPDATE pos360_event_package_inventory_forecasts SET reviewed_by=$3, reviewed_at=NOW(), updated_at=NOW() WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [forecastId, venueId, actorUserId]
  )
  if (!result.rows.length) return { ok: false, error: 'forecast_not_found' }
  await auditRecord(venueId, actorUserId, 'mark_forecast_reviewed', 'inventory_forecast', String(forecastId), {}, result.rows[0], null)
  return { ok: true, forecast: result.rows[0] }
}

// ── POS order links ───────────────────────────────────────────────────────────

export async function createPOSOrderLink({ venueId, privateEventId, payload, actorUserId, idempotencyKey }) {
  if (!venueId || !privateEventId) return { ok: false, error: 'venue_id_and_private_event_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const dup = await query(`SELECT id FROM pos360_event_package_pos_order_links WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
  if (dup.rows.length) return { ok: true, link: dup.rows[0], duplicate: true }
  const result = await query(
    `INSERT INTO pos360_event_package_pos_order_links
       (tenant_id, venue_id, private_event_id, pos_order_id, external_order_reference,
        linked_order_total, counts_toward_minimum_spend, link_status, source, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [payload.tenantId ?? null, venueId, privateEventId, payload.pos_order_id ?? null,
     payload.external_order_reference ?? null, payload.linked_order_total ?? 0,
     payload.counts_toward_minimum_spend !== false, payload.link_status ?? 'pending',
     payload.source ?? null, idempotencyKey, actorUserId]
  )
  const link = result.rows[0]
  await auditRecord(venueId, actorUserId, 'create_pos_order_link', 'pos_order_link', String(link.id), {}, link, null)
  return {
    ok: true, link,
    note: 'POS order link created. Actual order totals must be confirmed before counting toward minimum spend.',
  }
}

export async function listPOSOrderLinks({ venueId, privateEventId }) {
  if (!venueId || !privateEventId) return { ok: false, error: 'venue_id_and_private_event_id_required' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, links: [], note: 'No POS orders are linked to this event yet.' }
  const result = await query(
    `SELECT * FROM pos360_event_package_pos_order_links WHERE venue_id=$1 AND private_event_id=$2 ORDER BY created_at DESC`,
    [venueId, privateEventId]
  )
  return { ok: true, links: result.rows }
}

export async function removePOSOrderLink({ venueId, orderLinkId, actorUserId, reason, idempotencyKey }) {
  if (!venueId || !orderLinkId) return { ok: false, error: 'venue_id_and_order_link_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `UPDATE pos360_event_package_pos_order_links SET link_status='removed', updated_at=NOW() WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [orderLinkId, venueId]
  )
  if (!result.rows.length) return { ok: false, error: 'order_link_not_found' }
  await auditRecord(venueId, actorUserId, 'remove_pos_order_link', 'pos_order_link', String(orderLinkId), {}, result.rows[0], reason)
  return { ok: true, link: result.rows[0] }
}

// ── Monetization insights ─────────────────────────────────────────────────────

export async function createMonetizationInsightPlaceholder({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isValidMonetizationInsightType(payload.insight_type)) return { ok: false, error: 'invalid_insight_type' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `INSERT INTO pos360_event_monetization_insights
       (tenant_id, venue_id, private_event_id, insight_type, insight_payload, contains_ai_generated_content, ai_confidence, source, honest_state)
     VALUES ($1,$2,$3,$4,$5,FALSE,NULL,$6,$7) RETURNING *`,
    [payload.tenantId ?? null, venueId, payload.private_event_id ?? null,
     payload.insight_type, JSON.stringify(payload.insight_payload ?? {}),
     payload.source ?? 'system', 'placeholder']
  )
  return {
    ok: true, insight: result.rows[0],
    note: 'Monetization insight created as placeholder. No AI content was generated. E.A.T. monetization intelligence is not connected yet.',
  }
}

export async function listMonetizationInsights({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, insights: [], note: 'E.A.T. monetization insights are not connected yet.' }
  let sql = `SELECT * FROM pos360_event_monetization_insights WHERE venue_id=$1`
  const params = [venueId]
  if (filters.private_event_id) { params.push(filters.private_event_id); sql += ` AND private_event_id=$${params.length}` }
  if (filters.insight_type) { params.push(filters.insight_type); sql += ` AND insight_type=$${params.length}` }
  sql += ' ORDER BY created_at DESC LIMIT 100'
  const result = await query(sql, params)
  return { ok: true, insights: result.rows }
}

export async function getPrivateEventMonetizationSummary({ venueId, privateEventId }) {
  if (!venueId || !privateEventId) return { ok: false, error: 'venue_id_and_private_event_id_required' }
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', note: 'Monetization summary unavailable. No database connection.' }
  const [selections, deposit, minSpend, forecasts, links, insights] = await Promise.all([
    query(`SELECT * FROM pos360_private_event_package_selections WHERE venue_id=$1 AND private_event_id=$2`, [venueId, privateEventId]),
    query(`SELECT * FROM pos360_event_deposit_records WHERE venue_id=$1 AND private_event_id=$2 ORDER BY created_at DESC LIMIT 1`, [venueId, privateEventId]),
    query(`SELECT * FROM pos360_event_minimum_spend_progress WHERE venue_id=$1 AND private_event_id=$2`, [venueId, privateEventId]),
    query(`SELECT * FROM pos360_event_package_inventory_forecasts WHERE venue_id=$1 AND private_event_id=$2`, [venueId, privateEventId]),
    query(`SELECT * FROM pos360_event_package_pos_order_links WHERE venue_id=$1 AND private_event_id=$2 AND link_status='linked'`, [venueId, privateEventId]),
    query(`SELECT * FROM pos360_event_monetization_insights WHERE venue_id=$1 AND private_event_id=$2`, [venueId, privateEventId]),
  ])
  return {
    ok: true,
    privateEventId,
    packageSelections: selections.rows,
    depositRecord: deposit.rows[0] ?? null,
    minimumSpendProgress: minSpend.rows[0] ?? null,
    inventoryForecasts: forecasts.rows,
    posOrderLinks: links.rows,
    monetizationInsights: insights.rows,
    note: 'Summary reflects current data state. No revenue has been recognized. No deposits have been processed. No contracts have been signed unless recorded externally.',
  }
}

// ── Offline queue ─────────────────────────────────────────────────────────────

export async function queueOfflineEventPackageAction({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, action: { id: 'preview', idempotencyKey, status: 'queued' }, note: 'Action queued for sync.' }
  }
  const dup = await query(`SELECT id FROM pos360_event_package_offline_queue WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
  if (dup.rows.length) return { ok: true, action: dup.rows[0], duplicate: true }
  const result = await query(
    `INSERT INTO pos360_event_package_offline_queue
       (tenant_id, venue_id, device_id, actor_user_id, action_type, entity_type, entity_id, payload, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [payload.tenantId ?? null, venueId, payload.device_id ?? null, actorUserId,
     payload.action_type ?? 'unknown', payload.entity_type ?? null, payload.entity_id ?? null,
     JSON.stringify(payload.payload ?? {}), idempotencyKey]
  )
  return { ok: true, action: result.rows[0], note: 'Action queued for sync.' }
}

export async function listOfflineEventPackageQueue({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  if (!isDbAvailable()) return { ok: true, localPreview: true, actions: [], note: 'No offline actions queued.' }
  let sql = `SELECT * FROM pos360_event_package_offline_queue WHERE venue_id=$1`
  const params = [venueId]
  if (filters.sync_status) { params.push(filters.sync_status); sql += ` AND sync_status=$${params.length}` }
  sql += ' ORDER BY created_at DESC LIMIT 200'
  const result = await query(sql, params)
  return { ok: true, actions: result.rows }
}

export async function markOfflineEventPackageActionSynced({ venueId, offlineActionId, actorUserId, idempotencyKey }) {
  if (!venueId || !offlineActionId) return { ok: false, error: 'venue_id_and_action_id_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }
  if (!isDbAvailable()) return LOCAL_PREVIEW
  const result = await query(
    `UPDATE pos360_event_package_offline_queue SET sync_status='synced', synced_by=$3, synced_at=NOW(), updated_at=NOW() WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [offlineActionId, venueId, actorUserId]
  )
  if (!result.rows.length) return { ok: false, error: 'offline_action_not_found' }
  return { ok: true, action: result.rows[0] }
}
