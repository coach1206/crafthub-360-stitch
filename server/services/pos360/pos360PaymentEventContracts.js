/**
 * POS360 Payments — Event Contracts (Phase B.7)
 */

export const PAYMENT_EVENTS = {
  // Intent
  INTENT_CREATED:             'payment.intent.created',
  INTENT_CANCELED:            'payment.intent.canceled',
  INTENT_FAILED:              'payment.intent.failed',
  INTENT_PROVIDER_REQUIRED:   'payment.intent.provider_required',

  // Payment
  PAYMENT_CREATED:            'payment.created',
  PAYMENT_STATUS_CHANGED:     'payment.status_changed',
  PAYMENT_APPLIED_TO_ORDER:   'payment.applied_to_order',
  PAYMENT_APPLIED_TO_CHECK:   'payment.applied_to_check',
  PAYMENT_APPLIED_TO_TAB:     'payment.applied_to_tab',
  PAYMENT_PARTIALLY_PAID:     'payment.partially_paid',
  PAYMENT_PAID:               'payment.paid',
  PAYMENT_FAILED:             'payment.failed',
  PAYMENT_DUPLICATE_BLOCKED:  'payment.duplicate_blocked',
  PAYMENT_ABANDONED:          'payment.abandoned',

  // Split
  SPLIT_CREATED:              'payment.split.created',
  SPLIT_TENDER_ADDED:         'payment.split.tender_added',
  SPLIT_TENDER_REMOVED:       'payment.split.tender_removed',
  SPLIT_COMPLETED:            'payment.split.completed',

  // Tip
  TIP_SELECTED:               'payment.tip.selected',
  TIP_UPDATED:                'payment.tip.updated',
  TIP_REMOVED:                'payment.tip.removed',
  TIP_ADJUSTED:               'payment.tip.adjusted',

  // Signature
  SIGNATURE_CAPTURED:         'payment.signature.captured',
  SIGNATURE_SKIPPED:          'payment.signature.skipped',
  SIGNATURE_QUEUED_OFFLINE:   'payment.signature.queued_offline',

  // Receipt
  RECEIPT_PREVIEW_GENERATED:  'payment.receipt.preview_generated',
  RECEIPT_EMAIL_QUEUED:       'payment.receipt.email_queued',
  RECEIPT_SMS_QUEUED:         'payment.receipt.sms_queued',
  RECEIPT_PRINT_QUEUED:       'payment.receipt.print_queued',

  // Refund
  REFUND_REQUESTED:           'payment.refund.requested',
  REFUND_APPROVED:            'payment.refund.approved',
  REFUND_DENIED:              'payment.refund.denied',
  REFUND_FAILED:              'payment.refund.failed',
  REFUND_COMPLETED:           'payment.refund.completed',

  // Void
  VOID_REQUESTED:             'payment.void.requested',
  VOID_APPROVED:              'payment.void.approved',
  VOID_DENIED:                'payment.void.denied',
  VOID_COMPLETED:             'payment.void.completed',

  // Settlement
  SETTLEMENT_BATCH_CREATED:   'payment.settlement.batch_created',
  SETTLEMENT_BATCH_CLOSED:    'payment.settlement.batch_closed',
  SETTLEMENT_BATCH_FAILED:    'payment.settlement.batch_failed',
  SETTLEMENT_EOD_HOOK:        'payment.settlement.end_of_day',

  // Cash
  CASH_RECORDED:              'payment.cash.recorded',
  CASH_DRAWER_VARIANCE:       'payment.cash_drawer.variance_detected',
  CASH_PAID_IN:               'payment.cash.paid_in',
  CASH_PAID_OUT:              'payment.cash.paid_out',
  CASH_DROP:                  'payment.cash.drop',

  // Provider
  PROVIDER_EVENT_RECORDED:    'payment.provider.event_recorded',
  PROVIDER_DISCONNECTED:      'payment.provider.disconnected',

  // Offline
  OFFLINE_QUEUED:             'payment.offline.queued',
  OFFLINE_REPLAY_VALIDATED:   'payment.offline.replay_validated',
  OFFLINE_CONFLICT_DETECTED:  'payment.offline.conflict_detected',

  // E.A.T.
  EAT_ALERT_CREATED:          'payment.eat.alert_created',

  // Localization
  LANGUAGE_CHANGED:           'payment.language.changed',
  TRANSLATION_MISSING_KEY:    'payment.translation.missing_key',

  // Audit
  AUDIT_RECORDED:             'payment.audit.recorded',
}

export const PAYMENT_METHODS = [
  'credit_card',
  'debit_card',
  'apple_pay',
  'google_pay',
  'tap_to_pay',
  'gift_card',
  'house_account',
  'cash',
  'split_payment',
  'partial_payment',
  'comp_hook',
  'loyalty_reward_hook',
  'deposit_hook',
  'custom_provider',
]

export const PAYMENT_STATUSES = [
  'not_started',
  'intent_created',
  'pending',
  'authorized_hook',
  'partially_paid',
  'paid',
  'failed',
  'canceled',
  'voided',
  'refunded',
  'partially_refunded',
  'settlement_pending',
  'settled',
  'offline_queued',
  'review_required',
]

export const TIP_TYPES = [
  'none',
  'percentage',
  'custom',
  'auto_gratuity',
  'service_charge',
]

export const TIP_PRESETS_DEFAULT = [15, 18, 20, 25]

export const REFUND_TYPES   = ['full', 'partial', 'item']
export const REFUND_STATUSES = ['requested', 'pending_approval', 'approved', 'denied', 'completed', 'failed']

export const VOID_TYPES    = ['standard', 'same_day']
export const VOID_STATUSES = ['requested', 'pending_approval', 'approved', 'denied', 'completed', 'failed']

export const SETTLEMENT_STATUSES = ['open', 'pending', 'closed', 'failed']

export const CASH_DRAWER_EVENT_TYPES = [
  'payment',
  'paid_in',
  'paid_out',
  'cash_drop',
  'opening_count',
  'closing_count',
  'over_short',
]

export const EAT_PAYMENT_ALERT_TYPES = [
  'payment_failure',
  'refund_alert',
  'void_alert',
  'settlement_summary',
  'payment_risk',
  'abandoned_payment',
  'cash_drawer_variance',
  'tip_summary',
  'service_charge_summary',
  'revenue_summary',
  'provider_disconnected',
  'offline_payment_risk',
]

export const MANAGER_REVIEW_TRIGGERS = [
  'refund',
  'void',
  'discount',
  'comp',
  'service_charge_override',
  'payment_override',
  'cash_drawer_variance',
  'high_value_payment',
]

export const SUPPORTED_LANGUAGES = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt']
export const DEFAULT_LANGUAGE    = 'en-US'
