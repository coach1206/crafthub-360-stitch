/**
 * NOMPF — Module Route Registry Service
 */

import { getModuleById } from './moduleRegistryService.js'

const _routeRegistry = new Map()

export function getModuleRoutes(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { error: 'module_not_found', moduleId }
  return {
    moduleId,
    moduleName: m.moduleName,
    requiredRoutes: m.requiredRoutes ?? [],
    registeredRoutes: _routeRegistry.get(moduleId) ?? [],
    status: 'routes_ready',
    preview_only: true,
  }
}

export function registerModuleRoutesPreview(moduleId, routes) {
  _routeRegistry.set(moduleId, routes ?? [])
  return { registered: true, status: 'routes_registered_preview', moduleId, routes, preview_only: true }
}

export function validateModuleRoutes(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { valid: false, status: 'module_not_found' }
  return { valid: true, status: 'routes_ready', moduleId, preview_only: true }
}

export function detectRouteConflicts(moduleId) {
  return { conflicts: [], status: 'routes_ready', moduleId, preview_only: true }
}

export function detectMissingRoutes(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { missing: [], status: 'module_not_found' }
  const registered = _routeRegistry.get(moduleId) ?? []
  const missing = (m.requiredRoutes ?? []).filter(r => !registered.includes(r))
  return { missing, status: missing.length ? 'route_missing' : 'routes_ready', moduleId, preview_only: true }
}

export function buildModuleRouteRegistryReport(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { status: 'module_not_found', moduleId }
  return {
    moduleId,
    moduleName: m.moduleName,
    requiredRoutes: m.requiredRoutes ?? [],
    registeredRoutes: _routeRegistry.get(moduleId) ?? [],
    status: 'routes_ready',
    preview_only: true,
    note: 'Route registry is preview-only. Existing routes are not remounted.',
  }
}
