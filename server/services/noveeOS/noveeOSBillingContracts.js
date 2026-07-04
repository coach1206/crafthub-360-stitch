// Phase C.3 / Module 3 of 7 — NOVEE OS Billing Contracts

export const PLAN_STATUSES = ['draft','available_placeholder','active_placeholder','disabled','deprecated','unavailable'];
export const TIER_STATUSES = ['draft','available_placeholder','active_placeholder','disabled','unavailable'];
export const FEATURE_GATE_STATUSES = ['locked','unlocked_placeholder','enabled_placeholder','disabled','unavailable'];
export const TRIAL_STATUSES = ['not_started','active_placeholder','expired_placeholder','converted_external','cancelled','unavailable'];
export const LICENSE_STATUSES = ['not_licensed','license_required_placeholder','active_placeholder','verified_external','expired_placeholder','suspended','unavailable'];
export const BILLING_STATUSES = ['not_connected','configured_placeholder','connected_external','failed','unavailable'];
export const SUBSCRIPTION_STATUSES = ['not_started','active_placeholder','active_external','past_due_placeholder','cancelled_placeholder','cancelled_external','unavailable'];
export const INVOICE_STATUSES = ['draft_placeholder','open_placeholder','paid_external','failed_external','void_placeholder','unavailable'];
export const PAYMENT_STATUSES = ['not_processed','pending_external','processed_external','failed_external','unavailable'];
export const ENTITLEMENT_STATUSES = ['not_active','active_placeholder','active_external','expired','revoked','unavailable'];
export const REQUEST_STATUSES = ['draft','pending_review','approved_placeholder','completed_external','rejected','cancelled','unavailable'];
export const HEALTH_STATUSES = ['unknown','healthy_placeholder','degraded','failed','unavailable'];

export const BILLING_PROVIDER_KEYS = ['stripe','square','clover','quickbooks','xero','manual_invoice','platform_placeholder','other'];
export const PLAN_KEYS = ['free','starter','growth','pro','enterprise','white_label','custom'];
export const BILLING_INTERVALS = ['none','monthly','quarterly','annual','one_time','usage_based_placeholder','custom'];
export const ADDON_TYPES = ['module_addon','seat_addon','venue_addon','workspace_addon','storage_addon','support_addon','white_label_addon','custom'];
export const ACCESS_DECISION_TYPES = ['allowed_placeholder','blocked_plan_required','blocked_license_required','blocked_trial_expired','blocked_billing_required','blocked_seat_limit','blocked_module_disabled','blocked_admin_required','unavailable'];

export const isValidPlanStatus            = s => PLAN_STATUSES.includes(s);
export const isValidTierStatus            = s => TIER_STATUSES.includes(s);
export const isValidFeatureGateStatus     = s => FEATURE_GATE_STATUSES.includes(s);
export const isValidTrialStatus           = s => TRIAL_STATUSES.includes(s);
export const isValidLicenseStatus         = s => LICENSE_STATUSES.includes(s);
export const isValidBillingStatus         = s => BILLING_STATUSES.includes(s);
export const isValidSubscriptionStatus    = s => SUBSCRIPTION_STATUSES.includes(s);
export const isValidInvoiceStatus         = s => INVOICE_STATUSES.includes(s);
export const isValidPaymentStatus         = s => PAYMENT_STATUSES.includes(s);
export const isValidEntitlementStatus     = s => ENTITLEMENT_STATUSES.includes(s);
export const isValidRequestStatus         = s => REQUEST_STATUSES.includes(s);
export const isValidHealthStatus          = s => HEALTH_STATUSES.includes(s);
export const isValidBillingProviderKey    = k => BILLING_PROVIDER_KEYS.includes(k);
export const isValidPlanKey               = k => PLAN_KEYS.includes(k);
export const isValidBillingInterval       = i => BILLING_INTERVALS.includes(i);
export const isValidAddonType             = t => ADDON_TYPES.includes(t);
export const isValidAccessDecisionType    = t => ACCESS_DECISION_TYPES.includes(t);
