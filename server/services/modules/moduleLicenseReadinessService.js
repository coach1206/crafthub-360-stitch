/**
 * NOMPF — Module License Readiness Service
 * Prepares license requirements. Does not enforce license gates yet.
 */

import { getModuleById, getRegisteredModules } from './moduleRegistryService.js'

const LICENSE_TIERS = ['none', 'standard', 'premium', 'enterprise', 'white_label', 'reseller']

function deriveLicenseTier(m) {
  if (m.pricingModel === 'white_label_license') return 'white_label'
  if (m.pricingModel === 'reseller_license') return 'reseller'
  if (m.enterpriseEligible) return 'enterprise'
  if (m.premiumEligible) return 'premium'
  return 'standard'
}

export function getModuleLicenseRequirements(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { error: 'module_not_found', moduleId }
  return {
    moduleId,
    moduleName: m.moduleName,
    licenseRequirements: m.licenseRequirements ?? { tier: 'none', enforced: false },
    licenseTier: deriveLicenseTier(m),
    enforced: false,
    license_not_enforced: true,
    preview_only: true,
  }
}

export function validateModuleLicenseReadiness(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { valid: false, status: 'module_not_found' }
  return {
    valid: true,
    status: 'license_ready_draft',
    moduleId,
    tier: deriveLicenseTier(m),
    enforced: false,
    license_not_enforced: true,
    preview_only: true,
  }
}

export function getLicenseTierForModule(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return null
  return deriveLicenseTier(m)
}

export function getAddonLicenseRequirements() {
  return getRegisteredModules()
    .filter(m => m.coreOrAddon === 'addon')
    .map(m => ({
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      tier: deriveLicenseTier(m),
      status: 'license_ready_draft',
      enforced: false,
    }))
}

export function getWhiteLabelLicenseRequirements() {
  return getRegisteredModules()
    .filter(m => m.whiteLabelEligible)
    .map(m => ({
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      whiteLabelEligible: true,
      status: 'white_label_license_required',
      enforced: false,
    }))
}

export function buildModuleLicenseReadinessReport() {
  const all = getRegisteredModules()
  return {
    licenseTiers: LICENSE_TIERS,
    totalModules: all.length,
    byTier: Object.fromEntries(
      LICENSE_TIERS.map(t => [t, all.filter(m => deriveLicenseTier(m) === t).length])
    ),
    licenseGateBuilt: false,
    license_gate_required: true,
    license_not_enforced: true,
    preview_only: true,
    note: 'License requirements are prepared but not enforced in Module Build 1.',
  }
}
