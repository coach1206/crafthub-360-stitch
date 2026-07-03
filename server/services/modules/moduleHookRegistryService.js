/**
 * NOMPF — Module Hook Registry Service
 * Supports E.A.T., POS360, NCIE, checkout, staff, KDS, LOCC, EOCG, and audit hooks.
 */

import { getModuleById } from './moduleRegistryService.js'

export const SUPPORTED_HOOK_SYSTEMS = [
  'eat', 'pos360', 'ncie', 'checkout', 'staff', 'kds', 'locc', 'eocg', 'audit',
]

const _hookRegistry = new Map()

export function getModuleHooks(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { error: 'module_not_found', moduleId }
  return {
    moduleId,
    requiredHooks: m.requiredHooks ?? [],
    registeredHooks: _hookRegistry.get(moduleId) ?? [],
    supportedSystems: SUPPORTED_HOOK_SYSTEMS,
    status: 'hooks_ready',
    preview_only: true,
  }
}

export function registerModuleHooksPreview(moduleId, hooks) {
  _hookRegistry.set(moduleId, hooks ?? [])
  return { registered: true, status: 'hooks_registered_preview', moduleId, hooks, preview_only: true }
}

export function validateModuleHooks(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { valid: false, status: 'module_not_found' }
  return { valid: true, status: 'hooks_ready', moduleId, preview_only: true }
}

export function detectMissingHooks(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { missing: [], status: 'module_not_found' }
  const registered = _hookRegistry.get(moduleId) ?? []
  const missing = (m.requiredHooks ?? []).filter(h => !registered.includes(h))
  return { missing, status: missing.length ? 'hook_missing' : 'hooks_ready', moduleId, preview_only: true }
}

export function detectHookConflicts(moduleId) {
  return { conflicts: [], status: 'hooks_ready', moduleId, preview_only: true }
}

export function buildModuleHookRegistryReport(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { status: 'module_not_found', moduleId }
  return {
    moduleId,
    moduleName: m.moduleName,
    requiredHooks: m.requiredHooks ?? [],
    registeredHooks: _hookRegistry.get(moduleId) ?? [],
    supportedSystems: SUPPORTED_HOOK_SYSTEMS,
    status: 'hooks_ready',
    preview_only: true,
  }
}
