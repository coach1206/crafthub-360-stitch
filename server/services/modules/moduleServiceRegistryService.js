/**
 * NOMPF — Module Service Registry Service
 */

import { getModuleById } from './moduleRegistryService.js'

const _serviceRegistry = new Map()

export function getModuleServices(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { error: 'module_not_found', moduleId }
  return {
    moduleId,
    requiredServices: m.requiredServices ?? [],
    registeredServices: _serviceRegistry.get(moduleId) ?? [],
    status: 'services_ready',
    preview_only: true,
  }
}

export function registerModuleServicesPreview(moduleId, services) {
  _serviceRegistry.set(moduleId, services ?? [])
  return { registered: true, status: 'services_registered_preview', moduleId, services, preview_only: true }
}

export function validateModuleServices(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { valid: false, status: 'module_not_found' }
  return { valid: true, status: 'services_ready', moduleId, preview_only: true }
}

export function detectMissingServices(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { missing: [], status: 'module_not_found' }
  const registered = _serviceRegistry.get(moduleId) ?? []
  const missing = (m.requiredServices ?? []).filter(s => !registered.includes(s))
  return { missing, status: missing.length ? 'service_missing' : 'services_ready', moduleId, preview_only: true }
}

export function detectServiceConflicts(moduleId) {
  return { conflicts: [], status: 'services_ready', moduleId, preview_only: true }
}

export function buildModuleServiceRegistryReport(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { status: 'module_not_found', moduleId }
  return {
    moduleId,
    moduleName: m.moduleName,
    requiredServices: m.requiredServices ?? [],
    registeredServices: _serviceRegistry.get(moduleId) ?? [],
    status: 'services_ready',
    preview_only: true,
  }
}
