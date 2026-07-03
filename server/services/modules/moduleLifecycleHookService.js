/**
 * NOMPF — Module Lifecycle Hook Service
 * Preview-only install/uninstall/enable/disable/upgrade/rollback hooks.
 */

import { getModuleById } from './moduleRegistryService.js'

function buildHookEntry(type, moduleId, m) {
  return {
    hookType: type,
    moduleId,
    moduleName: m?.moduleName ?? moduleId,
    status: `${type}_preview_ready`,
    preview_only: true,
    destructive: false,
    note: `${type} is preview-only in Module Build 1. No changes are applied.`,
  }
}

export function getModuleInstallHooks(moduleId) {
  const m = getModuleById(moduleId)
  return buildHookEntry('install', moduleId, m)
}

export function getModuleUninstallHooks(moduleId) {
  const m = getModuleById(moduleId)
  return buildHookEntry('uninstall', moduleId, m)
}

export function getModuleEnableHooks(moduleId) {
  const m = getModuleById(moduleId)
  return buildHookEntry('enable', moduleId, m)
}

export function getModuleDisableHooks(moduleId) {
  const m = getModuleById(moduleId)
  return buildHookEntry('disable', moduleId, m)
}

export function getModuleUpgradeHooks(moduleId) {
  const m = getModuleById(moduleId)
  return buildHookEntry('upgrade', moduleId, m)
}

export function getModuleRollbackHooks(moduleId) {
  const m = getModuleById(moduleId)
  return buildHookEntry('rollback', moduleId, m)
}

export function validateInstallHooks(moduleId) {
  return { valid: true, status: 'install_preview_ready', moduleId, preview_only: true }
}

export function validateUninstallHooks(moduleId) {
  return { valid: true, status: 'uninstall_preview_ready', moduleId, preview_only: true }
}

export function runInstallHooksPreview(moduleId) {
  return { ran: true, status: 'install_preview_ready', moduleId, preview_only: true, changed: false }
}

export function runUninstallHooksPreview(moduleId) {
  return { ran: true, status: 'uninstall_preview_ready', moduleId, preview_only: true, changed: false }
}

export function runEnableHooksPreview(moduleId) {
  return { ran: true, status: 'enable_preview_ready', moduleId, preview_only: true, changed: false }
}

export function runDisableHooksPreview(moduleId) {
  return { ran: true, status: 'disable_preview_ready', moduleId, preview_only: true, changed: false }
}

export function buildLifecycleHookReadinessReport(moduleId) {
  const m = getModuleById(moduleId)
  return {
    moduleId,
    moduleName: m?.moduleName ?? moduleId,
    hooks: {
      install:   'install_preview_ready',
      uninstall: 'uninstall_preview_ready',
      enable:    'enable_preview_ready',
      disable:   'disable_preview_ready',
      upgrade:   'upgrade_preview_ready',
      rollback:  'rollback_preview_ready',
    },
    preview_only: true,
    destructive: false,
    note: 'All lifecycle hooks are preview-only in Module Build 1.',
  }
}
