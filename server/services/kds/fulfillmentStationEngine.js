/**
 * Fulfillment Station Engine
 * Tracks fulfillment plan, handoff plan, and station status for orders.
 * Preview-safe: does not claim actual item prep or pickup completion without proof.
 */

const fulfillmentStore = new Map()  // orderId → fulfillmentPlan
const handoffStore     = new Map()  // orderId → [handoffs]

export function getFulfillmentStations(venueId) {
  return {
    ok: true,
    venueId,
    stations: [
      { stationType: 'kitchen',         fulfillmentStatus: 'fulfillment_pending', routingMode: 'routing_preview' },
      { stationType: 'bar',             fulfillmentStatus: 'fulfillment_pending', routingMode: 'routing_preview' },
      { stationType: 'humidor',         fulfillmentStatus: 'fulfillment_pending', routingMode: 'routing_preview' },
      { stationType: 'partner_window',  fulfillmentStatus: 'fulfillment_pending', routingMode: 'routing_preview' },
      { stationType: 'expo',            fulfillmentStatus: 'fulfillment_pending', routingMode: 'routing_preview' },
      { stationType: 'service_runner',  fulfillmentStatus: 'fulfillment_pending', routingMode: 'routing_preview' },
      { stationType: 'patio_runner',    fulfillmentStatus: 'fulfillment_pending', routingMode: 'routing_preview' },
      { stationType: 'pickup_handoff',  fulfillmentStatus: 'fulfillment_pending', routingMode: 'routing_preview' },
      { stationType: 'delivery_handoff', fulfillmentStatus: 'fulfillment_pending', routingMode: 'routing_preview' },
    ],
    storageMode: 'memory_fallback',
  }
}

export function getLineItemFulfillmentStatus(lineItem) {
  const isPartner = !!lineItem.partnerId
  return {
    lineItemId:        lineItem.lineItemId ?? lineItem.line_item_id ?? 'unknown',
    fulfillmentStatus: 'fulfillment_pending',
    fulfillmentOwner:  isPartner ? 'partner' : 'venue',
    stationType:       isPartner ? 'partner_window' : (lineItem.stationType ?? 'kitchen'),
    partnerWindowRequired: isPartner ? 'partner_window_required' : null,
    routingMode:       'routing_preview',
  }
}

export function getFulfillmentPlan(orderPayload) {
  const items        = orderPayload?.lineItems ?? []
  const venueItems   = items.filter(li => !li.partnerId)
  const partnerItems = items.filter(li => li.partnerId)
  const hasMultiple  = items.length > 1

  const plan = {
    orderId:           orderPayload?.orderId,
    venueId:           orderPayload?.venueId,
    totalItems:        items.length,
    venueItemCount:    venueItems.length,
    partnerItemCount:  partnerItems.length,
    overallFulfillmentStatus: 'fulfillment_pending',
    requiresExpo:      hasMultiple,
    expoRequired:      hasMultiple ? 'expo_required' : null,
    partnerWindowRequired: partnerItems.length > 0 ? 'partner_window_required' : null,
    lineItemStatuses:  items.map(getLineItemFulfillmentStatus),
    storageMode:       'memory_fallback',
    routingMode:       'routing_preview',
  }
  fulfillmentStore.set(orderPayload?.orderId, plan)
  return { ok: true, fulfillmentPlan: plan }
}

export async function updateLineItemFulfillmentPreview(orderId, lineItemId, payload) {
  const plan = fulfillmentStore.get(orderId)
  if (!plan) return { ok: false, reason: 'order_not_found', orderId }
  const item = plan.lineItemStatuses?.find(li => li.lineItemId === lineItemId)
  if (!item) return { ok: false, reason: 'line_item_not_found', lineItemId }
  Object.assign(item, { fulfillmentStatus: payload.fulfillmentStatus ?? 'fulfillment_pending', updatedAt: new Date().toISOString() })
  return { ok: true, orderId, lineItemId, fulfillmentStatus: item.fulfillmentStatus, storageMode: 'memory_fallback' }
}

export function buildHandoffPlan(orderPayload) {
  const items   = orderPayload?.lineItems ?? []
  const handoffs = []

  // Expo handoff for multi-station orders
  if (items.length > 1) {
    handoffs.push({ handoffType: 'expo', handoffStatus: 'handoff_pending', routingMode: 'routing_preview' })
  }

  // Service runner or patio runner
  const orderType = orderPayload?.orderType ?? 'venue_order'
  if (orderType === 'patio_order') {
    handoffs.push({ handoffType: 'patio_runner', handoffStatus: 'handoff_pending', routingMode: 'routing_preview' })
  } else {
    handoffs.push({ handoffType: 'service_runner', handoffStatus: 'handoff_pending', routingMode: 'routing_preview' })
  }

  // Pickup / delivery
  if (orderType === 'pickup_order') {
    handoffs.push({ handoffType: 'pickup_handoff', handoffStatus: 'handoff_pending', routingMode: 'routing_preview' })
  }
  if (orderType === 'delivery_order') {
    handoffs.push({ handoffType: 'delivery_handoff', handoffStatus: 'handoff_pending', routingMode: 'routing_preview' })
  }

  handoffStore.set(orderPayload?.orderId, handoffs)
  return { ok: true, orderId: orderPayload?.orderId, handoffs, storageMode: 'memory_fallback' }
}

export function getHandoffStatus(orderId) {
  const handoffs = handoffStore.get(orderId) ?? []
  return { ok: true, orderId, handoffs, storageMode: 'memory_fallback' }
}

export function getFulfillmentBlockers(orderPayload) {
  const blockers = []
  if (!orderPayload?.venueId) blockers.push({ type: 'venue_profile_required', severity: 'critical' })

  const partnerItems = (orderPayload?.lineItems ?? []).filter(li => li.partnerId)
  if (partnerItems.length > 0) {
    blockers.push({ type: 'partner_window_required', severity: 'warning' })
    blockers.push({ type: 'availability_required', severity: 'warning' })
  }

  if ((orderPayload?.lineItems ?? []).length > 1) {
    blockers.push({ type: 'expo_required', severity: 'info' })
  }

  blockers.push({ type: 'fulfillment_pending', severity: 'info', message: 'Fulfillment is pending. No station was notified.' })
  return blockers
}

export function getFulfillmentReadiness(orderPayload) {
  const blockers  = getFulfillmentBlockers(orderPayload)
  const criticals = blockers.filter(b => b.severity === 'critical')
  return {
    ok: true,
    fulfillmentReadiness: criticals.length === 0 ? 'routing_preview' : 'routing_preview',
    overallFulfillmentStatus: 'fulfillment_pending',
    routingMode: 'routing_preview',
    blockers,
    storageMode: 'preview_fallback',
  }
}
