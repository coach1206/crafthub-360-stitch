/**
 * SmokeCraft White-Label Service
 * Module Build 8 — white-label readiness and brand override governance.
 * Cannot bypass protected journey logic.
 */

import { createWhiteLabelRecord, WHITE_LABEL_STATUSES, PROTECTED_BRAND_ELEMENTS } from '../../../src/modules/smokecraft/data/smokecraftWhiteLabelContract.js'

export function getWhiteLabelStatus() {
  const record = createWhiteLabelRecord()
  return {
    ...record,
    warnings: [
      'White-label brand overrides do not modify SmokeCraft journey logic.',
      'White-label cannot change protected progression rules.',
      'Powered-by NOVEE OS metadata is required unless license explicitly allows removal.',
      'License enforcement is not active — white-label remains preview_only.',
    ],
  }
}

export function validateBrandOverride(overrides = {}) {
  const errors = []
  const BLOCKED_KEYS = ['journeyStepOrder', 'visitCount', 'sessionCount', 'passportUnlockThreshold', 'connectionsUnlockThreshold', 'flavorMemoryRequired']

  for (const key of BLOCKED_KEYS) {
    if (key in overrides) {
      errors.push(`Cannot override protected field: ${key}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    canBypassJourneyLogic: false,
    canBypassProtectedProgression: false,
    protectedBrandElements: PROTECTED_BRAND_ELEMENTS,
  }
}

export function getWhiteLabelReadinessReport() {
  return {
    whiteLabelStatus:              WHITE_LABEL_STATUSES.PREVIEW,
    licenseRequired:               true,
    licenseEnforced:               false,
    poweredByNoveeOSRequired:      true,
    protectedBrandElements:        PROTECTED_BRAND_ELEMENTS,
    canBypassProtectedProgression: false,
    productionReady:               false,
    readinessBlockers: [
      'license_enforcement_not_active',
      'physical_package_not_created',
    ],
  }
}
