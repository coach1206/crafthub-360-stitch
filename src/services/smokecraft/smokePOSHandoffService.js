// Wires SmokeCraft to POS3 / E.A.T. honestly: no real payment processing,
// no fake purchases, no fabricated inventory. A "purchase intent" is a
// local/session-level signal only — it becomes a real reward only after
// `verified` status is reached, which (absent a real POS/backend) can only
// be set by a controlled local/dev action, never automatically.

import { emit, SYSTEMS } from '../shared/opsEventBus.js'
import { saveSmokePurchaseIntent, updateSmokePurchaseVerification, getSmokeSharedStorageMode } from './smokeSharedStorageService.js'

export const POS_HANDOFF_STATUS = {
  NOT_STARTED: 'not_started',
  INTENT_CREATED: 'intent_created',
  PENDING_POS_VERIFICATION: 'pending_pos_verification',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  BACKEND_REQUIRED: 'backend_required',
}

function ph(session) {
  return session?.smokeCraft?.posHandoff || {
    status: POS_HANDOFF_STATUS.NOT_STARTED,
    intentId: null,
    verificationStatus: POS_HANDOFF_STATUS.NOT_STARTED,
    product: null,
    createdAt: null,
    updatedAt: null,
  }
}

function localIntentId() {
  return `local-intent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Reads the current POS handoff state for this session. Never fabricates a status. */
export function getSmokePOSHandoff(session) {
  return ph(session)
}

/**
 * Creates a local purchase intent. This is NOT a real POS transaction —
 * the id is explicitly prefixed `local-intent-` so it can never be mistaken
 * for a real order/transaction id. Emits ops-bus events so POS3 and E.A.T.
 * can see the handoff, mirroring the existing HUMIDOR_REQUEST flow.
 */
export function createSmokePurchaseIntent(session, payload = {}) {
  const now = Date.now()
  const intentId = localIntentId()
  const product = payload.product || session?.smokeCraft?.selectedFormat?.id || session?.smokeCraft?.requestPurchaseChoice?.label || null

  emit({
    sourceSystem: SYSTEMS.SMOKECRAFT,
    targetSystem: SYSTEMS.POS3,
    eventType: 'POS_HANDOFF_CREATED',
    commandType: 'SMOKE_PURCHASE_INTENT',
    payload: { intentId, product, label: 'SmokeCraft Purchase Intent', sessionId: session?.sessionId || null },
  })
  emit({
    sourceSystem: SYSTEMS.SMOKECRAFT,
    targetSystem: SYSTEMS.EAT,
    eventType: 'EAT_EVENT_CREATED',
    commandType: 'SMOKE_PURCHASE_INTENT',
    payload: { intentId, product, label: 'SmokeCraft Purchase Intent', sessionId: session?.sessionId || null },
  })

  const handoff = {
    status: POS_HANDOFF_STATUS.INTENT_CREATED,
    intentId,
    verificationStatus: POS_HANDOFF_STATUS.NOT_STARTED,
    product,
    createdAt: now,
    updatedAt: now,
  }

  const syncResult = saveSmokePurchaseIntent(session, handoff)
  return { ...handoff, syncResult }
}

/** Moves an existing intent into pending POS verification. No reward yet. */
export function markSmokePurchasePending(session, payload = {}) {
  const current = ph(session)
  if (!current.intentId) return current
  return {
    ...current,
    status: POS_HANDOFF_STATUS.PENDING_POS_VERIFICATION,
    verificationStatus: POS_HANDOFF_STATUS.PENDING_POS_VERIFICATION,
    updatedAt: Date.now(),
    ...payload,
  }
}

/**
 * Marks a purchase verified. This must only be called from a controlled
 * local/dev action or real POS/order proof — never automatically from a
 * guest-facing button — since there is no real backend to confirm against.
 */
export function markSmokePurchaseVerified(session, payload = {}) {
  const current = ph(session)
  if (!current.intentId) return current
  const updated = {
    ...current,
    status: POS_HANDOFF_STATUS.VERIFIED,
    verificationStatus: POS_HANDOFF_STATUS.VERIFIED,
    verifiedAt: Date.now(),
    updatedAt: Date.now(),
    ...payload,
  }
  const syncResult = updateSmokePurchaseVerification(current.intentId, updated)
  return { ...updated, syncResult }
}

/** Marks a purchase rejected (e.g. staff declines the handoff). */
export function markSmokePurchaseRejected(session, payload = {}) {
  const current = ph(session)
  if (!current.intentId) return current
  const updated = {
    ...current,
    status: POS_HANDOFF_STATUS.REJECTED,
    verificationStatus: POS_HANDOFF_STATUS.REJECTED,
    updatedAt: Date.now(),
    ...payload,
  }
  const syncResult = updateSmokePurchaseVerification(current.intentId, updated)
  return { ...updated, syncResult }
}

/**
 * Reward eligibility requires a verified purchase. intent_created alone
 * never earns a reward — this is the honest gate referenced across the
 * winner/reward logic.
 */
export function getSmokePurchaseRewardStatus(session) {
  const handoff = ph(session)
  if (handoff.verificationStatus === POS_HANDOFF_STATUS.VERIFIED) {
    return { eligible: true, reason: 'Purchase verified by POS3 — reward unlocked.' }
  }
  if (handoff.verificationStatus === POS_HANDOFF_STATUS.REJECTED) {
    return { eligible: false, reason: 'Purchase was rejected — no reward earned.' }
  }
  if (handoff.status === POS_HANDOFF_STATUS.INTENT_CREATED || handoff.status === POS_HANDOFF_STATUS.PENDING_POS_VERIFICATION) {
    return { eligible: false, reason: 'Purchase reward pending POS3 verification.' }
  }
  return { eligible: false, reason: 'No purchase intent created yet.' }
}

/** Honest summary of what E.A.T. can currently see for this session's handoff. */
export function getSmokeEATHandoffSummary(session) {
  const handoff = ph(session)
  const reward = getSmokePurchaseRewardStatus(session)
  return {
    visibleToManagement: handoff.status !== POS_HANDOFF_STATUS.NOT_STARTED,
    posStatus: handoff.status,
    verificationStatus: handoff.verificationStatus,
    pendingVerification: handoff.status === POS_HANDOFF_STATUS.PENDING_POS_VERIFICATION,
    rewardEligible: reward.eligible,
    rewardReason: reward.reason,
    backendRequired: true,
    backendRequiredReason: 'Cross-venue/multi-session POS verification requires a real backend or shared event store — this is local/session-only until that exists.',
  }
}

/** Honest storage-mode message for UI surfaces — never implies multi-device sync exists. */
export function getSmokeStorageStatusMessage() {
  const mode = getSmokeSharedStorageMode()
  return mode.backendConnected
    ? 'Shared venue storage active.'
    : 'Local fallback active. Shared venue storage pending.'
}

/**
 * Computes the purchaseRewards + eatHandoff fragments that should be
 * persisted alongside a posHandoff update, keyed under
 * session.smokeCraft.purchaseRewards / session.smokeCraft.eatHandoff.
 */
export function getDerivedPurchaseState(sessionWithUpdatedHandoff) {
  const reward = getSmokePurchaseRewardStatus(sessionWithUpdatedHandoff)
  const eat = getSmokeEATHandoffSummary(sessionWithUpdatedHandoff)
  return {
    purchaseRewards: { eligible: reward.eligible, reason: reward.reason },
    eatHandoff: { visibleToManagement: eat.visibleToManagement, backendRequired: eat.backendRequired },
  }
}

/** Honest inventory preview — never deducts real inventory locally. */
export function getSmokeInventoryImpactPreview(session) {
  const handoff = ph(session)
  return {
    productId: handoff.product || null,
    willDeductInventory: false,
    deducted: false,
    reason: 'Inventory deduction requires real POS3/backend confirmation — this preview never deducts inventory locally.',
  }
}
