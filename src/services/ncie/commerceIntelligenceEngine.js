/**
 * NCIE Commerce Intelligence Engine
 * Provides commerce insight signals for venues and partners.
 * All outputs are commerce_preview without verified live order data.
 * Does not hold, move, or claim custody of venue or vendor funds.
 */

export function getCommerceIntelligence(venueId, moduleId = null, options = {}) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }

  return {
    ok:                  true,
    venueId,
    moduleId,
    commerceMode:        'commerce_preview',
    inventorySignals:    buildInventorySignals(moduleId),
    orderSignals:        buildOrderSignals(venueId),
    revenueSignals:      buildRevenueSignals(venueId),
    partnerSignals:      buildPartnerSignals(venueId),
    pricingInsights:     buildPricingInsights(moduleId),
    storageMode:         'memory_fallback',
    message:             'Commerce intelligence is preview-only. No live order, inventory, or revenue data was queried without a verified database connection.',
  }
}

function buildInventorySignals(moduleId) {
  return {
    inventoryStatus:     'inventory_unavailable',
    lowStockAlerts:      [],
    outOfStockCount:     0,
    inventoryMode:       'commerce_preview',
    message:             'Inventory signals require a verified venue catalog connection.',
  }
}

function buildOrderSignals(venueId) {
  return {
    orderSignalMode:     'commerce_preview',
    activeOrders:        0,
    pendingOrders:       0,
    completedToday:      0,
    orderDataStatus:     'order_data_unavailable',
    message:             'Order signals require a verified live order data connection.',
  }
}

function buildRevenueSignals(venueId) {
  return {
    revenueSignalMode:   'commerce_preview',
    todayRevenueCents:   0,
    weekRevenueCents:    0,
    revenueDataStatus:   'revenue_data_unavailable',
    custodyNote:         'NOVEE OS does not hold or control venue funds. Revenue signals are informational previews only.',
    message:             'Revenue signals require a verified financial data connection. No funds were captured or reported.',
  }
}

function buildPartnerSignals(venueId) {
  return {
    partnerSignalMode:   'commerce_preview',
    activePartners:      0,
    pendingPartnerOrders: 0,
    partnerDataStatus:   'partner_data_unavailable',
    message:             'Partner signals require a verified partner vendor connection.',
  }
}

function buildPricingInsights(moduleId) {
  return {
    pricingMode:         'commerce_preview',
    averagePriceCents:   0,
    topSellingProfiles:  [],
    pricingDataStatus:   'pricing_data_unavailable',
    message:             'Pricing insights require verified historical order data.',
  }
}

export function getPartnerCommerceIntelligence(partnerId, moduleId = null) {
  if (!partnerId) return { ok: false, error: 'partner_id_required' }

  return {
    ok:                  true,
    partnerId,
    moduleId,
    commerceMode:        'commerce_preview',
    partnerOrderSignals: {
      pendingOrders:     0,
      completedToday:    0,
      signalMode:        'commerce_preview',
    },
    partnerRevenueSignals: {
      todayRevenueCents: 0,
      custodyModel:      'no_custody',
      custodyNote:       'NOVEE OS does not hold partner funds. Partner revenue is passed through Stripe Connect.',
      revenueMode:       'commerce_preview',
    },
    storageMode:         'memory_fallback',
    message:             'Partner commerce intelligence is preview-only. No live partner order or revenue data was queried.',
  }
}

export function getCommerceReadiness(venueId) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  return {
    ok:              true,
    venueId,
    commerceMode:    'commerce_preview',
    blockers: [
      { type: 'catalog_connection_required',  severity: 'warning', message: 'No verified venue catalog connection.' },
      { type: 'order_data_required',          severity: 'info',    message: 'Live order data requires verified database connection.' },
      { type: 'stripe_connect_required',      severity: 'critical', message: 'Stripe Connect not verified. No live commerce is possible.' },
    ],
    message: 'Commerce readiness is preview-only. All commerce signals require verified integrations.',
  }
}
