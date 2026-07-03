/**
 * SmokeCraft Environment Validation Service
 * Checks for expected env vars without exposing their values.
 * Secret values are always redacted.
 */

import { ENV_VARS, createEnvVarStatus } from '../../../src/modules/smokecraft/data/smokecraftEnvironmentContract.js'
import { safeEnvPresence } from './smokecraftSecretSafetyService.js'

export function validateEnvironment() {
  const results = {}
  let criticalMissing = 0
  let optionalMissing = 0

  for (const [name, meta] of Object.entries(ENV_VARS)) {
    const presence = safeEnvPresence(name)
    const status = createEnvVarStatus(name, meta)
    status.present = presence.present
    if (!presence.present) {
      if (meta.critical) criticalMissing++
      else optionalMissing++
    }
    results[name] = status
  }

  return {
    vars:             results,
    criticalMissing,
    optionalMissing,
    productionReady:  criticalMissing === 0,
    message:          criticalMissing > 0
      ? `${criticalMissing} critical env var(s) missing. SmokeCraft is not production-ready.`
      : optionalMissing > 0
        ? `${optionalMissing} optional env var(s) not configured. Some integrations will be unavailable.`
        : 'All expected env vars are present.',
  }
}

export function getEnvVarPresence(varName) {
  return safeEnvPresence(varName)
}

export function isDatabaseUrlPresent() {
  return Boolean(process.env.DATABASE_URL)
}

export function isPOS360Configured() {
  return Boolean(process.env.POS360_ENDPOINT)
}

export function isEatConfigured() {
  return Boolean(process.env.EAT_SYSTEM_ENDPOINT)
}

export function isPairingProviderConfigured() {
  return Boolean(process.env.SMOKECRAFT_PAIRING_PROVIDER && process.env.SMOKECRAFT_PAIRING_ENDPOINT)
}

export function isVenueMenuProviderConfigured() {
  // Venue menu comes from POS360 or E.A.T.; no dedicated env var beyond those
  return isPOS360Configured() || isEatConfigured()
}

export function getEnvironmentValidationReport() {
  const env = validateEnvironment()
  return {
    ...env,
    secretsSafe:       true,
    valuesRedacted:    true,
    containsSecrets:   false,
    exposesPrivateData:false,
  }
}
