/**
 * NOVEE OS — Universal 360 Platform Registry Feature Flags
 * contains_secrets: false
 * NOVEE OS is industry-flexible and powers all 360 platforms.
 */

const NOVEE_OS_360_PLATFORM_REGISTRY_FLAGS = {
  NOVEE_360_PLATFORM_REGISTRY_ENABLED:                      true,
  NOVEE_360_PLATFORM_REGISTRY_PREVIEW_MODE:                 true,
  NOVEE_AGENT_X_360_RESERVED:                               true,
  NOVEE_DAYONE_360_RESERVED:                                true,
  NOVEE_EGOMUSIC_360_RESERVED:                              true,
  NOVEE_FUTURE_360_PLATFORMS_SUPPORTED:                     true,
  NOVEE_360_PLATFORM_PRODUCTION_LOCKS_ENABLED:              true,
  NOVEE_360_PLATFORM_DOCUMENTATION_REQUIRED_FOR_PRODUCTION: true,
  NOVEE_360_PLATFORM_LICENSE_REQUIRED_FOR_PRODUCTION:       true,
  NOVEE_360_PLATFORM_INTEGRATION_PROOF_REQUIRED_FOR_LIVE:   true,
}

export function getNoveeOS360PlatformRegistryFlags(overrides = {}) {
  return { ...NOVEE_OS_360_PLATFORM_REGISTRY_FLAGS, ...overrides }
}

export default NOVEE_OS_360_PLATFORM_REGISTRY_FLAGS
