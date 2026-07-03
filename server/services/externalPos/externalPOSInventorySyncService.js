const hasPOSCreds = () => !!process.env.EXTERNAL_POS_API_KEY
const dbAvailable = () => !!process.env.DATABASE_URL

export function getInventorySyncReadiness(venueId) {
  return {
    venueId,
    status: 'preview_only',
    inventorySyncLive: false,
    external_pos_required: !hasPOSCreds(),
    external_sync_not_live: true,
    databaseRequired: !dbAvailable(),
    real_time_push_pending: true,
  }
}

export function pullInventorySnapshot(venueId, posProviderId) {
  return {
    venueId, posProviderId,
    status: 'preview_only',
    snapshotPulled: false,
    external_sync_not_live: true,
    external_pos_required: !hasPOSCreds(),
    items: [],
    message: 'pos_inventory_pull_preview · credentials_required',
  }
}

export function pushInventoryUpdate(venueId, updates) {
  return {
    venueId,
    status: 'preview_only',
    updatesPushed: false,
    external_sync_not_live: true,
    real_time_push_pending: true,
    updateCount: updates?.length ?? 0,
    message: 'inventory_push_preview_only · no live push',
  }
}

export function reconcileInventoryWithPOS(venueId) {
  return {
    venueId,
    status: 'preview_only',
    reconciled: false,
    external_sync_not_live: true,
    databaseRequired: !dbAvailable(),
    message: 'pos_inventory_reconciliation_preview_only',
  }
}

export function buildInventorySyncNotLiveResponse(venueId) {
  return {
    venueId,
    status: 'sync_not_live',
    external_sync_not_live: true,
    external_pos_required: !hasPOSCreds(),
    real_time_push_pending: true,
    databaseRequired: !dbAvailable(),
  }
}
