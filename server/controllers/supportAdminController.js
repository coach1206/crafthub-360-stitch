/**
 * Support Admin Tools — Production Package 5 (§18-20)
 *
 * RBAC-gated (manager+ for lookups, admin+ for corrective actions — see
 * supportAdminRoutes.js) tools for authorized staff to inspect real player
 * state, orders, payments, inventory events, Passport, Golden Box, and to
 * create/manage support cases. Every corrective action is:
 *   1. Previewed (dry-run diff returned to caller before commit)
 *   2. Authorized (requires admin role + explicit confirm=true)
 *   3. Logged to support_case_actions BEFORE the mutation is applied
 *   4. Tied to a support case (case_id required)
 *   5. Reversible where possible (reversible flag + reversed_by/at columns)
 *
 * No endpoint here allows a raw/arbitrary SQL write. Corrective actions are
 * limited to a small allowlist of safe, reviewed operations.
 */

import { isDbAvailable, query } from '../db/connection.js'
import { logInfo, logWarn, EVENT_TYPE } from '../lib/structuredLogger.mjs'

function requireDb(res) {
  if (!isDbAvailable()) {
    res.status(503).json({ success: false, error: 'database_unavailable' })
    return false
  }
  return true
}

// ── Case model ─────────────────────────────────────────────────

export async function createCase(req, res) {
  if (!requireDb(res)) return
  const { customerIdentifier, venueId, category, severity, description,
          relatedOrderId, relatedPaymentId, relatedSessionId } = req.body || {}
  if (!category || !description) {
    return res.status(400).json({ success: false, error: 'category and description required' })
  }
  const caseNumber = `SC-CASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const result = await query(
    `INSERT INTO support_cases
       (case_number, customer_identifier, venue_id, category, severity, status,
        related_order_id, related_payment_id, related_session_id, description, opened_by)
     VALUES ($1,$2,$3,$4,$5,'open',$6,$7,$8,$9,$10)
     RETURNING *`,
    [caseNumber, customerIdentifier || null, venueId || null, category,
     severity || 'sev4', relatedOrderId || null, relatedPaymentId || null,
     relatedSessionId || null, description, req.user?.id || 'unknown']
  )
  logInfo(EVENT_TYPE.SUPPORT_ACTION, {
    action: 'case_created', case_number: caseNumber, actor_id: req.user?.id, category,
  })
  res.status(201).json({ success: true, case: result.rows[0] })
}

export async function listCases(req, res) {
  if (!requireDb(res)) return
  const { status, venueId } = req.query
  const clauses = []
  const params = []
  if (status) { params.push(status); clauses.push(`status = $${params.length}`) }
  if (venueId) { params.push(venueId); clauses.push(`venue_id = $${params.length}`) }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const result = await query(`SELECT * FROM support_cases ${where} ORDER BY created_at DESC LIMIT 100`, params)
  res.json({ success: true, cases: result.rows })
}

export async function getCase(req, res) {
  if (!requireDb(res)) return
  const c = await query(`SELECT * FROM support_cases WHERE id = $1`, [req.params.caseId])
  if (!c.rows.length) return res.status(404).json({ success: false, error: 'case_not_found' })
  const actions = await query(
    `SELECT * FROM support_case_actions WHERE case_id = $1 ORDER BY created_at ASC`,
    [req.params.caseId]
  )
  res.json({ success: true, case: c.rows[0], actions: actions.rows })
}

// ── Read-only lookups (manager+) ────────────────────────────────

export async function lookupPlayerState(req, res) {
  if (!requireDb(res)) return
  const { identifier } = req.params
  const passport = await query(
    `SELECT * FROM passport_records WHERE id::text = $1 OR player_id::text = $1 LIMIT 5`,
    [identifier]
  ).catch((e) => ({ rows: [], error: e.message }))
  const stamps = await query(
    `SELECT * FROM passport_stamps WHERE passport_id::text = $1 LIMIT 25`,
    [identifier]
  ).catch((e) => ({ rows: [], error: e.message }))
  await logAuditedLookup(req, 'player_state', identifier)
  res.json({ success: true, identifier, passport: passport.rows, stamps: stamps.rows })
}

export async function lookupOrder(req, res) {
  if (!requireDb(res)) return
  const { orderId } = req.params
  const order = await query(
    `SELECT * FROM venue_cigar_payment_intents WHERE id::text = $1 LIMIT 1`,
    [orderId]
  ).catch((e) => ({ rows: [], error: e.message }))
  await logAuditedLookup(req, 'order', orderId)
  res.json({ success: true, orderId, order: order.rows })
}

export async function lookupInventoryEvents(req, res) {
  if (!requireDb(res)) return
  const { productId } = req.params
  const events = await query(
    `SELECT * FROM inventory_events WHERE product_id::text = $1 ORDER BY created_at DESC LIMIT 100`,
    [productId]
  ).catch((e) => ({ rows: [], error: e.message }))
  await logAuditedLookup(req, 'inventory_events', productId)
  res.json({ success: true, productId, events: events.rows })
}

async function logAuditedLookup(req, targetEntity, targetId) {
  const caseId = req.query?.caseId || req.body?.caseId || null
  logInfo(EVENT_TYPE.SUPPORT_ACTION, {
    action: 'lookup', actor_id: req.user?.id, target_entity: targetEntity,
    target_id: targetId, case_id: caseId,
  })
  if (caseId) {
    await query(
      `INSERT INTO support_case_actions (case_id, actor_id, actor_role, action_type, target_entity, target_id, reason)
       VALUES ($1,$2,$3,'lookup',$4,$5,'support lookup')`,
      [caseId, req.user?.id || 'unknown', req.user?.role || 'unknown', targetEntity, String(targetId)]
    ).catch(() => {})
  }
}

// ── Corrective actions (admin+ only, allowlisted operations) ────

const ALLOWED_CORRECTIVE_ACTIONS = new Set([
  'reopen_support_case',
  'reassign_support_case',
  'add_case_note',
])

/**
 * POST /api/support-admin/cases/:caseId/corrective-action
 * Body: { actionType, payload, reason, confirm }
 * With confirm !== true, returns a PREVIEW only (no write performed).
 */
export async function applyCorrectiveAction(req, res) {
  if (!requireDb(res)) return
  const { caseId } = req.params
  const { actionType, payload = {}, reason, confirm } = req.body || {}

  if (!ALLOWED_CORRECTIVE_ACTIONS.has(actionType)) {
    return res.status(400).json({
      success: false,
      error: 'unsupported_action_type',
      allowed: [...ALLOWED_CORRECTIVE_ACTIONS],
    })
  }
  if (!reason) return res.status(400).json({ success: false, error: 'reason_required' })

  const caseRow = await query(`SELECT * FROM support_cases WHERE id = $1`, [caseId])
  if (!caseRow.rows.length) return res.status(404).json({ success: false, error: 'case_not_found' })
  const before = caseRow.rows[0]

  let after = { ...before }
  if (actionType === 'reopen_support_case') after.status = 'open'
  if (actionType === 'reassign_support_case') after.assigned_owner = payload.assignedOwner || before.assigned_owner
  if (actionType === 'add_case_note') after.resolution_notes = `${before.resolution_notes || ''}\n[${new Date().toISOString()}] ${payload.note || ''}`.trim()

  const preview = { before, after, actionType, reason }

  if (confirm !== true) {
    return res.json({ success: true, preview, applied: false, note: 'Preview only. Resend with confirm:true to apply.' })
  }

  // Log the action BEFORE applying the mutation (audit-first ordering).
  const actionRow = await query(
    `INSERT INTO support_case_actions
       (case_id, actor_id, actor_role, action_type, target_entity, target_id, before_state, after_state, reason, reversible)
     VALUES ($1,$2,$3,'corrective_action','support_cases',$4,$5,$6,$7,true)
     RETURNING *`,
    [caseId, req.user?.id || 'unknown', req.user?.role || 'unknown', String(caseId),
     JSON.stringify(before), JSON.stringify(after), reason]
  )

  if (actionType === 'reopen_support_case') {
    await query(`UPDATE support_cases SET status = 'open', updated_at = now() WHERE id = $1`, [caseId])
  } else if (actionType === 'reassign_support_case') {
    await query(`UPDATE support_cases SET assigned_owner = $2, updated_at = now() WHERE id = $1`, [caseId, payload.assignedOwner || null])
  } else if (actionType === 'add_case_note') {
    await query(`UPDATE support_cases SET resolution_notes = $2, updated_at = now() WHERE id = $1`, [caseId, after.resolution_notes])
  }

  logWarn(EVENT_TYPE.SUPPORT_ACTION, {
    action: 'corrective_action_applied', actor_id: req.user?.id, case_id: caseId, action_type: actionType,
  })

  const updated = await query(`SELECT * FROM support_cases WHERE id = $1`, [caseId])
  res.json({ success: true, applied: true, action: actionRow.rows[0], case: updated.rows[0] })
}

export default {
  createCase, listCases, getCase, lookupPlayerState, lookupOrder,
  lookupInventoryEvents, applyCorrectiveAction,
}
