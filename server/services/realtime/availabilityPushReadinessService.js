const dbAvailable = () => !!process.env.DATABASE_URL

export const PUSH_STATUSES = [
  'real_time_push_ready','real_time_push_pending','websocket_required',
  'sse_required','webhook_required','preview_only','database_required',
]

export function getAvailabilityPushReadiness() {
  return {
    status: 'real_time_push_pending',
    real_time_push_pending: true,
    websocket_required: true,
    sse_required: true,
    webhook_required: true,
    liveReady: false,
    databaseRequired: !dbAvailable(),
    foundationReady: true,
  }
}

export function buildAvailabilityUpdatePayload(venueId, updates) {
  return {
    venueId, updates,
    payloadBuilt: true,
    status: 'preview_only',
    real_time_push_pending: true,
    message: 'availability_payload_ready · push_not_yet_active',
  }
}

export function buildInventoryAvailabilityBroadcastPreview(venueId) {
  return { venueId, system: 'inventory', status: 'preview_only', real_time_push_pending: true, pushed: false }
}

export function buildPOS360AvailabilityPushPreview(venueId) {
  return { venueId, system: 'pos360', status: 'preview_only', real_time_push_pending: true, pushed: false }
}

export function buildEATAvailabilityPushPreview(venueId) {
  return { venueId, system: 'eat', status: 'preview_only', real_time_push_pending: true, pushed: false }
}

export function buildKDSAvailabilityPushPreview(venueId) {
  return { venueId, system: 'kds', status: 'preview_only', real_time_push_pending: true, pushed: false }
}

export function buildNCIEAvailabilityPushPreview(venueId) {
  return { venueId, system: 'ncie', status: 'preview_only', real_time_push_pending: true, pushed: false }
}

export function buildLOCCAvailabilityPushPreview(venueId) {
  return { venueId, system: 'locc', status: 'preview_only', real_time_push_pending: true, pushed: false }
}

export function buildRealtimePushPendingResponse() {
  return {
    status: 'real_time_push_pending',
    real_time_push_pending: true,
    websocket_required: true,
    sse_required: true,
    webhook_required: true,
    liveReady: false,
  }
}
