// CraftHub Onboarding Contracts — Phase C.6
// contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets

export const ONBOARDING_STATUSES = [
  'not_started',
  'in_progress_placeholder',
  'blocked',
  'complete_placeholder',
  'complete_external',
  'unavailable',
];

export const STEP_STATUSES = [
  'not_started',
  'in_progress_placeholder',
  'complete_placeholder',
  'blocked',
  'skipped',
  'unavailable',
];

export const SETUP_STATUSES = [
  'not_started',
  'configuration_required',
  'configured_placeholder',
  'activation_required',
  'active_placeholder',
  'active_external',
  'blocked',
  'unavailable',
];

export const READINESS_STATUSES = [
  'not_ready',
  'configuration_required',
  'activation_required',
  'provider_required',
  'license_required',
  'billing_required',
  'role_required',
  'ready_placeholder',
  'ready_external',
  'blocked',
  'unavailable',
];

export const BLOCKER_STATUSES = [
  'open',
  'acknowledged',
  'resolved_placeholder',
  'resolved_external',
  'waived_placeholder',
  'unavailable',
];

export const ACTIVATION_STATUSES = [
  'not_active',
  'activation_required',
  'active_placeholder',
  'active_external',
  'blocked',
  'unavailable',
];

export const DEMO_LIVE_MODES = [
  'demo',
  'local_preview',
  'staging_placeholder',
  'production_placeholder',
  'live_external',
  'unavailable',
];

export const PROVIDER_STATUSES = [
  'not_connected',
  'configured_placeholder',
  'connected_external',
  'failed',
  'unavailable',
];

export const ONBOARDING_STEP_KEYS = [
  'organization_setup',
  'venue_profile',
  'workspace_setup',
  'business_units',
  'departments',
  'locations',
  'roles_permissions',
  'staff_invites',
  'module_selection',
  'pos360_setup',
  'smokecraft_setup',
  'pourcraft_setup',
  'eat_setup',
  'passport_connections_setup',
  'loyalty_rewards_setup',
  'inventory_setup',
  'menu_setup',
  'fulfillment_areas',
  'tables_patio',
  'payment_provider',
  'billing_license',
  'security_setup',
  'demo_live_mode',
  'readiness_review',
  'launch_precheck',
];

export const MODULE_SETUP_KEYS = [
  'pos360',
  'smokecraft',
  'pourcraft',
  'eat_system',
  'passport_connections',
  'loyalty_rewards',
  'inventory',
  'menu',
  'fulfillment',
  'tables_patio',
  'reports',
  'integrations',
];

export const BLOCKER_TYPES = [
  'configuration_missing',
  'provider_required',
  'license_required',
  'billing_required',
  'role_required',
  'security_required',
  'data_required',
  'activation_required',
  'deployment_required',
  'custom',
];

export function isValidOnboardingStatus(s) {
  return typeof s === 'string' && ONBOARDING_STATUSES.includes(s);
}

export function isValidStepStatus(s) {
  return typeof s === 'string' && STEP_STATUSES.includes(s);
}

export function isValidSetupStatus(s) {
  return typeof s === 'string' && SETUP_STATUSES.includes(s);
}

export function isValidReadinessStatus(s) {
  return typeof s === 'string' && READINESS_STATUSES.includes(s);
}

export function isValidBlockerStatus(s) {
  return typeof s === 'string' && BLOCKER_STATUSES.includes(s);
}

export function isValidActivationStatus(s) {
  return typeof s === 'string' && ACTIVATION_STATUSES.includes(s);
}

export function isValidDemoLiveMode(s) {
  return typeof s === 'string' && DEMO_LIVE_MODES.includes(s);
}

export function isValidProviderStatus(s) {
  return typeof s === 'string' && PROVIDER_STATUSES.includes(s);
}

export function isValidOnboardingStepKey(s) {
  return typeof s === 'string' && ONBOARDING_STEP_KEYS.includes(s);
}

export function isValidModuleSetupKey(s) {
  return typeof s === 'string' && MODULE_SETUP_KEYS.includes(s);
}

export function isValidBlockerType(s) {
  return typeof s === 'string' && BLOCKER_TYPES.includes(s);
}
