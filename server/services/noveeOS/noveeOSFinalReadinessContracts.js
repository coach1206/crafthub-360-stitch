// Phase C.7 — NOVEE OS Final Readiness Contracts
// contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets

export const READINESS_STATUSES = [
  'not_checked', 'foundation_ready', 'contract_ready', 'placeholder_ready',
  'configuration_required', 'provider_activation_required', 'license_required',
  'billing_required', 'security_required', 'deployment_required',
  'blocked', 'not_live', 'live_external', 'unavailable',
];

export const LAUNCH_STATUSES = [
  'not_started', 'foundation_locked', 'launch_blocked', 'activation_required',
  'production_placeholder', 'production_live_external', 'unavailable',
];

export const AUDIT_STATUSES = [
  'not_started', 'in_progress', 'passed_placeholder', 'failed', 'review_required', 'unavailable',
];

export const BLOCKER_STATUSES = [
  'open', 'acknowledged', 'resolved_placeholder', 'resolved_external', 'waived_placeholder', 'unavailable',
];

export const ACTIVATION_STATUSES = [
  'not_active', 'activation_required', 'active_placeholder', 'active_external', 'blocked', 'unavailable',
];

export const DEMO_LIVE_MODES = [
  'demo', 'local_preview', 'staging_placeholder', 'production_placeholder', 'live_external', 'unavailable',
];

export const CLAIM_STATUSES = [
  'safe', 'unsafe', 'conditional', 'not_allowed', 'unavailable',
];

export const PHASE_KEYS = [
  'c1_module_registry',
  'c2_tenant_governance',
  'c3_billing_gates',
  'c4_security_governance',
  'c5_crafthub_dashboard',
  'c6_venue_onboarding',
  'c7_final_launch_lock',
  'pos360_phase_b',
  'smokecraft_foundation',
  'future_phase_c_provider_activation',
];

export const MODULE_KEYS = [
  'novee_os', 'crafthub', 'pos360', 'smokecraft', 'pourcraft', 'eat_system',
  'passport_connections', 'loyalty_rewards', 'inventory', 'reports',
  'external_integrations', 'marketplace', 'provider_activation', 'deployment', 'custom',
];

export const AUDIT_CATEGORIES = [
  'database', 'api_routes', 'frontend_routes', 'guards', 'feature_flags', 'locales',
  'services', 'controllers', 'verification', 'build', 'documentation', 'security',
  'billing', 'marketplace', 'provider_activation', 'deployment',
  'safe_claims', 'no_fake_claims', 'custom',
];

export function isValidReadinessStatus(s) { return typeof s === 'string' && READINESS_STATUSES.includes(s); }
export function isValidLaunchStatus(s)    { return typeof s === 'string' && LAUNCH_STATUSES.includes(s); }
export function isValidAuditStatus(s)     { return typeof s === 'string' && AUDIT_STATUSES.includes(s); }
export function isValidBlockerStatus(s)   { return typeof s === 'string' && BLOCKER_STATUSES.includes(s); }
export function isValidActivationStatus(s){ return typeof s === 'string' && ACTIVATION_STATUSES.includes(s); }
export function isValidDemoLiveMode(s)    { return typeof s === 'string' && DEMO_LIVE_MODES.includes(s); }
export function isValidClaimStatus(s)     { return typeof s === 'string' && CLAIM_STATUSES.includes(s); }
export function isValidPhaseKey(s)        { return typeof s === 'string' && PHASE_KEYS.includes(s); }
export function isValidModuleKey(s)       { return typeof s === 'string' && MODULE_KEYS.includes(s); }
export function isValidAuditCategory(s)   { return typeof s === 'string' && AUDIT_CATEGORIES.includes(s); }
