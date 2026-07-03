/**
 * SmokeCraft Experience Module — NOVEE OS Module Entry Point
 * Module Build 2 of 9
 *
 * This is the module registration entry point. It does not render UI directly.
 * It exports the manifest, contracts, services, hooks, and adapters that make up
 * the SmokeCraft Experience Module in the NOVEE OS system.
 *
 * Do not use this file to redesign or replace SmokeCraft screens.
 * Existing screens in src/pages/smokecraft/ and src/components/smokecraft/ are protected.
 */

export { smokecraftModuleManifest, SMOKECRAFT_MODULE_ID, SMOKECRAFT_MODULE_VERSION } from './module.manifest.js'
export { JOURNEY_STEPS, JOURNEY_RULES } from './data/smokecraftJourneyContract.js'
export { SMOKECRAFT_ROUTES, buildSmokeCraftRouteRegistryReport } from './data/smokecraftRouteContract.js'
export { SMOKECRAFT_HOOKS, buildSmokeCraftHookRegistryReport } from './data/smokecraftHookContract.js'
export { SMOKECRAFT_PERMISSIONS, hasSmokeCraftPermission, buildSmokeCraftPermissionReport } from './data/smokecraftPermissionContract.js'
export { createSmokeCraftOrder, ORDER_MODES, ORDER_STATUSES } from './data/smokecraftOrderingContract.js'
export { createPairingRecommendation, buildPairingFallbackResponse } from './data/smokecraftPairingContract.js'
export { createVenueMenuContract, createVenueMenuItem } from './data/smokecraftMenuContract.js'
export { useSmokeCraftProgress } from './hooks/useSmokeCraftProgress.js'
export { useSmokeCraftOrdering } from './hooks/useSmokeCraftOrdering.js'
export { useSmokeCraftPairing } from './hooks/useSmokeCraftPairing.js'

export const MODULE_STATUS = {
  moduleId: 'smokecraft-experience',
  moduleVersion: '0.1.0',
  module_packaging_status: 'registered_preview',
  physical_package_status: 'not_yet_packaged',
  marketplace_status: 'not_live_marketplace',
  license_status: 'license_not_enforced',
  lifecycle_status: 'preview_only',
  preview_only: true,
}
