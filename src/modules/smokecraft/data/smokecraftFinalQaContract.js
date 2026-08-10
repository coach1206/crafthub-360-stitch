/**
 * SmokeCraft Final QA Contract
 * Module Build 9 — QA category shapes and allowed statuses.
 */

export const QA_STATUSES = {
  PASSED:   'passed',
  WARNING:  'warning',
  BLOCKED:  'blocked',
  FAILED:   'failed',
}

export const QA_CATEGORIES = [
  'foundation',
  'module_registration',
  'journey_protection',
  'ordering',
  'pairing',
  'rewards',
  'venue_admin',
  'integrations',
  'enterprise_packaging',
  'documentation',
  'security',
  'honest_status',
  'production_blockers',
  'release_candidate_readiness',
]

export function createQaCategory(overrides = {}) {
  return {
    categoryId:      null,
    categoryName:    null,
    status:          QA_STATUSES.PASSED,
    checksPassed:    0,
    checksFailed:    0,
    blockedReasons:  [],
    warnings:        [],
    ...overrides,
  }
}

export function createFinalQaRecord(overrides = {}) {
  return {
    qaId:            null,
    moduleId:        'smokecraft',
    qaStatus:        'passed_internal_rc',
    categories:      [],
    totalPassed:     0,
    totalFailed:     0,
    totalWarnings:   0,
    approvedForInternalDemo: false,
    createdAt:       new Date().toISOString(),
    ...overrides,
  }
}
