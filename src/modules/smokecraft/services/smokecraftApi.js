/**
 * SmokeCraft API Service
 * Frontend service contracts for SmokeCraft module operations.
 * All functions return honest status when backend or POS is not connected.
 */

import { createSmokeCraftOrder, buildPosUnavailableResponse, ORDER_STATUSES } from '../data/smokecraftOrderingContract.js'
import { buildPairingFallbackResponse } from '../data/smokecraftPairingContract.js'
import { createVenueMenuContract } from '../data/smokecraftMenuContract.js'

/**
 * Returns the current SmokeCraft session for a user.
 * Falls back to demo/local mode when backend is not connected.
 */
export async function getSmokeCraftSession(userId, visitId, sessionId) {
  return {
    userId,
    visitId,
    sessionId,
    status: 'demo_only',
    source: 'local_fallback',
    preview_only: true,
    message: 'Session data is local only. DATABASE_URL required for persistence.',
  }
}

/**
 * Saves SmokeCraft progress. Falls back to local storage when backend unavailable.
 */
export async function saveSmokeCraftProgress(payload) {
  return {
    saved: false,
    source: 'local_fallback',
    preview_only: true,
    message: 'Progress save is demo_only. DATABASE_URL required for persistence.',
    payload,
  }
}

/**
 * Returns pairing recommendations. Returns demo_only fallback when engine not connected.
 */
export async function getSmokeCraftRecommendations(payload) {
  return buildPairingFallbackResponse(payload)
}

/**
 * Creates a SmokeCraft order request.
 * Returns honest not_connected status when POS360 is unavailable.
 */
export async function createSmokeCraftOrderRequest(payload) {
  const order = createSmokeCraftOrder(payload)
  return {
    ...order,
    orderStatus: ORDER_STATUSES.REQUESTED,
    ...buildPosUnavailableResponse(order.orderId),
  }
}

/**
 * Updates SmokeCraft order status.
 * No POS sync unless POS360 adapter confirms connection.
 */
export async function updateSmokeCraftOrderStatus(orderId, status) {
  return {
    orderId,
    status,
    synced: false,
    syncStatus: 'not_connected',
    preview_only: true,
    message: 'Order status updated locally. POS360 sync requires active connection.',
  }
}

/**
 * Triggers management sync. Returns demo_only when backend unavailable.
 */
export async function syncSmokeCraftManagement(payload) {
  return {
    synced: false,
    status: 'demo_only',
    source: 'local_fallback',
    preview_only: true,
    message: 'Management sync is demo_only. E.A.T. connection required for live sync.',
    payload,
  }
}

/**
 * Returns venue menu for SmokeCraft ordering. Returns empty contract when not synced.
 */
export async function getSmokeCraftVenueMenu(venueId) {
  return createVenueMenuContract({ venueId })
}

/**
 * Returns the SmokeCraft module status from the NOVEE OS registry.
 */
export async function getSmokeCraftModuleStatus() {
  return {
    moduleId: 'smokecraft-experience',
    moduleVersion: '0.1.0',
    module_packaging_status: 'registered_preview',
    physical_package_status: 'not_yet_packaged',
    marketplace_status: 'not_live_marketplace',
    license_status: 'license_not_enforced',
    lifecycle_status: 'preview_only',
    preview_only: true,
  }
}

/**
 * Returns integration status for all SmokeCraft adapters.
 */
export async function getSmokeCraftIntegrationStatus() {
  return {
    pos360: { connected: false, status: 'not_connected' },
    eat: { connected: false, status: 'not_connected' },
    passport: { connected: false, status: 'not_connected' },
    preview_only: true,
    message: 'All integrations are not_connected in demo mode.',
  }
}
