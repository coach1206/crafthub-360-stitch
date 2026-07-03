const hasPOSCreds = () => !!process.env.EXTERNAL_POS_API_KEY
const dbAvailable = () => !!process.env.DATABASE_URL

export const SUPPORTED_POS_PROVIDERS = [
  { posProviderId: 'square', providerName: 'Square', status: 'provider_not_configured' },
  { posProviderId: 'toast', providerName: 'Toast', status: 'provider_not_configured' },
  { posProviderId: 'clover', providerName: 'Clover', status: 'provider_not_configured' },
  { posProviderId: 'lightspeed', providerName: 'Lightspeed', status: 'provider_not_configured' },
  { posProviderId: 'shopify_pos', providerName: 'Shopify POS', status: 'provider_not_configured' },
  { posProviderId: 'stripe_terminal', providerName: 'Stripe Terminal', status: 'provider_not_configured' },
  { posProviderId: 'custom', providerName: 'Custom POS API', status: 'provider_not_configured' },
]

export const POS_CONNECTION_STATUSES = [
  'connected','disconnected','credentials_required','provider_not_configured',
  'unsupported_provider','sync_not_live','webhook_required','database_required','preview_only',
]

export const POS_SYNC_DIRECTIONS = [
  'inbound_only','outbound_only','bidirectional','disabled','preview_only',
]

export function getExternalPOSConnectionStatus(venueId) {
  return {
    venueId,
    connectionStatus: hasPOSCreds() ? 'disconnected' : 'credentials_required',
    credentialStatus: hasPOSCreds() ? 'present' : 'missing',
    syncDirection: 'preview_only',
    inventorySyncEnabled: false,
    menuSyncEnabled: false,
    orderSyncEnabled: false,
    webhookEnabled: false,
    degradedMode: !dbAvailable(),
    external_sync_not_live: true,
    external_pos_required: !hasPOSCreds(),
    external_pos_credentials_required: !hasPOSCreds(),
    databaseRequired: !dbAvailable(),
    real_time_push_pending: true,
  }
}

export function validateExternalPOSCredentials() {
  return {
    valid: hasPOSCreds(),
    status: hasPOSCreds() ? 'present' : 'external_pos_credentials_required',
    external_pos_credentials_required: !hasPOSCreds(),
    valueExposed: false,
  }
}

export function listSupportedPOSProviders() {
  return {
    providers: SUPPORTED_POS_PROVIDERS,
    activeProvider: null,
    providerConfigured: false,
    external_pos_required: true,
  }
}

export function getPOSProviderCapabilities(posProviderId) {
  const provider = SUPPORTED_POS_PROVIDERS.find(p => p.posProviderId === posProviderId)
  if (!provider) return { status: 'unsupported_provider', posProviderId }
  return {
    posProviderId,
    providerName: provider.providerName,
    capabilities: {
      inventorySync: 'preview_only',
      menuSync: 'preview_only',
      orderSync: 'preview_only',
      webhook: 'webhook_required',
      realTimePush: 'real_time_push_pending',
    },
    status: 'provider_not_configured',
    external_pos_required: true,
  }
}

export function pullInventoryFromPOSPreview(venueId, posProviderId) {
  return {
    status: 'preview_only',
    venueId,
    posProviderId,
    inventoryPulled: false,
    external_pos_required: !hasPOSCreds(),
    external_sync_not_live: true,
    databaseRequired: !dbAvailable(),
    previewData: [],
    message: 'external_pos_credentials_required · no live pull performed',
  }
}

export function pushAvailabilityToPOSPreview(venueId, posProviderId) {
  return {
    status: 'preview_only',
    venueId,
    posProviderId,
    availabilityPushed: false,
    external_sync_not_live: true,
    real_time_push_pending: true,
    external_pos_required: !hasPOSCreds(),
    message: 'availability_push_preview_only · no live push performed',
  }
}

export function syncMenuAvailabilityPreview(venueId, posProviderId) {
  return {
    status: 'preview_only',
    venueId,
    posProviderId,
    menuSynced: false,
    external_sync_not_live: true,
    external_pos_required: !hasPOSCreds(),
    message: 'menu_sync_preview_only · external_pos_credentials_required',
  }
}

export function processExternalPOSWebhookPreview(payload) {
  return {
    status: 'preview_only',
    webhookProcessed: false,
    webhook_required: true,
    external_sync_not_live: true,
    payloadReceived: !!payload,
    message: 'webhook_consumer_pending · not yet active',
  }
}

export function mapExternalPOSProductToInventoryRecord(externalProduct) {
  return {
    status: 'mapping_preview_only',
    externalPosProductId: externalProduct?.id ?? null,
    internalProductId: null,
    mappingRequired: true,
    pos_product_mapping_required: true,
    mappingConfidence: 0,
  }
}

export function mapInventoryRecordToExternalPOSProduct(inventoryRecord) {
  return {
    status: 'mapping_preview_only',
    internalProductId: inventoryRecord?.productId ?? null,
    externalPosProductId: null,
    mappingRequired: true,
    pos_product_mapping_required: true,
    mappingConfidence: 0,
  }
}

export function buildExternalPOSRequiredResponse(context = '') {
  return {
    status: 'external_pos_required',
    context,
    external_pos_required: true,
    external_pos_credentials_required: true,
    external_sync_not_live: true,
    degradedMode: true,
    credentialKey: 'EXTERNAL_POS_API_KEY',
    valueExposed: false,
  }
}

export function buildExternalPOSSyncNotLiveResponse(venueId) {
  return {
    venueId,
    status: 'sync_not_live',
    external_sync_not_live: true,
    real_time_push_pending: true,
    vendor_sync_not_live: true,
    externalCredentialsRequired: !hasPOSCreds(),
    databaseRequired: !dbAvailable(),
  }
}
