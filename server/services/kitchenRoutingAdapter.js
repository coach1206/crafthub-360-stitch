/**
 * Kitchen Routing Adapter Contract
 *
 * Destination stations: bar | humidor | kitchen | partner | server_pickup | management_review
 *
 * No real KDS (Kitchen Display System) or partner API is currently integrated.
 * Status routed_live must NEVER be used unless real integration exists.
 */

const ROUTING_STATUSES = {
  ROUTING_PREVIEW: 'routing_preview',
  ROUTE_PENDING: 'route_pending',
  MANAGEMENT_REVIEW_REQUIRED: 'management_review_required',
  PARTNER_ROUTE_PENDING: 'partner_route_pending',
  KITCHEN_ROUTE_PENDING: 'kitchen_route_pending',
  ROUTED_PREVIEW_ONLY: 'routed_preview_only',
  ROUTED_LIVE: 'routed_live',  // only valid with real KDS integration
}

const STATIONS = {
  BAR: 'bar',
  HUMIDOR: 'humidor',
  KITCHEN: 'kitchen',
  PARTNER: 'partner',
  SERVER_PICKUP: 'server_pickup',
  MANAGEMENT_REVIEW: 'management_review',
}

// In-memory routing state — preview only
const routingStore = new Map()

/**
 * Determine destination station for an order item.
 */
export function validateDestinationStation(item) {
  if (!item) return { station: STATIONS.SERVER_PICKUP, routingStatus: ROUTING_STATUSES.ROUTING_PREVIEW }

  if (item.requiresManagementReview || item.approvalRequired) {
    return { station: STATIONS.MANAGEMENT_REVIEW, routingStatus: ROUTING_STATUSES.MANAGEMENT_REVIEW_REQUIRED }
  }

  if (item.isPartnerSpecial || item.source === 'partner_network') {
    const fulfilledByVenue = item.fulfilledByVenue === true
    if (fulfilledByVenue) {
      return { station: STATIONS.KITCHEN, routingStatus: ROUTING_STATUSES.KITCHEN_ROUTE_PENDING }
    }
    return { station: STATIONS.PARTNER, routingStatus: ROUTING_STATUSES.PARTNER_ROUTE_PENDING }
  }

  if (item.type === 'cigar' || item.special_type === 'cigar_special') {
    return { station: STATIONS.HUMIDOR, routingStatus: ROUTING_STATUSES.KITCHEN_ROUTE_PENDING }
  }

  if (item.type === 'drink' || item.special_type === 'drink_special') {
    return { station: STATIONS.BAR, routingStatus: ROUTING_STATUSES.KITCHEN_ROUTE_PENDING }
  }

  return { station: STATIONS.KITCHEN, routingStatus: ROUTING_STATUSES.KITCHEN_ROUTE_PENDING }
}

/**
 * Create a routing ticket for an order.
 * Returns preview-only routing — no KDS or partner API is live.
 */
export async function createRoutingTicket(orderPayload) {
  const { orderId, items = [], venueId, staffId } = orderPayload ?? {}
  if (!orderId) return { ok: false, error: 'orderId required' }

  const routes = (items ?? []).map(item => {
    const { station, routingStatus } = validateDestinationStation(item)
    return {
      itemId: item.id ?? item.item_id,
      itemName: item.name ?? item.item_name,
      station,
      routingStatus,
    }
  })

  const ticket = {
    ticketId: `route-preview-${Date.now()}`,
    orderId,
    venueId,
    staffId,
    routes,
    overallStatus: ROUTING_STATUSES.ROUTED_PREVIEW_ONLY,
    kdsIntegration: false,
    partnerApiIntegration: false,
    createdAt: new Date().toISOString(),
    note: 'Routing ticket created in preview mode. No KDS or partner API connected.',
  }

  routingStore.set(orderId, ticket)
  return { ok: true, ticket }
}

/**
 * Get routing status for an order.
 */
export async function getRoutingStatus(orderId) {
  if (!orderId) return { ok: false, error: 'orderId required' }

  const ticket = routingStore.get(orderId)
  if (!ticket) {
    return {
      ok: true,
      orderId,
      routingStatus: ROUTING_STATUSES.ROUTING_PREVIEW,
      kdsIntegration: false,
      message: 'No routing ticket found for this order (preview mode).',
    }
  }

  return { ok: true, ticket, kdsIntegration: false }
}

/**
 * Mark routing as pending (items being prepared).
 */
export async function markRoutingPending(orderId) {
  const ticket = routingStore.get(orderId) ?? { orderId, routes: [] }
  const updated = { ...ticket, overallStatus: ROUTING_STATUSES.ROUTE_PENDING, updatedAt: new Date().toISOString() }
  routingStore.set(orderId, updated)
  return { ok: true, orderId, routingStatus: ROUTING_STATUSES.ROUTE_PENDING, kdsIntegration: false }
}

/**
 * Mark routing as ready (items ready for pickup/delivery).
 * Returns routed_preview_only — NOT routed_live — because no KDS exists.
 */
export async function markRoutingReady(orderId) {
  const ticket = routingStore.get(orderId) ?? { orderId, routes: [] }
  const updated = { ...ticket, overallStatus: ROUTING_STATUSES.ROUTED_PREVIEW_ONLY, readyAt: new Date().toISOString() }
  routingStore.set(orderId, updated)
  return {
    ok: true,
    orderId,
    routingStatus: ROUTING_STATUSES.ROUTED_PREVIEW_ONLY,
    kdsIntegration: false,
    note: 'Marked ready in preview mode. routed_live requires real KDS integration.',
  }
}

export { ROUTING_STATUSES, STATIONS }
