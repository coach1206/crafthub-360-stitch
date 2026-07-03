/**
 * Manual POS360 Handoff Service
 * Builds handoff snapshots for staff to enter into POS manually.
 * Does not claim POS sync happened. pos_status remains pos_sync_pending.
 */

import { v4 as uuidv4 } from 'uuid'

const HANDOFF_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

export function buildManualPOS360Handoff(session, items = []) {
  const subtotal = items.reduce((s, i) => s + (i.line_subtotal_amount ?? 0), 0)
  return {
    handoff_snapshot_version: '1.0',
    venue_id:               session.venue_id,
    staff_order_session_id: session.staff_order_session_id,
    order_id:               session.order_id ?? null,
    table_id:               session.table_id ?? null,
    section_id:             session.section_id ?? null,
    staff_id:               session.staff_id ?? null,
    items: items.map(i => ({
      item_name:            i.item_name,
      item_category:        i.item_category ?? 'general',
      quantity:             i.quantity,
      unit_amount:          i.unit_amount,
      line_subtotal_amount: i.line_subtotal_amount,
      fulfillment_owner:    i.fulfillment_owner ?? 'venue',
      notes:                i.metadata?.notes ?? null,
    })),
    subtotal_amount:   subtotal,
    item_count:        items.length,
    handoff_status:    'manual_pos360_handoff',
    pos_status:        'pos_sync_pending',
    handoff_note:      'Staff must enter this order into POS manually. POS sync has not occurred.',
    created_at:        now(),
  }
}

export function createManualPOS360Handoff(payload = {}) {
  if (!payload.venue_id) return { ok: false, error: 'venue_id is required' }
  const handoffId = uuidv4()
  const snapshot = buildManualPOS360Handoff(
    { venue_id: payload.venue_id, staff_order_session_id: payload.staff_order_session_id, order_id: payload.order_id, table_id: payload.table_id, section_id: payload.section_id, staff_id: payload.staff_id },
    payload.items ?? []
  )
  const record = {
    handoff_id:             handoffId,
    venue_id:               payload.venue_id,
    staff_order_session_id: payload.staff_order_session_id ?? null,
    order_id:               payload.order_id ?? null,
    staff_id:               payload.staff_id ?? null,
    handoff_status:         'manual_pos360_handoff',
    pos_status:             'pos_sync_pending',
    handoff_snapshot:       snapshot,
    created_at:             now(),
    updated_at:             now(),
  }
  HANDOFF_STORE.set(handoffId, record)
  return {
    ok: true, handoff: record,
    handoffStatus:     'manual_pos360_handoff',
    posStatus:         'pos_sync_pending',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
    handoffNote:       'Manual POS360 handoff created. Staff must enter order into POS manually.',
  }
}

export function getManualPOS360Handoff(handoffId) {
  const handoff = HANDOFF_STORE.get(handoffId)
  if (!handoff) return { ok: false, handoffStatus: 'handoff_not_found', handoffId }
  return { ok: true, handoff, handoffStatus: handoff.handoff_status, posStatus: handoff.pos_status }
}

export function getVenueManualPOS360Handoffs(venueId, filters = {}) {
  const handoffs = []
  for (const h of HANDOFF_STORE.values()) {
    if (h.venue_id !== venueId) continue
    if (filters.handoff_status && h.handoff_status !== filters.handoff_status) continue
    handoffs.push(h)
  }
  return { ok: true, handoffs, count: handoffs.length, venueId }
}

export function markManualHandoffPreviewed(handoffId, actorContext = {}) {
  const handoff = HANDOFF_STORE.get(handoffId)
  if (!handoff) return { ok: false, handoffStatus: 'handoff_not_found' }
  handoff.handoff_status = 'manual_pos360_handoff_previewed'
  handoff.updated_at = now()
  return { ok: true, handoff, handoffStatus: 'manual_pos360_handoff_previewed', posStatus: 'pos_sync_pending', persistenceStatus: 'not_persisted' }
}

export function getManualPOS360Readiness(venueId) {
  return {
    ok:             true,
    venueId,
    handoffStatus:  'manual_pos360_handoff',
    posStatus:      'pos_sync_pending',
    readinessNote:  'Manual POS360 handoff is available. Automatic POS sync requires live POS integration.',
    blockers:       [{ type: 'pos_sync_pending', severity: 'info' }],
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}
