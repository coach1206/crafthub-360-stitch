/**
 * POS360 Payments — Feature Flags (Phase B.7)
 */

export const POS360_PAYMENT_FLAGS = {
  'pos360.payments.enabled':                      true,
  'pos360.payments.provider_abstraction_enabled': true,
  'pos360.payments.credit_card_enabled':          true,
  'pos360.payments.debit_card_enabled':           true,
  'pos360.payments.apple_pay_enabled':            true,
  'pos360.payments.google_pay_enabled':           true,
  'pos360.payments.tap_to_pay_enabled':           true,
  'pos360.payments.gift_card_enabled':            true,
  'pos360.payments.house_account_enabled':        true,
  'pos360.payments.cash_enabled':                 true,
  'pos360.payments.split_payments_enabled':       true,
  'pos360.payments.partial_payments_enabled':     true,
  'pos360.payments.tips_enabled':                 true,
  'pos360.payments.signature_enabled':            true,
  'pos360.payments.receipts_enabled':             true,
  'pos360.payments.refunds_enabled':              true,
  'pos360.payments.voids_enabled':                true,
  'pos360.payments.settlement_enabled':           true,
  'pos360.payments.cash_drawer_enabled':          true,
  'pos360.payments.offline_queue_enabled':        true,
  'pos360.payments.eat_alerts_enabled':           true,
  'pos360.payments.localization_enabled':         true,
  'pos360.payments.audit_enabled':                true,
}

export function getPaymentFlags(venueOverrides = {}) {
  let envOverrides = {}
  try {
    if (process.env.POS360_PAYMENT_FLAGS_JSON) {
      envOverrides = JSON.parse(process.env.POS360_PAYMENT_FLAGS_JSON)
    }
  } catch { /* ignore malformed env override */ }

  return { ...POS360_PAYMENT_FLAGS, ...envOverrides, ...venueOverrides }
}
