/**
 * POS Inventory Adapter Contract
 *
 * Supports future POS providers:
 *   square | toast | clover | lightspeed | shopify_pos | custom_pos360 | manual_eat
 *
 * No real provider is currently integrated.
 * All methods return honest status when no provider is connected.
 */

const PROVIDER_STATUSES = {
  NOT_CONNECTED: 'provider_not_connected',
  PREVIEW: 'preview_inventory',
  CONNECTED_PENDING: 'connected_pending_sync',
  SYNCED: 'synced_from_provider',
  SYNC_REQUIRED: 'sync_required',
}

// In-memory fallback store keyed by venueId + itemId
const memoryInventory = new Map()

function memKey(venueId, itemId) { return `${venueId}::${itemId}` }

/**
 * Returns provider connection status for a venue.
 * Until a real POS is integrated, always returns provider_not_connected.
 */
export async function getInventoryProviderStatus(venueId) {
  return {
    ok: true,
    venueId,
    provider: null,
    providerStatus: PROVIDER_STATUSES.NOT_CONNECTED,
    syncMode: 'preview_fallback',
    message: 'No POS provider connected. Using preview inventory only.',
  }
}

/**
 * Request an inventory sync from the connected POS provider.
 * No-op until real provider is wired.
 */
export async function requestInventorySync(venueId) {
  return {
    ok: true,
    venueId,
    syncStatus: PROVIDER_STATUSES.NOT_CONNECTED,
    syncRequested: false,
    syncMode: 'preview_fallback',
    message: 'POS provider not connected. Sync request cannot be fulfilled. Preview inventory in use.',
  }
}

/**
 * Normalize a provider-specific inventory item to the internal format.
 * Each provider has different field names — this maps them to a common shape.
 */
export function normalizeInventoryItem(providerItem, provider = 'unknown') {
  if (!providerItem) return null

  // Generic passthrough — real normalization per-provider added when integrated
  return {
    itemId: providerItem.id ?? providerItem.item_id ?? providerItem.sku ?? null,
    itemName: providerItem.name ?? providerItem.item_name ?? providerItem.title ?? 'Unknown Item',
    totalQuantity: providerItem.quantity ?? providerItem.total_quantity ?? providerItem.stock ?? 0,
    soldQuantity: providerItem.sold ?? providerItem.sold_quantity ?? 0,
    reservedQuantity: providerItem.reserved ?? providerItem.reserved_quantity ?? 0,
    provider,
    normalized: true,
    providerRaw: providerItem,
    posyncStatus: PROVIDER_STATUSES.NOT_CONNECTED,
    note: `Normalized from ${provider} schema. Not synced — provider not connected.`,
  }
}

/**
 * Apply a quantity delta to an inventory item (decrement on add, increment on remove).
 * In preview mode, stores in memory only — not persisted.
 */
export async function applyInventoryDelta(venueId, itemId, delta) {
  const key = memKey(venueId, itemId)
  const current = memoryInventory.get(key) ?? { availableQuantity: 0, soldQuantity: 0 }
  const next = {
    ...current,
    availableQuantity: Math.max(0, (current.availableQuantity ?? 0) - delta),
    soldQuantity: (current.soldQuantity ?? 0) + Math.max(0, delta),
    lastUpdated: new Date().toISOString(),
  }
  memoryInventory.set(key, next)

  return {
    ok: true,
    venueId,
    itemId,
    delta,
    updatedInventory: next,
    persistenceStatus: 'not_persisted',
    syncMode: 'preview_fallback',
    posyncStatus: PROVIDER_STATUSES.NOT_CONNECTED,
    message: 'Inventory delta applied in memory only. No database or POS sync.',
  }
}

/**
 * Validate whether the requested quantity can be fulfilled.
 */
export async function validateAvailableQuantity(venueId, itemId, requestedQty) {
  const key = memKey(venueId, itemId)
  const current = memoryInventory.get(key)

  if (!current) {
    return {
      ok: true,
      venueId,
      itemId,
      requestedQty,
      available: true,
      availableQuantity: null,
      inventorySource: 'no_record',
      posyncStatus: PROVIDER_STATUSES.NOT_CONNECTED,
      message: 'No inventory record found. Allowing by default (preview mode).',
    }
  }

  const avail = current.availableQuantity ?? 0
  const allowed = avail >= requestedQty

  return {
    ok: true,
    venueId,
    itemId,
    requestedQty,
    available: allowed,
    availableQuantity: avail,
    inventorySource: 'preview_memory',
    posyncStatus: PROVIDER_STATUSES.PREVIEW,
    message: allowed
      ? `${avail} units available (preview). Not POS-synced.`
      : `Only ${avail} units available. Request for ${requestedQty} cannot be fulfilled.`,
  }
}

export { PROVIDER_STATUSES }
