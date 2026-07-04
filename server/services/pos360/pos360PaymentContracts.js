/**
 * pos360PaymentContracts.js — Phase B.11 Prompt X
 * Enums and validators for POS360 payment, tip, closeout domain.
 */

export const PAYMENT_PROVIDER_TYPES = ['stripe','square','clover','toast','adyen','authorize_net','worldpay','manual','other']
export const TERMINAL_TYPES = ['handheld','tablet','kiosk','counter','external','virtual']
export const TERMINAL_STATUSES = ['active','inactive','maintenance','offline']
export const PAYMENT_INTENT_STATUSES = ['draft','pending_external','authorized_external','captured_external','failed_external','cancelled','unavailable']
export const TENDER_TYPES = ['cash','card_external','gift_card_external','comp','house_account','manual_external','other']
export const PAYMENT_STATUSES = ['pending','marked_paid_external','authorized_external','captured_external','failed_external','refunded_external','partially_refunded_external','voided_external','cancelled']
export const TIP_SELECTION_TYPES = ['preset_percent','custom_amount','no_tip','adjusted','pool']
export const RECEIPT_FORMATS = ['print','email','sms','qr','none']
export const RECEIPT_STATUSES = ['generated','queued','sent_external','delivered_external','failed_external','suppressed']
export const REFUND_STATUSES = ['pending','approved','rejected','completed_external','failed_external','cancelled']
export const VOID_STATUSES = ['pending','approved','rejected','completed_external','failed_external']
export const CASH_DRAWER_STATUSES = ['open','closed','reconciled','discrepancy']
export const CASH_DRAWER_EVENT_TYPES = ['open','close','no_sale','payout','drop','loan','adjustment','reconcile']
export const CLOSEOUT_STATUSES = ['open','in_progress','submitted','manager_approved','discrepancy','closed']
export const RISK_FLAG_LEVELS = ['info','warning','critical']
export const RISK_FLAG_TYPES = ['large_void','large_refund','unusual_tip','multiple_tenders','split_tender_mismatch','manager_override','manual_entry','offline_payment','duplicate_intent','other']

export const isValidProviderType = v => PAYMENT_PROVIDER_TYPES.includes(v)
export const isValidTerminalType = v => TERMINAL_TYPES.includes(v)
export const isValidTerminalStatus = v => TERMINAL_STATUSES.includes(v)
export const isValidPaymentIntentStatus = v => PAYMENT_INTENT_STATUSES.includes(v)
export const isValidTenderType = v => TENDER_TYPES.includes(v)
export const isValidPaymentStatus = v => PAYMENT_STATUSES.includes(v)
export const isValidTipSelectionType = v => TIP_SELECTION_TYPES.includes(v)
export const isValidReceiptFormat = v => RECEIPT_FORMATS.includes(v)
export const isValidReceiptStatus = v => RECEIPT_STATUSES.includes(v)
export const isValidRefundStatus = v => REFUND_STATUSES.includes(v)
export const isValidVoidStatus = v => VOID_STATUSES.includes(v)
export const isValidCashDrawerStatus = v => CASH_DRAWER_STATUSES.includes(v)
export const isValidCashDrawerEventType = v => CASH_DRAWER_EVENT_TYPES.includes(v)
export const isValidCloseoutStatus = v => CLOSEOUT_STATUSES.includes(v)
export const isValidRiskFlagLevel = v => RISK_FLAG_LEVELS.includes(v)
export const isValidRiskFlagType = v => RISK_FLAG_TYPES.includes(v)
