/**
 * NOMPF — Module Dependency Service
 */

import { getModuleById, getRegisteredModules } from './moduleRegistryService.js'

export function getModuleDependencies(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { error: 'module_not_found', moduleId }
  return { moduleId, dependencies: m.dependencies ?? [], optionalDependencies: m.optionalDependencies ?? [] }
}

export function getOptionalDependencies(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { error: 'module_not_found', moduleId }
  return { moduleId, optionalDependencies: m.optionalDependencies ?? [] }
}

export function getIncompatibleModules(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { error: 'module_not_found', moduleId }
  return { moduleId, incompatibleModules: m.incompatibleModules ?? [] }
}

export function validateModuleDependencies(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { valid: false, status: 'module_not_found', moduleId }
  const all = getRegisteredModules()
  const registeredIds = new Set(all.map(r => r.moduleId))
  const missing = (m.dependencies ?? []).filter(d => !registeredIds.has(d))
  if (missing.length > 0) {
    return { valid: false, status: 'missing_dependency', moduleId, missing }
  }
  return { valid: true, status: 'dependencies_ready', moduleId }
}

export function detectMissingDependencies(moduleId) {
  const result = validateModuleDependencies(moduleId)
  return result.missing ?? []
}

export function detectDependencyConflicts(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return []
  const all = getRegisteredModules()
  const enabledIds = new Set(all.filter(r => r.moduleStatus === 'enabled').map(r => r.moduleId))
  return (m.incompatibleModules ?? []).filter(id => enabledIds.has(id))
}

export function detectCircularDependencies(moduleId, visited = new Set()) {
  if (visited.has(moduleId)) return [moduleId]
  visited.add(moduleId)
  const m = getModuleById(moduleId)
  if (!m) return []
  for (const dep of (m.dependencies ?? [])) {
    const cycle = detectCircularDependencies(dep, new Set(visited))
    if (cycle.length > 0) return [moduleId, ...cycle]
  }
  return []
}

export function buildDependencyReadinessReport(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { status: 'module_not_found', moduleId }
  const validation = validateModuleDependencies(moduleId)
  const conflicts = detectDependencyConflicts(moduleId)
  const circular = detectCircularDependencies(moduleId)
  const ready = validation.valid && conflicts.length === 0 && circular.length === 0
  return {
    moduleId,
    moduleName: m.moduleName,
    status: ready ? 'dependencies_ready' : 'dependency_blocked',
    valid: ready,
    dependencies: m.dependencies ?? [],
    optionalDependencies: m.optionalDependencies ?? [],
    incompatibleModules: m.incompatibleModules ?? [],
    missingDependencies: validation.missing ?? [],
    conflictingModules: conflicts,
    circularDependencies: circular,
    degradedMode: !process.env.DATABASE_URL,
    preview_only: true,
    dependency_preview_only: true,
  }
}

export function buildDependencyBlockedResponse(moduleId, reason) {
  return {
    status: 'dependency_blocked',
    moduleId,
    reason: reason ?? 'dependency_check_failed',
    preview_only: true,
    canInstall: false,
  }
}
