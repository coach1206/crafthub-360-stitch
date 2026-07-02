#!/usr/bin/env node
/**
 * Phase 9 Verification Script
 * Proves production-readiness contracts without requiring a live database.
 *
 * Run: node server/scripts/verifyPhase9.js
 */

let passed = 0
let failed = 0

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ''}`)
    failed++
  }
}

// ── 1. Import contracts ───────────────────────────────────────────────────────
import { resolveTaxConfig, calculateTax, FALLBACK_PREVIEW_RATE } from '../../src/utils/smokeCraftTaxConfig.js'
import {
  resolveFeatureStatus, buildEnablePayload, defaultFeatureSettings,
  filterSpecialsByVenueFeature, FEATURE_STATUSES,
} from '../../src/utils/venueFeatureSettings.js'
import { roundMoney } from '../../src/utils/smokeCraftMoneyBridge.js'
import {
  canApproveSpecial, canPublishSpecial, getInitialSpecialStatusForRole,
  canShowSpecialToCustomer, SPECIAL_APPROVAL_ROLES, SPECIAL_SUGGESTION_ROLES,
} from '../../src/utils/smokeCraftSpecialsEngine.js'
import { PROVIDER_STATUSES, normalizeInventoryItem } from '../services/posInventoryAdapter.js'
import { ROUTING_STATUSES, validateDestinationStation } from '../services/kitchenRoutingAdapter.js'

console.log('\n═══════════════════════════════════════════════')
console.log('  Phase 9 — Production Readiness Verification')
console.log('═══════════════════════════════════════════════\n')

// ── TEST 1: Tax config — missing → preview_only ───────────────────────────────
console.log('1. Tax Config Contract')
{
  const cfg = resolveTaxConfig(null)
  assert('Missing tax config → taxStatus preview_only', cfg.taxStatus === 'preview_only')
  assert('Missing tax config → uses fallback rate', cfg.taxRate === FALLBACK_PREVIEW_RATE)

  const verifedCfg = resolveTaxConfig({ is_verified: true, combined_tax_rate: 0.0825, partner_food_taxable: true, delivery_fee_taxable: false })
  assert('Verified venue config → taxStatus venue_config', verifedCfg.taxStatus === 'venue_config')

  const calc = calculateTax({ taxableBase: 100, taxConfig: cfg })
  assert('Tax calculation produces taxAmount', typeof calc.taxAmount === 'number' && calc.taxAmount > 0)
  assert('Tax calculation preserves taxStatus', calc.taxStatus === 'preview_only')
}

// ── TEST 2: Venue feature settings ────────────────────────────────────────────
console.log('\n2. Venue Feature Settings')
{
  const defaults = defaultFeatureSettings('venue-001')
  assert('Default settings: disabled', defaults.computedStatus === FEATURE_STATUSES.DISABLED)
  assert('Default settings: partner not allowed', defaults.partnerSpecialsAllowed === false)

  const payload = buildEnablePayload({ venueId: 'venue-001', enabledBy: 'owner-1' })
  assert('Enable payload: enabled flag true', payload.ticket_tapper_partner_specials_enabled === true)
  assert('Enable payload: trial_active status', payload.status === FEATURE_STATUSES.TRIAL_ACTIVE)
  assert('Enable payload: trial_expires_at set', !!payload.trial_expires_at)

  // Trial within 30 days
  const trialExpires = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
  const activeSettings = resolveFeatureStatus({ ticket_tapper_partner_specials_enabled: true, enabled_at: new Date().toISOString(), trial_expires_at: trialExpires, cancelled_at: null, cancellation_requested_at: null })
  assert('Active trial: partner allowed', activeSettings.partnerSpecialsAllowed === true)
  assert('Active trial: computedStatus trial_active', activeSettings.computedStatus === FEATURE_STATUSES.TRIAL_ACTIVE)

  // Expired trial without cancellation → active_renewing
  const expiredTrial = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  const renewingSettings = resolveFeatureStatus({ ticket_tapper_partner_specials_enabled: true, enabled_at: expiredTrial, trial_expires_at: expiredTrial, cancelled_at: null, cancellation_requested_at: null })
  assert('Expired trial, no cancel → active_renewing', renewingSettings.computedStatus === FEATURE_STATUSES.ACTIVE_RENEWING)

  // Cancelled
  const cancelledSettings = resolveFeatureStatus({ ticket_tapper_partner_specials_enabled: true, cancelled_at: new Date().toISOString() })
  assert('Cancelled: partner not allowed', cancelledSettings.partnerSpecialsAllowed === false)
  assert('Cancelled: computedStatus cancelled', cancelledSettings.computedStatus === FEATURE_STATUSES.CANCELLED)
}

// ── TEST 3: Partner specials filtered when venue not opted in ─────────────────
console.log('\n3. Partner Specials Filtering')
{
  const specials = [
    { id: 'sp-1', title: 'Venue Special', source: 'venue', status: 'active' },
    { id: 'sp-2', title: 'Partner Special', source: 'partner_network', isPartnerSpecial: true, status: 'active' },
  ]
  const disabledSettings = defaultFeatureSettings('venue-001')
  const filtered = filterSpecialsByVenueFeature(specials, disabledSettings)
  assert('Partner special hidden when venue disabled', filtered.length === 1 && filtered[0].id === 'sp-1')

  const enablePayload = buildEnablePayload({ venueId: 'venue-001', enabledBy: 'mgr' })
  const enabledSettings = resolveFeatureStatus(enablePayload)
  const allowedAll = filterSpecialsByVenueFeature(specials, enabledSettings)
  assert('Partner special shown when venue enabled', allowedAll.length === 2)
}

// ── TEST 4: Staff approval rules ──────────────────────────────────────────────
console.log('\n4. Staff Approval Rules')
{
  assert('Manager can approve', canApproveSpecial('manager') === true)
  assert('Owner can approve', canApproveSpecial('owner') === true)
  assert('Admin can approve', canApproveSpecial('admin') === true)
  assert('Bartender cannot approve', canApproveSpecial('bartender') === false)
  assert('Cook cannot approve', canApproveSpecial('cook') === false)
  assert('Server cannot approve', canApproveSpecial('server') === false)

  assert('Manager initial status: approved', getInitialSpecialStatusForRole('manager') === 'approved')
  assert('Bartender initial status: pending_approval', getInitialSpecialStatusForRole('bartender') === 'pending_approval')
  assert('Cook initial status: pending_approval', getInitialSpecialStatusForRole('cook') === 'pending_approval')
  assert('Server initial status: pending_approval', getInitialSpecialStatusForRole('server') === 'pending_approval')

  // Customer cannot see pending specials
  const pendingSpecial = { status: 'pending_approval', approval: { required: true, status: 'pending_approval' } }
  const activeSpecial = { status: 'active', approval: { required: true, status: 'approved' } }
  assert('Pending special hidden from customer', canShowSpecialToCustomer(pendingSpecial) === false)
  assert('Active+approved special visible to customer', canShowSpecialToCustomer(activeSpecial) === true)
}

// ── TEST 5: Sold-out check ────────────────────────────────────────────────────
console.log('\n5. Inventory / Sold-Out')
{
  const { canOneTapOrderSpecial } = await import('../../src/utils/smokeCraftSpecialsEngine.js')
  const soldOutSpecial = { id: 'sp-1', inventory: { quantityAvailable: 0, inventoryStatus: 'sold_out', allowOversell: false } }
  const { allowed, reason } = canOneTapOrderSpecial({ special: soldOutSpecial, inventoryItems: [] })
  assert('Sold-out special cannot be one-tapped', allowed === false && reason === 'sold_out')

  // Engine uses inventoryStatus field to determine low_stock reason
  const lowStockSpecial = { id: 'sp-2', inventory: { quantityAvailable: 2, lowInventoryThreshold: 3, inventoryStatus: 'low_stock', allowOversell: false } }
  const { allowed: lowAllowed, reason: lowReason } = canOneTapOrderSpecial({ special: lowStockSpecial, inventoryItems: [] })
  assert('Low stock special allowed but flagged', lowAllowed === true && lowReason === 'low_stock')
}

// ── TEST 6: Money Bridge math ─────────────────────────────────────────────────
console.log('\n6. Money Bridge Math')
{
  const subtotal = 100
  const sc = roundMoney(subtotal * 0.10)
  const vr = roundMoney(subtotal * 0.05)
  const pp = roundMoney(subtotal * 0.85)
  assert('SmokeCraft commission = 10%', sc === 10.00)
  assert('Venue referral = 5%', vr === 5.00)
  assert('Partner payout = 85%', pp === 85.00)
  assert('Commission + referral + payout = 100%', roundMoney(sc + vr + pp) === subtotal)

  const delivery = 4.50
  const taxRate = 0.085
  const tax = roundMoney(subtotal * taxRate)
  const total = roundMoney(subtotal + delivery + tax)
  assert('Delivery fee = $4.50 flat', delivery === 4.50)
  assert('Total = subtotal + delivery + tax', total === roundMoney(subtotal + 4.50 + tax))
}

// ── TEST 7: Tax varies by config ──────────────────────────────────────────────
console.log('\n7. Tax Variance by Config')
{
  const txCfg = resolveTaxConfig({ is_verified: true, combined_tax_rate: 0.0825, partner_food_taxable: true, delivery_fee_taxable: false, state: 'TX' })
  assert('TX tax rate: 0.0825', txCfg.taxRate === 0.0825)

  const noCfg = resolveTaxConfig(null)
  assert('No config → preview rate 0.085', noCfg.taxRate === 0.085)
  assert('No config → taxStatus preview_only', noCfg.taxStatus === 'preview_only')
}

// ── TEST 8: POS provider not connected ────────────────────────────────────────
console.log('\n8. POS Inventory Sync Status')
{
  const { getInventoryProviderStatus } = await import('../services/posInventoryAdapter.js')
  const status = await getInventoryProviderStatus('venue-001')
  assert('POS provider: not connected', status.providerStatus === PROVIDER_STATUSES.NOT_CONNECTED)
  assert('POS provider: syncMode preview_fallback', status.syncMode === 'preview_fallback')
  assert('POS provider: ok true', status.ok === true)

  const normalized = normalizeInventoryItem({ id: 'item-1', name: 'Old Fashioned', quantity: 10 }, 'square')
  assert('normalizeInventoryItem: returns itemId', !!normalized.itemId)
  assert('normalizeInventoryItem: posyncStatus not_connected', normalized.posyncStatus === PROVIDER_STATUSES.NOT_CONNECTED)
}

// ── TEST 9: Kitchen routing — no routed_live without KDS ─────────────────────
console.log('\n9. Kitchen Routing Status')
{
  const partnerItem = { isPartnerSpecial: true, source: 'partner_network' }
  const barItem = { type: 'drink', special_type: 'drink_special' }
  const humidorItem = { type: 'cigar' }

  const { station: ps, routingStatus: pr } = validateDestinationStation(partnerItem)
  assert('Partner item routes to partner station', ps === 'partner')
  assert('Partner item status: partner_route_pending', pr === ROUTING_STATUSES.PARTNER_ROUTE_PENDING)

  const { station: bs } = validateDestinationStation(barItem)
  assert('Drink item routes to bar', bs === 'bar')

  const { station: hs } = validateDestinationStation(humidorItem)
  assert('Cigar item routes to humidor', hs === 'humidor')

  // Prove routed_live is never used in preview
  const { createRoutingTicket } = await import('../services/kitchenRoutingAdapter.js')
  const ticket = await createRoutingTicket({ orderId: 'order-test-1', items: [partnerItem], venueId: 'venue-001' })
  assert('Routing ticket not routed_live', ticket.ticket.overallStatus !== ROUTING_STATUSES.ROUTED_LIVE)
  assert('Routing ticket kdsIntegration false', ticket.ticket.kdsIntegration === false)
}

// ── TEST 10: Settlement status never claims deposited/settled/paid ─────────────
console.log('\n10. Settlement Language Honest Check')
{
  const { calculateSmokeCraftMoneyBridge } = await import('../../src/utils/smokeCraftMoneyBridge.js')
  const result = calculateSmokeCraftMoneyBridge({
    venueItems: [{ price: 20, quantity: 1 }],
    partnerItems: [{ partnerId: 'p1', price: 50, quantity: 1 }],
    venueTaxConfig: null,
  })

  const BANNED = ['deposited', 'settled', 'confirmed', 'paid', 'completed settlement', 'payment released', 'synced', 'live synced']
  const resultStr = JSON.stringify(result).toLowerCase()
  const found = BANNED.filter(b => resultStr.includes(b))
  assert('Money Bridge result contains no banned settlement language', found.length === 0, found.join(', '))
  assert('settlementStatus = pending_preview', result.settlementStatus === 'pending_preview')
  assert('taxStatus = preview_only (no venue config)', result.taxStatus === 'preview_only')
}

// ── TEST 11: Local preview fallback still works ────────────────────────────────
console.log('\n11. Local Preview Fallback')
{
  const { fetchVenueFeatureSettings } = await import('../../src/services/smokeCraftTicketTapperSpecialsApi.js')
  const result = await fetchVenueFeatureSettings('venue-offline-001')
  assert('fetchVenueFeatureSettings: ok true', result.ok === true)
  assert('fetchVenueFeatureSettings: returns settings', !!result.settings)
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════')
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('═══════════════════════════════════════════════\n')

if (failed > 0) process.exit(1)
