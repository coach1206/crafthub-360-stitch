/**
 * NOMPF — Module Activation Service
 * Preview-only activation state model. Does not physically install code.
 */

import { getModuleById } from './moduleRegistryService.js'
import { validateModuleDependencies } from './moduleDependencyService.js'

const _activationState = new Map()

function getState(moduleId) {
  return _activationState.get(moduleId) ?? { status: 'deactivated_preview', venueStates: {}, tenantStates: {} }
}

export function getModuleActivationStatus(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { status: 'module_not_found', moduleId }
  return { moduleId, moduleName: m.moduleName, ...getState(moduleId), preview_only: true }
}

export function activateModulePreview(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { success: false, status: 'module_not_found', moduleId }
  const dep = validateModuleDependencies(moduleId)
  if (!dep.valid) return { success: false, status: 'dependency_blocked', missing: dep.missing }
  _activationState.set(moduleId, { ...getState(moduleId), status: 'activated_preview' })
  return { success: true, status: 'activated_preview', moduleId, preview_only: true }
}

export function deactivateModulePreview(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { success: false, status: 'module_not_found', moduleId }
  _activationState.set(moduleId, { ...getState(moduleId), status: 'deactivated_preview' })
  return { success: true, status: 'deactivated_preview', moduleId, preview_only: true }
}

export function enableModuleForVenuePreview(moduleId, venueId) {
  const state = getState(moduleId)
  state.venueStates[venueId] = 'enabled_for_venue_preview'
  _activationState.set(moduleId, state)
  return { success: true, status: 'enabled_for_venue_preview', moduleId, venueId, preview_only: true }
}

export function disableModuleForVenuePreview(moduleId, venueId) {
  const state = getState(moduleId)
  state.venueStates[venueId] = 'disabled_for_venue_preview'
  _activationState.set(moduleId, state)
  return { success: true, status: 'disabled_for_venue_preview', moduleId, venueId, preview_only: true }
}

export function enableModuleForTenantPreview(moduleId, tenantId) {
  const state = getState(moduleId)
  state.tenantStates[tenantId] = 'enabled_for_tenant_preview'
  _activationState.set(moduleId, state)
  return { success: true, status: 'enabled_for_tenant_preview', moduleId, tenantId, preview_only: true }
}

export function disableModuleForTenantPreview(moduleId, tenantId) {
  const state = getState(moduleId)
  state.tenantStates[tenantId] = 'disabled_for_tenant_preview'
  _activationState.set(moduleId, state)
  return { success: true, status: 'disabled_for_tenant_preview', moduleId, tenantId, preview_only: true }
}

export function validateActivationRequirements(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { valid: false, status: 'module_not_found' }
  const dep = validateModuleDependencies(moduleId)
  if (!dep.valid) return { valid: false, status: 'dependency_blocked', missing: dep.missing }
  if (m.requiredEnvVars?.length > 0) {
    const missingEnv = m.requiredEnvVars.filter(k => !process.env[k])
    if (missingEnv.length > 0) return { valid: false, status: 'database_required', missingEnv }
  }
  return { valid: true, status: 'activation_ready' }
}

export function validateDeactivationSafety(moduleId) {
  return { safe: true, status: 'deactivation_safe', moduleId, preview_only: true }
}

export function buildActivationReadinessReport(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { status: 'module_not_found', moduleId }
  const req = validateActivationRequirements(moduleId)
  const state = getState(moduleId)
  return {
    moduleId,
    moduleName: m.moduleName,
    activationStatus: state.status,
    requirementsValid: req.valid,
    requirementsStatus: req.status,
    missingEnv: req.missingEnv ?? [],
    preview_only: true,
    database_required: !process.env.DATABASE_URL,
    degradedMode: !process.env.DATABASE_URL,
    note: 'Activation is preview-only in this phase. No code is physically installed.',
  }
}
