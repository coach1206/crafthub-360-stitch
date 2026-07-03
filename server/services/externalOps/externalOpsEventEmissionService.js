export function emitCheckoutInventorySyncEventPreview(venueId, orderId) {
  return { venueId, orderId, system: 'checkout', status: 'preview_only', emitted: false, external_sync_not_live: true, real_time_push_pending: true }
}

export function emitStaffOrderInventorySyncEventPreview(venueId, orderId) {
  return { venueId, orderId, system: 'staff', status: 'preview_only', emitted: false, external_sync_not_live: true, real_time_push_pending: true }
}

export function emitKDSInventoryBlockedSyncEventPreview(venueId, ticketId) {
  return { venueId, ticketId, system: 'kds', status: 'preview_only', emitted: false, external_sync_not_live: true, real_time_push_pending: true }
}

export function emitNCIEDemandSignalSyncEventPreview(venueId, signal) {
  return { venueId, signal, system: 'ncie', status: 'preview_only', emitted: false, external_sync_not_live: true, real_time_push_pending: true }
}

export function emitPOS360AvailabilitySyncEventPreview(venueId, productId) {
  return { venueId, productId, system: 'pos360', status: 'preview_only', emitted: false, external_sync_not_live: true, real_time_push_pending: true }
}

export function emitEATInventoryCommandSyncEventPreview(venueId, commandId) {
  return { venueId, commandId, system: 'eat', status: 'preview_only', emitted: false, external_sync_not_live: true, real_time_push_pending: true }
}

export function emitLOCCRetrySyncEventPreview(venueId, syncEventId) {
  return { venueId, syncEventId, system: 'locc', status: 'preview_only', emitted: false, real_time_push_pending: true }
}

export function buildExternalOpsEventEmissionReport(venueId) {
  return {
    venueId,
    emissionStatus: 'preview_only',
    external_sync_not_live: true,
    real_time_push_pending: true,
    systems: ['checkout','staff','kds','ncie','pos360','eat','locc'],
    liveEmissionReady: false,
    message: 'event_emission_foundation_ready · no live external push',
  }
}
