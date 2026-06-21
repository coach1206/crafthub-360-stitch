/**
 * POS 3 Field Mapping Service — applies field mappings to normalize sample
 * external records (from posProviderAdapters.js) into POS3 shapes.
 */

import { getDefaultFieldMappings } from '../../data/pos3/defaultFieldMappings.js'

export function getFieldMappings(overrides = {}) {
  const defaults = getDefaultFieldMappings()
  return {
    menu: { ...defaults.menu, ...(overrides.menu || {}) },
    orders: { ...defaults.orders, ...(overrides.orders || {}) },
    inventory: { ...defaults.inventory, ...(overrides.inventory || {}) },
    staff: { ...defaults.staff, ...(overrides.staff || {}) },
  }
}

export function applyMapping(record, mapping, fieldMap) {
  const out = {}
  Object.entries(fieldMap).forEach(([targetKey, sourceKey]) => {
    out[targetKey.replace(/Field$/, '')] = record[mapping[sourceKey] || sourceKey] ?? record[sourceKey]
  })
  return out
}
