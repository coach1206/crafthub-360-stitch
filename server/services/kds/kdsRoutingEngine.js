/**
 * KDS Routing Engine
 * Routes order items to stations in preview-safe mode.
 * No live kitchen, bar, humidor, or partner station is claimed without verified proof.
 */

// All supported station types for routing
const STATION_TYPES = ['kitchen','bar','humidor','partner_window','expo','service_runner','patio_runner','pickup_handoff','delivery_handoff','custom']

// Default category → station type routing table
const DEFAULT_CATEGORY_ROUTING = {
  cigar:           'humidor',
  tobacco:         'humidor',
  alcohol:         'bar',
  beverage:        'bar',
  food:            'kitchen',
  tasting_flight:  'kitchen',
  merchandise:     'expo',
  ticket:          'expo',
  event_admission: 'expo',
  service_fee:     'expo',
  delivery_fee:    'delivery_handoff',
  membership:      'expo',
  general:         'kitchen',
}

export function validateRoutingInput(orderPayload) {
  const errors = []
  if (!orderPayload?.venueId)             errors.push({ field: 'venueId', reason: 'venue_profile_required' })
  if (!orderPayload?.lineItems?.length)   errors.push({ field: 'lineItems', reason: 'line_items_required' })
  return { ok: errors.length === 0, errors }
}

export function getFulfillmentOwnerForLineItem(lineItem) {
  return lineItem.partnerId ? 'partner' : 'venue'
}

export function getStationForCategory(itemCategory, stationConfig = [], routingRules = []) {
  // Check explicit routing rules first (sorted by priority desc)
  const sorted = [...routingRules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  for (const rule of sorted) {
    if (rule.itemCategory === itemCategory && rule.stationType) return { stationType: rule.stationType, source: 'routing_rule' }
  }
  // Fall back to default category routing
  const stationType = DEFAULT_CATEGORY_ROUTING[itemCategory] ?? 'kitchen'
  return { stationType, source: 'default_routing' }
}

export function routeLineItemToStation(lineItem, stationConfig = [], routingRules = []) {
  const isPartner = !!lineItem.partnerId
  // Partner items always go to partner_window
  if (isPartner) {
    return {
      lineItemId:        lineItem.lineItemId ?? lineItem.line_item_id ?? 'unknown',
      stationType:       'partner_window',
      routingReason:     'partner_item_default_routing',
      dispatchStatus:    'dispatch_pending',
      fulfillmentStatus: 'fulfillment_pending',
      fulfillmentOwner:  'partner',
      routingMode:       'routing_preview',
      partnerWindowRequired: true,
    }
  }

  const category    = lineItem.taxCategory ?? lineItem.itemCategory ?? lineItem.item_category ?? 'general'
  const { stationType, source } = getStationForCategory(category, stationConfig, routingRules)

  return {
    lineItemId:        lineItem.lineItemId ?? lineItem.line_item_id ?? 'unknown',
    itemCategory:      category,
    stationType,
    routingReason:     source,
    dispatchStatus:    'dispatch_pending',
    fulfillmentStatus: 'fulfillment_pending',
    fulfillmentOwner:  'venue',
    routingMode:       'routing_preview',
  }
}

export function buildRoutingPlan(orderPayload, stationConfig = [], routingRules = []) {
  const items = orderPayload?.lineItems ?? []
  const routedItems = items.map(item => routeLineItemToStation(item, stationConfig, routingRules))

  const stationGroups = {}
  for (const item of routedItems) {
    const t = item.stationType
    if (!stationGroups[t]) stationGroups[t] = []
    stationGroups[t].push(item)
  }

  const hasMultiStation = Object.keys(stationGroups).length > 1
  const hasPartnerItems = routedItems.some(i => i.fulfillmentOwner === 'partner')

  return {
    orderId:      orderPayload.orderId,
    venueId:      orderPayload.venueId,
    stationGroups,
    stationCount: Object.keys(stationGroups).length,
    routedItemCount: routedItems.length,
    hasMultiStation,
    hasPartnerItems,
    requiresExpo: hasMultiStation,
    expoRequired: hasMultiStation ? 'expo_required' : null,
    routingMode:  'routing_preview',
    dispatchMode: 'dispatch_preview',
    routingStatus: 'kds_routing_pending',
  }
}

export function buildDispatchPreview(orderPayload, routingPlan) {
  return {
    ok: true,
    orderId:       orderPayload?.orderId,
    venueId:       orderPayload?.venueId,
    dispatchStatus: 'dispatch_pending',
    dispatchMode:   'dispatch_preview',
    routingStatus:  'kds_routing_pending',
    stationCount:   routingPlan?.stationCount ?? 0,
    stationGroups:  routingPlan?.stationGroups ?? {},
    requiresExpo:   routingPlan?.requiresExpo ?? false,
    expoRequired:   routingPlan?.expoRequired ?? null,
    partnerWindowRequired: routingPlan?.hasPartnerItems ? 'partner_window_required' : null,
    routingMode:    'routing_preview',
    message: 'Dispatch preview generated. No live KDS station was notified.',
    storageMode: 'memory_fallback',
  }
}

export function getRoutingBlockers(orderPayload, stationConfig = []) {
  const blockers = []
  if (!orderPayload?.venueId)             blockers.push({ type: 'venue_profile_required', severity: 'critical' })
  if (!orderPayload?.lineItems?.length)   blockers.push({ type: 'line_items_required', severity: 'critical' })

  const hasConfiguredStations = stationConfig.some(s => s.stationStatus !== 'station_config_required')
  if (!hasConfiguredStations)            blockers.push({ type: 'station_config_required', severity: 'warning' })

  const hasPartnerItems = (orderPayload?.lineItems ?? []).some(li => li.partnerId)
  if (hasPartnerItems)                   blockers.push({ type: 'partner_window_required', severity: 'info' })

  const hasMultiStation = true  // conservative — assume expo needed until station plan proven
  if (hasMultiStation)                   blockers.push({ type: 'expo_required', severity: 'info' })

  blockers.push({ type: 'kds_routing_pending', severity: 'info', message: 'No live KDS integration. Using routing_preview.' })
  blockers.push({ type: 'dispatch_preview', severity: 'info', message: 'Dispatch is preview-only. No station was notified.' })

  return blockers
}

export function getRoutingReadiness(orderPayload, stationConfig = []) {
  const validation = validateRoutingInput(orderPayload)
  const blockers   = getRoutingBlockers(orderPayload, stationConfig)
  const criticals  = blockers.filter(b => b.severity === 'critical')
  return {
    ok: true,
    routingReadiness: criticals.length === 0 ? 'routing_preview' : 'routing_preview',
    kdsStatus: 'kds_routing_pending',
    dispatchMode: 'dispatch_preview',
    blockers,
    inputValid: validation.ok,
    errors: validation.errors,
    storageMode: 'preview_fallback',
  }
}

export function routeOrderToStations(orderPayload, routingContext = {}) {
  const validation = validateRoutingInput(orderPayload)
  if (!validation.ok) {
    return { ok: false, errors: validation.errors, routingStatus: 'kds_routing_pending' }
  }

  const stationConfig = routingContext.stationConfig ?? []
  const routingRules  = routingContext.routingRules  ?? []
  const plan          = buildRoutingPlan(orderPayload, stationConfig, routingRules)
  const dispatch      = buildDispatchPreview(orderPayload, plan)

  return { ok: true, ...dispatch, routingPlan: plan }
}
