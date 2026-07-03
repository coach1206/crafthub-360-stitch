/**
 * NOMPF — Module Marketplace Draft Service
 * Prepares module listing drafts. not_live_marketplace — marketplace is not active.
 */

import { getModuleById, getRegisteredModules } from './moduleRegistryService.js'

function buildDraft(m) {
  return {
    listingId: `draft_${m.moduleId}`,
    moduleId: m.moduleId,
    moduleName: m.moduleName,
    category: m.moduleCategory,
    shortDescription: m.moduleDescription?.slice(0, 120) ?? '',
    longDescription: m.moduleDescription ?? '',
    pricingModel: m.pricingModel,
    targetBuyer: m.enterpriseEligible ? 'enterprise' : m.premiumEligible ? 'premium' : 'standard',
    coreOrAddon: m.coreOrAddon,
    dependencies: m.dependencies ?? [],
    demoRoute: `/demo/modules/${m.moduleSlug}`,
    installRequirements: m.requiredEnvVars ?? [],
    licenseRequirements: m.licenseRequirements ?? {},
    whiteLabelEligible: m.whiteLabelEligible,
    marketplaceStatus: 'not_live_marketplace',
    draftStatus: m.marketplaceEligible ? 'marketplace_draft_ready' : 'marketplace_draft_incomplete',
    preview_only: true,
    not_live_marketplace: true,
  }
}

export function buildModuleMarketplaceDraft(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { error: 'module_not_found', moduleId }
  return buildDraft(m)
}

export function getModuleMarketplaceDraft(moduleId) {
  return buildModuleMarketplaceDraft(moduleId)
}

export function getModuleMarketplaceDrafts() {
  return getRegisteredModules().filter(m => m.marketplaceEligible).map(buildDraft)
}

export function validateMarketplaceDraft(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { valid: false, status: 'module_not_found' }
  const issues = []
  if (!m.moduleDescription) issues.push('needs_description')
  if (!m.pricingModel) issues.push('needs_pricing')
  if (!m.marketplaceEligible) issues.push('not_marketplace_eligible')
  return {
    valid: issues.length === 0,
    status: issues.length === 0 ? 'marketplace_draft_ready' : 'marketplace_draft_incomplete',
    issues,
    not_live_marketplace: true,
    preview_only: true,
  }
}

export function buildMarketplaceDraftReadinessReport() {
  const all = getRegisteredModules()
  const eligible = all.filter(m => m.marketplaceEligible)
  return {
    totalModules: all.length,
    marketplaceEligible: eligible.length,
    drafts: eligible.map(m => ({ moduleId: m.moduleId, status: 'marketplace_draft_ready' })),
    marketplaceStatus: 'not_live_marketplace',
    live_marketplace: false,
    marketplace_not_live: true,
    listing_drafts_only: true,
    preview_only: true,
    note: 'not_live_marketplace — listing_drafts_only — marketplace_not_live',
  }
}
