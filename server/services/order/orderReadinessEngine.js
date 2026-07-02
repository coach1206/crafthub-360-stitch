/**
 * Order Readiness Engine
 * Scores order readiness 0–100 and returns blockers.
 * Does not imply live fulfillment unless proof exists.
 */

export function getOrderBlockers(orderPayload) {
  const blockers = []
  if (!orderPayload?.venueId)           blockers.push({ type: 'venue_profile_required', severity: 'critical' })
  if (!orderPayload?.lineItems?.length) blockers.push({ type: 'line_items_required', severity: 'critical' })

  blockers.push({ type: 'payment_confirmation_required', severity: 'warning', message: 'Payment not captured. Stripe Connect required.' })
  blockers.push({ type: 'tax_preview_required', severity: 'warning', message: 'Tax in preview mode. CPA review required.' })
  blockers.push({ type: 'pos_sync_pending', severity: 'info', message: 'POS sync pending. Provider connection required.' })
  blockers.push({ type: 'kds_routing_pending', severity: 'info', message: 'KDS routing pending. Kitchen station connection required.' })
  blockers.push({ type: 'compliance_review_required', severity: 'info', message: 'CPA/legal review required before live tax collection.' })

  const partnerItems = (orderPayload?.lineItems ?? []).filter(li => li.partnerId)
  if (partnerItems.length > 0) {
    blockers.push({ type: 'venue_approval_required', severity: 'warning', message: 'Partner vendor requires venue approval.' })
    blockers.push({ type: 'availability_required', severity: 'warning', message: 'Partner product availability must be confirmed.' })
    blockers.push({ type: 'partner_onboarding_required', severity: 'warning', message: 'Partner vendor onboarding must be complete.' })
  }

  if (!process.env.DATABASE_URL) {
    blockers.push({ type: 'database_required', severity: 'warning', message: 'DATABASE_URL not set. Order not persisted.' })
  }

  return blockers
}

export function buildOrderReadinessScore(orderPayload) {
  const checks = [
    { name: 'venue_id_present', passed: !!orderPayload?.venueId, points: 20 },
    { name: 'line_items_present', passed: (orderPayload?.lineItems?.length ?? 0) > 0, points: 20 },
    { name: 'valid_totals', passed: (orderPayload?.totalAmount ?? 0) >= 0, points: 20 },
    { name: 'no_negative_amounts', passed: (orderPayload?.subtotalAmount ?? 0) >= 0, points: 20 },
    { name: 'order_source_set', passed: !!orderPayload?.orderSource, points: 20 },
  ]
  const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0)
  return {
    ok: true,
    orderReadinessScore: score,
    maxScore: 100,
    checks,
    note: 'Score of 100/100 does not imply live payment capture or fulfillment. All integrations require separate verification.',
  }
}

export function getOrderReadiness(orderPayload) {
  const blockers = getOrderBlockers(orderPayload)
  const score    = buildOrderReadinessScore(orderPayload)
  const criticalBlockers = blockers.filter(b => b.severity === 'critical')
  return {
    ok: true,
    lifecycleReadiness: criticalBlockers.length === 0 ? 'order_lifecycle_preview' : 'order_lifecycle_preview',
    orderReadinessScore: score.orderReadinessScore,
    maxScore: 100,
    blockers,
    databaseStatus: process.env.DATABASE_URL ? 'available' : 'database_required',
    paymentStatus: 'payment_confirmation_required',
    taxStatus: 'tax_preview_required',
    posStatus: 'pos_sync_pending',
    kdsStatus: 'kds_routing_pending',
    storageMode: 'preview_fallback',
  }
}

export async function getVenueOrderReadiness(venueId) {
  const blockers = []
  if (!venueId) blockers.push({ type: 'venue_profile_required', severity: 'critical' })
  blockers.push({ type: 'payment_confirmation_required', severity: 'warning' })
  blockers.push({ type: 'pos_sync_pending', severity: 'info' })
  blockers.push({ type: 'kds_routing_pending', severity: 'info' })
  if (!process.env.DATABASE_URL) blockers.push({ type: 'database_required', severity: 'warning' })
  return { ok: true, venueId, orderReadinessStatus: 'order_lifecycle_preview', blockers, storageMode: 'preview_fallback' }
}

export async function getPartnerOrderReadiness(partnerId, venueId) {
  const blockers = []
  if (!partnerId) blockers.push({ type: 'partner_onboarding_required', severity: 'critical' })
  blockers.push({ type: 'venue_approval_required', severity: 'warning' })
  blockers.push({ type: 'availability_required', severity: 'warning' })
  blockers.push({ type: 'product_approval_required', severity: 'warning' })
  blockers.push({ type: 'payment_confirmation_required', severity: 'warning' })
  return { ok: true, partnerId, venueId, orderReadinessStatus: 'order_lifecycle_preview', blockers, storageMode: 'preview_fallback' }
}
