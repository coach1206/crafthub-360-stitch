/**
 * Partner Commission Agreement Service
 * Manages commercial split agreements between SmokeCraft, venues, and partner vendors.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const agreementStore = new Map() // key: agreementId
const partnerAgreementIndex = new Map() // key: `${partnerId}::${venueId ?? 'global'}`

const DEFAULT_RATES = {
  smokecraft_commission_rate: 0.10,
  venue_referral_rate: 0.05,
  partner_payout_rate: 0.85,
  routing_fee: 450,
}

export async function createCommissionAgreement(partnerId, payload) {
  const agreementId = payload.agreementId ?? `agr-${partnerId}-${Date.now()}`
  const agreement = {
    agreement_id: agreementId,
    partner_id: partnerId,
    venue_id: payload.venueId ?? null,
    agreement_type: payload.agreementType ?? 'partner_food_specials',
    smokecraft_commission_rate: payload.smokecraftCommissionRate ?? DEFAULT_RATES.smokecraft_commission_rate,
    venue_referral_rate: payload.venueReferralRate ?? DEFAULT_RATES.venue_referral_rate,
    partner_payout_rate: payload.partnerPayoutRate ?? DEFAULT_RATES.partner_payout_rate,
    routing_fee: payload.routingFee ?? DEFAULT_RATES.routing_fee,
    tax_handling_status: 'tax_preview',
    agreement_status: payload.agreementStatus ?? 'draft',
    starts_at: payload.startsAt ?? null,
    ends_at: payload.endsAt ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: payload.createdBy ?? 'system',
  }

  agreementStore.set(agreementId, agreement)
  partnerAgreementIndex.set(`${partnerId}::${payload.venueId ?? 'global'}`, agreementId)

  return { ok: true, agreement, storageMode: 'memory_fallback', persistenceStatus: 'preview_fallback' }
}

export async function updateCommissionAgreement(agreementId, payload) {
  const existing = agreementStore.get(agreementId)
  if (!existing) return { ok: false, message: `Agreement ${agreementId} not found.` }
  const updated = { ...existing, ...payload, agreement_id: agreementId, updated_at: new Date().toISOString() }
  agreementStore.set(agreementId, updated)
  return { ok: true, agreement: updated, storageMode: 'memory_fallback' }
}

export async function getCommissionAgreement(partnerId, venueId = null) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `SELECT * FROM partner_vendor_commission_agreements WHERE partner_id=$1 ${venueId ? 'AND venue_id=$2' : ''} ORDER BY created_at DESC LIMIT 1`,
        venueId ? [partnerId, venueId] : [partnerId]
      )
      if (rows[0]) return { ok: true, agreement: rows[0], storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const idx = partnerAgreementIndex.get(`${partnerId}::${venueId ?? 'global'}`)
    ?? partnerAgreementIndex.get(`${partnerId}::global`)
  const agreement = idx ? (agreementStore.get(idx) ?? null) : null
  return {
    ok: true,
    agreement,
    agreementStatus: agreement?.agreement_status ?? 'agreement_required',
    storageMode: 'memory_fallback',
  }
}

export async function getActiveCommissionAgreement(partnerId, venueId = null) {
  const result = await getCommissionAgreement(partnerId, venueId)
  if (!result.agreement || result.agreement.agreement_status !== 'active') {
    return { ok: false, agreementStatus: result.agreement?.agreement_status ?? 'agreement_required',
      message: 'No active commission agreement found.' }
  }
  return { ok: true, agreement: result.agreement, storageMode: result.storageMode }
}

export async function validateCommissionAgreement(partnerId, venueId = null) {
  const result = await getActiveCommissionAgreement(partnerId, venueId)
  if (!result.ok) {
    return { valid: false, agreementStatus: result.agreementStatus, reason: 'agreement_required' }
  }
  const a = result.agreement
  const ratesSum = a.smokecraft_commission_rate + a.venue_referral_rate + a.partner_payout_rate
  const ratesValid = Math.abs(ratesSum - 1.0) < 0.001
  return {
    valid: ratesValid,
    agreementStatus: 'active',
    ratesSum,
    ratesValid,
    smokecraftCommissionRate: a.smokecraft_commission_rate,
    venueReferralRate: a.venue_referral_rate,
    partnerPayoutRate: a.partner_payout_rate,
    routingFee: a.routing_fee,
  }
}

export async function calculateAgreementSplit(partnerId, venueId, subtotalCents) {
  const result = await getActiveCommissionAgreement(partnerId, venueId)

  const rates = result.ok ? result.agreement : DEFAULT_RATES
  const commission = Math.round(subtotalCents * rates.smokecraft_commission_rate)
  const referral = Math.round(subtotalCents * rates.venue_referral_rate)
  const payout = subtotalCents - commission - referral
  const routingFee = rates.routing_fee ?? DEFAULT_RATES.routing_fee

  return {
    partnerId,
    venueId,
    subtotalCents,
    smokecraftCommissionCents: commission,
    venueReferralCents: referral,
    partnerPayoutCents: payout,
    routingFeeCents: routingFee,
    agreementSource: result.ok ? 'active_agreement' : 'default_rates',
    settlementStatus: 'settlement_pending_preview',
  }
}

export async function pauseCommissionAgreement(agreementId) {
  return updateCommissionAgreement(agreementId, { agreement_status: 'paused' })
}

export async function cancelCommissionAgreement(agreementId) {
  return updateCommissionAgreement(agreementId, { agreement_status: 'cancelled' })
}
