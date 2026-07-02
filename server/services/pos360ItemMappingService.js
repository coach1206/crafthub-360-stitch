/**
 * POS360 Item Mapping Service
 *
 * Maps SmokeCraft menu items to provider-specific item IDs.
 * Uses in-memory store when DB is unavailable.
 * manual_pos360 bypasses mapping requirements entirely.
 */

import crypto from 'crypto';

// In-memory mapping store: { venueId: { providerName: [ mappingObject ] } }
const mappingStore = {};

function generateMappingId() {
  return `map_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function getVenueProviderMappings(venueId, providerName) {
  if (!mappingStore[venueId]) mappingStore[venueId] = {};
  if (!mappingStore[venueId][providerName]) mappingStore[venueId][providerName] = [];
  return mappingStore[venueId][providerName];
}

/**
 * Get all item mappings for a venue + provider.
 * @param {string} venueId
 * @param {string} providerName
 */
export async function getItemMappings(venueId, providerName) {
  if (!venueId) return { status: 'tenant_guard_active', error: 'venueId required' };

  const mappings = getVenueProviderMappings(venueId, providerName);
  return {
    status: 'audit_logged',
    venueId,
    providerName,
    storageMode: 'memory_fallback',
    mappings,
    count: mappings.length,
  };
}

/**
 * Get the provider mapping for a specific SmokeCraft item.
 * @param {string} venueId
 * @param {string} providerName
 * @param {string} smokeCraftItemId
 */
export async function getMappingForSmokeCraftItem(venueId, providerName, smokeCraftItemId) {
  if (!venueId) return { status: 'tenant_guard_active', error: 'venueId required' };

  const mappings = getVenueProviderMappings(venueId, providerName);
  const mapping = mappings.find((m) => m.smokeCraftItemId === smokeCraftItemId);

  if (!mapping) {
    return {
      status: 'mapping_required',
      venueId,
      providerName,
      smokeCraftItemId,
      message: `No mapping found for item ${smokeCraftItemId} in provider ${providerName}.`,
    };
  }

  return {
    status: 'audit_logged',
    venueId,
    providerName,
    mapping,
  };
}

/**
 * Create a new item mapping.
 * @param {object} mappingPayload
 * @param {string} mappingPayload.venueId
 * @param {string} mappingPayload.providerName
 * @param {string} mappingPayload.smokeCraftItemId
 * @param {string} mappingPayload.providerItemId
 * @param {string} [mappingPayload.smokeCraftItemName]
 * @param {string} [mappingPayload.providerItemName]
 */
export async function createItemMapping(mappingPayload) {
  const { venueId, providerName, smokeCraftItemId, providerItemId } = mappingPayload || {};

  if (!venueId) return { status: 'tenant_guard_active', error: 'venueId required' };
  if (!providerName || !smokeCraftItemId || !providerItemId) {
    return {
      status: 'mapping_required',
      error: 'providerName, smokeCraftItemId, and providerItemId are required.',
    };
  }

  const mappings = getVenueProviderMappings(venueId, providerName);

  // Check for duplicate
  const existing = mappings.find((m) => m.smokeCraftItemId === smokeCraftItemId);
  if (existing) {
    return {
      status: 'idempotency_conflict',
      venueId,
      providerName,
      smokeCraftItemId,
      existingMappingId: existing.mappingId,
      message: `Mapping already exists for item ${smokeCraftItemId}. Use updateItemMapping to modify.`,
    };
  }

  const newMapping = {
    mappingId: generateMappingId(),
    venueId,
    providerName,
    smokeCraftItemId,
    providerItemId,
    smokeCraftItemName: mappingPayload.smokeCraftItemName || null,
    providerItemName: mappingPayload.providerItemName || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    storageMode: 'memory_fallback',
  };

  mappings.push(newMapping);

  return {
    status: 'audit_logged',
    storageMode: 'memory_fallback',
    mapping: newMapping,
  };
}

/**
 * Update an existing item mapping.
 * @param {string} mappingId
 * @param {object} updatePayload
 */
export async function updateItemMapping(mappingId, updatePayload) {
  if (!mappingId) {
    return { status: 'mapping_required', error: 'mappingId required' };
  }

  // Search across all venues and providers
  for (const venueId of Object.keys(mappingStore)) {
    for (const providerName of Object.keys(mappingStore[venueId])) {
      const mappings = mappingStore[venueId][providerName];
      const idx = mappings.findIndex((m) => m.mappingId === mappingId);
      if (idx !== -1) {
        const updated = {
          ...mappings[idx],
          ...updatePayload,
          mappingId, // preserve original ID
          updatedAt: new Date().toISOString(),
        };
        mappings[idx] = updated;
        return {
          status: 'audit_logged',
          storageMode: 'memory_fallback',
          mapping: updated,
        };
      }
    }
  }

  return {
    status: 'mapping_required',
    mappingId,
    message: `Mapping ${mappingId} not found.`,
  };
}

/**
 * Validate that all items in an orderPayload have mappings for the provider.
 * manual_pos360 always returns valid.
 * @param {string} venueId
 * @param {string} providerName
 * @param {object} orderPayload
 */
export async function validateOrderMappings(venueId, providerName, orderPayload) {
  if (!venueId) return { status: 'tenant_guard_active', error: 'venueId required' };

  // Manual provider bypasses mapping requirement
  if (providerName === 'manual_pos360') {
    return {
      valid: true,
      bypass: 'manual_pos360',
      message: 'Manual POS360 does not require item mappings.',
    };
  }

  const items = (orderPayload && orderPayload.items) || [];
  if (items.length === 0) {
    return {
      valid: false,
      status: 'mapping_required',
      unmappedItems: [],
      message: 'Order has no items.',
    };
  }

  const mappings = getVenueProviderMappings(venueId, providerName);
  const mappedIds = new Set(mappings.map((m) => m.smokeCraftItemId));

  const unmappedItems = items
    .filter((item) => {
      const id = item.itemId || item.id || item.smokeCraftItemId;
      return !id || !mappedIds.has(id);
    })
    .map((item) => ({
      itemId: item.itemId || item.id || item.smokeCraftItemId || null,
      name: item.name || item.itemName || 'Unknown',
    }));

  if (unmappedItems.length > 0) {
    return {
      valid: false,
      status: 'mapping_required',
      venueId,
      providerName,
      unmappedItems,
      message: `${unmappedItems.length} item(s) have no mapping for provider ${providerName}.`,
    };
  }

  return {
    valid: true,
    venueId,
    providerName,
    message: 'All items have mappings.',
  };
}

/**
 * Return items that have no mapping for the given provider.
 * @param {string} venueId
 * @param {string} providerName
 */
export async function getUnmappedItems(venueId, providerName) {
  if (!venueId) return { status: 'tenant_guard_active', error: 'venueId required' };

  const mappings = getVenueProviderMappings(venueId, providerName);
  return {
    status: 'audit_logged',
    venueId,
    providerName,
    storageMode: 'memory_fallback',
    mappedCount: mappings.length,
    message: 'Unmapped item detection requires SmokeCraft item catalog. Integrate catalog lookup to use this fully.',
    unmappedItems: [], // Would require SmokeCraft catalog access to enumerate
  };
}

/**
 * Detect possible mapping conflicts (duplicate provider item IDs across SmokeCraft items).
 * @param {string} venueId
 * @param {string} providerName
 */
export async function detectPossibleMappingConflicts(venueId, providerName) {
  if (!venueId) return { status: 'tenant_guard_active', error: 'venueId required' };

  const mappings = getVenueProviderMappings(venueId, providerName);

  // Find providerItemIds used more than once
  const providerIdCounts = {};
  for (const m of mappings) {
    providerIdCounts[m.providerItemId] = (providerIdCounts[m.providerItemId] || 0) + 1;
  }

  const conflicts = mappings.filter((m) => providerIdCounts[m.providerItemId] > 1);

  return {
    status: conflicts.length > 0 ? 'retry_required' : 'audit_logged',
    venueId,
    providerName,
    conflicts,
    conflictCount: conflicts.length,
    message:
      conflicts.length > 0
        ? `${conflicts.length} mapping conflict(s) detected — multiple SmokeCraft items map to the same provider item.`
        : 'No mapping conflicts detected.',
  };
}
