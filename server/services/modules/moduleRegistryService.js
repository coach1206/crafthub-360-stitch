/**
 * NOMPF — Module Registry Service
 * Central in-memory registry for module manifests.
 * Operates in degraded/preview mode when DATABASE_URL is not configured.
 */

import { validateManifestShape } from './moduleManifestSchema.js'
import { getInitialModuleManifests } from './initialModuleManifests.js'

const dbAvailable = () => !!process.env.DATABASE_URL

const _registry = new Map()

function seedRegistry() {
  if (_registry.size === 0) {
    for (const m of getInitialModuleManifests()) {
      _registry.set(m.moduleId, m)
    }
  }
}

export function registerModuleManifest(manifest) {
  seedRegistry()
  const validation = validateManifestShape(manifest)
  if (!validation.valid) {
    return { registered: false, error: validation.error, missing: validation.missing }
  }
  _registry.set(manifest.moduleId, { ...manifest, updatedAt: new Date().toISOString() })
  return {
    registered: true,
    moduleId: manifest.moduleId,
    persistenceMode: dbAvailable() ? 'database' : 'in_memory_only',
    degradedMode: !dbAvailable(),
    note: dbAvailable() ? 'registered' : 'module_registry_in_memory_only',
  }
}

export function getRegisteredModules() {
  seedRegistry()
  return Array.from(_registry.values())
}

export function getModuleById(moduleId) {
  seedRegistry()
  return _registry.get(moduleId) ?? null
}

export function getModuleBySlug(slug) {
  seedRegistry()
  return Array.from(_registry.values()).find(m => m.moduleSlug === slug) ?? null
}

export function getModulesByType(type) {
  seedRegistry()
  return Array.from(_registry.values()).filter(m => m.moduleType === type)
}

export function getCoreModules() {
  return getModulesByType('core_platform')
}

export function getAddonModules() {
  seedRegistry()
  return Array.from(_registry.values()).filter(m => m.coreOrAddon === 'addon')
}

export function getPremiumModules() {
  seedRegistry()
  return Array.from(_registry.values()).filter(m => m.premiumEligible)
}

export function getEnterpriseModules() {
  seedRegistry()
  return Array.from(_registry.values()).filter(m => m.enterpriseEligible)
}

export function getMarketplaceEligibleModules() {
  seedRegistry()
  return Array.from(_registry.values()).filter(m => m.marketplaceEligible)
}

export function getWhiteLabelEligibleModules() {
  seedRegistry()
  return Array.from(_registry.values()).filter(m => m.whiteLabelEligible)
}

export function validateModuleManifest(manifest) {
  return validateManifestShape(manifest)
}

export function validateModuleRegistration(moduleId) {
  seedRegistry()
  const m = _registry.get(moduleId)
  if (!m) return { valid: false, error: 'module_not_found', moduleId }
  return { valid: true, moduleId, moduleStatus: m.moduleStatus }
}

export function buildModuleRegistryReport() {
  seedRegistry()
  const all = Array.from(_registry.values())
  return {
    engine: 'NOMPF',
    registryStatus: 'module_registry_active',
    persistenceMode: dbAvailable() ? 'database' : 'in_memory_only',
    degradedMode: !dbAvailable(),
    database_required: !dbAvailable(),
    totalModules: all.length,
    byType: Object.fromEntries(
      ['core_platform','experience_module','commerce_module','management_module',
       'inventory_module','connector_module','intelligence_module','operations_module',
       'marketplace_module','licensing_module','addon_module']
        .map(t => [t, all.filter(m => m.moduleType === t).length])
    ),
    byStatus: Object.fromEntries(
      ['not_yet_packaged','manifest_ready','registered','installed','enabled','disabled',
       'marketplace_draft','white_label_ready']
        .map(s => [s, all.filter(m => m.moduleStatus === s).length])
    ),
    marketplaceNotLive: true,
    licenseNotEnforced: true,
    modulesNotPackaged: all.filter(m => m.moduleStatus === 'not_yet_packaged').map(m => m.moduleSlug),
    note: 'NOMPF registry foundation. Modules are not yet packaged for install.',
  }
}
