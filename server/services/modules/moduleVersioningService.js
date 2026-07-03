/**
 * NOMPF — Module Versioning and Upgrade Service
 */

import { getModuleById } from './moduleRegistryService.js'

function parseSemver(v) {
  const [major = 0, minor = 0, patch = 0] = (v || '0.0.0').split('.').map(Number)
  return { major, minor, patch }
}

export function getModuleVersion(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { error: 'module_not_found', moduleId }
  return { moduleId, version: m.moduleVersion ?? '0.0.0', status: 'version_current' }
}

export function compareModuleVersions(v1, v2) {
  const a = parseSemver(v1)
  const b = parseSemver(v2)
  if (a.major !== b.major) return a.major > b.major ? 1 : -1
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1
  return 0
}

export function getAvailableModuleUpgrades(moduleId) {
  return { moduleId, upgrades: [], status: 'upgrade_preview_ready', preview_only: true }
}

export function validateUpgradePath(moduleId, targetVersion) {
  const m = getModuleById(moduleId)
  if (!m) return { valid: false, status: 'module_not_found' }
  return { valid: true, status: 'upgrade_preview_ready', moduleId, targetVersion, preview_only: true }
}

export function validateRollbackPath(moduleId, targetVersion) {
  const m = getModuleById(moduleId)
  if (!m) return { valid: false, status: 'module_not_found' }
  return { valid: true, status: 'rollback_preview_ready', moduleId, targetVersion, preview_only: true }
}

export function buildUpgradePlanPreview(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { status: 'module_not_found', moduleId }
  return {
    moduleId,
    currentVersion: m.moduleVersion ?? '0.0.0',
    plan: [],
    status: 'upgrade_preview_ready',
    preview_only: true,
    note: 'Upgrade plan preview — no upgrade has been executed.',
  }
}

export function buildRollbackPlanPreview(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { status: 'module_not_found', moduleId }
  return {
    moduleId,
    currentVersion: m.moduleVersion ?? '0.0.0',
    plan: [],
    status: 'rollback_preview_ready',
    preview_only: true,
    note: 'Rollback plan preview — no rollback has been executed.',
  }
}

export function buildVersionReadinessReport(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { status: 'module_not_found', moduleId }
  return {
    moduleId,
    moduleName: m.moduleName,
    version: m.moduleVersion ?? '0.0.0',
    versionStatus: 'version_current',
    upgradeStatus: 'upgrade_preview_ready',
    rollbackStatus: 'rollback_preview_ready',
    preview_only: true,
  }
}
