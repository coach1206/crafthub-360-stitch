/**
 * SmokeCraft Reward Policy Service
 * Enforces reward integrity rules. Every award must pass policy checks.
 * Prevents abuse, early unlocks, and false spend verification.
 */

import { BLOCKED_REASONS } from '../../../src/modules/smokecraft/data/smokecraftRewardContract.js'

export const POLICY_CHECKS = {
  NO_DUPLICATE:                  'no_duplicate_reward_for_same_event',
  NO_EARLY_PASSPORT:             'no_passport_award_before_eligibility',
  NO_EARLY_CONNECTIONS:          'no_connections_unlock_before_rules',
  NO_POS_WITHOUT_VERIFICATION:   'no_pos_verified_reward_without_pos_confirmation',
  NO_REDEEM_WITHOUT_HANDLER:     'no_redeemed_status_without_redemption_handler',
  NO_SINGLE_SESSION_COMPLETION:  'no_full_visit_completion_from_single_session',
  NO_REWARD_MISSING_SCORECARD:   'no_reward_for_missing_scorecard_when_required',
  NO_REWARD_MISSING_FLAVOR_MEM:  'no_reward_for_missing_flavor_memory_when_required',
  NO_PROVIDER_BONUS_OFFLINE:     'no_live_provider_bonus_without_provider_connection',
}

/**
 * Runs all applicable policy checks for a reward evaluation payload.
 * Returns { passed: bool, violations: string[], checks: string[] }
 */
export function runPolicyChecks(payload, existingRewards = []) {
  const {
    rewardType,
    sourceEventId,
    sourceEventType,
    passportStampRequest,
    connectionsUnlockRequest,
    visitId,
    sessionId,
    scorecardPresent,
    flavorMemoryPresent,
    posVerified,
    redemptionRequested,
    singleSessionOnly,
    providerConnected,
    providerBonusRequested,
    allergyBlock,
  } = payload

  const checks = []
  const violations = []

  // No duplicate reward for same event
  checks.push(POLICY_CHECKS.NO_DUPLICATE)
  if (sourceEventId) {
    const duplicate = existingRewards.find(
      r => r.sourceEventId === sourceEventId && r.rewardType === rewardType && r.rewardStatus !== 'revoked'
    )
    if (duplicate) violations.push(POLICY_CHECKS.NO_DUPLICATE)
  }

  // No early Passport Stamp
  checks.push(POLICY_CHECKS.NO_EARLY_PASSPORT)
  if (passportStampRequest) {
    // Passport Stamp requires scorecard and flavor memory at minimum
    if (!scorecardPresent) violations.push(POLICY_CHECKS.NO_EARLY_PASSPORT)
    if (!flavorMemoryPresent) violations.push(POLICY_CHECKS.NO_EARLY_PASSPORT)
  }

  // No early Connections unlock
  checks.push(POLICY_CHECKS.NO_EARLY_CONNECTIONS)
  if (connectionsUnlockRequest) {
    // Connections requires passport stamp to be awarded first
    if (!payload.passportStampAwarded) violations.push(POLICY_CHECKS.NO_EARLY_CONNECTIONS)
  }

  // No POS-verified reward without POS confirmation
  checks.push(POLICY_CHECKS.NO_POS_WITHOUT_VERIFICATION)
  if (payload.posVerifiedRewardRequested && !posVerified) {
    violations.push(POLICY_CHECKS.NO_POS_WITHOUT_VERIFICATION)
  }

  // No redeemed status without handler
  checks.push(POLICY_CHECKS.NO_REDEEM_WITHOUT_HANDLER)
  if (redemptionRequested && !payload.redemptionHandlerConfirmed) {
    violations.push(POLICY_CHECKS.NO_REDEEM_WITHOUT_HANDLER)
  }

  // No full visit completion from single session
  checks.push(POLICY_CHECKS.NO_SINGLE_SESSION_COMPLETION)
  if (singleSessionOnly && payload.experienceCompletionRequested) {
    violations.push(POLICY_CHECKS.NO_SINGLE_SESSION_COMPLETION)
  }

  // No reward for missing scorecard when required
  checks.push(POLICY_CHECKS.NO_REWARD_MISSING_SCORECARD)
  if (payload.scorecardRequired && !scorecardPresent) {
    violations.push(POLICY_CHECKS.NO_REWARD_MISSING_SCORECARD)
  }

  // No reward for missing Flavor Memory when required
  checks.push(POLICY_CHECKS.NO_REWARD_MISSING_FLAVOR_MEM)
  if (payload.flavorMemoryRequired && !flavorMemoryPresent) {
    violations.push(POLICY_CHECKS.NO_REWARD_MISSING_FLAVOR_MEM)
  }

  // No live provider bonus without provider connection
  checks.push(POLICY_CHECKS.NO_PROVIDER_BONUS_OFFLINE)
  if (providerBonusRequested && !providerConnected) {
    violations.push(POLICY_CHECKS.NO_PROVIDER_BONUS_OFFLINE)
  }

  return {
    passed: violations.length === 0,
    violations,
    checks,
    blockedReason: violations.length > 0 ? (violations[0] ?? BLOCKED_REASONS.POLICY_VIOLATION) : null,
  }
}

/**
 * Maps a policy violation to the canonical blocked reason.
 */
export function mapViolationToBlockedReason(violation) {
  const map = {
    [POLICY_CHECKS.NO_EARLY_PASSPORT]:           BLOCKED_REASONS.EARLY_PASSPORT_STAMP,
    [POLICY_CHECKS.NO_EARLY_CONNECTIONS]:        BLOCKED_REASONS.EARLY_CONNECTIONS_UNLOCK,
    [POLICY_CHECKS.NO_POS_WITHOUT_VERIFICATION]: BLOCKED_REASONS.POS_NOT_VERIFIED,
    [POLICY_CHECKS.NO_REDEEM_WITHOUT_HANDLER]:   BLOCKED_REASONS.REDEMPTION_HANDLER_MISSING,
    [POLICY_CHECKS.NO_SINGLE_SESSION_COMPLETION]:BLOCKED_REASONS.ONE_SESSION_SHORTCUT_BLOCKED,
    [POLICY_CHECKS.NO_REWARD_MISSING_SCORECARD]: BLOCKED_REASONS.SCORECARD_MISSING,
    [POLICY_CHECKS.NO_REWARD_MISSING_FLAVOR_MEM]:BLOCKED_REASONS.FLAVOR_MEMORY_MISSING,
    [POLICY_CHECKS.NO_PROVIDER_BONUS_OFFLINE]:   BLOCKED_REASONS.PROVIDER_NOT_CONNECTED,
    [POLICY_CHECKS.NO_DUPLICATE]:                BLOCKED_REASONS.DUPLICATE_REWARD,
  }
  return map[violation] ?? BLOCKED_REASONS.POLICY_VIOLATION
}
