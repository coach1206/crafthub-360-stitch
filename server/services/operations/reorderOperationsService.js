/**
 * LOCC — Reorder Operations Service
 * Controls visibility and safe actions for PO submission and reorder workflow.
 */

import { v4 as uuidv4 } from 'uuid'
import { assertManagerRole, assertOwnerRole } from './roleSafetyGateway.js'

const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

export const SUBMISSION_GATE_STATUSES = [
  'reorder_not_submitted','vendor_api_required','vendor_email_required',
  'manual_export_required','approval_required','reorder_preview_only',
  'submission_blocked','submission_pending_vendor_setup',
]

export function getReorderSubmissionReadiness(venueId) {
  return {
    ok:                     true,
    venueId,
    submissionGateActive:   true,
    submissionStatus:       'reorder_not_submitted',
    vendorApiRequired:      true,
    vendorSyncNotLive:      true,
    distributorConnectionRequired: true,
    manufacturerConnectionRequired: true,
    autoSubmissionDisabled: true,
    approvalRequired:       true,
    canPreviewPO:           true,
    canSubmitLive:          false,
    persistenceMode:        dbAvailable() ? 'real_database' : 'in_memory_only',
    degradedMode:           !dbAvailable(),
    note: 'No vendor API is connected. Purchase orders can be drafted and approved but not submitted.',
    nextPhaseRequired: 'Phase 18+ for live vendor API integration',
  }
}

export async function getReorderRecommendationQueue(venueId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'view_reorder_recommendations')
  if (blocked) return blocked
  try {
    const { getVenueReorderRecommendations } = await import('../reorder/reorderRecommendationEngine.js')
    const result = getVenueReorderRecommendations(venueId)
    return {
      ok:              true,
      venueId,
      recommendations: result.recommendations ?? [],
      count:           result.count ?? 0,
      urgentCount:     (result.recommendations ?? []).filter(r => r.urgency === 'critical' || r.urgency === 'urgent').length,
      reorderNotSubmitted: true,
      vendorApiRequired:   true,
      degradedMode:    !dbAvailable(),
      timestamp:       now(),
    }
  } catch {
    return { ok: false, status: 'recommendation_service_unavailable', recommendations: [], degradedMode: true }
  }
}

export async function getPurchaseOrderDraftQueue(venueId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'view_purchase_orders')
  if (blocked) return blocked
  try {
    const { listVenuePurchaseOrders } = await import('../reorder/purchaseOrderDraftService.js')
    const result = listVenuePurchaseOrders(venueId)
    return {
      ok:              true,
      venueId,
      purchaseOrders:  result.purchaseOrders ?? [],
      count:           result.count ?? 0,
      reorderNotSubmitted: true,
      vendorApiRequired:   true,
      degradedMode:    !dbAvailable(),
      timestamp:       now(),
    }
  } catch {
    return { ok: false, status: 'po_service_unavailable', purchaseOrders: [], degradedMode: true }
  }
}

export async function markPONotSubmitted(purchaseOrderId, reason, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'mark_po_not_submitted')
  if (blocked) return blocked
  try {
    const { markPurchaseOrderNotSubmitted } = await import('../reorder/purchaseOrderPersistenceService.js')
    const result = await markPurchaseOrderNotSubmitted(purchaseOrderId, reason)
    return {
      ...result,
      reorderNotSubmitted: true,
      vendorApiRequired:   true,
      note: 'PO marked not submitted. Vendor API or email integration required for live submission.',
    }
  } catch {
    return { ok: false, status: 'operation_failed', purchaseOrderId, reorderNotSubmitted: true }
  }
}

export async function previewPurchaseOrderSubmission(purchaseOrderId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'preview_po_submission')
  if (blocked) return blocked
  return {
    ok:                   true,
    purchaseOrderId,
    submissionStatus:     'reorder_preview_only',
    reorderNotSubmitted:  true,
    vendorApiRequired:    true,
    canSubmitLive:        false,
    previewMode:          true,
    note:                 'Submission preview only. No vendor API connected — order will not be sent.',
    blockers: [
      'vendor_api_required — no vendor API configured',
      'distributor_connection_required — no distributor linked',
    ],
    timestamp: now(),
  }
}

export function buildVendorConnectorStatus(venueId) {
  return {
    ok:                            true,
    venueId,
    vendorConnectorsActive:        false,
    vendorApiRequired:             true,
    vendorSyncNotLive:             true,
    distributorConnectionRequired: true,
    manufacturerConnectionRequired: true,
    connectedVendors:              0,
    pendingSetupVendors:           0,
    reorderNotSubmitted:           true,
    note: 'No vendor API connections active. Register vendors and configure API credentials to enable live ordering.',
    nextPhaseRequired: 'Phase 18+ for vendor API integration',
  }
}
