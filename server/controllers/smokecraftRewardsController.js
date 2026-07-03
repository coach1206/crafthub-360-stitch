/**
 * SmokeCraft Rewards Controller
 * Handles all reward, loyalty, passport, and monetization API requests.
 */

import { getRewardStoreReport, getRewardsByUser } from '../services/smokecraft/smokecraftRewardStore.js'
import { getLoyaltySummary, awardXP } from '../services/smokecraft/smokecraftLoyaltyService.js'
import { evaluatePassportStampEligibility, awardPassportStamp, getPassportRewardStatus, getPassportStampAudit } from '../services/smokecraft/smokecraftPassportRewardService.js'
import { evaluateVisitProgressionRewards } from '../services/smokecraft/smokecraftVisitProgressionRewardService.js'
import { evaluateScorecardRewards } from '../services/smokecraft/smokecraftScorecardRewardService.js'
import { evaluateOrderRewards } from '../services/smokecraft/smokecraftOrderRewardService.js'
import { evaluatePairingRewards } from '../services/smokecraft/smokecraftPairingRewardService.js'
import { evaluateMonetization, getMonetizationReport, getPreviewMonetizationModels } from '../services/smokecraft/smokecraftExperienceMonetizationService.js'
import { getAuditTrailForReward, getRewardAuditReport, REWARD_AUDIT_EVENTS } from '../services/smokecraft/smokecraftRewardAuditService.js'
import { createRewardAuditEntry } from '../services/smokecraft/smokecraftRewardAuditService.js'
import { runPolicyChecks } from '../services/smokecraft/smokecraftRewardPolicyService.js'
import { syncSmokeCraftOrderToEAT } from '../services/smokecraft/smokecraftEatSyncBridgeService.js'

export async function getRewardsStatus(req, res) {
  try {
    const storeReport = getRewardStoreReport()
    const auditReport = getRewardAuditReport()
    res.json({
      module: 'smokecraft-rewards-monetization',
      build: 'module_build_5',
      storeReport,
      auditReport,
      posVerified: false,
      eatSyncStatus: 'not_connected',
      managementSyncStatus: 'preview_only',
      billingStatus: 'preview_only',
      licenseStatus: 'license_not_enforced',
      marketplaceStatus: 'not_live_marketplace',
    })
  } catch (err) {
    res.status(500).json({ error: 'rewards_status_error', message: err.message })
  }
}

export async function getUserRewards(req, res) {
  try {
    const { userId } = req.params
    const rewards = await getRewardsByUser(userId)
    const summary = await getLoyaltySummary(userId)
    res.json({ userId, rewards, summary })
  } catch (err) {
    res.status(500).json({ error: 'get_user_rewards_error', message: err.message })
  }
}

export async function evaluateRewards(req, res) {
  try {
    const { userId, venueId, sessionId, visitId, eventType, ...context } = req.body ?? {}
    if (!userId) return res.status(400).json({ error: 'missing_userId' })

    const existingRewards = await getRewardsByUser(userId)
    const policyResult = runPolicyChecks({ ...context, rewardType: eventType }, existingRewards)

    createRewardAuditEntry({
      userId, venueId,
      eventType: policyResult.passed ? REWARD_AUDIT_EVENTS.EVALUATED : REWARD_AUDIT_EVENTS.POLICY_BLOCKED,
      sourceEventType: eventType,
      policyChecks: policyResult.checks,
      blockedReason: policyResult.blockedReason,
    })

    await syncSmokeCraftOrderToEAT({ userId, eventType: 'reward.evaluated' }, 'smokeCraft.reward.evaluated')

    res.json({ userId, policyResult, eventType })
  } catch (err) {
    res.status(500).json({ error: 'evaluate_rewards_error', message: err.message })
  }
}

export async function awardReward(req, res) {
  try {
    const { userId, venueId, sessionId, visitId, eventType, sourceEventId, posVerified = false } = req.body ?? {}
    if (!userId || !eventType) return res.status(400).json({ error: 'missing_required_fields' })

    const result = await awardXP({ userId, venueId, sessionId, visitId, eventType, sourceEventId, posVerified })

    await syncSmokeCraftOrderToEAT({ userId, eventType: 'reward.awarded' }, 'smokeCraft.reward.awarded')

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'award_reward_error', message: err.message })
  }
}

export async function evaluatePassportReward(req, res) {
  try {
    const payload = req.body ?? {}
    if (!payload.userId) return res.status(400).json({ error: 'missing_userId' })
    const eligibility = evaluatePassportStampEligibility(payload)
    await syncSmokeCraftOrderToEAT({ userId: payload.userId, eventType: 'passport.eligibilityChecked' }, 'smokeCraft.passport.eligibilityChecked')
    res.json(eligibility)
  } catch (err) {
    res.status(500).json({ error: 'passport_evaluate_error', message: err.message })
  }
}

export async function awardPassportReward(req, res) {
  try {
    const payload = req.body ?? {}
    if (!payload.userId) return res.status(400).json({ error: 'missing_userId' })
    const result = await awardPassportStamp(payload)
    if (result.awarded) {
      await syncSmokeCraftOrderToEAT({ userId: payload.userId, eventType: 'passport.stampAwarded' }, 'smokeCraft.passport.stampAwarded')
    }
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'passport_award_error', message: err.message })
  }
}

export async function evaluateOrderReward(req, res) {
  try {
    const payload = req.body ?? {}
    const result = await evaluateOrderRewards(payload)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'order_reward_error', message: err.message })
  }
}

export async function evaluatePairingReward(req, res) {
  try {
    const payload = req.body ?? {}
    const result = await evaluatePairingRewards(payload)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'pairing_reward_error', message: err.message })
  }
}

export async function getMonetizationHandler(req, res) {
  try {
    const { venueId } = req.params
    const report = getMonetizationReport(venueId)
    res.json(report)
  } catch (err) {
    res.status(500).json({ error: 'monetization_report_error', message: err.message })
  }
}

export async function evaluateMonetizationHandler(req, res) {
  try {
    const { venueId, userId, sourceEventType, monetizationType } = req.body ?? {}
    const result = await evaluateMonetization({ venueId, userId, sourceEventType, monetizationType })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'monetization_evaluate_error', message: err.message })
  }
}

export async function getRewardAudit(req, res) {
  try {
    const { rewardId } = req.params
    const trail = getAuditTrailForReward(rewardId)
    res.json({ rewardId, auditTrail: trail, entryCount: trail.length })
  } catch (err) {
    res.status(500).json({ error: 'reward_audit_error', message: err.message })
  }
}
