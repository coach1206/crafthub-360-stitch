/**
 * SmokeCraft Passport Reward Service
 * Evaluates and awards Passport Stamps following existing journey lock rules.
 * Passport Stamp cannot unlock early. Visit 8 is protected.
 * One-session shortcut is blocked. Connections cannot unlock early.
 */

import { createReward, getRewardsByUser } from './smokecraftRewardStore.js'
import { runPolicyChecks } from './smokecraftRewardPolicyService.js'
import { createRewardAuditEntry, REWARD_AUDIT_EVENTS } from './smokecraftRewardAuditService.js'
import { REWARD_TYPES, REWARD_STATUSES, BLOCKED_REASONS } from '../../../src/modules/smokecraft/data/smokecraftRewardContract.js'

// Minimum requirements for Passport Stamp — cannot be bypassed
const PASSPORT_STAMP_REQUIREMENTS = {
  scorecardRequired: true,
  flavorMemoryRequired: true,
  managementSyncRequired: false, // preview — not blocking until sync is live
  minimumVisitsRequired: 1,
  visit8Locked: true,
  connectionsLockedUntilStamp: true,
  oneSessionShortcutBlocked: true,
}

export function evaluatePassportStampEligibility(payload) {
  const {
    userId, visitId, sessionId,
    scorecardPresent = false,
    flavorMemoryPresent = false,
    visitNumber = null,
    sessionsCompletedInVisit = 0,
    totalSessionsCompleted = 0,
    passportStampAlreadyAwarded = false,
    singleSessionOnly = false,
  } = payload

  const blockedReasons = []

  // Already awarded
  if (passportStampAlreadyAwarded) {
    return { eligible: false, passportStampEligible: false, blockedReasons: ['already_awarded'] }
  }

  // Single-session shortcut blocked
  if (singleSessionOnly && totalSessionsCompleted < 2) {
    blockedReasons.push(BLOCKED_REASONS.ONE_SESSION_SHORTCUT_BLOCKED)
  }

  // Scorecard required
  if (!scorecardPresent) {
    blockedReasons.push(BLOCKED_REASONS.SCORECARD_MISSING)
  }

  // Flavor Memory required
  if (!flavorMemoryPresent) {
    blockedReasons.push(BLOCKED_REASONS.FLAVOR_MEMORY_MISSING)
  }

  // Visit 8 protection
  if (visitNumber === 8) {
    blockedReasons.push(BLOCKED_REASONS.VISIT_8_LOCKED)
  }

  // Visit not complete
  if (sessionsCompletedInVisit < 1) {
    blockedReasons.push(BLOCKED_REASONS.VISIT_NOT_COMPLETE)
  }

  const eligible = blockedReasons.length === 0

  return {
    eligible,
    passportStampEligible: eligible,
    blockedReasons,
    primaryBlockedReason: blockedReasons[0] ?? null,
    requirements: PASSPORT_STAMP_REQUIREMENTS,
    scorecardPresent,
    flavorMemoryPresent,
    visitNumber,
    sessionsCompletedInVisit,
  }
}

export async function awardPassportStamp(payload) {
  const eligibility = evaluatePassportStampEligibility(payload)

  createRewardAuditEntry({
    userId: payload.userId, venueId: payload.venueId,
    eventType: REWARD_AUDIT_EVENTS.PASSPORT_CHECKED,
    sourceEventType: 'passport_stamp_request',
    policyChecks: ['no_passport_award_before_eligibility'],
    blockedReason: eligibility.primaryBlockedReason,
    passportStampAwarded: false,
  })

  if (!eligibility.eligible) {
    const record = await createReward({
      userId: payload.userId, venueId: payload.venueId,
      sessionId: payload.sessionId, visitId: payload.visitId,
      rewardType: REWARD_TYPES.PASSPORT_STAMP,
      rewardStatus: REWARD_STATUSES.BLOCKED,
      passportStampEligible: false,
      passportStampAwarded: false,
      blockedReason: eligibility.primaryBlockedReason,
      policyChecks: ['no_passport_award_before_eligibility'],
    })
    return { awarded: false, eligibility, record }
  }

  const record = await createReward({
    userId: payload.userId, venueId: payload.venueId,
    sessionId: payload.sessionId, visitId: payload.visitId,
    rewardType: REWARD_TYPES.PASSPORT_STAMP,
    rewardStatus: REWARD_STATUSES.AWARDED,
    passportStampEligible: true,
    passportStampAwarded: true,
    xpAwarded: 200,
    rewardValue: 200,
    rewardCurrency: 'xp',
    policyChecks: ['no_passport_award_before_eligibility'],
  })

  createRewardAuditEntry({
    rewardId: record.rewardId,
    userId: payload.userId, venueId: payload.venueId,
    eventType: REWARD_AUDIT_EVENTS.PASSPORT_AWARDED,
    sourceEventType: 'passport_stamp_awarded',
    previousStatus: null, nextStatus: REWARD_STATUSES.AWARDED,
    policyChecks: ['no_passport_award_before_eligibility'],
    xpAwarded: 200,
    passportStampAwarded: true,
  })

  return { awarded: true, eligibility, record }
}

export function blockEarlyPassportStamp(reason) {
  return {
    eligible: false,
    passportStampEligible: false,
    blocked: true,
    blockedReason: reason ?? BLOCKED_REASONS.INCOMPLETE_REQUIRED_STEPS,
    message: `Passport Stamp blocked: ${reason ?? BLOCKED_REASONS.INCOMPLETE_REQUIRED_STEPS}`,
  }
}

export async function getPassportStampAudit(userId) {
  const rewards = await getRewardsByUser(userId)
  return rewards.filter(r => r.rewardType === REWARD_TYPES.PASSPORT_STAMP)
}

export async function getPassportRewardStatus(userId, visitId, sessionId) {
  const rewards = await getRewardsByUser(userId)
  const stampRewards = rewards.filter(r => r.rewardType === REWARD_TYPES.PASSPORT_STAMP)
  const awarded = stampRewards.find(r => r.passportStampAwarded && r.visitId === visitId)
  return {
    userId, visitId, sessionId,
    passportStampAwarded: !!awarded,
    totalStampsAwarded: stampRewards.filter(r => r.passportStampAwarded).length,
    lastStampRecord: awarded ?? null,
  }
}
