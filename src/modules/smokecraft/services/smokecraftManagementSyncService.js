/**
 * SmokeCraft Management Sync Service (module layer)
 * Handles management sync operations for venue owners and managers.
 * Returns demo_only status when E.A.T. is not connected.
 */

/**
 * Triggers a management sync for a venue.
 * Returns demo_only when E.A.T. is not connected.
 */
export function syncManagement(payload) {
  return {
    synced: false,
    status: 'demo_only',
    source: 'local_fallback',
    eatConnected: false,
    preview_only: true,
    backendConnected: false,
    safeClaim: 'E.A.T. management sync is preview/internal — backend connection not enabled',
    message: 'Management sync is demo_only. E.A.T. command hub connection required for live sync.',
    payload,
    syncedAt: null,
  }
}

/**
 * Returns the management sync status for a venue.
 */
export function getManagementSyncStatus(venueId) {
  return {
    venueId,
    eatConnected: false,
    lastSyncedAt: null,
    syncStatus: 'not_connected',
    preview_only: true,
    backendConnected: false,
    safeClaim: 'E.A.T. management sync is preview/internal — backend connection not enabled',
  }
}

export function buildManagementSyncReport() {
  return {
    moduleId: 'smokecraft-experience',
    eatConnected: false,
    syncStatus: 'not_connected',
    preview_only: true,
    backendConnected: false,
    safeClaim: 'E.A.T. management sync is preview/internal — backend connection not enabled',
    message: 'Management sync requires E.A.T. command hub. Connect in Module Build 4.',
  }
}
