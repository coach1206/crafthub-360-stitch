const hasPOSCreds = () => !!process.env.EXTERNAL_POS_API_KEY

export function getMenuSyncReadiness(venueId) {
  return {
    venueId,
    status: 'preview_only',
    menuSyncLive: false,
    external_pos_required: !hasPOSCreds(),
    external_sync_not_live: true,
    real_time_push_pending: true,
  }
}

export function syncMenuAvailabilityToPreview(venueId, menuItems) {
  return {
    venueId,
    status: 'preview_only',
    menuSynced: false,
    itemCount: menuItems?.length ?? 0,
    external_sync_not_live: true,
    external_pos_required: !hasPOSCreds(),
    message: 'menu_availability_sync_preview_only',
  }
}

export function getMenuAvailabilityFromPOSPreview(venueId) {
  return {
    venueId,
    status: 'preview_only',
    menuItemsAvailable: [],
    external_sync_not_live: true,
    external_pos_required: !hasPOSCreds(),
    message: 'pos_menu_availability_pull_preview',
  }
}

export function buildMenuSyncNotLiveResponse(venueId) {
  return {
    venueId,
    status: 'sync_not_live',
    external_sync_not_live: true,
    external_pos_required: !hasPOSCreds(),
    real_time_push_pending: true,
  }
}
