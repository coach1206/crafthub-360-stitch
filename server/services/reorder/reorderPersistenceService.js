/**
 * OIPSL — Reorder Persistence Service
 * Persists reorder recommendations and demand signals.
 * Wraps reorderRecommendationEngine + reorderDemandSignalService.
 */

import { v4 as uuidv4 } from 'uuid'
import {
  getVenueReorderRecommendations, buildUrgentReorderAlert,
  updateRecommendationStatus,
} from './reorderRecommendationEngine.js'
import { getVenueDemandSignals } from './reorderDemandSignalService.js'

const REC_PERSIST_STORE   = new Map()
const SIGNAL_PERSIST_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

function persistResult(extra = {}) {
  return {
    persisted:         dbAvailable(),
    persistenceStatus: dbAvailable() ? 'persisted' : 'in_memory_only',
    databaseRequired:  !dbAvailable(),
    degradedMode:      !dbAvailable(),
    ...extra,
  }
}

export async function persistReorderRecommendation(venueId, recommendation) {
  const id = recommendation.recommendation_id ?? uuidv4()
  const record = {
    ...recommendation,
    recommendation_id: id,
    venue_id:          venueId,
    persisted:         dbAvailable(),
    persistence_status: dbAvailable() ? 'persisted' : 'in_memory_only',
    persisted_at:      now(),
  }
  REC_PERSIST_STORE.set(id, record)
  return {
    ok: true, recommendation: record,
    ...persistResult({ eventId: id }),
  }
}

export async function updateReorderRecommendation(recommendationId, updates = {}) {
  const existing = REC_PERSIST_STORE.get(recommendationId)
  if (!existing) return { ok: false, error: 'recommendation_not_found' }
  if (updates.reorder_status) updateRecommendationStatus(recommendationId, updates.reorder_status)
  const updated = { ...existing, ...updates, updated_at: now() }
  REC_PERSIST_STORE.set(recommendationId, updated)
  return { ok: true, recommendation: updated, ...persistResult() }
}

export async function getReorderRecommendationsByVenue(venueId, filters = {}) {
  const result = getVenueReorderRecommendations(venueId, filters)
  return { ...result, ...persistResult() }
}

export async function getUrgentReorderRecommendations(venueId) {
  const result = buildUrgentReorderAlert(venueId)
  return { ...result, ...persistResult() }
}

export async function persistReorderDemandSignal(venueId, signal) {
  const id = signal.signal_id ?? uuidv4()
  const record = {
    ...signal,
    signal_id:   id,
    venue_id:    venueId,
    persisted:   dbAvailable(),
    persisted_at: now(),
  }
  SIGNAL_PERSIST_STORE.set(id, record)
  return {
    ok: true, signal: record,
    ...persistResult({ eventId: id }),
  }
}

export async function getDemandSignalsByProduct(venueId, productId) {
  const result = getVenueDemandSignals(venueId, { product_id: productId })
  return { ...result, ...persistResult() }
}

export async function getDemandSignalsByVenue(venueId) {
  const result = getVenueDemandSignals(venueId)
  return { ...result, ...persistResult() }
}

export async function aggregateDemandSignalsForEAT(venueId) {
  const { signals } = getVenueDemandSignals(venueId)
  const byProduct = {}
  for (const s of signals) {
    if (!byProduct[s.product_id]) byProduct[s.product_id] = { product_id: s.product_id, product_name: s.product_name, total_signals: 0, max_strength: 'low', sources: [] }
    byProduct[s.product_id].total_signals += s.times_blocked
    byProduct[s.product_id].sources.push(s.signal_source)
    if (['urgent','high'].includes(s.signal_strength)) byProduct[s.product_id].max_strength = s.signal_strength
  }
  return {
    ok: true, venueId,
    aggregatedSignals: Object.values(byProduct).sort((a, b) => b.total_signals - a.total_signals),
    signalCount: signals.length,
    eatMessage: 'demand_signals_aggregated',
    ...persistResult(),
  }
}

export function getReorderPersistenceReadiness(venueId) {
  const recs    = [...REC_PERSIST_STORE.values()].filter(r => r.venue_id === venueId).length
  const signals = [...SIGNAL_PERSIST_STORE.values()].filter(s => s.venue_id === venueId).length
  return {
    ok:                    true,
    venueId,
    persistedRecommendations: recs,
    persistedSignals:      signals,
    persistenceStatus:     dbAvailable() ? 'persisted' : 'in_memory_only',
    databaseRequired:      !dbAvailable(),
    degradedMode:          !dbAvailable(),
    reorderStatus:         'reorder_not_submitted',
  }
}
