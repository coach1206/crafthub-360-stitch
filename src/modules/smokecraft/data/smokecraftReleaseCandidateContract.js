/**
 * SmokeCraft Release Candidate Contract
 * Module Build 9 — RC status shapes and approval rules.
 */

export const RC_QA_STATUSES = {
  PASSED_INTERNAL_RC: 'passed_internal_rc',
  FAILED:             'failed',
  BLOCKED:            'blocked',
  INCOMPLETE:         'incomplete',
}

export const DOCUMENTATION_STATUSES = {
  LOCKED_FOR_RC: 'locked_for_rc',
  INCOMPLETE:    'incomplete',
  NEEDS_REVIEW:  'needs_review',
}

export const HANDOFF_STATUSES = {
  HANDOFF_READY: 'handoff_ready',
  INCOMPLETE:    'incomplete',
  NEEDS_REVIEW:  'needs_review',
}

export const PRODUCTION_READINESS_STATUSES = {
  NOT_PRODUCTION_READY:      'not_production_ready',
  PRODUCTION_BLOCKED:        'production_blocked',
  PRODUCTION_READY_VERIFIED: 'production_ready_verified',
}

export const MARKETPLACE_READINESS_STATUSES = {
  NOT_LIVE:         'not_live_marketplace',
  DRAFT_ONLY:       'marketplace_draft_only',
  BLOCKED:          'marketplace_blocked',
}

export const LICENSE_READINESS_STATUSES = {
  NOT_ENFORCED:        'license_not_enforced',
  GOVERNANCE_PREVIEW:  'license_governance_preview',
  BLOCKED:             'license_blocked',
}

export const BILLING_READINESS_STATUSES = {
  PREVIEW_ONLY:       'preview_only',
  NOT_CONNECTED:      'billing_not_connected',
  BLOCKED:            'billing_blocked',
}

export function createReleaseCandidateRecord(overrides = {}) {
  return {
    releaseCandidateId:       'smokecraft-rc-9-preview',
    moduleId:                 'smokecraft',
    moduleName:               'SmokeCraft Experience',
    version:                  '0.9.0-rc-preview',
    buildSequenceStatus:      'builds_1_through_9_complete',
    qaStatus:                 RC_QA_STATUSES.PASSED_INTERNAL_RC,
    documentationStatus:      DOCUMENTATION_STATUSES.LOCKED_FOR_RC,
    handoffStatus:            HANDOFF_STATUSES.HANDOFF_READY,
    productionReadinessStatus: PRODUCTION_READINESS_STATUSES.NOT_PRODUCTION_READY,
    marketplaceReadinessStatus: MARKETPLACE_READINESS_STATUSES.NOT_LIVE,
    licenseReadinessStatus:   LICENSE_READINESS_STATUSES.NOT_ENFORCED,
    billingReadinessStatus:   BILLING_READINESS_STATUSES.PREVIEW_ONLY,
    integrationReadinessStatus: 'not_connected',
    protectedFileStatus:      'protected_files_intact',
    knownBlockers:            [],
    approvedForInternalDemo:  true,
    approvedForProduction:    false,
    approvedForMarketplace:   false,
    createdAt:                new Date().toISOString(),
    updatedAt:                new Date().toISOString(),
    ...overrides,
  }
}
