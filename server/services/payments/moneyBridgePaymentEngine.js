/**
 * Money Bridge Payment Engine
 * Calculates splits, tax, delivery fees, and settlement previews.
 * Cannot release money — that requires Stripe Connect.
 */

import { isDbAvailable, query } from '../../db/connection.js'

// Rates — 10% SmokeCraft commission, 5% venue referral, 85% partner payout
export const SPLIT_RATES = {
  SMOKECRAFT_COMMISSION: 0.10,
  VENUE_REFERRAL: 0.05,
  PARTNER_PAYOUT: 0.85,
}

const DELIVERY_ROUTING_FEE_CENTS = 450 // $4.50
const FALLBACK_TAX_RATE = 0.085

// In-memory ledger fallback
const settlementLedgerMemory = []

/** Convert dollar float to integer cents */
export function toCents(dollars) {
  return Math.round(dollars * 100)
}

/** Convert integer cents to dollar float */
export function fromCents(cents) {
  return Math.round(cents) / 100
}

export function calculatePartnerFoodSplit(partnerFoodSubtotalCents) {
  const s = partnerFoodSubtotalCents
  const commission = Math.round(s * SPLIT_RATES.SMOKECRAFT_COMMISSION)
  const referral = Math.round(s * SPLIT_RATES.VENUE_REFERRAL)
  const payout = s - commission - referral // ensure exact sum
  return {
    partnerFoodSubtotalCents: s,
    smokecraftCommissionCents: commission,
    venueReferralCents: referral,
    partnerPayoutCents: payout,
    smokecraftCommissionRate: SPLIT_RATES.SMOKECRAFT_COMMISSION,
    venueReferralRate: SPLIT_RATES.VENUE_REFERRAL,
    partnerPayoutRate: SPLIT_RATES.PARTNER_PAYOUT,
  }
}

export function calculateDeliveryRoutingFee(orderPayload) {
  const hasPartnerItems = (orderPayload.partnerItems ?? []).length > 0
  return {
    deliveryRoutingFeeCents: hasPartnerItems ? DELIVERY_ROUTING_FEE_CENTS : 0,
    deliveryRoutingFeeApplied: hasPartnerItems,
    deliveryRoutingFeeReason: hasPartnerItems
      ? 'partner_food_items_present'
      : 'no_partner_food_items',
  }
}

export function calculateTaxForPayment(orderPayload, venueTaxConfig = null) {
  const partnerSubtotalCents = (orderPayload.partnerItems ?? []).reduce(
    (s, i) => s + toCents(i.price ?? 0) * (i.quantity ?? 1), 0
  )
  const venueSubtotalCents = (orderPayload.venueItems ?? []).reduce(
    (s, i) => s + toCents(i.price ?? 0) * (i.quantity ?? 1), 0
  )
  const deliveryFee = calculateDeliveryRoutingFee(orderPayload).deliveryRoutingFeeCents
  const taxableBase = partnerSubtotalCents + venueSubtotalCents + deliveryFee

  if (!venueTaxConfig) {
    return {
      taxableBaseCents: taxableBase,
      taxRate: FALLBACK_TAX_RATE,
      taxAmountCents: Math.round(taxableBase * FALLBACK_TAX_RATE),
      taxStatus: 'preview_only',
      taxNote: 'No venue tax config found. Preview rate applied. Not tax-compliant.',
    }
  }

  const rate = venueTaxConfig.combined_tax_rate ?? venueTaxConfig.local_tax_rate ?? FALLBACK_TAX_RATE
  return {
    taxableBaseCents: taxableBase,
    taxRate: rate,
    taxAmountCents: Math.round(taxableBase * rate),
    taxStatus: venueTaxConfig.is_verified ? 'venue_config' : 'preview_only',
    taxNote: venueTaxConfig.is_verified
      ? 'Venue tax config applied.'
      : 'Unverified venue tax config. Preview rate applied.',
  }
}

export function calculateMoneyBridgeSplit(orderPayload) {
  const { venueItems = [], partnerItems = [], venueTaxConfig = null } = orderPayload

  const venueSubtotalCents = venueItems.reduce(
    (s, i) => s + toCents(i.price ?? 0) * (i.quantity ?? 1), 0
  )
  const partnerSubtotalCents = partnerItems.reduce(
    (s, i) => s + toCents(i.price ?? 0) * (i.quantity ?? 1), 0
  )

  const split = calculatePartnerFoodSplit(partnerSubtotalCents)
  const delivery = calculateDeliveryRoutingFee(orderPayload)
  const tax = calculateTaxForPayment(orderPayload, venueTaxConfig)

  const totalCustomerChargeCents =
    venueSubtotalCents +
    partnerSubtotalCents +
    delivery.deliveryRoutingFeeCents +
    tax.taxAmountCents

  return {
    venueSubtotalCents,
    venueSubtotalDollars: fromCents(venueSubtotalCents),
    partnerFoodSubtotalCents: partnerSubtotalCents,
    partnerFoodSubtotalDollars: fromCents(partnerSubtotalCents),
    smokecraftCommissionRate: split.smokecraftCommissionRate,
    smokecraftCommissionCents: split.smokecraftCommissionCents,
    smokecraftCommissionDollars: fromCents(split.smokecraftCommissionCents),
    venueReferralRate: split.venueReferralRate,
    venueReferralCents: split.venueReferralCents,
    venueReferralDollars: fromCents(split.venueReferralCents),
    partnerPayoutRate: split.partnerPayoutRate,
    partnerPayoutCents: split.partnerPayoutCents,
    partnerPayoutDollars: fromCents(split.partnerPayoutCents),
    deliveryRoutingFeeCents: delivery.deliveryRoutingFeeCents,
    deliveryRoutingFeeDollars: fromCents(delivery.deliveryRoutingFeeCents),
    deliveryRoutingFeeApplied: delivery.deliveryRoutingFeeApplied,
    taxableBaseCents: tax.taxableBaseCents,
    taxRate: tax.taxRate,
    taxAmountCents: tax.taxAmountCents,
    taxAmountDollars: fromCents(tax.taxAmountCents),
    taxStatus: tax.taxStatus,
    taxNote: tax.taxNote,
    totalCustomerChargeCents,
    totalCustomerChargeDollars: fromCents(totalCustomerChargeCents),
  }
}

export function buildPaymentPreview(orderPayload) {
  const split = calculateMoneyBridgeSplit(orderPayload)
  return {
    ok: true,
    splitCalculation: split,
    settlementStatus: 'settlement_pending_preview',
    paymentStatus: 'payment_preview',
    settlementProcessorStatus: 'processor_integration_required',
    stripeStatus: 'stripe_required',
    message: 'Money Bridge can calculate the split in preview mode, but it cannot release money until Stripe Connect or another payment processor is live.',
    storageMode: 'memory_fallback',
  }
}

export function buildSettlementPreview(orderPayload) {
  const split = calculateMoneyBridgeSplit(orderPayload)
  return {
    ok: true,
    ...split,
    settlementStatus: 'settlement_pending_preview',
    settlementProcessor: 'stripe',
    stripeChargeId: null,
    stripeTransferId: null,
    stripeApplicationFeeId: null,
    transferGroup: null,
    message: 'Settlement preview only. Stripe Connect required for real settlement.',
    storageMode: 'memory_fallback',
  }
}

export function validateSettlementReadiness(orderPayload) {
  const warnings = []
  if (!process.env.STRIPE_SECRET_KEY) {
    warnings.push({ type: 'stripe_keys_missing', severity: 'critical', message: 'Stripe secret key not configured.' })
  }
  if (!process.env.STRIPE_CONNECT_CLIENT_ID) {
    warnings.push({ type: 'stripe_connect_required', severity: 'critical', message: 'Stripe Connect client ID not configured.' })
  }
  return {
    ready: warnings.length === 0,
    warnings,
    settlementStatus: warnings.length > 0 ? 'settlement_pending_preview' : 'settlement_ready',
  }
}

export async function createSettlementLedgerEntry(payload) {
  const entry = {
    ...payload,
    settlement_status: 'settlement_pending_preview',
    id: `ledger-${Date.now()}`,
    created_at: new Date().toISOString(),
  }

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `INSERT INTO money_bridge_settlement_ledger
          (venue_id, partner_id, partner_name, smokecraft_order_id, cart_id, payment_intent_id,
           partner_food_subtotal, smokecraft_commission_rate, venue_referral_rate, partner_payout_rate,
           smokecraft_commission_amount, venue_referral_amount, partner_payout_amount,
           delivery_routing_fee, tax_amount, total_customer_charge, settlement_status, settlement_processor)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING id`,
        [
          payload.venueId, payload.partnerId, payload.partnerName, payload.orderId, payload.cartId,
          payload.paymentIntentId, payload.partnerFoodSubtotalCents, SPLIT_RATES.SMOKECRAFT_COMMISSION,
          SPLIT_RATES.VENUE_REFERRAL, SPLIT_RATES.PARTNER_PAYOUT,
          payload.smokecraftCommissionCents, payload.venueReferralCents, payload.partnerPayoutCents,
          payload.deliveryRoutingFeeCents, payload.taxAmountCents, payload.totalCustomerChargeCents,
          'settlement_pending_preview', 'stripe',
        ]
      )
      return { ok: true, id: rows[0].id, storageMode: 'postgres', settlementStatus: 'settlement_pending_preview' }
    } catch { /* fallback */ }
  }

  settlementLedgerMemory.push(entry)
  return {
    ok: true,
    id: entry.id,
    storageMode: 'memory_fallback',
    persistenceStatus: 'preview_fallback',
    settlementStatus: 'settlement_pending_preview',
    message: 'Settlement ledger entry stored in memory only.',
  }
}

export async function getSettlementStatus(orderId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        'SELECT * FROM money_bridge_settlement_ledger WHERE smokecraft_order_id = $1 ORDER BY created_at DESC LIMIT 1',
        [orderId]
      )
      if (rows[0]) {
        return { ok: true, settlementStatus: rows[0].settlement_status, record: rows[0], storageMode: 'postgres' }
      }
    } catch { /* fallback */ }
  }

  const entry = settlementLedgerMemory.slice().reverse().find(e => e.orderId === orderId)
  return {
    ok: true,
    orderId,
    settlementStatus: entry?.settlement_status ?? 'settlement_pending_preview',
    storageMode: 'memory_fallback',
    message: 'Settlement status from memory fallback.',
  }
}

export async function getMoneyBridgePaymentStatus(orderId) {
  const settlement = await getSettlementStatus(orderId)
  return {
    ok: true,
    orderId,
    paymentStatus: 'payment_preview',
    settlementStatus: settlement.settlementStatus,
    stripeStatus: process.env.STRIPE_SECRET_KEY ? 'stripe_keys_present' : 'stripe_keys_missing',
    storageMode: settlement.storageMode,
  }
}
