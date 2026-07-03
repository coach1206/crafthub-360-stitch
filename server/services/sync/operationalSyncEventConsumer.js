const dbAvailable = () => !!process.env.DATABASE_URL
const hasPOSCreds = () => !!process.env.EXTERNAL_POS_API_KEY
const hasVendorCreds = () => !!process.env.VENDOR_API_KEY

export const CONSUMER_STATUSES = [
  'consumer_ready','consumer_preview_only','queue_empty','processed_preview',
  'blocked_external_pos_required','blocked_vendor_api_required','blocked_database_required',
  'real_time_push_pending','webhook_consumer_pending',
]

export function getQueuedSyncEvents(venueId) {
  return {
    venueId,
    status: dbAvailable() ? 'queue_ready' : 'database_required',
    events: [],
    queueCount: 0,
    databaseRequired: !dbAvailable(),
    real_time_push_pending: true,
    external_sync_not_live: true,
  }
}

export function processNextSyncEventPreview(venueId) {
  return {
    venueId,
    status: 'processed_preview',
    eventProcessed: false,
    real_time_push_pending: true,
    databaseRequired: !dbAvailable(),
    sync_event_consumer_foundation_ready: true,
    message: 'sync_event_consumer_foundation_ready · processed_preview',
  }
}

export function processSyncEventBatchPreview(venueId, batchSize = 10) {
  return {
    venueId, batchSize,
    status: 'processed_preview',
    eventsProcessed: 0,
    real_time_push_pending: true,
    databaseRequired: !dbAvailable(),
    message: 'batch_processing_preview_only',
  }
}

export function routeSyncEventToExternalPOS(event) {
  return {
    eventId: event?.syncEventId,
    routed: false,
    status: hasPOSCreds() ? 'sync_not_live' : 'blocked_external_pos_required',
    external_pos_required: !hasPOSCreds(),
    external_sync_not_live: true,
  }
}

export function routeSyncEventToVendorGateway(event) {
  return {
    eventId: event?.syncEventId,
    routed: false,
    status: hasVendorCreds() ? 'sync_not_live' : 'blocked_vendor_api_required',
    vendor_api_required: !hasVendorCreds(),
    external_sync_not_live: true,
  }
}

export function routeSyncEventToEAT(event) {
  return { eventId: event?.syncEventId, routed: false, status: 'processed_preview', system: 'eat', external_sync_not_live: true }
}

export function routeSyncEventToPOS360(event) {
  return { eventId: event?.syncEventId, routed: false, status: 'processed_preview', system: 'pos360', external_sync_not_live: true }
}

export function routeSyncEventToNCIE(event) {
  return { eventId: event?.syncEventId, routed: false, status: 'processed_preview', system: 'ncie', external_sync_not_live: true }
}

export function routeSyncEventToLOCC(event) {
  return { eventId: event?.syncEventId, routed: true, status: 'processed_preview', system: 'locc' }
}

export function markSyncEventProcessedPreview(eventId) {
  return {
    eventId, status: 'processed_preview',
    persisted: dbAvailable(),
    databaseRequired: !dbAvailable(),
    sync_event_consumer_foundation_ready: true,
    message: 'sync_event_consumer_foundation_ready',
  }
}

export function markSyncEventBlocked(eventId, reason) {
  return { eventId, status: 'blocked', reason, blockedAt: new Date().toISOString() }
}

export function buildSyncConsumerReadinessReport(venueId) {
  return {
    venueId,
    status: 'consumer_preview_only',
    sync_event_consumer_foundation_ready: true,
    real_time_push_pending: true,
    websocket_required: true,
    sse_required: true,
    webhook_consumer_pending: true,
    databaseRequired: !dbAvailable(),
    externalPOSRequired: !hasPOSCreds(),
    vendorAPIRequired: !hasVendorCreds(),
    liveConsumerReady: false,
    external_sync_not_live: true,
  }
}

export function buildLOCCSyncConsumerSummary(venueId) {
  return {
    venueId,
    consumerReadiness: buildSyncConsumerReadinessReport(venueId),
    real_time_push_pending: true,
    external_sync_not_live: true,
    liveConsumerReady: false,
  }
}
