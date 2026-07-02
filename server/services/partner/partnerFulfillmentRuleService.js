/**
 * Partner Fulfillment Rule Service
 * Controls delivery, pickup, routing, and fulfillment behavior for partner products.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const fulfillmentStore = new Map() // key: partnerId

const DEFAULT_ROUTING_FEE_CENTS = 450

function defaultFulfillmentRules(partnerId, venueId = null) {
  return {
    partner_id: partnerId,
    venue_id: venueId,
    fulfillment_mode: 'management_review',
    default_destination_station: 'management_review',
    delivery_available: false,
    pickup_available: true,
    venue_pickup_allowed: true,
    estimated_prep_minutes: null,
    delivery_fee: 0,
    routing_fee: DEFAULT_ROUTING_FEE_CENTS,
    requires_management_approval: true,
    requires_staff_acknowledgement: true,
  }
}

export async function createFulfillmentRules(partnerId, payload) {
  const rules = { ...defaultFulfillmentRules(partnerId, payload.venueId ?? null), ...payload,
    partner_id: partnerId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  fulfillmentStore.set(partnerId, rules)
  return { ok: true, partnerId, rules, storageMode: 'memory_fallback' }
}

export async function updateFulfillmentRules(partnerId, payload) {
  const existing = fulfillmentStore.get(partnerId) ?? defaultFulfillmentRules(partnerId)
  const updated = { ...existing, ...payload, partner_id: partnerId, updated_at: new Date().toISOString() }
  fulfillmentStore.set(partnerId, updated)
  return { ok: true, partnerId, rules: updated, storageMode: 'memory_fallback' }
}

export async function getFulfillmentRules(partnerId, venueId = null) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        'SELECT * FROM partner_vendor_fulfillment_rules WHERE partner_id=$1 LIMIT 1',
        [partnerId]
      )
      if (rows[0]) return { ok: true, partnerId, rules: rows[0], storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const rules = fulfillmentStore.get(partnerId) ?? null
  return {
    ok: true,
    partnerId,
    rules,
    fulfillmentStatus: rules ? 'fulfillment_configured' : 'fulfillment_rules_required',
    storageMode: 'memory_fallback',
  }
}

export async function getDestinationStationForPartnerProduct(partnerId, productId, venueId) {
  const result = await getFulfillmentRules(partnerId, venueId)
  const station = result.rules?.default_destination_station ?? 'management_review'
  return {
    partnerId,
    productId,
    venueId,
    destinationStation: station,
    fulfillmentMode: result.rules?.fulfillment_mode ?? 'management_review',
    requiresManagementApproval: result.rules?.requires_management_approval ?? true,
  }
}

export async function validatePartnerFulfillmentReadiness(partnerId, venueId) {
  const result = await getFulfillmentRules(partnerId, venueId)
  if (!result.rules) {
    return { ready: false, reason: 'fulfillment_rules_required', fulfillmentStatus: 'fulfillment_rules_required' }
  }
  return {
    ready: true,
    fulfillmentStatus: 'fulfillment_configured',
    fulfillmentMode: result.rules.fulfillment_mode,
    destinationStation: result.rules.default_destination_station,
    routingFee: result.rules.routing_fee,
  }
}

export async function calculatePartnerRoutingFee(partnerId, venueId) {
  const result = await getFulfillmentRules(partnerId, venueId)
  const fee = result.rules?.routing_fee ?? DEFAULT_ROUTING_FEE_CENTS
  return {
    partnerId,
    venueId,
    routingFeeCents: fee,
    routingFeeDollars: fee / 100,
    feeSource: result.rules ? 'fulfillment_rules' : 'default',
  }
}
