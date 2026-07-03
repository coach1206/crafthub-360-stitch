/**
 * SmokeCraft Experience Module — NOVEE OS Module Manifest
 * Module Build 2 of 9 — Post-Phase Module Build Series
 *
 * This manifest registers SmokeCraft into the NOVEE OS Module Packaging Foundation
 * created in Module Build 1. It does not physically package or install SmokeCraft.
 *
 * Honest status:
 *   module_packaging_status: registered_preview
 *   physical_package_status: not_yet_packaged
 *   marketplace_status: not_live_marketplace
 *   license_status: license_not_enforced
 *   lifecycle_status: preview_only
 */

export const SMOKECRAFT_MODULE_ID = 'smokecraft-experience'

export const SMOKECRAFT_MODULE_VERSION = '0.1.0'

export const smokecraftModuleManifest = {
  moduleId: SMOKECRAFT_MODULE_ID,
  moduleName: 'SmokeCraft Experience Module',
  moduleSlug: 'smokecraft-experience',
  moduleType: 'experience_module',
  moduleCategory: 'venue_experience',
  moduleDescription:
    'SmokeCraft guided cigar experience — 8-visit / 24-session gamified progression. ' +
    'Covers entry gate, identity, golden box, mentor selection, seed & soil, humidor match, ' +
    'request/purchase, cut/toast/light, first/second/final thirds, flavor memory, scorecard, ' +
    'passport stamp, connections, management sync, and session complete.',
  moduleVersion: SMOKECRAFT_MODULE_VERSION,
  moduleStatus: 'active_development',
  coreOrAddon: 'core',
  host: 'NOVEE OS',
  premiumEligible: true,
  enterpriseEligible: true,
  whiteLabelEligible: false,
  marketplaceEligible: false,
  pricingModel: 'per_venue',
  tenantScope: 'single_venue',
  venueScope: 'venue_required',

  // Honest packaging status
  module_packaging_status: 'registered_preview',
  physical_package_status: 'not_yet_packaged',
  marketplace_status: 'not_live_marketplace',
  license_status: 'license_not_enforced',
  lifecycle_status: 'preview_only',
  preview_only: true,

  // Dependencies
  dependencies: ['nompf-core'],
  optionalDependencies: [
    'pos360',
    'eat-system',
    'loyalty-engine',
    'analytics-engine',
    'staff-command',
    'venue-menu-engine',
  ],
  incompatibleModules: [],

  // Required platform resources
  requiredServices: [
    'smokecraftJourneyService',
    'smokecraftProgressService',
    'smokecraftPairingService',
    'smokecraftOrderingService',
    'smokecraftMenuService',
    'smokecraftManagementSyncService',
    'passportProgressService',
    'passportEntryService',
  ],
  requiredComponents: [
    'SmokeCraftAssetScreen',
    'SmokeCraftHotspotLayer',
    'SmokeCraftAssetRoute',
  ],
  requiredRoutes: [
    '/smokecraft',
    '/smokecraft/identity',
    '/smokecraft/golden-box',
    '/smokecraft/mentor-selection',
    '/smokecraft/seed-soil',
    '/smokecraft/humidor-match',
    '/smokecraft/request-purchase',
    '/smokecraft/cut-toast-light',
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
  requiredPermissions: [
    'smokecraft.start_session',
    'smokecraft.view_recommendations',
    'smokecraft.request_order',
    'smokecraft.complete_scorecard',
    'smokecraft.earn_passport_stamp',
  ],
  requiredEnvVars: [],
  requiredMigrations: [],
  requiredDocs: ['src/modules/smokecraft/README.md'],

  // Lifecycle hooks (preview-only — Module Build 2)
  installHooks: ['smokecraft.install.preview'],
  uninstallHooks: ['smokecraft.uninstall.preview'],
  enableHooks: ['smokecraft.enable.preview'],
  disableHooks: ['smokecraft.disable.preview'],
  upgradeHooks: ['smokecraft.upgrade.preview'],
  rollbackHooks: ['smokecraft.rollback.preview'],

  // License (not enforced)
  licenseRequirements: {
    tier: 'premium',
    enforced: false,
    license_not_enforced: true,
    preview_only: true,
  },

  // Capabilities
  capabilities: [
    'guided_cigar_experience',
    'mentor_selection',
    'flavor_memory',
    'scorecard',
    'passport_stamp',
    'venue_menu_request',
    'server_assisted_order',
    'customer_self_order',
    'pairing_recommendations',
    'management_sync',
    'progression_tracking',
    'route_registration',
    'service_registration',
    'hook_registration',
    'audit_readiness',
    'license_readiness_preview',
  ],

  // Journey integrity constants
  journeyStructure: {
    totalVisits: 8,
    totalSessions: 24,
    flavorMemoryPosition: 'between_second_third_and_final_third',
    passportStampLock: true,
    connectionsLock: true,
    visit8Protected: true,
    oneSessionShortcutAllowed: false,
    journeyCompressionAllowed: false,
  },

  createdAt: '2026-07-03T00:00:00.000Z',
  updatedAt: '2026-07-03T00:00:00.000Z',
  manifestNote: 'module_build_2_registered_preview',
}

export default smokecraftModuleManifest
