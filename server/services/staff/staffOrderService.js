/**
 * Staff Order Service
 * Manages staff-entered and staff-assisted order sessions.
 * Does not claim payment captured, POS synced, or order persisted without database proof.
 */

import { v4 as uuidv4 } from 'uuid'

const SESSION_STORE = new Map()
const ITEM_STORE    = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

async function _attachOrderPreview(venueId, items) {
  try {
    const { createOrder } = await import('../order/orderLifecycleService.js')
    return await createOrder({ venueId, orderType: 'staff_order', items })
  } catch { return null }
}

async function _attachTaxPreview(venueId, subtotalCents) {
  try {
    const { calculateOrderTax } = await import('../tax/taxCalculationEngine.js')
    return await calculateOrderTax({ venueId, subtotalCents })
  } catch { return null }
}

async function _attachPaymentPreview(venueId, subtotalCents) {
  try {
    const { buildPaymentPreview } = await import('../payments/moneyBridgePaymentEngine.js')
    return await buildPaymentPreview({ venueId, subtotalCents })
  } catch { return null }
}

async function _attachKdsPreview(venueId, items) {
  try {
    const { buildDispatchPreview } = await import('../kds/kdsRoutingEngine.js')
    return await buildDispatchPreview({ venueId, items })
  } catch { return null }
}

export function startStaffOrderSession(payload = {}) {
  if (!payload.venue_id) return { ok: false, error: 'venue_id is required', sessionStatus: 'staff_order_preview' }
  const sessionId = uuidv4()
  const session = {
    staff_order_session_id: sessionId,
    venue_id:               payload.venue_id,
    staff_id:               payload.staff_id ?? null,
    table_id:               payload.table_id ?? null,
    section_id:             payload.section_id ?? null,
    customer_id:            payload.customer_id ?? null,
    checkout_cart_id:       payload.checkout_cart_id ?? null,
    order_id:               null,
    session_status:         payload.checkout_cart_id ? 'staff_assisted_preview' : 'staff_order_preview',
    order_mode:             payload.checkout_cart_id ? 'staff_assisted' : 'staff_entered',
    payment_status:         'payment_confirmation_required',
    tax_status:             'tax_preview_required',
    pos_status:             'pos_sync_pending',
    kds_status:             'kds_routing_pending',
    items:                  [],
    created_at:             now(),
    updated_at:             now(),
  }
  SESSION_STORE.set(sessionId, session)
  return {
    ok: true, session,
    sessionStatus:     session.session_status,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getStaffOrderSession(staffOrderSessionId) {
  const session = SESSION_STORE.get(staffOrderSessionId)
  if (!session) return { ok: false, sessionStatus: 'session_not_found', staffOrderSessionId }
  return { ok: true, session, sessionStatus: session.session_status }
}

export function getVenueStaffOrderSessions(venueId, filters = {}) {
  const sessions = []
  for (const s of SESSION_STORE.values()) {
    if (s.venue_id !== venueId) continue
    if (filters.session_status && s.session_status !== filters.session_status) continue
    if (filters.order_mode && s.order_mode !== filters.order_mode) continue
    sessions.push(s)
  }
  return { ok: true, sessions, count: sessions.length, venueId }
}

export function addItemToStaffOrder(staffOrderSessionId, itemPayload = {}) {
  const session = SESSION_STORE.get(staffOrderSessionId)
  if (!session) return { ok: false, sessionStatus: 'session_not_found' }
  if (!itemPayload.item_name) return { ok: false, error: 'item_name is required' }
  if ((itemPayload.quantity ?? 1) <= 0) return { ok: false, error: 'zero quantity is rejected' }
  if ((itemPayload.unit_amount ?? 0) < 0) return { ok: false, error: 'negative amounts are rejected' }

  const qty = itemPayload.quantity ?? 1
  const unitAmount = itemPayload.unit_amount ?? 0
  const item = {
    item_id:              uuidv4(),
    staff_order_session_id: staffOrderSessionId,
    item_name:            itemPayload.item_name,
    item_category:        itemPayload.item_category ?? 'general',
    quantity:             qty,
    unit_amount:          unitAmount,
    line_subtotal_amount: qty * unitAmount,
    tax_category:         itemPayload.tax_category ?? null,
    fulfillment_owner:    itemPayload.fulfillment_owner ?? 'venue',
    partner_id:           itemPayload.partner_id ?? null,
    availability_status:  'availability_required',
    metadata:             itemPayload.metadata ?? {},
    created_at:           now(),
    updated_at:           now(),
  }
  session.items.push(item)
  ITEM_STORE.set(item.item_id, item)
  session.updated_at = now()
  return { ok: true, item, sessionStatus: 'staff_order_preview', inventoryStatus: 'inventory_unavailable' }
}

export function updateStaffOrderItem(staffOrderSessionId, itemId, itemPayload = {}) {
  const session = SESSION_STORE.get(staffOrderSessionId)
  if (!session) return { ok: false, sessionStatus: 'session_not_found' }
  if (itemPayload.quantity != null && itemPayload.quantity <= 0) return { ok: false, error: 'zero quantity is rejected' }
  if (itemPayload.unit_amount != null && itemPayload.unit_amount < 0) return { ok: false, error: 'negative amounts are rejected' }
  const item = session.items.find(i => i.item_id === itemId)
  if (!item) return { ok: false, error: 'item_not_found' }
  if (itemPayload.quantity != null) item.quantity = itemPayload.quantity
  if (itemPayload.unit_amount != null) item.unit_amount = itemPayload.unit_amount
  item.line_subtotal_amount = item.quantity * item.unit_amount
  item.updated_at = now()
  session.updated_at = now()
  return { ok: true, item, sessionStatus: 'staff_order_preview' }
}

export function removeStaffOrderItem(staffOrderSessionId, itemId) {
  const session = SESSION_STORE.get(staffOrderSessionId)
  if (!session) return { ok: false, sessionStatus: 'session_not_found' }
  const idx = session.items.findIndex(i => i.item_id === itemId)
  if (idx === -1) return { ok: false, error: 'item_not_found' }
  session.items.splice(idx, 1)
  ITEM_STORE.delete(itemId)
  session.updated_at = now()
  return { ok: true, sessionStatus: 'staff_order_preview', itemId }
}

export function assignStaffOrderToTable(staffOrderSessionId, tableContext = {}) {
  const session = SESSION_STORE.get(staffOrderSessionId)
  if (!session) return { ok: false, sessionStatus: 'session_not_found' }
  session.table_id = tableContext.table_id ?? null
  session.updated_at = now()
  return { ok: true, session, tableAssignmentStatus: 'table_assignment_pending', sessionStatus: session.session_status }
}

export function assignStaffOrderToSection(staffOrderSessionId, sectionContext = {}) {
  const session = SESSION_STORE.get(staffOrderSessionId)
  if (!session) return { ok: false, sessionStatus: 'session_not_found' }
  session.section_id = sectionContext.section_id ?? null
  session.updated_at = now()
  return { ok: true, session, sectionStatus: 'section_layout_preview', sessionStatus: session.session_status }
}

export async function submitStaffOrderPreview(staffOrderSessionId, actorContext = {}) {
  const session = SESSION_STORE.get(staffOrderSessionId)
  if (!session) return { ok: false, sessionStatus: 'session_not_found' }

  const subtotal = session.items.reduce((s, i) => s + i.line_subtotal_amount, 0)
  const [orderPreview, taxPreview, paymentPreview, kdsPreview] = await Promise.all([
    _attachOrderPreview(session.venue_id, session.items),
    _attachTaxPreview(session.venue_id, subtotal),
    _attachPaymentPreview(session.venue_id, subtotal),
    _attachKdsPreview(session.venue_id, session.items),
  ])

  return {
    ok:               true,
    staffOrderSessionId,
    sessionStatus:    'staff_order_preview',
    submissionStatus: 'order_submission_preview',
    orderPreview,     orderStatus:   'order_lifecycle_preview',
    taxPreview,       taxStatus:     'tax_preview_required',
    paymentPreview,   paymentStatus: 'payment_confirmation_required',
    kdsPreview,       kdsStatus:     'kds_routing_pending',
    posStatus:        'pos_sync_pending',
    inventoryStatus:  'inventory_unavailable',
    submissionNote:   'Staff order submitted as preview only. No payment captured, no POS synced, no kitchen notified.',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function convertCustomerCartToStaffOrder(cartId, staffContext = {}) {
  const sessionId = uuidv4()
  const session = {
    staff_order_session_id: sessionId,
    venue_id:               staffContext.venue_id,
    staff_id:               staffContext.staff_id ?? null,
    table_id:               staffContext.table_id ?? null,
    section_id:             staffContext.section_id ?? null,
    customer_id:            staffContext.customer_id ?? null,
    checkout_cart_id:       cartId,
    order_id:               null,
    session_status:         'staff_assisted_preview',
    order_mode:             'staff_assisted',
    payment_status:         'payment_confirmation_required',
    tax_status:             'tax_preview_required',
    pos_status:             'pos_sync_pending',
    kds_status:             'kds_routing_pending',
    items:                  [],
    created_at:             now(),
    updated_at:             now(),
  }
  SESSION_STORE.set(sessionId, session)
  return {
    ok: true, session,
    sessionStatus:      'staff_assisted_preview',
    conversionNote:     'Customer cart converted to staff-assisted order preview.',
    persistenceStatus:  dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function requestStaffAssistFromCustomerCart(cartId, staffContext = {}) {
  return convertCustomerCartToStaffOrder(cartId, staffContext)
}

export function cancelStaffOrderSession(staffOrderSessionId, reason = null, actorContext = {}) {
  const session = SESSION_STORE.get(staffOrderSessionId)
  if (!session) return { ok: false, sessionStatus: 'session_not_found' }
  session.session_status = 'staff_order_cancelled'
  session.updated_at = now()
  return { ok: true, sessionStatus: 'staff_order_cancelled', reason, staffOrderSessionId }
}

export async function getStaffOrderReadiness(payload = {}) {
  const blockers = []
  if (!payload.venue_id) blockers.push({ type: 'venue_profile_required', severity: 'critical' })
  blockers.push({ type: 'payment_confirmation_required', severity: 'required' })
  blockers.push({ type: 'tax_preview_required', severity: 'info' })
  blockers.push({ type: 'pos_sync_pending', severity: 'info' })
  blockers.push({ type: 'kds_routing_pending', severity: 'info' })
  if (!dbAvailable()) blockers.push({ type: 'database_required', severity: 'warning' })
  const score = Math.max(0, 100 - blockers.filter(b => b.severity === 'critical').length * 40)
  return {
    ok: blockers.filter(b => b.severity === 'critical').length === 0,
    staffOrderStatus: 'staff_order_preview',
    readinessScore:   score,
    blockers,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}
