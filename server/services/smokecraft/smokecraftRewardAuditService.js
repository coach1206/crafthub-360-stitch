/**
 * SmokeCraft Reward Audit Service
 * Records every reward evaluation and status transition.
 * Does not store secrets or expose private user data unnecessarily.
 */

const _auditLog = []
let _counter = 1

export const REWARD_AUDIT_EVENTS = {
  EVALUATED:           'smokeCraft.reward.evaluated',
  AWARDED:             'smokeCraft.reward.awarded',
  BLOCKED:             'smokeCraft.reward.blocked',
  PASSPORT_CHECKED:    'smokeCraft.passport.eligibilityChecked',
  PASSPORT_AWARDED:    'smokeCraft.passport.stampAwarded',
  LOYALTY_AWARDED:     'smokeCraft.loyalty.pointsAwarded',
  MONETIZATION_EVAL:   'smokeCraft.monetization.previewEvaluated',
  POLICY_BLOCKED:      'smokeCraft.reward.policyBlocked',
}

export function createRewardAuditEntry({
  rewardId = null,
  userId = null,
  venueId = null,
  eventType,
  sourceEventType = null,
  previousStatus = null,
  nextStatus = null,
  policyChecks = [],
  blockedReason = null,
  xpAwarded = 0,
  loyaltyPointsAwarded = 0,
  passportStampAwarded = false,
  posVerified = false,
}) {
  const auditId = `sc-rew-audit-${Date.now()}-${_counter++}`
  const entry = {
    auditId,
    rewardId,
    userId,
    venueId,
    eventType,
    sourceEventType,
    previousStatus,
    nextStatus,
    policyChecks,
    blockedReason,
    xpAwarded,
    loyaltyPointsAwarded,
    passportStampAwarded,
    posVerified,
    createdAt: new Date().toISOString(),
  }
  _auditLog.push(entry)
  return entry
}

export function getAuditTrailForReward(rewardId) {
  return _auditLog.filter(e => e.rewardId === rewardId)
}

export function getAllRewardAuditEntries() {
  return [..._auditLog]
}

export function getRewardAuditReport() {
  const byEvent = {}
  for (const e of _auditLog) {
    byEvent[e.eventType] = (byEvent[e.eventType] ?? 0) + 1
  }
  return {
    totalEntries: _auditLog.length,
    byEvent,
    containsSecrets: false,
    exposesPrivateData: false,
  }
}
