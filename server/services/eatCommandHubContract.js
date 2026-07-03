/**
 * E.A.T. Command Hub Integration Contract
 *
 * Management hooks for Ticket Tapper Specials and Money Bridge.
 * This is a contract/service layer — the E.A.T. UI wires to these methods.
 *
 * Operates in preview mode when no database is available.
 */

import { resolveFeatureStatus, buildEnablePayload, defaultFeatureSettings, FEATURE_STATUSES } from '../../src/utils/venueFeatureSettings.js'
import { PROVIDER_STATUSES } from './posInventoryAdapter.js'
import { ROUTING_STATUSES } from './kitchenRoutingAdapter.js'

// In-memory stores (used when DB unavailable)
const venueFeatureStore = new Map()
const approvalQueueStore = new Map()

// ── Venue Feature: Partner Specials ──────────────────────────────────────────

export async function getVenueFeatureSettings(venueId, db = null) {
  if (db) {
    try {
      const { rows } = await db.query(
        'SELECT * FROM venue_feature_settings WHERE venue_id = $1 LIMIT 1',
        [venueId]
      )
      if (rows[0]) return { ok: true, settings: resolveFeatureStatus(rows[0]), storageMode: 'postgres' }
    } catch { /* fall through */ }
  }

  const stored = venueFeatureStore.get(venueId) ?? defaultFeatureSettings(venueId)
  return {
    ok: true,
    settings: resolveFeatureStatus(stored),
    storageMode: 'memory_fallback',
    syncMode: 'preview_fallback',
  }
}

export async function enableVenuePartnerSpecials(venueId, enabledBy, db = null) {
  const payload = buildEnablePayload({ venueId, enabledBy })

  if (db) {
    try {
      const { rows } = await db.query(
        `INSERT INTO venue_feature_settings
           (venue_id, ticket_tapper_partner_specials_enabled, enabled_at, trial_expires_at, status, enabled_by)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (venue_id) DO UPDATE SET
           ticket_tapper_partner_specials_enabled = EXCLUDED.ticket_tapper_partner_specials_enabled,
           enabled_at = EXCLUDED.enabled_at,
           trial_expires_at = EXCLUDED.trial_expires_at,
           status = EXCLUDED.status,
           enabled_by = EXCLUDED.enabled_by,
           updated_at = NOW()
         RETURNING *`,
        [venueId, true, payload.enabled_at, payload.trial_expires_at, payload.status, payload.enabled_by]
      )
      return { ok: true, settings: resolveFeatureStatus(rows[0]), storageMode: 'postgres' }
    } catch { /* fall through */ }
  }

  venueFeatureStore.set(venueId, payload)
  return {
    ok: true,
    settings: resolveFeatureStatus(payload),
    storageMode: 'memory_fallback',
    syncMode: 'preview_fallback',
    message: 'Partner specials enabled locally. Not persisted — backend unavailable.',
  }
}

export async function requestCancellation(venueId, cancelledBy, db = null) {
  const now = new Date().toISOString()

  if (db) {
    try {
      const { rows } = await db.query(
        `UPDATE venue_feature_settings
         SET cancellation_requested_at = $1, status = $2, cancelled_by = $3, updated_at = NOW()
         WHERE venue_id = $4 RETURNING *`,
        [now, FEATURE_STATUSES.CANCELLATION_PENDING, cancelledBy, venueId]
      )
      if (rows[0]) return { ok: true, settings: resolveFeatureStatus(rows[0]), storageMode: 'postgres' }
    } catch { /* fall through */ }
  }

  const stored = venueFeatureStore.get(venueId) ?? defaultFeatureSettings(venueId)
  const updated = { ...stored, cancellation_requested_at: now, status: FEATURE_STATUSES.CANCELLATION_PENDING, cancelled_by: cancelledBy }
  venueFeatureStore.set(venueId, updated)
  return {
    ok: true,
    settings: resolveFeatureStatus(updated),
    storageMode: 'memory_fallback',
    message: 'Cancellation requested locally. Not persisted.',
  }
}

// ── Approval Queue ────────────────────────────────────────────────────────────

export async function getApprovalQueueReport(venueId, specials = []) {
  const pending = specials.filter(s => s.approval?.status === 'pending_approval' || s.status === 'pending_approval')
  const approved = specials.filter(s => s.approval?.status === 'approved')
  const rejected = specials.filter(s => s.approval?.status === 'rejected')
  const live = specials.filter(s => s.status === 'active')

  return {
    ok: true,
    venueId,
    approvalQueue: {
      pendingCount: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      liveCount: live.length,
      pending,
      approved,
      rejected,
    },
  }
}

// ── Inventory Alerts ──────────────────────────────────────────────────────────

export function buildInventoryAlerts(inventoryItems = []) {
  return inventoryItems
    .filter(item => {
      const qty = item.quantityAvailable ?? item.available_quantity ?? 0
      const threshold = item.lowInventoryThreshold ?? item.low_stock_threshold ?? 3
      return qty <= 0 || qty <= threshold
    })
    .map(item => ({
      itemId: item.id ?? item.item_id,
      itemName: item.name ?? item.item_name,
      availableQuantity: item.quantityAvailable ?? item.available_quantity ?? 0,
      status: (item.quantityAvailable ?? item.available_quantity ?? 0) <= 0 ? 'sold_out' : 'low_stock',
      posyncStatus: item.posSyncStatus ?? PROVIDER_STATUSES.NOT_CONNECTED,
    }))
}

// ── Warnings ──────────────────────────────────────────────────────────────────

export function buildSystemWarnings({ taxStatus, posProviderStatus, kdsStatus, settlementStatus }) {
  const warnings = []

  if (!taxStatus || taxStatus === 'preview_only') {
    warnings.push({ type: 'tax_preview_warning', message: 'Tax is using preview rate only. Configure venue/state tax for compliance.' })
  }
  if (!posProviderStatus || posProviderStatus === PROVIDER_STATUSES.NOT_CONNECTED) {
    warnings.push({ type: 'pos_sync_warning', message: 'No POS provider connected. Inventory is preview only.' })
  }
  if (!kdsStatus || kdsStatus === ROUTING_STATUSES.ROUTING_PREVIEW || kdsStatus === ROUTING_STATUSES.ROUTED_PREVIEW_ONLY) {
    warnings.push({ type: 'kitchen_route_warning', message: 'No KDS connected. Kitchen routing is preview only.' })
  }
  if (!settlementStatus || settlementStatus === 'pending_preview' || settlementStatus === 'integration_required') {
    warnings.push({ type: 'settlement_warning', message: 'Partner settlement is pending. Payment processor not integrated.' })
  }

  return warnings
}

// ── POS360 Management Hooks ───────────────────────────────────────────────────

export async function getPOS360ReadinessHooks(venueId) {
  const { getVenuePOSReadiness } = await import('./pos360IntegrationHub.js')
  const { getEncryptionStatus } = await import('../utils/encryption.js')
  const { isDbAvailable } = await import('../db/connection.js')
  const { getItemMappings } = await import('./pos360ItemMappingService.js')
  const { getProviderHealth } = await import('./pos360ProviderHealthService.js')

  const encStatus = getEncryptionStatus()
  const dbReady = isDbAvailable()
  const posReadiness = await getVenuePOSReadiness(venueId)

  const hooks = []

  if (encStatus.status === 'encryption_key_required') {
    hooks.push({ type: 'encryption_key_required', severity: 'critical', message: 'ENCRYPTION_SECRET not set. Cannot store POS provider tokens.' })
  }
  if (!dbReady) {
    hooks.push({ type: 'database_required', severity: 'warning', message: 'DATABASE_URL not configured. POS data not persisted.' })
  }

  for (const [provider, status] of Object.entries(posReadiness.providers ?? {})) {
    if (provider === 'manual_pos360') continue
    if (status.connectionStatus === 'provider_not_connected' || status.connectionStatus === 'oauth_required' || status.connectionStatus === 'credentials_missing') {
      hooks.push({ type: 'provider_not_connected', severity: 'info', provider, message: `${provider}: ${status.connectionStatus}` })
    }
  }

  // Item mapping check for all known providers
  const providerNames = ['square', 'toast', 'clover', 'lightspeed', 'shopify_pos']
  for (const pname of providerNames) {
    const mappings = await getItemMappings(venueId, pname)
    const unmapped = (mappings.mappings ?? []).filter(m => m.mappingStatus === 'mapping_required')
    if (unmapped.length > 0) {
      hooks.push({ type: 'mapping_required', severity: 'warning', provider: pname, unmappedCount: unmapped.length, message: `${unmapped.length} items need mapping for ${pname}.` })
    }
  }

  // Manual mode always available
  hooks.push({ type: 'manual_mode_available', severity: 'info', message: 'manual_pos360 fallback available for venues without POS connection.' })

  return {
    ok: true,
    venueId,
    posHooks: hooks,
    manualModeAvailable: true,
    databaseStatus: dbReady ? 'available' : 'database_required',
    encryptionStatus: encStatus.status,
    tenantGuardStatus: 'tenant_guard_active',
  }
}

// ── Payment / Money Bridge Management Hooks ───────────────────────────────────

export async function getPaymentReadinessHooks(venueId, partnerId = null) {
  const { getStripeReadiness } = await import('../config/paymentProviderConfig.js')
  const { getVenuePaymentReadiness, getPartnerVendorPaymentReadiness, getPlatformPaymentReadiness } = await import('./payments/paymentAccountOnboardingService.js')
  const { isDbAvailable } = await import('../db/connection.js')

  const stripeReadiness = getStripeReadiness()
  const platformReadiness = await getPlatformPaymentReadiness()
  const venueReadiness = venueId ? await getVenuePaymentReadiness(venueId) : null
  const partnerReadiness = partnerId ? await getPartnerVendorPaymentReadiness(partnerId) : null

  const hooks = []

  if (!stripeReadiness.stripeReady) {
    hooks.push({ type: 'stripe_keys_missing', severity: 'critical', message: 'Stripe secret key not configured. Payment processing unavailable.' })
  }
  if (!stripeReadiness.stripeConnectReady) {
    hooks.push({ type: 'stripe_connect_required', severity: 'critical', message: 'Stripe Connect client ID not configured. Venue/partner payouts unavailable.' })
  }
  if (!stripeReadiness.webhookReady) {
    hooks.push({ type: 'webhook_pending', severity: 'warning', message: 'STRIPE_WEBHOOK_SECRET not configured. Webhook verification unavailable.' })
  }
  if (!isDbAvailable()) {
    hooks.push({ type: 'database_required', severity: 'warning', message: 'DATABASE_URL not configured. Settlement records not persisted.' })
  }

  if (venueReadiness && venueReadiness.onboardingStatus !== 'onboarding_complete') {
    hooks.push({ type: 'onboarding_required', severity: 'warning', owner: 'venue', venueId, message: `Venue ${venueId} payment account onboarding required for referral payout.` })
  }
  if (partnerReadiness && partnerReadiness.onboardingStatus !== 'onboarding_complete') {
    hooks.push({ type: 'onboarding_required', severity: 'warning', owner: 'partner_vendor', partnerId, message: `Partner ${partnerId} payment account onboarding required for payout.` })
  }

  hooks.push({ type: 'settlement_pending_preview', severity: 'info', message: 'All settlements are in preview mode. Money Bridge calculates splits but cannot release money until Stripe Connect is live.' })

  return {
    ok: true,
    venueId,
    partnerId,
    stripeReadiness: stripeReadiness.readinessStatus,
    platformPaymentStatus: platformReadiness.stripeReadiness,
    settlementStatus: 'settlement_pending_preview',
    paymentHooks: hooks,
    moneyBridgeStatus: 'preview_only',
    refundStatus: 'refund_requires_processor',
    payoutReadiness: { venue: venueReadiness?.canReceiveReferralPayout ?? false, partner: partnerReadiness?.canReceivePartnerPayout ?? false },
  }
}

export async function getVenueOnboardingHooks(venueId) {
  const { getVenueCommerceReadiness, getVenueReadinessWarnings } = await import('./venue/venueOnboardingEngine.js')
  const { canVenueDisplayPartnerSpecials, canVenueAcceptPartnerVendorOrders } = await import('./venue/venuePartnerSpecialsLifecycleService.js')

  const [commerce, warnings, canDisplay, canAccept] = await Promise.all([
    getVenueCommerceReadiness(venueId),
    getVenueReadinessWarnings(venueId),
    canVenueDisplayPartnerSpecials(venueId),
    canVenueAcceptPartnerVendorOrders(venueId),
  ])

  return {
    ok: true,
    venueId,
    overallStatus: commerce.overallStatus,
    readinessScore: warnings.readinessScore,
    ticketTapperStatus: commerce.ticketTapperStatus,
    moneyBridgeStatus: commerce.moneyBridgeStatus,
    partnerSpecialsStatus: commerce.partnerSpecialsStatus,
    canDisplayPartnerSpecials: canDisplay.canDisplay,
    canAcceptPartnerOrders: canAccept.canAcceptPartnerOrders,
    warnings: warnings.warnings,
    message: 'Venue onboarding is the control layer that decides which commerce features a venue can safely use.',
  }
}

export async function getPartnerVendorHooks(partnerId, venueId = null) {
  const { getPartnerCommerceReadiness, getPartnerReadinessWarnings } = await import('./partner/partnerVendorOnboardingEngine.js')
  const { canPartnerSellAtVenue } = await import('./partner/partnerVenueRelationshipService.js')
  const { getPartnerPayoutReadiness } = await import('./partner/partnerPayoutReadinessService.js')

  const [commerce, warnings, payoutReadiness] = await Promise.all([
    getPartnerCommerceReadiness(partnerId),
    getPartnerReadinessWarnings(partnerId),
    getPartnerPayoutReadiness(partnerId),
  ])

  const venueApproval = venueId ? await canPartnerSellAtVenue(partnerId, venueId) : null

  return {
    ok: true,
    partnerId,
    venueId,
    overallStatus: commerce.overallStatus,
    readinessScore: warnings.readinessScore,
    partnerSpecialsStatus: commerce.partnerSpecialsStatus,
    payoutStatus: payoutReadiness.payoutStatus,
    canReceivePartnerPayout: payoutReadiness.canReceivePartnerPayout,
    venueApprovalStatus: venueApproval?.approvalStatus ?? 'venue_approval_required',
    canSellAtVenue: venueApproval?.canSell ?? false,
    warnings: warnings.warnings,
    settlementStatus: 'settlement_pending_preview',
    message: 'Partner vendors should never become customer-facing until venue approval, product approval, availability, fulfillment rules, and commission rules are in place.',
  }
}

export async function getOrderLifecycleHooks(venueId, partnerId = null) {
  const { getVenueOrderReadiness, getPartnerOrderReadiness } = await import('./order/orderReadinessEngine.js')

  const venueReadiness = venueId ? await getVenueOrderReadiness(venueId) : null
  const partnerReadiness = partnerId ? await getPartnerOrderReadiness(partnerId, venueId) : null

  const hooks = []
  for (const blocker of venueReadiness?.blockers ?? []) {
    hooks.push({ type: blocker.type, severity: blocker.severity, message: blocker.message ?? blocker.type })
  }
  for (const blocker of partnerReadiness?.blockers ?? []) {
    hooks.push({ type: blocker.type, severity: blocker.severity, owner: 'partner_vendor', partnerId })
  }

  return {
    ok: true,
    venueId,
    partnerId,
    orderLifecycleStatus: 'order_lifecycle_preview',
    paymentStatus: 'payment_confirmation_required',
    taxStatus: 'tax_preview_required',
    posStatus: 'pos_sync_pending',
    kdsStatus: 'kds_routing_pending',
    orderHooks: hooks,
    message: 'The Order Lifecycle Engine tracks order state and readiness, but it does not prove live payment capture, POS sync, or kitchen routing unless those integrations are verified.',
  }
}

export async function getTaxReadinessHooks(venueId, partnerId = null) {
  const { getVenueTaxComplianceReadiness, getPartnerTaxComplianceReadiness, buildTaxReadinessScore } = await import('./tax/taxComplianceReadinessEngine.js')

  const [venueReadiness, score] = await Promise.all([
    getVenueTaxComplianceReadiness(venueId),
    buildTaxReadinessScore(venueId, partnerId),
  ])

  const partnerReadiness = partnerId ? await getPartnerTaxComplianceReadiness(partnerId, venueId) : null

  return {
    ok: true,
    venueId,
    partnerId,
    taxReadinessStatus: venueReadiness.taxReadinessStatus,
    taxReadinessScore: score.taxReadinessScore,
    maxScore: score.maxScore,
    profileStatus: venueReadiness.profileStatus,
    jurisdictionStatus: venueReadiness.jurisdictionStatus,
    categoryStatus: venueReadiness.categoryStatus,
    ruleStatus: venueReadiness.ruleStatus,
    partnerTaxProfileStatus: partnerReadiness?.partnerTaxProfileStatus ?? null,
    merchantOfRecordStatus: partnerReadiness?.merchantOfRecordStatus ?? null,
    blockers: venueReadiness.blockers,
    complianceNote: 'This engine supports tax calculation previews and readiness checks, but it does not provide legal tax advice or guarantee tax compliance.',
  }
}

export async function getKdsRoutingHooks(venueId, partnerId = null) {
  const { getStationConfigReadiness } = await import('./kds/stationConfigService.js')
  const { getStationHealthReadiness } = await import('./kds/stationHealthEngine.js')
  const { getFulfillmentReadiness }   = await import('./kds/fulfillmentStationEngine.js')

  const [configReadiness, healthReadiness, fulfillmentReadiness] = await Promise.all([
    getStationConfigReadiness(venueId),
    Promise.resolve(getStationHealthReadiness(venueId)),
    Promise.resolve(getFulfillmentReadiness({ venueId })),
  ])

  const hooks = []
  for (const b of configReadiness.blockers ?? []) {
    hooks.push({ type: b.type, severity: b.severity, message: b.message ?? b.type })
  }
  for (const b of healthReadiness.blockers ?? []) {
    hooks.push({ type: b.type, severity: b.severity, message: b.message ?? b.type })
  }

  return {
    ok: true,
    venueId,
    partnerId,
    kdsStatus:             'kds_routing_pending',
    routingMode:           'routing_preview',
    dispatchMode:          'dispatch_preview',
    stationConfigStatus:   configReadiness.blockers?.some(b => b.type === 'station_config_required') ? 'station_config_required' : 'preview_only',
    stationMappingStatus:  configReadiness.blockers?.some(b => b.type === 'station_mapping_required') ? 'station_mapping_required' : 'preview_only',
    overallHealthStatus:   healthReadiness.overallHealthStatus ?? 'station_unavailable',
    fulfillmentStatus:     fulfillmentReadiness.overallFulfillmentStatus ?? 'fulfillment_pending',
    kdsHooks:              hooks,
    message: 'The KDS Fulfillment Station Engine can build routing and dispatch previews, but it does not prove a kitchen, bar, humidor, or partner station was notified unless a live station integration is verified.',
  }
}

export function getNcieScreenWiringReadiness() {
  return {
    ok: true,
    screenWiringStatus:     'screen_wiring_ready',
    educationStatus:        'ncie_ready',
    lessonStatus:           'verified_outline_available',
    adapterMode:            'adapter_only',
    protectedScreenStatus:  'protected_screen_not_modified',
    hookStatus:             'hooks_wired',
    wiringNote: 'NCIE screen wiring connects verified educational outlines, mentors, decisions, recommendations, passport mastery, and analytics previews to screens without making OpenAI the source of truth.',
  }
}

export function getCraftEducationTileReadiness(craftType = 'smokecraft') {
  return {
    ok: true,
    craftType,
    tileStatus:             'educational_tile_ready',
    lessonStatus:           'verified_outline_available',
    quizStatus:             'quiz_preview',
    inventoryStatus:        'inventory_unavailable',
    tileNote: 'Educational tiles provide verified content outlines. Live inventory and AI personalization require active integrations.',
  }
}

export function getSmokeCraftEducationReadiness() {
  return {
    ok: true,
    moduleId:               'smokecraft',
    educationStatus:        'ncie_ready',
    lessonStatus:           'verified_outline_available',
    quizStatus:             'quiz_preview',
    mentorStatus:           'mentor_preview',
    decisionStatus:         'decision_preview',
    recommendationStatus:   'recommendation_preview',
    screenWiringStatus:     'screen_wiring_ready',
    protectedScreenStatus:  'protected_screen_not_modified',
  }
}

export function getEducationAnalyticsReadiness() {
  return {
    ok: true,
    analyticsStatus:    'analytics_preview',
    persistenceStatus:  'not_persisted',
    databaseStatus:     'database_required',
    analyticsNote: 'Analytics events are buffered in-memory for this session. Persistence requires a connected database.',
  }
}

export function getMentorInteractionReadiness() {
  return {
    ok: true,
    mentorStatus:       'mentor_preview',
    aiStatus:           'ai_unavailable',
    aiAvailable:        false,
    sessionStatus:      'session_preview',
    mentorNote: 'Mentor sessions are available in preview mode using verified content outlines. AI personalization requires an active OpenAI key.',
  }
}

export function getPassportMasteryReadiness() {
  return {
    ok: true,
    passportStatus:     'passport_preview',
    masteryStatus:      'mastery_preview',
    xpStatus:           'xp_preview',
    stampLockAuthority: 'session.js',
    passportNote: 'SmokeCraft Passport stamp locks are enforced by session.js. NCIE provides XP and mastery data only.',
  }
}

export async function getCheckoutReadinessHooks(venueId, partnerId = null) {
  const { getCheckoutReadiness, getPartnerCheckoutReadiness } = await import('./checkout/checkoutReadinessEngine.js')
  const cartPayload = { venue_id: venueId }
  const [baseReadiness, partnerReadiness] = await Promise.all([
    getCheckoutReadiness(cartPayload),
    partnerId ? getPartnerCheckoutReadiness(partnerId, venueId) : Promise.resolve(null),
  ])
  return {
    ok:                 true,
    venueId,
    partnerId,
    checkoutReadiness:  baseReadiness.checkoutReadiness,
    readinessScore:     baseReadiness.readinessScore,
    paymentStatus:      'payment_confirmation_required',
    taxStatus:          'tax_preview_required',
    posStatus:          'pos_sync_pending',
    kdsStatus:          'kds_routing_pending',
    inventoryStatus:    'inventory_unavailable',
    partnerReadiness:   partnerReadiness,
    blockers:           baseReadiness.blockers,
    checkoutNote:       'The Customer Checkout and Self-Order Engine can create cart, checkout, receipt, and order-status previews, but it does not prove live payment capture, POS sync, KDS notification, inventory reservation, or finalized tax collection unless those integrations are verified.',
  }
}

export async function getSelfOrderReadinessHooks(venueId) {
  const { getSelfOrderReadiness } = await import('./checkout/checkoutReadinessEngine.js')
  return getSelfOrderReadiness(venueId)
}

export async function getStaffAssistedOrderReadinessHooks(venueId) {
  const { getStaffAssistedOrderReadiness } = await import('./checkout/checkoutReadinessEngine.js')
  return getStaffAssistedOrderReadiness(venueId)
}

export async function getCustomerOrderStatusHooks(orderId) {
  const { getCustomerOrderStatus } = await import('./checkout/customerOrderStatusService.js')
  return getCustomerOrderStatus(orderId)
}

export async function getStaffOperationsReadinessHooks(venueId) {
  const { getStaffOrderReadiness } = await import('./staff/staffOrderService.js')
  return getStaffOrderReadiness({ venue_id: venueId })
}

export async function getTableLayoutReadinessHooks(venueId) {
  const { getTableLayoutReadiness } = await import('./staff/tableLayoutService.js')
  return getTableLayoutReadiness(venueId)
}

export async function getStaffOrderReadinessHooks(venueId) {
  const { getStaffOrderReadiness } = await import('./staff/staffOrderService.js')
  return getStaffOrderReadiness({ venue_id: venueId })
}

export async function getManagerApprovalReadinessHooks(venueId) {
  const { getApprovalReadiness } = await import('./staff/staffApprovalEngine.js')
  return getApprovalReadiness(venueId)
}

export async function getManualPOS360HandoffHooks(venueId) {
  const { getManualPOS360Readiness } = await import('./staff/manualPos360HandoffService.js')
  return getManualPOS360Readiness(venueId)
}

export async function getDragDropLayoutReadinessHooks(venueId) {
  const { getTableLayoutReadiness } = await import('./staff/tableLayoutService.js')
  const base = getTableLayoutReadiness(venueId)
  return {
    ...base,
    dragDropStatus:    'drag_drop_active',
    library:           '@dnd-kit/core',
    touchMoveReady:    'touch_move_ready',
    keyboardMoveReady: 'keyboard_move_ready',
    snapGridReady:     'snap_grid_ready',
    collisionWarnings: 'collision_warning',
    boundaryWarnings:  'section_boundary_warning',
    layoutSaveStatus:  'layout_save_preview',
    persistenceStatus: 'layout_not_persisted',
  }
}

export async function getTableLayoutInteractionReadinessHooks(venueId) {
  const { getTableLayoutReadiness } = await import('./staff/tableLayoutService.js')
  const base = getTableLayoutReadiness(venueId)
  return {
    ...base,
    dragDropActive:    'drag_drop_active',
    keyboardMoveReady: 'keyboard_move_ready',
    touchMoveReady:    'touch_move_ready',
    snapGridReady:     'snap_grid_ready',
    layoutStatus:      'table_layout_preview',
    persistenceStatus: 'layout_not_persisted',
  }
}

export async function getPatioLayoutReadinessHooks(venueId) {
  const { getTableLayoutReadiness } = await import('./staff/tableLayoutService.js')
  const base = getTableLayoutReadiness(venueId)
  return {
    ...base,
    patioLayoutStatus: 'patio_layout_preview',
    dragDropActive:    'drag_drop_active',
    reservedStatus:    'reserved_preview',
    persistenceStatus: 'layout_not_persisted',
  }
}

export async function getFloorPlanOperationalReadinessHooks(venueId) {
  const { getTableLayoutReadiness } = await import('./staff/tableLayoutService.js')
  const { getSectionReadiness }     = await import('./staff/floorSectionService.js')
  const [tableReady, secReady] = await Promise.all([
    getTableLayoutReadiness(venueId),
    getSectionReadiness(venueId),
  ])
  return {
    ok:                tableReady.ok && secReady.ok,
    venueId,
    dragDropStatus:    'drag_drop_active',
    floorLayoutStatus: 'floor_layout_preview',
    tableLayoutStatus: 'table_layout_preview',
    patioLayoutStatus: 'patio_layout_preview',
    layoutSaveStatus:  'layout_save_preview',
    collisionWarnings: 'collision_warning',
    boundaryWarnings:  'section_boundary_warning',
    persistenceStatus: 'layout_not_persisted',
    tableCount:        tableReady.tableCount,
    sectionCount:      secReady.sectionCount,
  }
}

export async function getInventoryAvailabilityReadinessHooks(venueId) {
  try {
    const { getInventoryReadiness } = await import('./inventory/inventoryAvailabilityService.js')
    const r = getInventoryReadiness(venueId)
    return {
      ok: true, venueId,
      inventoryStatus:    r.inventoryStatus,
      syncStatus:         r.syncStatus,
      productCount:       r.productCount,
      soldOutCount:       r.soldOutCount,
      lowStockCount:      r.lowStockCount,
      persistenceStatus:  r.persistenceStatus,
    }
  } catch {
    return { ok: false, venueId, inventoryStatus: 'inventory_sync_pending', syncStatus: 'inventory_sync_pending', persistenceStatus: 'preview_fallback' }
  }
}

export async function getProductAvailabilityReadinessHooks(venueId) {
  try {
    const { getProductAvailabilityReadiness } = await import('./inventory/productAvailabilityService.js')
    return getProductAvailabilityReadiness(venueId)
  } catch {
    return { ok: false, venueId, availabilityStatus: 'availability_required', persistenceStatus: 'preview_fallback' }
  }
}

export async function getDistributorReorderReadinessHooks(venueId) {
  try {
    const { getVendorConnectionReadiness } = await import('./reorder/vendorConnectionService.js')
    const r = getVendorConnectionReadiness(venueId)
    return {
      ok: true, venueId,
      distributorCount:   r.distributorCount,
      connectionStatus:   r.distributorCount === 0 ? 'distributor_connection_required' : r.connectionStatus,
      reorderStatus:      'reorder_preview_only',
      persistenceStatus:  r.persistenceStatus,
    }
  } catch {
    return { ok: false, venueId, connectionStatus: 'distributor_connection_required', persistenceStatus: 'preview_fallback' }
  }
}

export async function getManufacturerReorderReadinessHooks(venueId) {
  try {
    const { getVendorConnectionReadiness } = await import('./reorder/vendorConnectionService.js')
    const r = getVendorConnectionReadiness(venueId)
    return {
      ok: true, venueId,
      manufacturerCount:  r.manufacturerCount,
      connectionStatus:   r.manufacturerCount === 0 ? 'manufacturer_connection_required' : r.connectionStatus,
      reorderStatus:      'reorder_preview_only',
      persistenceStatus:  r.persistenceStatus,
    }
  } catch {
    return { ok: false, venueId, connectionStatus: 'manufacturer_connection_required', persistenceStatus: 'preview_fallback' }
  }
}

export async function getVendorConnectionReadinessHooks(venueId) {
  try {
    const { getVendorConnectionReadiness } = await import('./reorder/vendorConnectionService.js')
    return getVendorConnectionReadiness(venueId)
  } catch {
    return { ok: false, venueId, connectionStatus: 'pending_setup', persistenceStatus: 'preview_fallback' }
  }
}

export async function getPurchaseOrderDraftReadinessHooks(venueId) {
  try {
    const { getPurchaseOrderReadiness } = await import('./reorder/purchaseOrderDraftService.js')
    return getPurchaseOrderReadiness(venueId)
  } catch {
    return { ok: false, venueId, submissionStatus: 'reorder_not_submitted', approvalStatus: 'pending_manager_approval', persistenceStatus: 'preview_fallback' }
  }
}

export async function getReorderApprovalReadinessHooks(venueId) {
  try {
    const { getApprovalReadiness } = await import('./reorder/reorderApprovalService.js')
    return getApprovalReadiness(venueId)
  } catch {
    return { ok: false, venueId, approvalStatus: 'pending_manager_approval', submissionStatus: 'reorder_not_submitted', persistenceStatus: 'preview_fallback' }
  }
}

export async function getInventoryReceivingReadinessHooks(venueId) {
  try {
    const { getReceivingReadiness } = await import('./reorder/inventoryReceivingService.js')
    return getReceivingReadiness(venueId)
  } catch {
    return { ok: false, venueId, receivingStatus: 'receiving_pending', persistenceStatus: 'preview_fallback' }
  }
}

export async function getInventoryPersistenceReadinessHooks(venueId) {
  try {
    const { getInventoryPersistenceReadiness } = await import('./inventory/inventoryPersistenceService.js')
    return getInventoryPersistenceReadiness(venueId)
  } catch {
    return { ok: false, venueId, persistenceStatus: 'preview_fallback', databaseRequired: true, degradedMode: true }
  }
}

export async function getInventoryAdjustmentReadinessHooks(venueId) {
  try {
    const { getAdjustmentPersistenceReadiness } = await import('./inventory/inventoryAdjustmentPersistenceService.js')
    return getAdjustmentPersistenceReadiness(venueId)
  } catch {
    return { ok: false, venueId, persistenceStatus: 'preview_fallback', databaseRequired: true, degradedMode: true }
  }
}

export async function getReceivingPersistenceReadinessHooks(venueId) {
  try {
    const { getReceivingPersistenceReadiness } = await import('./reorder/receivingPersistenceService.js')
    return getReceivingPersistenceReadiness(venueId)
  } catch {
    return { ok: false, venueId, receivingStatus: 'receiving_preview_only', persistenceStatus: 'preview_fallback', databaseRequired: true }
  }
}

export async function getPurchaseOrderPersistenceReadinessHooks(venueId) {
  try {
    const { getPurchaseOrderPersistenceReadiness } = await import('./reorder/purchaseOrderPersistenceService.js')
    return getPurchaseOrderPersistenceReadiness(venueId)
  } catch {
    return { ok: false, venueId, submissionStatus: 'reorder_not_submitted', persistenceStatus: 'preview_fallback', databaseRequired: true }
  }
}

export async function getApprovalPersistenceReadinessHooks(venueId) {
  try {
    const { getApprovalPersistenceReadiness } = await import('./reorder/reorderApprovalPersistenceService.js')
    return getApprovalPersistenceReadiness(venueId)
  } catch {
    return { ok: false, venueId, approvalStatus: 'pending_manager_approval', persistenceStatus: 'preview_fallback', databaseRequired: true }
  }
}

export async function getInventoryAuditReadinessHooks(venueId) {
  try {
    const { getAuditReadiness } = await import('./inventory/inventoryAuditPersistenceService.js')
    return getAuditReadiness(venueId)
  } catch {
    return { ok: false, venueId, persistenceStatus: 'preview_fallback', databaseRequired: true }
  }
}

export async function getOperationalSyncEventReadinessHooks(venueId) {
  try {
    const { getOperationalSyncReadiness } = await import('./sync/operationalSyncEventService.js')
    return getOperationalSyncReadiness(venueId)
  } catch {
    return { ok: false, venueId, syncStatus: 'database_required', externalSyncNotLive: true, persistenceStatus: 'preview_fallback' }
  }
}

export async function getExternalPOSSyncReadinessHooks(venueId) {
  try {
    const { buildExternalPOSRequiredSyncResponse } = await import('./sync/operationalSyncEventService.js')
    return buildExternalPOSRequiredSyncResponse(venueId)
  } catch {
    return { ok: false, venueId, syncStatus: 'external_system_required', externalPOSRequired: true, persistenceStatus: 'preview_fallback' }
  }
}

export async function getVendorSyncReadinessHooks(venueId) {
  try {
    const { buildVendorRequiredSyncResponse } = await import('./sync/operationalSyncEventService.js')
    return buildVendorRequiredSyncResponse(venueId)
  } catch {
    return { ok: false, venueId, syncStatus: 'external_system_required', vendorApiRequired: true, persistenceStatus: 'preview_fallback' }
  }
}

// ─── Phase 16 EPRL Hooks ─────────────────────────────────────────────────────

export async function getEnvironmentReadinessHooks(venueId) {
  try {
    const { buildEnvironmentReadinessReport } = await import('./environment/environmentReadinessService.js')
    const report = buildEnvironmentReadinessReport()
    return {
      hookId: 'environment_readiness', system: 'eprl', venueId,
      readiness: report.ok ? 'ready' : 'degraded',
      status: report.environmentMode,
      blockers: report.blockers,
      warnings: report.warnings,
      degradedMode: report.degradedMode,
      persistenceMode: report.persistenceMode,
      databaseRequired: !report.databaseUrl?.present,
      evidence: report,
      nextRequiredAction: report.degradedMode ? 'Set DATABASE_URL to enable persistence' : null,
    }
  } catch {
    return { ok: false, venueId, status: 'preview_fallback', degradedMode: true, persistenceStatus: 'preview_fallback' }
  }
}

export async function getDatabaseConnectionReadinessHooks(venueId) {
  try {
    const { getDatabaseConnectionStatus } = await import('../db/databaseConnectionManager.js')
    const conn = getDatabaseConnectionStatus()
    return {
      hookId: 'database_connection', system: 'eprl', venueId,
      readiness: conn.degradedMode ? 'degraded' : 'ready',
      status: conn.status,
      blockers: conn.degradedMode ? ['DATABASE_URL missing or invalid'] : [],
      degradedMode: conn.degradedMode,
      databaseRequired: conn.databaseRequired,
      evidence: conn,
      nextRequiredAction: conn.degradedMode ? 'Set DATABASE_URL environment variable' : null,
    }
  } catch {
    return { ok: false, venueId, status: 'preview_fallback', degradedMode: true, persistenceStatus: 'preview_fallback' }
  }
}

export async function getMigrationReadinessHooks(venueId) {
  try {
    const { buildMigrationReadinessReport } = await import('../db/migrationReadinessService.js')
    const report = await buildMigrationReadinessReport(null)
    return {
      hookId: 'migration_readiness', system: 'eprl', venueId,
      readiness: report.ok ? 'ready' : 'degraded',
      status: report.status,
      blockers: report.pendingMigrations?.length > 0 ? [`${report.pendingMigrations.length} migrations pending`] : [],
      degradedMode: report.degradedMode,
      databaseRequired: report.databaseRequired,
      evidence: { latestExpected: report.latestExpected, latestApplied: report.latestApplied, pendingCount: report.pendingMigrations?.length ?? 0 },
      nextRequiredAction: report.degradedMode ? 'Run npm run db:migrate' : null,
    }
  } catch {
    return { ok: false, venueId, status: 'preview_fallback', degradedMode: true, persistenceStatus: 'preview_fallback' }
  }
}

export async function getSchemaReadinessHooks(venueId) {
  try {
    const { buildSchemaReadinessReport } = await import('../db/schemaReadinessService.js')
    const report = await buildSchemaReadinessReport(null)
    return {
      hookId: 'schema_readiness', system: 'eprl', venueId,
      readiness: report.ok ? 'ready' : 'degraded',
      status: report.status,
      blockers: report.degradedMode ? ['Schema not yet validated — database required'] : [],
      degradedMode: report.degradedMode,
      databaseRequired: true,
      evidence: report,
      nextRequiredAction: report.degradedMode ? 'Apply migrations and verify schema' : null,
    }
  } catch {
    return { ok: false, venueId, status: 'preview_fallback', degradedMode: true, persistenceStatus: 'preview_fallback' }
  }
}

export async function getPersistenceModeReadinessHooks(venueId) {
  try {
    const { buildPersistenceModeResponse } = await import('./persistence/persistenceModeService.js')
    const mode = buildPersistenceModeResponse()
    return {
      hookId: 'persistence_mode', system: 'eprl', venueId,
      readiness: mode.databaseActive ? 'ready' : 'degraded',
      status: mode.persistenceMode,
      blockers: mode.degradedMode ? ['No database — in_memory_only mode active'] : [],
      degradedMode: mode.degradedMode,
      persistenceMode: mode.persistenceMode,
      databaseRequired: mode.databaseRequired,
      evidence: mode,
      nextRequiredAction: mode.degradedMode ? 'Set DATABASE_URL to switch to real_database mode' : null,
    }
  } catch {
    return { ok: false, venueId, status: 'preview_fallback', degradedMode: true, persistenceStatus: 'preview_fallback' }
  }
}

export async function getDeploymentReadinessHooks(venueId) {
  try {
    const { buildDeploymentReadinessReport } = await import('./deployment/deploymentReadinessService.js')
    const report = buildDeploymentReadinessReport()
    return {
      hookId: 'deployment_readiness', system: 'eprl', venueId,
      readiness: report.ok ? 'ready' : 'not_ready',
      status: report.environmentMode,
      blockers: report.blockers?.map(b => typeof b === 'string' ? b : `${b.key}: ${b.message}`) ?? [],
      warnings: report.warnings ?? [],
      degradedMode: report.degradedMode,
      persistenceMode: report.persistence,
      databaseRequired: !process.env.DATABASE_URL,
      evidence: { provider: report.provider, environmentMode: report.environmentMode },
      nextRequiredAction: report.ok ? null : 'Resolve production blockers before deploy',
    }
  } catch {
    return { ok: false, venueId, status: 'preview_fallback', degradedMode: true, persistenceStatus: 'preview_fallback' }
  }
}

export async function getProductionBlockerReadinessHooks(venueId) {
  try {
    const { getProductionBlockers } = await import('./deployment/deploymentReadinessService.js')
    const blockers = getProductionBlockers()
    return {
      hookId: 'production_blockers', system: 'eprl', venueId,
      readiness: blockers.length === 0 ? 'ready' : 'blocked',
      status: blockers.length === 0 ? 'no_blockers' : 'production_blockers_present',
      blockers: blockers.map(b => `${b.key}: ${b.message}`),
      blockerCount: blockers.length,
      degradedMode: blockers.length > 0,
      evidence: blockers,
      nextRequiredAction: blockers.length > 0 ? 'Resolve all production blockers' : null,
    }
  } catch {
    return { ok: false, venueId, status: 'preview_fallback', degradedMode: true, persistenceStatus: 'preview_fallback' }
  }
}

export async function getRailwayPostgresReadinessHooks(venueId) {
  try {
    const { buildRailwayReadinessChecklist, buildPostgresReadinessChecklist } = await import('./deployment/deploymentReadinessService.js')
    const railway  = buildRailwayReadinessChecklist()
    const postgres = buildPostgresReadinessChecklist()
    return {
      hookId: 'railway_postgres_readiness', system: 'eprl', venueId,
      readiness: railway.ready ? 'ready' : 'not_ready',
      status: railway.ready ? 'railway_ready' : 'railway_setup_required',
      blockers: railway.blockers ?? [],
      railway,
      postgres,
      degradedMode: !railway.ready,
      databaseRequired: !process.env.DATABASE_URL,
      evidence: { railwayReady: railway.ready, postgresReady: postgres.ready },
      nextRequiredAction: !railway.ready ? 'Attach Railway Postgres plugin and set DATABASE_URL' : null,
    }
  } catch {
    return { ok: false, venueId, status: 'preview_fallback', degradedMode: true, persistenceStatus: 'preview_fallback' }
  }
}
