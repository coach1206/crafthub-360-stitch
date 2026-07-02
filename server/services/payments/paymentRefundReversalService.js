/**
 * Payment Refund and Reversal Service
 * Preview-safe. Cannot complete refunds without Stripe Connect.
 */

import { SPLIT_RATES, toCents, fromCents } from './moneyBridgePaymentEngine.js'
import { isDbAvailable, query } from '../../db/connection.js'

const refundLogsMemory = []

export function calculateSplitReversal(originalAmountCents, refundAmountCents) {
  const ratio = refundAmountCents / (originalAmountCents || 1)
  const commission = Math.round(refundAmountCents * SPLIT_RATES.SMOKECRAFT_COMMISSION)
  const referral = Math.round(refundAmountCents * SPLIT_RATES.VENUE_REFERRAL)
  const partnerReversal2 = refundAmountCents - commission - referral
  return {
    refundAmountCents,
    smokecraftCommissionReversalCents: commission,
    smokecraftCommissionReversalDollars: fromCents(commission),
    venueReferralReversalCents: referral,
    venueReferralReversalDollars: fromCents(referral),
    partnerPayoutReversalCents: partnerReversal2,
    partnerPayoutReversalDollars: fromCents(partnerReversal2),
    refundRatio: ratio,
  }
}

export function previewRefund(orderId, refundPayload) {
  const refundAmountCents = refundPayload.amountCents ?? toCents(refundPayload.amount ?? 0)
  const originalAmountCents = refundPayload.originalAmountCents ?? refundAmountCents
  const reversal = calculateSplitReversal(originalAmountCents, refundAmountCents)
  return {
    ok: true,
    orderId,
    refundType: refundPayload.refundType ?? 'partial',
    ...reversal,
    refundStatus: 'refund_preview',
    processorStatus: 'refund_requires_processor',
    message: 'Refund preview only. Stripe Connect required to process actual refund.',
  }
}

export async function requestRefund(orderId, refundPayload) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      ok: false,
      orderId,
      refundStatus: 'refund_requires_processor',
      message: 'Stripe not configured. Cannot process refund.',
    }
  }

  return {
    ok: false,
    orderId,
    refundStatus: 'refund_requires_processor',
    refundId: null,
    message: 'Refund requires live Stripe payment intent. Not implemented yet.',
  }
}

export async function createRefundLog(payload) {
  const entry = {
    ...payload,
    refund_status: payload.refundStatus ?? 'refund_pending',
    id: `refund-log-${Date.now()}`,
    created_at: new Date().toISOString(),
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO money_bridge_refund_reversal_logs
           (venue_id, partner_id, smokecraft_order_id, payment_intent_id, refund_type,
            refund_amount, smokecraft_commission_reversal, venue_referral_reversal,
            partner_payout_reversal, reason, refund_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          payload.venueId, payload.partnerId, payload.orderId, payload.paymentIntentId,
          payload.refundType ?? 'manual_review', payload.refundAmountCents ?? 0,
          payload.smokecraftCommissionReversalCents ?? 0, payload.venueReferralReversalCents ?? 0,
          payload.partnerPayoutReversalCents ?? 0, payload.reason ?? '',
          payload.refundStatus ?? 'refund_pending',
        ]
      )
      return { ok: true, storageMode: 'postgres', refundStatus: entry.refund_status }
    } catch { /* fallback */ }
  }

  refundLogsMemory.push(entry)
  return {
    ok: true,
    id: entry.id,
    storageMode: 'memory_fallback',
    persistenceStatus: 'preview_fallback',
    refundStatus: entry.refund_status,
  }
}

export async function createReversalLog(payload) {
  return createRefundLog({ ...payload, refundStatus: payload.reversalStatus ?? 'reversal_pending' })
}

export async function getRefundStatus(refundId) {
  const entry = refundLogsMemory.find(e => e.id === refundId)
  return {
    ok: true,
    refundId,
    refundStatus: entry?.refund_status ?? 'refund_pending',
    storageMode: 'memory_fallback',
  }
}

export async function getRefundsForOrder(orderId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        'SELECT * FROM money_bridge_refund_reversal_logs WHERE smokecraft_order_id = $1 ORDER BY created_at DESC',
        [orderId]
      )
      return { ok: true, orderId, refunds: rows, storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const entries = refundLogsMemory.filter(e => e.orderId === orderId)
  return {
    ok: true,
    orderId,
    refunds: entries,
    storageMode: 'memory_fallback',
  }
}
