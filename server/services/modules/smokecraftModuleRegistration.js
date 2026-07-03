/**
 * SmokeCraft Experience Module — NOVEE OS Server-Side Registration
 * Module Build 2 of 9
 *
 * Registers the SmokeCraft module into the NOMPF registry created in Module Build 1.
 * Updates the initial manifest from not_yet_packaged to active_development.
 */

import { createModuleManifest } from './moduleManifestSchema.js'
import { registerModuleManifest, getModuleById } from './moduleRegistryService.js'
import { buildSmokeCraftRouteRegistryReport } from '../../../src/modules/smokecraft/data/smokecraftRouteContract.js'

const SMOKECRAFT_MANIFEST = createModuleManifest({
  moduleId: 'smokecraft-experience',
  moduleName: 'SmokeCraft Experience Module',
  moduleSlug: 'smokecraft-experience',
  moduleType: 'experience_module',
  moduleCategory: 'venue_experience',
  moduleDescription:
    'SmokeCraft guided cigar experience — 8-visit / 24-session progression. ' +
    'Covers the full 17-step journey from entry to session complete.',
  moduleVersion: '0.1.0',
  moduleStatus: 'active_development',
  coreOrAddon: 'core',
  premiumEligible: true,
  enterpriseEligible: true,
  whiteLabelEligible: false,
  marketplaceEligible: false,
  pricingModel: 'per_venue',

  dependencies: ['nompf-core'],
  optionalDependencies: ['pos360', 'eat-system', 'loyalty-engine', 'analytics-engine'],
  requiredServices: [
    'smokecraftJourneyService',
    'smokecraftProgressService',
    'smokecraftPairingService',
    'smokecraftOrderingService',
    'smokecraftMenuService',
    'smokecraftManagementSyncService',
    'passportProgressService',
  ],
  requiredComponents: [
    'SmokeCraftAssetScreen',
    'SmokeCraftHotspotLayer',
    'SmokeCraftAssetRoute',
  ],
  requiredRoutes: [
    '/smokecraft',
    '/smokecraft/humidor-match',
    '/smokecraft/request-purchase',
    '/smokecraft/first-third',
    '/smokecraft/second-third',
    '/smokecraft/flavor-memory',
    '/smokecraft/final-third',
    '/smokecraft/scorecard',
    '/smokecraft/passport-stamp',
    '/smokecraft/connections',
    '/smokecraft/management-sync',
    '/smokecraft/session-complete',
  ],
  requiredHooks: [
    'smokeCraft.session.started',
    'smokeCraft.session.completed',
    'smokeCraft.passportStamp.earned',
    'smokeCraft.scorecard.completed',
    'smokeCraft.order.requested',
  ],
  requiredEnvVars: [],
  requiredMigrations: [],

  installHooks: ['smokecraft.install.preview'],
  uninstallHooks: ['smokecraft.uninstall.preview'],
  enableHooks: ['smokecraft.enable.preview'],
  disableHooks: ['smokecraft.disable.preview'],
  upgradeHooks: ['smokecraft.upgrade.preview'],
  rollbackHooks: ['smokecraft.rollback.preview'],

  licenseRequirements: { tier: 'premium', enforced: false },

  module_packaging_status: 'registered_preview',
  physical_package_status: 'not_yet_packaged',
  marketplace_status: 'not_live_marketplace',
  license_status: 'license_not_enforced',
  lifecycle_status: 'preview_only',
  preview_only: true,
})

let _registered = false

/**
 * Registers or updates the SmokeCraft manifest in the NOMPF registry.
 * Safe to call multiple times — idempotent.
 */
export function registerSmokeCraftModule() {
  if (_registered) return { status: 'already_registered', moduleId: 'smokecraft-experience' }
  const result = registerModuleManifest(SMOKECRAFT_MANIFEST)
  _registered = true
  return result
}

export function getSmokeCraftModuleRegistration() {
  return getModuleById('smokecraft-experience')
}

export function buildSmokeCraftServerRegistrationReport() {
  const manifest = getModuleById('smokecraft-experience')
  return {
    moduleId: 'smokecraft-experience',
    registered: !!manifest,
    manifest: manifest ?? null,
    module_packaging_status: 'registered_preview',
    physical_package_status: 'not_yet_packaged',
    marketplace_status: 'not_live_marketplace',
    license_status: 'license_not_enforced',
    lifecycle_status: 'preview_only',
    routeContract: buildSmokeCraftRouteRegistryReport(),
    preview_only: true,
  }
}
