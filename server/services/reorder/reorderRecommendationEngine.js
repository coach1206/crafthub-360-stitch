/**
 * DMRC — Reorder Recommendation Engine
 * Detects low stock triggers, builds reorder recommendations.
 * Does not auto-submit orders. Approval required before submission.
 */

import { v4 as uuidv4 } from 'uuid'
import { getVenueLowStockItems } from '../inventory/inventoryAvailabilityService.js'
import { getPreferredVendorsForProduct } from './vendorConnectionService.js'

const RECOMMENDATION_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

export const REORDER_STATUSES = [
  'reorder_not_needed','reorder_recommended','reorder_approved','reorder_rejected',
  'reorder_submitted','reorder_acknowledged','reorder_in_transit','reorder_received',
  'reorder_inventory_updated','reorder_preview_only',
]

export const URGENCY_LEVELS = ['low','normal','high','urgent','critical']

export function buildReorderRecommendation(venueId, inventoryRecord, vendorInfo = null) {
  const id = uuidv4()
  const stockRatio = inventoryRecord.reorder_threshold > 0
    ? inventoryRecord.current_stock / inventoryRecord.reorder_threshold
    : 1

  const urgency =
    inventoryRecord.current_stock <= 0     ? 'critical' :
    stockRatio <= 0.25                     ? 'urgent'   :
    stockRatio <= 0.5                      ? 'high'     :
    stockRatio <= 0.75                     ? 'normal'   : 'low'

  const recommendedQuantity = Math.max(
    inventoryRecord.reorder_quantity ?? 10,
    inventoryRecord.reorder_threshold - inventoryRecord.current_stock,
  )

  const rec = {
    recommendation_id:    id,
    venue_id:             venueId,
    product_id:           inventoryRecord.product_id,
    product_name:         inventoryRecord.product_name ?? inventoryRecord.product_id,
    vendor_id:            vendorInfo?.vendor_id ?? null,
    vendor_name:          vendorInfo?.vendor_name ?? null,
    reorder_reason:       inventoryRecord.current_stock <= 0 ? 'sold_out' : 'low_stock',
    reorder_source:       'system',
    urgency,
    current_stock:        inventoryRecord.current_stock,
    available_stock:      inventoryRecord.available_stock ?? inventoryRecord.current_stock,
    reorder_threshold:    inventoryRecord.reorder_threshold,
    recommended_quantity: recommendedQuantity,
    reorder_status:       'reorder_recommended',
    demand_signals:       [],
    metadata:             {},
    created_at:           now(),
    updated_at:           now(),
  }
  RECOMMENDATION_STORE.set(id, rec)
  return {
    ok: true, recommendation: rec,
    reorderStatus:     rec.reorder_status,
    urgency:           rec.urgency,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getVenueReorderRecommendations(venueId, filters = {}) {
  const recs = []
  for (const r of RECOMMENDATION_STORE.values()) {
    if (r.venue_id !== venueId) continue
    if (filters.urgency && r.urgency !== filters.urgency) continue
    if (filters.reorder_status && r.reorder_status !== filters.reorder_status) continue
    if (filters.product_id && r.product_id !== filters.product_id) continue
    recs.push(r)
  }
  recs.sort((a, b) => {
    const urgencyOrder = { critical: 0, urgent: 1, high: 2, normal: 3, low: 4 }
    return (urgencyOrder[a.urgency] ?? 5) - (urgencyOrder[b.urgency] ?? 5)
  })
  return {
    ok: true, recommendations: recs, count: recs.length, venueId,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function buildUrgentReorderAlert(venueId) {
  const recs = getVenueReorderRecommendations(venueId).recommendations
  const urgent = recs.filter(r => r.urgency === 'critical' || r.urgency === 'urgent')
  return {
    ok: true, venueId,
    urgentCount:       urgent.length,
    urgentItems:       urgent,
    alertStatus:       urgent.length > 0 ? 'urgent_reorder_required' : 'no_urgent_reorder',
    reorderStatus:     urgent.length > 0 ? 'reorder_recommended' : 'reorder_not_needed',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function detectLowStockTriggers(venueId) {
  const { items } = getVenueLowStockItems(venueId)
  const triggered = []
  for (const item of items) {
    const vendorResult = getPreferredVendorsForProduct(venueId, item.product_id)
    const vendor = vendorResult.preferredVendors[0] ?? vendorResult.backupVendors[0] ?? null
    const result = buildReorderRecommendation(venueId, item, vendor)
    triggered.push(result.recommendation)
  }
  return {
    ok: true, venueId,
    triggeredCount:    triggered.length,
    recommendations:   triggered,
    reorderStatus:     triggered.length > 0 ? 'reorder_recommended' : 'reorder_not_needed',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function updateRecommendationStatus(recommendationId, status) {
  const rec = RECOMMENDATION_STORE.get(recommendationId)
  if (!rec) return { ok: false, error: 'recommendation_not_found' }
  if (!REORDER_STATUSES.includes(status)) return { ok: false, error: 'invalid_reorder_status' }
  rec.reorder_status = status
  rec.updated_at = now()
  RECOMMENDATION_STORE.set(recommendationId, rec)
  return { ok: true, recommendation: rec, reorderStatus: status }
}
