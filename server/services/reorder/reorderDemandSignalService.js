/**
 * DMRC — Reorder Demand Signal Service
 * Collects demand signals from checkout, POS360, NCIE, KDS, and system events.
 * Used to prioritize reorder recommendations.
 */

import { v4 as uuidv4 } from 'uuid'

const SIGNAL_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

export const SIGNAL_TYPES = [
  'low_stock','sold_out','product_recommended_but_unavailable',
  'product_checkout_blocked_due_to_inventory','product_staff_blocked_due_to_inventory',
  'product_kds_blocked_due_to_inventory','product_pos360_blocked_due_to_inventory',
  'ncie_recommendation_unavailable','manual_reorder_request',
]
export const SIGNAL_SOURCES = ['checkout','pos360','ncie','kds','system','staff','manager']
export const SIGNAL_STRENGTHS = ['low','normal','high','urgent']

function createSignalRecord(venueId, payload) {
  const id = uuidv4()
  const existing = [...SIGNAL_STORE.values()].find(
    s => s.venue_id === venueId && s.product_id === payload.product_id && s.signal_type === payload.signal_type && s.signal_source === payload.signal_source
  )
  if (existing) {
    existing.times_blocked = (existing.times_blocked ?? 1) + 1
    existing.updated_at = now()
    if (payload.signal_strength && SIGNAL_STRENGTHS.indexOf(payload.signal_strength) > SIGNAL_STRENGTHS.indexOf(existing.signal_strength)) {
      existing.signal_strength = payload.signal_strength
    }
    SIGNAL_STORE.set(existing.signal_id, existing)
    return existing
  }
  const signal = {
    signal_id:       id,
    venue_id:        venueId,
    product_id:      payload.product_id,
    product_name:    payload.product_name ?? payload.product_id,
    signal_type:     SIGNAL_TYPES.includes(payload.signal_type) ? payload.signal_type : 'low_stock',
    signal_source:   SIGNAL_SOURCES.includes(payload.signal_source) ? payload.signal_source : 'system',
    signal_strength: SIGNAL_STRENGTHS.includes(payload.signal_strength) ? payload.signal_strength : 'normal',
    current_stock:   payload.current_stock ?? null,
    times_blocked:   1,
    metadata:        payload.metadata ?? {},
    created_at:      now(),
    updated_at:      now(),
  }
  SIGNAL_STORE.set(id, signal)
  return signal
}

export function createDemandSignal(venueId, payload = {}) {
  if (!payload.product_id) return { ok: false, error: 'product_id required' }
  const signal = createSignalRecord(venueId, payload)
  return {
    ok: true, signal,
    signalType:       signal.signal_type,
    signalStrength:   signal.signal_strength,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getVenueDemandSignals(venueId, filters = {}) {
  const signals = []
  for (const s of SIGNAL_STORE.values()) {
    if (s.venue_id !== venueId) continue
    if (filters.product_id && s.product_id !== filters.product_id) continue
    if (filters.signal_source && s.signal_source !== filters.signal_source) continue
    if (filters.signal_type && s.signal_type !== filters.signal_type) continue
    signals.push(s)
  }
  signals.sort((a, b) => b.times_blocked - a.times_blocked)
  return {
    ok: true, signals, count: signals.length, venueId,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function buildNcieDemandSignal(venueId, productId, productName) {
  return createDemandSignal(venueId, {
    product_id:      productId,
    product_name:    productName ?? productId,
    signal_type:     'ncie_recommendation_unavailable',
    signal_source:   'ncie',
    signal_strength: 'normal',
  })
}

export function buildCheckoutDemandSignal(venueId, productId, productName, availabilityStatus) {
  const strength = availabilityStatus === 'sold_out' ? 'urgent' : 'high'
  return createDemandSignal(venueId, {
    product_id:      productId,
    product_name:    productName ?? productId,
    signal_type:     'product_checkout_blocked_due_to_inventory',
    signal_source:   'checkout',
    signal_strength: strength,
  })
}

export function buildPos360DemandSignal(venueId, productId, productName) {
  return createDemandSignal(venueId, {
    product_id:      productId,
    product_name:    productName ?? productId,
    signal_type:     'product_pos360_blocked_due_to_inventory',
    signal_source:   'pos360',
    signal_strength: 'normal',
  })
}

export function getDemandSignalReadiness(venueId) {
  const { signals } = getVenueDemandSignals(venueId)
  return {
    ok:                true,
    venueId,
    signalCount:       signals.length,
    topSignals:        signals.slice(0, 5),
    signalStatus:      signals.length > 0 ? 'demand_signals_active' : 'no_demand_signals',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}
