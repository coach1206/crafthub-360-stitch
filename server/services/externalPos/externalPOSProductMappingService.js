const dbAvailable = () => !!process.env.DATABASE_URL

const mappingStore = new Map()

export const MAPPING_STATUSES = [
  'mapped','unmapped','mapping_required','mapping_conflict',
  'mapping_preview_only','provider_required','database_required',
]

export function createPOSProductMapping(mapping) {
  const id = `mapping_${Date.now()}`
  const record = {
    mappingId: id,
    internalProductId: mapping.productId,
    venueId: mapping.venueId,
    externalPosProductId: mapping.externalPosProductId ?? null,
    externalPosVariantId: mapping.externalPosVariantId ?? null,
    externalPosCategoryId: mapping.externalPosCategoryId ?? null,
    externalPosMenuId: mapping.externalPosMenuId ?? null,
    sku: mapping.sku ?? null,
    barcode: mapping.barcode ?? null,
    productName: mapping.productName ?? null,
    syncStatus: 'mapping_preview_only',
    mappingConfidence: 0,
    lastMappedAt: new Date().toISOString(),
    databaseRequired: !dbAvailable(),
    persisted: dbAvailable(),
  }
  mappingStore.set(id, record)
  return record
}

export function getPOSProductMapping(mappingId) {
  return mappingStore.get(mappingId) ?? { status: 'mapping_required', mappingId, databaseRequired: !dbAvailable() }
}

export function getMappingsByVenue(venueId) {
  return [...mappingStore.values()].filter(m => m.venueId === venueId)
}

export function getMappingsByProvider(posProviderId) {
  return { posProviderId, mappings: [], status: 'provider_required', message: 'no_provider_configured' }
}

export function validatePOSProductMapping(mapping) {
  const errors = []
  if (!mapping.productId) errors.push('productId_required')
  if (!mapping.venueId) errors.push('venueId_required')
  return { valid: errors.length === 0, errors, status: errors.length === 0 ? 'valid' : 'mapping_required' }
}

export function detectUnmappedInventoryProducts(venueId) {
  return {
    venueId,
    unmappedCount: 0,
    unmappedProducts: [],
    status: 'mapping_required',
    pos_product_mapping_required: true,
    message: 'pos_product_mapping_required · no external pos configured',
    databaseRequired: !dbAvailable(),
  }
}

export function detectUnmappedPOSProducts(venueId) {
  return {
    venueId,
    unmappedPOSCount: 0,
    unmappedPOSProducts: [],
    status: 'provider_required',
    message: 'external_pos_required · no external pos configured',
  }
}

export function detectMappingConflicts(venueId) {
  return {
    venueId,
    conflictCount: 0,
    conflicts: [],
    status: 'mapping_preview_only',
    message: 'no active mapping conflicts detected in preview mode',
  }
}

export function buildMappingRequiredResponse(context = '') {
  return {
    status: 'mapping_required',
    context,
    pos_product_mapping_required: true,
    external_pos_required: true,
    databaseRequired: !dbAvailable(),
  }
}
