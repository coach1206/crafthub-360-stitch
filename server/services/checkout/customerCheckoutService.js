/**
 * Customer Checkout Service
 * Orchestrates checkout preview, self-order, and staff-assisted flows.
 * Does not claim live payment capture, POS sync, or KDS notification.
 */

import { v4 as uuidv4 } from 'uuid'

const SESSION_STORE = new Map()
const HANDOFF_STORE = new Map()

function now() { return new Date().toISOString() }

async function _getOrderPreview(venueId, cartPayload) {
  try {
    const { createOrder } = await import('../order/orderLifecycleService.js')
    const result = await createOrder({
      venueId,
      orderType: cartPayload.order_type ?? 'venue_order',
      items: (cartPayload.items ?? []).map(i => ({
        itemId: i.product_id ?? i.cart_item_id,
        name:   i.item_name,
        qty:    i.quantity,
        priceCents: i.unit_amount,
      })),
      subtotalCents: cartPayload.subtotal_amount ?? 0,
    })
    return { ok: true, orderPreview: result, orderStatus: 'order_lifecycle_preview' }
  } catch {
    return { ok: true, orderPreview: null, orderStatus: 'order_lifecycle_preview', orderNote: 'order_lifecycle_engine_preview' }
  }
}

async function _getTaxPreview(venueId, cartPayload) {
  try {
    const { calculateOrderTax } = await import('../tax/taxCalculationEngine.js')
    const result = await calculateOrderTax({
      venueId,
      subtotalCents: cartPayload.subtotal_amount ?? 0,
      items: cartPayload.items ?? [],
    })
    return { ok: true, taxPreview: result, taxStatus: 'tax_preview' }
  } catch {
    return { ok: true, taxPreview: null, taxStatus: 'tax_preview_required', taxNote: 'tax_engine_preview' }
  }
}

async function _getPaymentPreview(venueId, cartPayload) {
  try {
    const { buildPaymentPreview } = await import('../payments/moneyBridgePaymentEngine.js')
    const result = await buildPaymentPreview({
      venueId,
      subtotalCents: cartPayload.subtotal_amount ?? 0,
    })
    return { ok: true, paymentPreview: result, paymentStatus: 'payment_confirmation_required' }
  } catch {
    return { ok: true, paymentPreview: null, paymentStatus: 'payment_confirmation_required', paymentNote: 'money_bridge_preview' }
  }
}

async function _getKdsPreview(venueId, cartPayload) {
  try {
    const { buildDispatchPreview } = await import('../kds/kdsRoutingEngine.js')
    const result = await buildDispatchPreview({ venueId, items: cartPayload.items ?? [] })
    return { ok: true, kdsPreview: result, kdsStatus: 'kds_routing_pending' }
  } catch {
    return { ok: true, kdsPreview: null, kdsStatus: 'kds_routing_pending', kdsNote: 'kds_engine_preview' }
  }
}

export async function startCheckout(cartId, checkoutContext = {}) {
  const sessionId = uuidv4()
  const session = {
    checkout_session_id: sessionId,
    cart_id:             cartId,
    venue_id:            checkoutContext.venue_id,
    customer_id:         checkoutContext.customer_id ?? null,
    session_status:      'checkout_preview',
    payment_status:      'payment_confirmation_required',
    tax_status:          'tax_preview_required',
    order_status:        'order_submission_preview',
    pos_status:          'pos_sync_pending',
    kds_status:          'kds_routing_pending',
    inventory_status:    'inventory_unavailable',
    created_at:          now(),
    updated_at:          now(),
  }
  SESSION_STORE.set(sessionId, session)
  return {
    ok:              true,
    checkoutSession: session,
    checkoutStatus:  'checkout_preview',
    persistenceStatus: process.env.DATABASE_URL ? 'database_required' : 'not_persisted',
  }
}

export function validateCheckoutSession(checkoutSession) {
  const errors = []
  if (!checkoutSession?.cart_id)   errors.push('cart_id required')
  if (!checkoutSession?.venue_id)  errors.push('venue_id required')
  return { ok: errors.length === 0, errors, sessionValidationStatus: errors.length === 0 ? 'session_valid' : 'session_invalid' }
}

export async function buildCheckoutPreview(cartPayload = {}, checkoutContext = {}) {
  const venueId = checkoutContext.venue_id ?? cartPayload.venue_id
  const [orderResult, taxResult, paymentResult, kdsResult] = await Promise.all([
    _getOrderPreview(venueId, cartPayload),
    _getTaxPreview(venueId, cartPayload),
    _getPaymentPreview(venueId, cartPayload),
    _getKdsPreview(venueId, cartPayload),
  ])

  return {
    ok:               true,
    checkoutStatus:   'checkout_preview',
    venueId,
    cartId:           cartPayload.cart_id,
    orderPreview:     orderResult.orderPreview,
    orderStatus:      orderResult.orderStatus,
    taxPreview:       taxResult.taxPreview,
    taxStatus:        taxResult.taxStatus,
    paymentPreview:   paymentResult.paymentPreview,
    paymentStatus:    paymentResult.paymentStatus,
    kdsPreview:       kdsResult.kdsPreview,
    kdsStatus:        kdsResult.kdsStatus,
    posStatus:        'pos_sync_pending',
    inventoryStatus:  'inventory_unavailable',
    previewNote:      'This is a checkout preview. No payment has been captured, no order has been submitted to a live system, and no kitchen has been notified.',
  }
}

export async function buildSelfOrderPreview(cartPayload = {}, checkoutContext = {}) {
  const base = await buildCheckoutPreview(cartPayload, checkoutContext)
  return {
    ...base,
    selfOrderStatus:  'self_order_preview',
    orderMode:        'self_order_preview',
    selfOrderNote:    'Self-order preview. Customer submission requires venue approval, payment confirmation, and active order lifecycle integration.',
  }
}

export async function submitSelfOrderPreview(cartPayload = {}, checkoutContext = {}) {
  const preview = await buildSelfOrderPreview(cartPayload, checkoutContext)
  return {
    ...preview,
    submissionStatus: 'order_submission_preview',
    submissionNote:   'Order submitted as preview only. Not persisted. No payment captured. No kitchen notified.',
    persistenceStatus: process.env.DATABASE_URL ? 'database_required' : 'not_persisted',
  }
}

export async function buildStaffAssistedOrderPreview(cartPayload = {}, staffContext = {}) {
  const base = await buildCheckoutPreview(cartPayload, { venue_id: staffContext.venue_id ?? cartPayload.venue_id })
  return {
    ...base,
    staffHandoffStatus: 'staff_handoff_preview',
    staffId:            staffContext.staff_id ?? null,
    staffNote:          'Staff-assisted order preview. Staff must confirm before submission to POS or KDS.',
    orderMode:          'staff_handoff_preview',
  }
}

export async function requestStaffHandoff(cartId, handoffPayload = {}) {
  const handoffId = uuidv4()
  const handoff = {
    handoff_id:            handoffId,
    cart_id:               cartId,
    venue_id:              handoffPayload.venue_id,
    staff_id:              handoffPayload.staff_id ?? null,
    handoff_status:        'staff_handoff_preview',
    handoff_reason:        handoffPayload.reason ?? null,
    staff_action_required: true,
    metadata:              handoffPayload.metadata ?? {},
    created_at:            now(),
    updated_at:            now(),
  }
  HANDOFF_STORE.set(handoffId, handoff)
  return {
    ok:              true,
    handoff,
    handoffStatus:   'staff_handoff_preview',
    staffAssistNote: 'Staff handoff requested. Staff action required before order is processed.',
    persistenceStatus: process.env.DATABASE_URL ? 'database_required' : 'not_persisted',
  }
}

export function getCheckoutSession(checkoutSessionId) {
  const session = SESSION_STORE.get(checkoutSessionId)
  if (!session) return { ok: false, checkoutStatus: 'session_not_found', checkoutSessionId }
  return { ok: true, checkoutSession: session, checkoutStatus: session.session_status }
}

export async function getCheckoutReadiness(cartPayload = {}) {
  const { getCheckoutReadiness: engineReadiness } = await import('./checkoutReadinessEngine.js')
  return engineReadiness(cartPayload)
}

export function cancelCheckoutSession(checkoutSessionId, reason = null) {
  const session = SESSION_STORE.get(checkoutSessionId)
  if (!session) return { ok: false, checkoutStatus: 'session_not_found' }
  session.session_status = 'checkout_cancelled'
  session.updated_at = now()
  return { ok: true, checkoutStatus: 'checkout_cancelled', reason, checkoutSessionId }
}
