const dbAvailable = () => !!process.env.DATABASE_URL
const hasPOSCreds = () => !!process.env.EXTERNAL_POS_API_KEY
const hasVendorCreds = () => !!process.env.VENDOR_API_KEY
const hasDistributorCreds = () => !!process.env.DISTRIBUTOR_API_KEY
const hasManufacturerCreds = () => !!process.env.MANUFACTURER_API_KEY
const hasWebhookSecret = () => !!process.env.WEBHOOK_SECRET
const hasEmailChannel = () => !!(process.env.SMTP_HOST || process.env.SENDGRID_API_KEY)

export const EOCG_STATUSES = [
  'live_ready','not_live_ready','database_required','database_unavailable',
  'migration_required','schema_required','external_pos_required',
  'external_pos_credentials_required','vendor_api_required','vendor_credentials_required',
  'distributor_connection_required','manufacturer_connection_required',
  'webhook_secret_required','email_channel_required','degraded_mode',
  'in_memory_only','preview_only',
]

export function getLiveExternalOperationsReadiness() {
  const db = dbAvailable()
  const pos = hasPOSCreds()
  const vendor = hasVendorCreds()
  return {
    status: 'not_live_ready',
    databaseAvailable: db,
    externalPOSReady: pos,
    vendorReady: vendor,
    distributorReady: hasDistributorCreds(),
    manufacturerReady: hasManufacturerCreds(),
    webhookReady: hasWebhookSecret(),
    emailChannelReady: hasEmailChannel(),
    degradedMode: !db,
    databaseRequired: !db,
    external_pos_required: !pos,
    vendor_api_required: !vendor,
    externalSyncNotLive: true,
    external_sync_not_live: true,
    realTimePushPending: true,
    real_time_push_pending: true,
    in_memory_only: !db,
    canSubmitLive: false,
  }
}

export function getDatabaseGateForExternalOps() {
  const db = dbAvailable()
  return {
    gate: db ? 'open' : 'closed',
    databaseRequired: !db,
    degradedMode: !db,
    status: db ? 'database_available' : 'database_required',
    in_memory_only: !db,
  }
}

export function getExternalPOSCredentialStatus() {
  const has = hasPOSCreds()
  return {
    status: has ? 'present' : 'external_pos_credentials_required',
    externalPOSReady: has,
    external_pos_required: !has,
    external_pos_credentials_required: !has,
    external_sync_not_live: true,
    credentialKey: 'EXTERNAL_POS_API_KEY',
    valueExposed: false,
  }
}

export function getVendorCredentialStatus() {
  const has = hasVendorCreds()
  return {
    status: has ? 'present' : 'vendor_credentials_required',
    vendorApiReady: has,
    vendor_api_required: !has,
    vendor_credentials_required: !has,
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    credentialKey: 'VENDOR_API_KEY',
    valueExposed: false,
  }
}

export function getDistributorCredentialStatus() {
  const has = hasDistributorCreds()
  return {
    status: has ? 'present' : 'distributor_connection_required',
    distributorReady: has,
    distributor_connection_required: !has,
    reorder_not_submitted: true,
    credentialKey: 'DISTRIBUTOR_API_KEY',
    valueExposed: false,
  }
}

export function getManufacturerCredentialStatus() {
  const has = hasManufacturerCreds()
  return {
    status: has ? 'present' : 'manufacturer_connection_required',
    manufacturerReady: has,
    manufacturer_connection_required: !has,
    reorder_not_submitted: true,
    credentialKey: 'MANUFACTURER_API_KEY',
    valueExposed: false,
  }
}

export function getWebhookCredentialStatus() {
  const has = hasWebhookSecret()
  return {
    status: has ? 'present' : 'webhook_secret_required',
    webhookReady: has,
    webhook_secret_required: !has,
    credentialKey: 'WEBHOOK_SECRET',
    valueExposed: false,
  }
}

export function getEmailChannelStatus() {
  const has = hasEmailChannel()
  return {
    status: has ? 'email_channel_ready' : 'email_channel_required',
    emailChannelReady: has,
    email_channel_required: !has,
    credentialKeys: ['SMTP_HOST', 'SENDGRID_API_KEY'],
    valueExposed: false,
  }
}

export function getPurchaseOrderSubmissionReadiness(venueId) {
  return {
    venueId,
    canSubmitLive: false,
    purchase_order_not_submitted: true,
    reorder_not_submitted: true,
    databaseRequired: !dbAvailable(),
    vendor_api_required: !hasVendorCreds(),
    emailFallbackAvailable: hasEmailChannel(),
    submissionStatus: 'not_submitted',
    autoApprovalDisabled: true,
    approvalRequired: true,
    previewOnly: true,
  }
}

export function getOperationalSyncConsumerReadiness() {
  return {
    status: 'consumer_preview_only',
    real_time_push_pending: true,
    websocket_required: true,
    sse_required: true,
    webhook_required: true,
    externalSyncNotLive: true,
    external_sync_not_live: true,
    consumerFoundationReady: true,
    sync_event_consumer_foundation_ready: true,
    liveConsumerReady: false,
  }
}

export function buildExternalOperationsBlockerReport() {
  const blockers = []
  if (!dbAvailable()) blockers.push({ blocker: 'database_required', severity: 'critical' })
  if (!hasPOSCreds()) blockers.push({ blocker: 'external_pos_credentials_required', severity: 'high' })
  if (!hasVendorCreds()) blockers.push({ blocker: 'vendor_credentials_required', severity: 'high' })
  if (!hasDistributorCreds()) blockers.push({ blocker: 'distributor_connection_required', severity: 'medium' })
  if (!hasManufacturerCreds()) blockers.push({ blocker: 'manufacturer_connection_required', severity: 'medium' })
  if (!hasWebhookSecret()) blockers.push({ blocker: 'webhook_secret_required', severity: 'medium' })
  if (!hasEmailChannel()) blockers.push({ blocker: 'email_channel_required', severity: 'low' })
  return { blockers, blockerCount: blockers.length, liveReadyWhenResolved: false }
}

export function buildExternalOperationsFallbackResponse(context = '') {
  return {
    status: 'preview_only',
    context,
    degradedMode: true,
    databaseRequired: !dbAvailable(),
    external_sync_not_live: true,
    real_time_push_pending: true,
    vendor_api_required: !hasVendorCreds(),
    purchase_order_not_submitted: true,
    in_memory_only: !dbAvailable(),
    externalCredentialsRequired: !hasPOSCreds() || !hasVendorCreds(),
  }
}

export function buildLOCCExternalOperationsSummary(venueId) {
  return {
    venueId,
    readiness: getLiveExternalOperationsReadiness(),
    blockers: buildExternalOperationsBlockerReport(),
    purchaseOrderReadiness: getPurchaseOrderSubmissionReadiness(venueId),
    syncConsumerReadiness: getOperationalSyncConsumerReadiness(),
    externalSyncNotLive: true,
    external_sync_not_live: true,
    canSubmitLive: false,
    autoApprovalDisabled: true,
  }
}
