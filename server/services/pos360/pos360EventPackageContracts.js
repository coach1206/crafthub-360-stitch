/**
 * pos360EventPackageContracts.js — Phase B.10 Prompt W
 * Event package, deposit, minimum spend, contract, and monetization constants.
 */

export const PACKAGE_CATEGORY_TYPES = {
  KITCHEN:       'kitchen',
  BAR:           'bar',
  HUMIDOR:       'humidor',
  CIGAR:         'cigar',
  LOUNGE:        'lounge',
  PATIO:         'patio',
  ROOM:          'room',
  SERVICE:       'service',
  ENTERTAINMENT: 'entertainment',
  CUSTOM:        'custom',
  OTHER:         'other',
}

export const PRICING_MODELS = {
  FLAT_FEE:        'flat_fee',
  PER_PERSON:      'per_person',
  TIERED:          'tiered',
  MINIMUM_SPEND:   'minimum_spend',
  CUSTOM_QUOTE:    'custom_quote',
}

export const PACKAGE_STATUSES = {
  DRAFT:    'draft',
  ACTIVE:   'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
}

export const PACKAGE_SELECTION_STATUSES = {
  DRAFT:     'draft',
  PROPOSED:  'proposed',
  APPROVED:  'approved',
  DECLINED:  'declined',
  CANCELLED: 'cancelled',
  LOCKED:    'locked',
}

export const APPROVAL_STATUSES = {
  PENDING:   'pending',
  APPROVED:  'approved',
  REJECTED:  'rejected',
  CANCELLED: 'cancelled',
}

export const DEPOSIT_STATUSES = {
  NOT_REQUIRED:       'not_required',
  PENDING:            'pending',
  MARKED_PAID_EXTERNAL: 'marked_paid_external',
  WAIVED:             'waived',
  REFUNDED_EXTERNAL:  'refunded_external',
  FAILED:             'failed',
  CANCELLED:          'cancelled',
}

export const CONTRACT_STATUSES = {
  DRAFT:               'draft',
  GENERATED_PLACEHOLDER: 'generated_placeholder',
  SENT_EXTERNAL:       'sent_external',
  VIEWED_EXTERNAL:     'viewed_external',
  SIGNED_EXTERNAL:     'signed_external',
  DECLINED_EXTERNAL:   'declined_external',
  EXPIRED:             'expired',
  CANCELLED:           'cancelled',
}

export const MINIMUM_SPEND_SOURCES = {
  NONE:                   'none',
  LINKED_POS_ORDERS:      'linked_pos_orders',
  MANUAL_MANAGER_CREDIT:  'manual_manager_credit',
  IMPORTED:               'imported',
  EXTERNAL:               'external',
}

export const FORECAST_TYPES = {
  KITCHEN:  'kitchen',
  BAR:      'bar',
  HUMIDOR:  'humidor',
  CIGAR:    'cigar',
  STAFFING: 'staffing',
  SUPPLIES: 'supplies',
  ROOM:     'room',
  OTHER:    'other',
}

export const APPROVAL_TYPES = {
  PACKAGE_DISCOUNT:         'package_discount',
  CUSTOM_PACKAGE:           'custom_package',
  DEPOSIT_WAIVER:           'deposit_waiver',
  DEPOSIT_REFUND:           'deposit_refund',
  MINIMUM_SPEND_OVERRIDE:   'minimum_spend_override',
  SIGNED_CONTRACT_CHANGE:   'signed_contract_change',
  CANCELLATION_FEE_WAIVER:  'cancellation_fee_waiver',
  PACKAGE_PRICE_OVERRIDE:   'package_price_override',
}

export const MONETIZATION_INSIGHT_TYPES = {
  PACKAGE_REVENUE:              'package_revenue',
  DEPOSIT_RISK:                 'deposit_risk',
  MINIMUM_SPEND_RISK:           'minimum_spend_risk',
  EVENT_PROFITABILITY_PLACEHOLDER: 'event_profitability_placeholder',
  KITCHEN_DEMAND:               'kitchen_demand',
  BAR_DEMAND:                   'bar_demand',
  HUMIDOR_DEMAND:               'humidor_demand',
  CIGAR_DEMAND:                 'cigar_demand',
  STAFFING_DEMAND:              'staffing_demand',
  CANCELLATION_RISK:            'cancellation_risk',
  SERVICE_RECOVERY_RISK:        'service_recovery_risk',
  UPSELL_OPPORTUNITY:           'upsell_opportunity',
}

const _pkgCatVals = new Set(Object.values(PACKAGE_CATEGORY_TYPES))
const _pricingVals = new Set(Object.values(PRICING_MODELS))
const _pkgSelVals = new Set(Object.values(PACKAGE_SELECTION_STATUSES))
const _approvalVals = new Set(Object.values(APPROVAL_STATUSES))
const _depositVals = new Set(Object.values(DEPOSIT_STATUSES))
const _contractVals = new Set(Object.values(CONTRACT_STATUSES))
const _minSpendVals = new Set(Object.values(MINIMUM_SPEND_SOURCES))
const _forecastVals = new Set(Object.values(FORECAST_TYPES))
const _approvalTypeVals = new Set(Object.values(APPROVAL_TYPES))
const _insightVals = new Set(Object.values(MONETIZATION_INSIGHT_TYPES))

export function isValidPackageCategoryType(v) { return _pkgCatVals.has(v) }
export function isValidPricingModel(v) { return _pricingVals.has(v) }
export function isValidPackageSelectionStatus(v) { return _pkgSelVals.has(v) }
export function isValidApprovalStatus(v) { return _approvalVals.has(v) }
export function isValidDepositStatus(v) { return _depositVals.has(v) }
export function isValidContractStatus(v) { return _contractVals.has(v) }
export function isValidMinimumSpendSource(v) { return _minSpendVals.has(v) }
export function isValidForecastType(v) { return _forecastVals.has(v) }
export function isValidApprovalType(v) { return _approvalTypeVals.has(v) }
export function isValidMonetizationInsightType(v) { return _insightVals.has(v) }
