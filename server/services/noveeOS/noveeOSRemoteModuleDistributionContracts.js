// Phase E.6 — NOVEE OS Remote Module Distribution Contracts
// Enforcement: no fake delivery, no fake provisioning, no raw secrets

export const ALLOWED_PACKAGE_TYPES = [
  'platform_core', 'craft_bundle', 'venue_bundle', 'client_bundle',
  'smoke_craft_bundle', 'pos_bundle', 'eat_bundle', 'passport_bundle',
  'preview_bundle', 'production_candidate_bundle',
]

export const ALLOWED_PACKAGE_STATUSES = [
  'draft', 'pending_review', 'approved', 'rejected', 'archived',
  'preview_ready', 'pilot_ready', 'production_candidate', 'production',
]

export const ALLOWED_CLIENT_TYPES = [
  'venue', 'cigar_lounge', 'bar', 'restaurant', 'hotel', 'resort',
  'private_club', 'event_space', 'internal_demo', 'pilot_client',
  'reseller', 'partner', 'other',
]

export const ALLOWED_PROVISIONING_STATUSES = [
  'pending', 'under_review', 'approved', 'rejected', 'cancelled',
  'provisioning', 'provisioned', 'suspended', 'revoked',
]

export const ALLOWED_INVITE_STATUSES = [
  'draft', 'pending', 'sent', 'accepted', 'expired', 'revoked', 'cancelled',
]

export const ALLOWED_INVITE_TYPES = [
  'pilot', 'demo', 'onboarding', 'client_activation', 'partner', 'internal',
]

export const ALLOWED_LICENSE_TYPES = [
  'pilot', 'demo', 'trial', 'standard', 'enterprise', 'partner', 'internal',
]

export const ALLOWED_LICENSE_STATUSES = [
  'draft', 'pending', 'active', 'suspended', 'revoked', 'expired', 'archived',
]

export const ALLOWED_ACTIVATION_MODES = [
  'preview', 'pilot', 'internal_demo', 'client_pending', 'client_active',
  'production_candidate', 'production',
]

export const ALLOWED_ACTIVATION_STATUSES = [
  'pending', 'preview', 'pilot_active', 'client_active', 'suspended',
  'revoked', 'production_active', 'archived',
]

export const ALLOWED_VERSION_STATUSES = [
  'draft', 'pending_review', 'approved', 'deployed', 'rolled_back', 'archived',
]

export const ALLOWED_ROLLBACK_STATUSES = [
  'not_initiated', 'planned', 'approved', 'executing', 'completed', 'failed', 'cancelled',
]

export const SAFE_REMOTE_DISTRIBUTION_CLAIMS = [
  'remote_module_distribution_center_exists',
  'module_deployment_package_record_exists',
  'client_provisioning_request_record_exists',
  'invite_session_record_exists',
  'license_key_record_exists',
  'module_activation_record_exists',
  'deployment_version_record_exists',
  'rollback_record_exists',
  'remote_distribution_tracking_active',
]

export const FORBIDDEN_FAKE_REMOTE_DELIVERY_CLAIMS = [
  'remote_delivery_live', 'live_delivery_active', 'modules_delivered_remotely',
  'remote_distribution_complete', 'distribution_confirmed',
]

export const FORBIDDEN_FAKE_CLIENT_PROVISIONING_CLAIMS = [
  'client_provisioned', 'provisioning_complete', 'client_active', 'tenant_activated',
  'venue_onboarded_remotely', 'client_modules_live',
]

export const FORBIDDEN_FAKE_INVITE_COMPLETION_CLAIMS = [
  'invite_accepted', 'invite_live', 'invite_completed', 'invite_link_active',
  'onboarding_complete_via_invite',
]

export const FORBIDDEN_FAKE_LICENSE_VALIDATION_CLAIMS = [
  'license_validated', 'license_active', 'license_live', 'license_key_confirmed',
]

export const FORBIDDEN_FAKE_TENANT_ACTIVATION_CLAIMS = [
  'tenant_activation_live', 'tenant_modules_active', 'remote_tenant_active',
]

export const FORBIDDEN_FAKE_PRODUCTION_ACTIVATION_CLAIMS = [
  'production_ready', 'smokecraft_production_ready', 'ambi_built',
  'agent_x_built', 'egomusic_built', 'dayone_production',
]

export const FORBIDDEN_FAKE_ROLLBACK_EXECUTION_CLAIMS = [
  'rollback_executed', 'rollback_complete', 'rollback_active',
]

export const FORBIDDEN_RAW_SECRET_FIELDS = [
  'license_key', 'invite_token', 'api_key', 'webhook_secret', 'jwt_secret',
  'private_key', 'database_url', 'stripe_secret', 'token', 'secret',
]

// ── Default records ────────────────────────────────────────────────────────────

export const DEFAULT_DEPLOYMENT_PACKAGES = [
  { package_key: 'novee_os_core', package_name: 'NOVEE OS Core', package_type: 'platform_core', module_keys_json: ['novee_os'], version_label: '1.0.0-preview' },
  { package_key: 'crafthub_360_bundle', package_name: 'CraftHub 360 Bundle', package_type: 'craft_bundle', module_keys_json: ['crafthub'], version_label: '1.0.0-preview' },
  { package_key: 'smokecraft_360_bundle', package_name: 'SmokeCraft 360 Bundle', package_type: 'smoke_craft_bundle', module_keys_json: ['smokecraft'], version_label: '1.0.0-preview' },
  { package_key: 'passport_360_bundle', package_name: 'Passport 360 Bundle', package_type: 'passport_bundle', module_keys_json: ['passport'], version_label: '1.0.0-preview' },
  { package_key: 'pos360_bundle', package_name: 'POS360 Bundle', package_type: 'pos_bundle', module_keys_json: ['pos360'], version_label: '1.0.0-preview' },
  { package_key: 'eat_360_bundle', package_name: 'E.A.T. 360 Bundle', package_type: 'eat_bundle', module_keys_json: ['eat'], version_label: '1.0.0-preview' },
  { package_key: 'pourcraft_preview_bundle', package_name: 'PourCraft Preview Bundle', package_type: 'preview_bundle', module_keys_json: ['pourcraft'], version_label: '0.1.0-preview' },
  { package_key: 'beercraft_preview_bundle', package_name: 'BeerCraft Preview Bundle', package_type: 'preview_bundle', module_keys_json: ['beercraft'], version_label: '0.1.0-preview' },
  { package_key: 'winecraft_preview_bundle', package_name: 'WineCraft Preview Bundle', package_type: 'preview_bundle', module_keys_json: ['winecraft'], version_label: '0.1.0-preview' },
  { package_key: 'venue_preview_package', package_name: 'Venue Preview Package', package_type: 'venue_bundle', module_keys_json: ['pos360', 'eat', 'passport'], version_label: '1.0.0-preview' },
  { package_key: 'production_candidate_package', package_name: 'Production Candidate Package', package_type: 'production_candidate_bundle', module_keys_json: ['novee_os', 'smokecraft', 'crafthub', 'pos360', 'eat', 'passport'], version_label: '1.0.0-rc.1' },
]

export const DEFAULT_MODULE_ACTIVATIONS = [
  { module_key: 'novee_os', module_name: 'NOVEE OS', activation_mode: 'preview' },
  { module_key: 'crafthub', module_name: 'CraftHub 360', activation_mode: 'preview' },
  { module_key: 'smokecraft', module_name: 'SmokeCraft 360', activation_mode: 'preview' },
  { module_key: 'passport', module_name: 'Passport 360', activation_mode: 'preview' },
  { module_key: 'pos360', module_name: 'POS360', activation_mode: 'preview' },
  { module_key: 'eat', module_name: 'E.A.T. 360', activation_mode: 'preview' },
  { module_key: 'pourcraft', module_name: 'PourCraft 360', activation_mode: 'preview' },
  { module_key: 'beercraft', module_name: 'BeerCraft 360', activation_mode: 'preview' },
  { module_key: 'winecraft', module_name: 'WineCraft 360', activation_mode: 'preview' },
  { module_key: 'ambi', module_name: 'AMBI', activation_mode: 'preview' },
  { module_key: 'agent_x', module_name: 'Agent X 360', activation_mode: 'preview' },
  { module_key: 'dayone', module_name: 'DayOne 360', activation_mode: 'preview' },
  { module_key: 'egomusic', module_name: 'EgoMusic 360', activation_mode: 'preview' },
]

export const DEFAULT_ROLLBACK_RECORDS = [
  { rollback_target_version: '0.0.0-base', rollback_status: 'not_initiated', rollback_execution_enabled: false },
]

// ── Assertion helpers ──────────────────────────────────────────────────────────

export function assertNoFakeRemoteDeliveryClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_REMOTE_DELIVERY_CLAIMS) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake remote delivery claim "${claim}" is not allowed.`)
  }
  if (payload.remote_distribution_enabled === true) throw new Error('BLOCKED: Cannot set remote_distribution_enabled=true — live delivery is disabled.')
  if (payload.remote_distribution_ready === true) throw new Error('BLOCKED: Cannot mark remote_distribution_ready=true without verified gate passage.')
}

export function assertNoFakeClientProvisioningClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_CLIENT_PROVISIONING_CLAIMS) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake client provisioning claim "${claim}" is not allowed.`)
  }
  if (payload.provisioning_status === 'provisioned') throw new Error('BLOCKED: Cannot set provisioning_status=provisioned without approved gates.')
}

export function assertNoFakeInviteCompletionClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_INVITE_COMPLETION_CLAIMS) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake invite completion claim "${claim}" is not allowed.`)
  }
  if (payload.invite_status === 'accepted') throw new Error('BLOCKED: Cannot set invite_status=accepted in preview layer.')
  if (payload.remote_activation_allowed === true) throw new Error('BLOCKED: remote_activation_allowed must remain false in preview layer.')
}

export function assertNoFakeLicenseValidationClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_LICENSE_VALIDATION_CLAIMS) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake license validation claim "${claim}" is not allowed.`)
  }
  if (payload.license_status === 'active') throw new Error('BLOCKED: Cannot set license_status=active without validated gate passage.')
  if (payload.validation_status === 'validated') throw new Error('BLOCKED: Cannot set validation_status=validated in preview layer.')
}

export function assertNoFakeTenantActivationClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_TENANT_ACTIVATION_CLAIMS) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake tenant activation claim "${claim}" is not allowed.`)
  }
  if (payload.activated_for_client === true) throw new Error('BLOCKED: Cannot set activated_for_client=true without full gate passage.')
  if (payload.activated_for_production === true) throw new Error('BLOCKED: Cannot set activated_for_production=true in distribution preview layer.')
}

export function assertNoFakeProductionActivationClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_PRODUCTION_ACTIVATION_CLAIMS) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake production activation claim "${claim}" is not allowed.`)
  }
  if (payload.production_ready === true) throw new Error('BLOCKED: Cannot set production_ready=true without verified production gate passage.')
}

export function assertNoFakeRollbackExecutionClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_ROLLBACK_EXECUTION_CLAIMS) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake rollback execution claim "${claim}" is not allowed.`)
  }
  if (payload.rollback_execution_enabled === true) throw new Error('BLOCKED: rollback_execution_enabled must remain false in Phase E.6.')
  if (payload.rollback_status === 'executing') throw new Error('BLOCKED: Cannot set rollback_status=executing — rollback execution is disabled.')
}

export function assertNoRawDistributionSecrets(payload = {}) {
  for (const field of FORBIDDEN_RAW_SECRET_FIELDS) {
    if (field in payload && payload[field] && typeof payload[field] === 'string' && payload[field].length > 20) {
      throw new Error(`BLOCKED: Field "${field}" appears to contain a raw secret value. Use reference-only fields.`)
    }
  }
}

export function assertSecurityDeploymentPilotGatesRequired(summary = {}) {
  if (!summary.security_gate_passed) throw new Error('BLOCKED: Security gate (E.3) must pass before remote distribution.')
  if (!summary.deployment_gate_passed) throw new Error('BLOCKED: Deployment gate (E.4) must pass before remote distribution.')
  if (!summary.pilot_gate_passed) throw new Error('BLOCKED: Pilot readiness gate (E.5) must pass before remote distribution.')
}

export function assertRemoteDistributionBlockedUntilReady(summary = {}) {
  if (summary.remote_distribution_ready === true && !summary.all_gates_passed) {
    throw new Error('BLOCKED: Cannot mark remote_distribution_ready=true without all gates passing.')
  }
}

// ── Validators ────────────────────────────────────────────────────────────────

export function validateDeploymentPackagePayload(payload = {}) {
  if (!payload.package_key) throw new Error('package_key is required.')
  if (!payload.package_name) throw new Error('package_name is required.')
  if (payload.package_type && !ALLOWED_PACKAGE_TYPES.includes(payload.package_type)) throw new Error(`Invalid package_type: ${payload.package_type}`)
  assertNoFakeRemoteDeliveryClaims(payload)
  assertNoFakeProductionActivationClaims(payload)
  assertNoRawDistributionSecrets(payload)
}

export function validateProvisioningRequestPayload(payload = {}) {
  if (!payload.client_name) throw new Error('client_name is required.')
  if (!payload.client_type) throw new Error('client_type is required.')
  if (payload.client_type && !ALLOWED_CLIENT_TYPES.includes(payload.client_type)) throw new Error(`Invalid client_type: ${payload.client_type}`)
  assertNoFakeClientProvisioningClaims(payload)
  assertNoRawDistributionSecrets(payload)
}

export function validateInviteSessionPayload(payload = {}) {
  if (!payload.invite_type) throw new Error('invite_type is required.')
  if (payload.invite_type && !ALLOWED_INVITE_TYPES.includes(payload.invite_type)) throw new Error(`Invalid invite_type: ${payload.invite_type}`)
  assertNoFakeInviteCompletionClaims(payload)
  assertNoRawDistributionSecrets(payload)
}

export function validateLicenseKeyPayload(payload = {}) {
  if (!payload.license_type) throw new Error('license_type is required.')
  if (payload.license_type && !ALLOWED_LICENSE_TYPES.includes(payload.license_type)) throw new Error(`Invalid license_type: ${payload.license_type}`)
  assertNoFakeLicenseValidationClaims(payload)
  assertNoRawDistributionSecrets(payload)
}

export function validateModuleActivationPayload(payload = {}) {
  if (!payload.module_key) throw new Error('module_key is required.')
  if (!payload.module_name) throw new Error('module_name is required.')
  if (payload.activation_mode && !ALLOWED_ACTIVATION_MODES.includes(payload.activation_mode)) throw new Error(`Invalid activation_mode: ${payload.activation_mode}`)
  assertNoFakeTenantActivationClaims(payload)
  assertNoFakeProductionActivationClaims(payload)
  assertNoRawDistributionSecrets(payload)
}

export function validateDeploymentVersionPayload(payload = {}) {
  if (!payload.version_label) throw new Error('version_label is required.')
  if (payload.version_status && !ALLOWED_VERSION_STATUSES.includes(payload.version_status)) throw new Error(`Invalid version_status: ${payload.version_status}`)
  assertNoFakeProductionActivationClaims(payload)
}

export function validateRollbackRecordPayload(payload = {}) {
  assertNoFakeRollbackExecutionClaims(payload)
  if (payload.rollback_status && !ALLOWED_ROLLBACK_STATUSES.includes(payload.rollback_status)) throw new Error(`Invalid rollback_status: ${payload.rollback_status}`)
}
