/**
 * Checkout Readiness Engine
 * Scores and reports checkout readiness without claiming live integration.
 */

async function _getVenueReadiness(venueId) {
  try {
    const { getVenueOnboardingReadiness } = await import('../venueOnboardingService.js')
    return await getVenueOnboardingReadiness(venueId)
  } catch { return null }
}

async function _getPartnerReadiness(partnerId, venueId) {
  try {
    const { getPartnerOnboardingReadiness } = await import('../partnerVendorOnboardingService.js')
    return await getPartnerOnboardingReadiness(partnerId, venueId)
  } catch { return null }
}

export async function getCheckoutBlockers(cartPayload = {}) {
  const blockers = []
  if (!process.env.DATABASE_URL)
    blockers.push({ type: 'database_required', severity: 'warning', message: 'Database not connected. Using preview fallback.' })
  if (!cartPayload.venue_id)
    blockers.push({ type: 'venue_profile_required', severity: 'critical', message: 'Venue ID is required.' })
  if (!cartPayload.items?.length)
    blockers.push({ type: 'cart_empty', severity: 'critical', message: 'Cart has no items.' })

  blockers.push({ type: 'payment_confirmation_required', severity: 'required', message: 'Payment requires Stripe Connect integration.' })
  blockers.push({ type: 'tax_preview_required', severity: 'info', message: 'Tax is estimated only.' })
  blockers.push({ type: 'pos_sync_pending', severity: 'info', message: 'POS sync is not live.' })
  blockers.push({ type: 'kds_routing_pending', severity: 'info', message: 'KDS routing is not live.' })
  blockers.push({ type: 'inventory_unavailable', severity: 'info', message: 'Inventory is not connected.' })

  if (cartPayload.items?.some(i => i.partner_id))
    blockers.push({ type: 'partner_approved_required', severity: 'warning', message: 'Partner items require approval.' })
  if (cartPayload.items?.some(i => i.availability_status === 'availability_required'))
    blockers.push({ type: 'availability_required', severity: 'warning', message: 'Item availability is not confirmed.' })

  if (cartPayload.venue_id) {
    const venueReady = await _getVenueReadiness(cartPayload.venue_id)
    if (venueReady && !venueReady.ok)
      blockers.push({ type: 'venue_approval_required', severity: 'warning', message: 'Venue onboarding is incomplete.' })
  }
  return blockers
}

export async function buildCheckoutReadinessScore(cartPayload = {}) {
  const blockers = await getCheckoutBlockers(cartPayload)
  const criticalCount = blockers.filter(b => b.severity === 'critical').length
  const warningCount  = blockers.filter(b => b.severity === 'warning').length
  const score = Math.max(0, 100 - criticalCount * 40 - warningCount * 10)
  return {
    ok:             criticalCount === 0,
    readinessScore: score,
    blockers,
    checkoutReadiness: score >= 60 ? 'checkout_preview' : 'checkout_blocked',
    inventoryStatus:   'inventory_unavailable',
    paymentStatus:     'payment_confirmation_required',
    taxStatus:         'tax_preview_required',
    posStatus:         'pos_sync_pending',
    kdsStatus:         'kds_routing_pending',
  }
}

export async function getCheckoutReadiness(cartPayload = {}) {
  const result = await buildCheckoutReadinessScore(cartPayload)
  return {
    ...result,
    persistenceStatus: process.env.DATABASE_URL ? 'database_required' : 'not_persisted',
    previewFallback:   !process.env.DATABASE_URL,
  }
}

export async function getSelfOrderReadiness(venueId) {
  const venueReady = await _getVenueReadiness(venueId)
  const blockers = []
  if (!venueReady?.ok) blockers.push({ type: 'venue_approval_required', severity: 'warning' })
  blockers.push({ type: 'staff_assist_required', severity: 'info', message: 'Self-order requires venue-configured approval flow.' })
  blockers.push({ type: 'payment_confirmation_required', severity: 'required' })
  return {
    ok:                  true,
    venueId,
    selfOrderStatus:     'self_order_preview',
    selfOrderReadiness:  blockers.filter(b => b.severity === 'critical').length === 0 ? 'self_order_available_preview' : 'self_order_blocked',
    blockers,
  }
}

export async function getStaffAssistedOrderReadiness(venueId) {
  const venueReady = await _getVenueReadiness(venueId)
  return {
    ok:                        true,
    venueId,
    staffAssistedStatus:       'staff_handoff_preview',
    staffAssistedReadiness:    venueReady?.ok ? 'staff_assist_available_preview' : 'staff_assist_venue_required',
    staffAssistRequired:       true,
    posStatus:                 'pos_sync_pending',
    kdsStatus:                 'kds_routing_pending',
  }
}

export async function getPartnerCheckoutReadiness(partnerId, venueId) {
  const partnerReady = await _getPartnerReadiness(partnerId, venueId)
  const blockers = []
  if (!partnerReady?.ok) blockers.push({ type: 'partner_onboarding_required', severity: 'critical' })
  blockers.push({ type: 'partner_approved_required', severity: 'required', message: 'Partner products require approval before checkout.' })
  blockers.push({ type: 'availability_required', severity: 'warning', message: 'Partner availability is not confirmed.' })
  return {
    ok:               blockers.filter(b => b.severity === 'critical').length === 0,
    partnerId,
    venueId,
    partnerReadiness: blockers.filter(b => b.severity === 'critical').length === 0 ? 'partner_checkout_preview' : 'partner_checkout_blocked',
    blockers,
  }
}
