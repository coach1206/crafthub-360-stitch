// Deployment profiles — Phase 5.
//
// Describes named combinations of modules a vendor could request, and what
// each combination would require (permissions/environments/feature flags/
// health). This is descriptive planning data only — selecting a profile
// does not deploy anything; it only describes what a future deployment
// would need.

import { MODULE_STATUS } from './moduleIntegrationContract.js'
import { ENVIRONMENT } from './vendorModuleAccess.js'

export const DEPLOYMENT_PROFILE_ID = {
  SMOKECRAFT_ONLY: 'smokecraft_only',
  POS3_ONLY: 'pos3_only',
  EAT_ONLY: 'eat_only',
  ATMOSPHERE_ONLY: 'atmosphere_only',
  POS3_AND_EAT: 'pos3_and_eat',
  SMOKECRAFT_AND_POS3: 'smokecraft_and_pos3',
  SMOKECRAFT_AND_EAT: 'smokecraft_and_eat',
  FULL_SUITE: 'full_suite',
}

function createDeploymentProfile(partial = {}) {
  return {
    id: partial.id ?? null,
    name: partial.name ?? null,
    modules: partial.modules ?? [],
    requiredPermissions: partial.requiredPermissions ?? [],
    requiredEnvironments: partial.requiredEnvironments ?? [ENVIRONMENT.DEMO],
    featureFlags: partial.featureFlags ?? {},
    healthRequirements: partial.healthRequirements ?? {
      requireConfigValid: true,
      requireDependenciesSatisfied: true,
      requireRegistryValid: true,
    },
  }
}

const deploymentProfiles = {
  [DEPLOYMENT_PROFILE_ID.SMOKECRAFT_ONLY]: createDeploymentProfile({
    id: DEPLOYMENT_PROFILE_ID.SMOKECRAFT_ONLY,
    name: 'SmokeCraft Only',
    modules: ['smokecraft'],
    requiredPermissions: [],
    requiredEnvironments: [ENVIRONMENT.DEMO, ENVIRONMENT.STAGING, ENVIRONMENT.PRODUCTION],
    featureFlags: { passportSupport: true },
  }),
  [DEPLOYMENT_PROFILE_ID.POS3_ONLY]: createDeploymentProfile({
    id: DEPLOYMENT_PROFILE_ID.POS3_ONLY,
    name: 'POS 3 Only',
    modules: ['pos3'],
    requiredPermissions: ['access_pos3_staff'],
    requiredEnvironments: [ENVIRONMENT.DEMO, ENVIRONMENT.STAGING, ENVIRONMENT.PRODUCTION],
  }),
  [DEPLOYMENT_PROFILE_ID.EAT_ONLY]: createDeploymentProfile({
    id: DEPLOYMENT_PROFILE_ID.EAT_ONLY,
    name: 'E.A.T. Only',
    modules: ['eat-command-hub'],
    requiredPermissions: ['access_eat_command'],
    requiredEnvironments: [ENVIRONMENT.DEMO, ENVIRONMENT.STAGING, ENVIRONMENT.PRODUCTION],
  }),
  [DEPLOYMENT_PROFILE_ID.ATMOSPHERE_ONLY]: createDeploymentProfile({
    id: DEPLOYMENT_PROFILE_ID.ATMOSPHERE_ONLY,
    name: 'Atmosphere Only',
    modules: ['atmosphere'],
    requiredPermissions: [],
    // Atmosphere is not built yet (MODULE_STATUS.NOT_BUILT) — this profile
    // exists as a known target, not a claim that it can deploy today.
    requiredEnvironments: [ENVIRONMENT.DEMO],
    healthRequirements: {
      requireConfigValid: false,
      requireDependenciesSatisfied: false,
      requireRegistryValid: true,
    },
  }),
  [DEPLOYMENT_PROFILE_ID.POS3_AND_EAT]: createDeploymentProfile({
    id: DEPLOYMENT_PROFILE_ID.POS3_AND_EAT,
    name: 'POS 3 + E.A.T.',
    modules: ['pos3', 'eat-command-hub'],
    requiredPermissions: ['access_pos3_staff', 'access_eat_command'],
    requiredEnvironments: [ENVIRONMENT.DEMO, ENVIRONMENT.STAGING, ENVIRONMENT.PRODUCTION],
  }),
  [DEPLOYMENT_PROFILE_ID.SMOKECRAFT_AND_POS3]: createDeploymentProfile({
    id: DEPLOYMENT_PROFILE_ID.SMOKECRAFT_AND_POS3,
    name: 'SmokeCraft + POS 3',
    modules: ['smokecraft', 'pos3'],
    requiredPermissions: ['access_pos3_staff'],
    requiredEnvironments: [ENVIRONMENT.DEMO, ENVIRONMENT.STAGING, ENVIRONMENT.PRODUCTION],
    featureFlags: { passportSupport: true },
  }),
  [DEPLOYMENT_PROFILE_ID.SMOKECRAFT_AND_EAT]: createDeploymentProfile({
    id: DEPLOYMENT_PROFILE_ID.SMOKECRAFT_AND_EAT,
    name: 'SmokeCraft + E.A.T.',
    modules: ['smokecraft', 'eat-command-hub'],
    requiredPermissions: ['access_eat_command'],
    requiredEnvironments: [ENVIRONMENT.DEMO, ENVIRONMENT.STAGING, ENVIRONMENT.PRODUCTION],
    featureFlags: { passportSupport: true },
  }),
  [DEPLOYMENT_PROFILE_ID.FULL_SUITE]: createDeploymentProfile({
    id: DEPLOYMENT_PROFILE_ID.FULL_SUITE,
    name: 'Full CraftHub Suite',
    modules: ['smokecraft', 'pos3', 'eat-command-hub', 'atmosphere'],
    requiredPermissions: ['access_pos3_staff', 'access_eat_command'],
    requiredEnvironments: [ENVIRONMENT.DEMO, ENVIRONMENT.STAGING, ENVIRONMENT.PRODUCTION],
    featureFlags: { passportSupport: true },
    healthRequirements: {
      requireConfigValid: true,
      requireDependenciesSatisfied: true,
      requireRegistryValid: true,
    },
  }),
}

export function getDeploymentProfile(profileId) {
  return deploymentProfiles[profileId] || null
}

export function listDeploymentProfiles() {
  return Object.values(deploymentProfiles)
}

/** Returns the module status enum value a module would need to be in to be considered "real" (not a placeholder). */
export const REAL_MODULE_STATUSES = [MODULE_STATUS.ACTIVE, MODULE_STATUS.STANDALONE]

export default deploymentProfiles
