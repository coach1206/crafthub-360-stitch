// Phase D.1 — Provider Activation Contracts & Validators
// contains_secrets: false, stores_secrets: false

export const PROVIDER_CATEGORIES = [
  'payments','billing','external_pos','inventory','menu_import',
  'bar_inventory','kitchen_inventory','humidor_inventory','kds_printer',
  'guest_notifications','staff_notifications','email','sms','sso','mfa',
  'device_trust','ip_allowlist','deployment','domain','white_label',
  'custom_domain','marketplace','smokecraft_sync','eat_automation',
  'reporting_analytics','tax_engine','payroll_accounting','manual_fallback','custom',
];

export const ACTIVATION_STATUSES = [
  'not_started','placeholder','credentials_required','configuration_required',
  'provider_required','activation_required','ready_for_test_placeholder',
  'test_required','verification_required','active_external','blocked','failed','unavailable',
];

export const CREDENTIAL_STATUSES = [
  'not_requested','requested_placeholder','received_placeholder',
  'verified_external','rejected','unavailable',
];

export const TEST_STATUSES = [
  'not_started','test_plan_ready','test_required','passed_placeholder',
  'passed_external','failed','unavailable',
];

export const VERIFICATION_STATUSES = [
  'not_started','verification_required','passed_placeholder',
  'passed_external','failed','unavailable',
];

export const READINESS_STATUSES = [
  'not_ready','foundation_ready','contract_ready','provider_required',
  'credentials_required','configuration_required','test_required',
  'verification_required','activation_required','ready_placeholder',
  'live_external','blocked','unavailable',
];

export const ROLLBACK_STATUSES = [
  'not_ready','rollback_plan_required','rollback_ready_placeholder',
  'rollback_ready_external','rollback_triggered','unavailable',
];

export const DEMO_LIVE_MODES = [
  'demo','local_preview','staging_placeholder','production_placeholder',
  'live_external','unavailable',
];

export const BLOCKER_STATUSES = ['active','resolved','deferred','unavailable'];

export const REQUIREMENT_STATUSES = [
  'not_started','in_progress','in_review','approved','signed','complete','rejected','unavailable',
];

export const CLAIM_STATUSES = ['safe','conditional','not_safe','unavailable'];

export const PROVIDER_KEYS = [
  'stripe','square','clover','toast','lightspeed','oracle_micros','spoton',
  'quickbooks','xero','twilio','sendgrid','mailgun','auth0','okta',
  'google_workspace','railway','github','custom_domain','manual_csv',
  'webhook_generic','api_generic','printer_generic','kds_generic',
  'taxjar','avalara','custom',
];

export const isValidProviderCategory    = v => PROVIDER_CATEGORIES.includes(v);
export const isValidActivationStatus    = v => ACTIVATION_STATUSES.includes(v);
export const isValidCredentialStatus    = v => CREDENTIAL_STATUSES.includes(v);
export const isValidTestStatus          = v => TEST_STATUSES.includes(v);
export const isValidVerificationStatus  = v => VERIFICATION_STATUSES.includes(v);
export const isValidReadinessStatus     = v => READINESS_STATUSES.includes(v);
export const isValidRollbackStatus      = v => ROLLBACK_STATUSES.includes(v);
export const isValidDemoLiveMode        = v => DEMO_LIVE_MODES.includes(v);
export const isValidBlockerStatus       = v => BLOCKER_STATUSES.includes(v);
export const isValidRequirementStatus   = v => REQUIREMENT_STATUSES.includes(v);
export const isValidClaimStatus         = v => CLAIM_STATUSES.includes(v);
export const isValidProviderKey         = v => PROVIDER_KEYS.includes(v);
