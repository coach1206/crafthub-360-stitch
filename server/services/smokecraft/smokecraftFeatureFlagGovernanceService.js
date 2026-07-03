/**
 * SmokeCraft Feature Flag Governance Service
 * Module Build 8 — feature flag management and protection rules.
 * Flags cannot bypass protected progression or fake connections.
 */

import { createFeatureFlagRecord, FEATURE_FLAGS, getDefaultFlags, FLAGS_CANNOT_BYPASS_PROGRESSION } from '../../../src/modules/smokecraft/data/smokecraftFeatureFlagContract.js'

let _flagOverrides = {}

export function getFeatureFlags() {
  const defaults = getDefaultFlags()
  return { ...defaults, ..._flagOverrides }
}

export function isFeatureEnabled(flagKey) {
  const flags = getFeatureFlags()
  return flags[flagKey] ?? false
}

export function setFeatureFlag(flagKey, value) {
  if (!(flagKey in FEATURE_FLAGS)) {
    return { success: false, reason: 'unknown_flag' }
  }
  if (FLAGS_CANNOT_BYPASS_PROGRESSION.includes(flagKey) && value === true) {
    return { success: false, reason: 'flag_cannot_bypass_protected_progression' }
  }
  _flagOverrides[flagKey] = value
  return { success: true, flagKey, value }
}

export function getFeatureFlagGovernanceStatus() {
  const record = createFeatureFlagRecord()
  const activeFlags = getFeatureFlags()
  return {
    ...record,
    activeFlags,
    canBypassProtectedProgression:  false,
    canFakeIntegrationConnection:   false,
    marketplaceListingEnabled:      activeFlags['smokecraft.marketplaceListing.enabled'] ?? false,
    licenseEnforcementEnabled:      activeFlags['smokecraft.licenseEnforcement.enabled'] ?? false,
    billingEnabled:                 activeFlags['smokecraft.billing.enabled'] ?? false,
    productionSyncEnabled:          activeFlags['smokecraft.productionSync.enabled'] ?? false,
  }
}

export function resetFlagOverrides() {
  _flagOverrides = {}
}
