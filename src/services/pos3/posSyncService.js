/**
 * POS 3 Sync Service — the core of the External POS Integration Hub.
 * Everything here is local-only: testConnection/syncProvider never make a
 * real network call, they validate local config + use bundled sample data
 * from posProviderAdapters.js. All emits go through the shared opsEventBus.
 */

import { emit, SYSTEMS, STATUS } from '../shared/opsEventBus.js'
import { getPosProvider } from '../../data/pos3/posProviders.js'
import { getRawConfig, upsertConfig, maskConfig, appendSyncHistory } from './posIntegrationService.js'
import { CONNECTION_STATES } from './posIntegrationRegistry.js'
import { getSampleData } from './posProviderAdapters.js'
import { getFieldMappings, applyMapping } from './posFieldMappingService.js'

const SOURCE = 'POS3_INTEGRATION_HUB'
const VENUE_ID = 'venue_default'

function basePayload(providerId, extra = {}) {
  const provider = getPosProvider(providerId)
  return {
    source: SOURCE,
    providerId,
    providerName: provider?.name || providerId,
    venueId: VENUE_ID,
    timestamp: Date.now(),
    ...extra,
  }
}

/** Save (or update) a provider's credential config. Masks values when read back. */
export function saveIntegrationConfig(providerId, config) {
  const provider = getPosProvider(providerId)
  emit({
    sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
    eventType: 'POS_PROVIDER_SELECTED', commandType: 'POS_PROVIDER_SELECTED',
    provider: providerId, status: STATUS.COMPLETED,
    payload: basePayload(providerId),
  })

  const cfg = upsertConfig(providerId, {
    credentials: config,
    status: CONNECTION_STATES.NEEDS_CREDENTIALS,
  })

  emit({
    sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
    eventType: 'POS_PROVIDER_CREDENTIALS_SAVED', commandType: 'POS_PROVIDER_CREDENTIALS_SAVED',
    provider: providerId, status: STATUS.COMPLETED,
    payload: basePayload(providerId, { fieldCount: Object.keys(config || {}).length }),
  })

  return maskConfig(cfg)
}

/** Read back a provider's saved config, with credential values masked. */
export function getIntegrationConfig(providerId) {
  const cfg = getRawConfig(providerId)
  return maskConfig(cfg)
}

/**
 * testConnection — succeeds ONLY if all required credential fields are
 * filled in the saved config. Never performs a real network call.
 */
export function testConnection(providerId) {
  const provider = getPosProvider(providerId)
  const cfg = getRawConfig(providerId)
  const required = provider?.requiredCredentialFields || []
  const creds = cfg?.credentials || {}

  const missing = required.filter((f) => !creds[f.key] || String(creds[f.key]).trim() === '')

  let result
  if (missing.length > 0) {
    result = { success: false, error: 'missing-credentials', missingFields: missing.map((f) => f.key) }
    upsertConfig(providerId, { status: CONNECTION_STATES.NEEDS_CREDENTIALS })
  } else {
    result = { success: true }
    upsertConfig(providerId, { status: CONNECTION_STATES.CONNECTED })
  }

  emit({
    sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
    eventType: 'POS_PROVIDER_CONNECTION_TESTED', commandType: 'POS_PROVIDER_CONNECTION_TESTED',
    provider: providerId, status: result.success ? STATUS.COMPLETED : STATUS.FAILED,
    payload: basePayload(providerId, { status: result.success ? 'success' : 'missing-credentials', missingFields: result.missingFields || [] }),
  })

  return result
}

export function normalizeMenuItems(providerId, externalRecords) {
  const mapping = getFieldMappings().menu
  return (externalRecords || []).map((r) => applyMapping(r, {}, {
    externalId: 'id', name: 'name', price: 'price', category: 'category',
  })).map((r) => ({ ...r, providerId }))
}

export function normalizeOrders(providerId, externalRecords) {
  return (externalRecords || []).map((r) => applyMapping(r, {}, {
    externalId: 'id', total: 'total', items: 'items', status: 'status', createdAt: 'createdAt',
  })).map((r) => ({ ...r, providerId }))
}

export function normalizeInventory(providerId, externalRecords) {
  return (externalRecords || []).map((r) => applyMapping(r, {}, {
    sku: 'sku', name: 'name', quantity: 'quantityOnHand', parLevel: 'parLevel',
  })).map((r) => ({ ...r, providerId }))
}

export function normalizeStaff(providerId, externalRecords) {
  return (externalRecords || []).map((r) => applyMapping(r, {}, {
    externalId: 'id', name: 'name', role: 'role',
  })).map((r) => ({ ...r, providerId }))
}

const NORMALIZED_KEY_PREFIX = 'pos3:integrations:normalized:'

function saveNormalized(providerId, type, records) {
  try {
    localStorage.setItem(`${NORMALIZED_KEY_PREFIX}${providerId}:${type}`, JSON.stringify(records))
  } catch {}
}

/**
 * syncProvider — uses bundled sample adapter data (never real API calls),
 * normalizes it per syncOptions, persists to localStorage, and emits the
 * appropriate POS_EXTERNAL_*_IMPORTED events. Marks provider sync_active.
 */
export function syncProvider(providerId, syncOptions = { menu: true, orders: true, inventory: true, staff: true }) {
  emit({
    sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
    eventType: 'POS_PROVIDER_SYNC_STARTED', commandType: 'POS_PROVIDER_SYNC_STARTED',
    provider: providerId, status: STATUS.PENDING,
    payload: basePayload(providerId, { syncOptions }),
  })

  try {
    const types = Object.keys(syncOptions).filter((k) => syncOptions[k])
    const sample = getSampleData(providerId, types)
    const importedCounts = {}

    if (sample.menu) {
      const normalized = normalizeMenuItems(providerId, sample.menu)
      saveNormalized(providerId, 'menu', normalized)
      importedCounts.menu = normalized.length
      emit({
        sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
        eventType: 'POS_EXTERNAL_MENU_IMPORTED', commandType: 'POS_EXTERNAL_MENU_IMPORTED',
        provider: providerId, status: STATUS.COMPLETED,
        payload: basePayload(providerId, { count: normalized.length }),
      })
    }
    if (sample.orders) {
      const normalized = normalizeOrders(providerId, sample.orders)
      saveNormalized(providerId, 'orders', normalized)
      importedCounts.orders = normalized.length
      emit({
        sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
        eventType: 'POS_EXTERNAL_ORDERS_IMPORTED', commandType: 'POS_EXTERNAL_ORDERS_IMPORTED',
        provider: providerId, status: STATUS.COMPLETED,
        payload: basePayload(providerId, { count: normalized.length }),
      })
    }
    if (sample.inventory) {
      const normalized = normalizeInventory(providerId, sample.inventory)
      saveNormalized(providerId, 'inventory', normalized)
      importedCounts.inventory = normalized.length
      emit({
        sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
        eventType: 'POS_EXTERNAL_INVENTORY_IMPORTED', commandType: 'POS_EXTERNAL_INVENTORY_IMPORTED',
        provider: providerId, status: STATUS.COMPLETED,
        payload: basePayload(providerId, { count: normalized.length }),
      })
    }
    if (sample.staff) {
      const normalized = normalizeStaff(providerId, sample.staff)
      saveNormalized(providerId, 'staff', normalized)
      importedCounts.staff = normalized.length
      emit({
        sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
        eventType: 'POS_EXTERNAL_STAFF_IMPORTED', commandType: 'POS_EXTERNAL_STAFF_IMPORTED',
        provider: providerId, status: STATUS.COMPLETED,
        payload: basePayload(providerId, { count: normalized.length }),
      })
    }

    const cfg = upsertConfig(providerId, { status: CONNECTION_STATES.SYNC_ACTIVE, lastSyncAt: Date.now(), syncOptions })
    appendSyncHistory(providerId, { at: Date.now(), importedCounts, syncOptions })

    emit({
      sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
      eventType: 'POS_PROVIDER_SYNC_COMPLETED', commandType: 'POS_PROVIDER_SYNC_COMPLETED',
      provider: providerId, status: STATUS.COMPLETED,
      payload: basePayload(providerId, { syncOptions, status: 'sync_active', importedCounts }),
    })

    return { success: true, importedCounts, status: cfg.status }
  } catch (err) {
    emit({
      sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
      eventType: 'POS_PROVIDER_SYNC_FAILED', commandType: 'POS_PROVIDER_SYNC_FAILED',
      provider: providerId, status: STATUS.FAILED,
      payload: basePayload(providerId, { error: String(err?.message || err) }),
    })
    return { success: false, error: String(err?.message || err) }
  }
}

/** activateSync — tests connection, syncs, marks provider connected + healthy. */
export function activateSync(providerId, syncOptions) {
  const test = testConnection(providerId)
  if (!test.success) return { success: false, error: test.error, missingFields: test.missingFields }

  const sync = syncProvider(providerId, syncOptions)
  if (!sync.success) return sync

  emit({
    sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
    eventType: 'POS_PROVIDER_SYNC_ACTIVATED', commandType: 'POS_PROVIDER_SYNC_ACTIVATED',
    provider: providerId, status: STATUS.COMPLETED,
    payload: basePayload(providerId, { syncOptions, importedCounts: sync.importedCounts }),
  })
  emit({
    sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
    eventType: 'EAT_POS_PROVIDER_CONNECTED', commandType: 'EAT_POS_PROVIDER_CONNECTED',
    provider: providerId, status: STATUS.COMPLETED,
    payload: basePayload(providerId, { status: 'connected', importedCounts: sync.importedCounts }),
  })
  emit({
    sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
    eventType: 'EAT_POS_SYNC_HEALTH_UPDATED', commandType: 'EAT_POS_SYNC_HEALTH_UPDATED',
    provider: providerId, status: STATUS.COMPLETED,
    payload: basePayload(providerId, { health: 'healthy', lastSyncAt: Date.now(), importedCounts: sync.importedCounts }),
  })

  return { success: true, importedCounts: sync.importedCounts, status: CONNECTION_STATES.SYNC_ACTIVE }
}

/** pauseSync — marks provider connected (not actively syncing), emits POS_PROVIDER_SYNC_PAUSED. */
export function pauseSync(providerId) {
  upsertConfig(providerId, { status: CONNECTION_STATES.CONNECTED })
  emit({
    sourceSystem: SYSTEMS.POS3, targetSystem: SYSTEMS.EAT,
    eventType: 'POS_PROVIDER_SYNC_PAUSED', commandType: 'POS_PROVIDER_SYNC_PAUSED',
    provider: providerId, status: STATUS.COMPLETED,
    payload: basePayload(providerId, { status: 'connected' }),
  })
  return { success: true }
}

export function getSyncStatus(providerId) {
  const cfg = getRawConfig(providerId)
  return {
    status: cfg?.status || CONNECTION_STATES.NOT_CONNECTED,
    lastSyncAt: cfg?.lastSyncAt || null,
    syncOptions: cfg?.syncOptions || {},
  }
}

export function getSyncHistory(providerId) {
  const cfg = getRawConfig(providerId)
  return cfg?.syncHistory || []
}
