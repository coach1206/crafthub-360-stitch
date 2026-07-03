/**
 * NOMPF — Module UI Component Registry Service
 */

import { getModuleById } from './moduleRegistryService.js'

const _componentRegistry = new Map()

export function getModuleComponents(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { error: 'module_not_found', moduleId }
  return {
    moduleId,
    requiredComponents: m.requiredComponents ?? [],
    registeredComponents: _componentRegistry.get(moduleId) ?? [],
    status: 'components_ready',
    preview_only: true,
  }
}

export function registerModuleComponentsPreview(moduleId, components) {
  _componentRegistry.set(moduleId, components ?? [])
  return { registered: true, status: 'components_registered_preview', moduleId, components, preview_only: true }
}

export function validateModuleComponents(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { valid: false, status: 'module_not_found' }
  return { valid: true, status: 'components_ready', moduleId, preview_only: true }
}

export function detectMissingComponents(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { missing: [], status: 'module_not_found' }
  const registered = _componentRegistry.get(moduleId) ?? []
  const missing = (m.requiredComponents ?? []).filter(c => !registered.includes(c))
  return { missing, status: missing.length ? 'component_missing' : 'components_ready', moduleId, preview_only: true }
}

export function detectComponentConflicts(moduleId) {
  return { conflicts: [], status: 'components_ready', moduleId, preview_only: true }
}

export function buildModuleComponentRegistryReport(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { status: 'module_not_found', moduleId }
  return {
    moduleId,
    moduleName: m.moduleName,
    requiredComponents: m.requiredComponents ?? [],
    registeredComponents: _componentRegistry.get(moduleId) ?? [],
    status: 'components_ready',
    preview_only: true,
  }
}
