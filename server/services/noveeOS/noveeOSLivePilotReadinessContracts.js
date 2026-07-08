// Phase E.5 — NOVEE OS Live Pilot Readiness Contracts
// Safety enforcement: no fake pilot approval, no fake go-live claims

export function assertNoFakePilotApprovalClaims(payload = {}) {
  const blocked = ['pilot_approved', 'go_live_approved', 'live_pilot_enabled', 'public_go_live_enabled']
  for (const key of blocked) {
    if (payload[key] === true) throw new Error(`BLOCKED: Cannot set ${key}=true in pilot readiness layer. Pilot approval requires full gate passage.`)
  }
}

export function assertNoFakeGoLiveClaims(payload = {}) {
  if (payload.go_live_date && !payload.go_live_approved) throw new Error('BLOCKED: Cannot set go_live_date without go_live_approved gate passage.')
  if (payload.public_go_live_enabled === true) throw new Error('BLOCKED: Public go-live is not enabled in Phase E.5.')
}

export function assertNoFakeRemoteDistributionClaims(payload = {}) {
  if (payload.remote_distribution_enabled === true) throw new Error('BLOCKED: Remote distribution is not enabled in Phase E.5.')
  if (payload.remote_distribution_ready === true) throw new Error('BLOCKED: Cannot mark remote_distribution_ready=true in pilot readiness layer.')
}

export function assertNoFakeProductionReadyClaims(payload = {}) {
  if (payload.production_ready === true) throw new Error('BLOCKED: Cannot set production_ready=true without verified gate passage.')
}

export function assertNoPilotStartWithoutApproval(payload = {}) {
  if (payload.pilot_start_date && payload.pilot_approved !== true) throw new Error('BLOCKED: Cannot set pilot_start_date without pilot_approved.')
}

export function assertNoExposedPilotSecrets(payload = {}) {
  const forbidden = ['database_url', 'stripe_secret', 'api_key', 'webhook_secret', 'jwt_secret', 'private_key', 'token']
  for (const key of forbidden) {
    if (key in payload) throw new Error(`BLOCKED: Payload must not include field "${key}".`)
    for (const v of Object.values(payload)) {
      if (typeof v === 'string' && v.toLowerCase().includes(key)) throw new Error(`BLOCKED: Payload value appears to contain sensitive data (${key}).`)
    }
  }
}

export function assertSecurityGateRequired(flags = {}) {
  if (!flags.NOVEE_PILOT_SECURITY_GATE_REQUIRED) throw new Error('BLOCKED: Security gate must be required for pilot readiness activation.')
}

export function assertNoBypassOfE3SecurityActivation(payload = {}) {
  if (payload.bypass_security_activation === true) throw new Error('BLOCKED: Cannot bypass Phase E.3 Security Activation in pilot readiness.')
}

export function assertNoBypassOfE4DeploymentActivation(payload = {}) {
  if (payload.bypass_deployment_activation === true) throw new Error('BLOCKED: Cannot bypass Phase E.4 Deployment Activation in pilot readiness.')
}

export function assertNoFakeLicenseKeyClaims(payload = {}) {
  if (payload.license_key || payload.invite_link) throw new Error('BLOCKED: License keys and invite links belong to Phase E.6, not E.5.')
}

export function assertNoClientProvisioningClaims(payload = {}) {
  if (payload.client_provisioned === true || payload.provisioning_active === true) throw new Error('BLOCKED: Client provisioning belongs to Phase E.6.')
}

export function assertNoRollbackExecutionClaims(payload = {}) {
  if (payload.rollback_executed === true || payload.rollback_active === true) throw new Error('BLOCKED: Rollback execution is not permitted in pilot readiness layer.')
}

export function assertNoFakeVerificationPassClaims(payload = {}) {
  if (payload.all_gates_passed === true && !payload._gates_verified_count) throw new Error('BLOCKED: Cannot claim all_gates_passed without verified gate count.')
}

// Validators

export function validatePilotVenuePayload(payload = {}) {
  if (!payload.venue_name) throw new Error('venue_name is required.')
  if (!payload.venue_type) throw new Error('venue_type is required.')
  assertNoFakePilotApprovalClaims(payload)
  assertNoFakeGoLiveClaims(payload)
  assertNoFakeRemoteDistributionClaims(payload)
  assertNoExposedPilotSecrets(payload)
}

export function validatePilotGatePayload(payload = {}) {
  if (!payload.gate_key) throw new Error('gate_key is required.')
  if (!payload.gate_label) throw new Error('gate_label is required.')
  assertNoFakePilotApprovalClaims(payload)
}

export function validateModuleReadinessPayload(payload = {}) {
  if (!payload.module_key) throw new Error('module_key is required.')
  if (!payload.module_label) throw new Error('module_label is required.')
  assertNoFakeProductionReadyClaims(payload)
}

export function validatePilotChecklistPayload(payload = {}) {
  if (!payload.checklist_key) throw new Error('checklist_key is required.')
  if (!payload.checklist_label) throw new Error('checklist_label is required.')
}

export function validatePilotEvidencePayload(payload = {}) {
  if (!payload.evidence_label) throw new Error('evidence_label is required.')
  if (!payload.evidence_type) throw new Error('evidence_type is required.')
  assertNoExposedPilotSecrets(payload)
}

export function validateAcceptancePayload(payload = {}) {
  if (!payload.acceptance_type) throw new Error('acceptance_type is required.')
  assertNoFakePilotApprovalClaims(payload)
  assertNoFakeGoLiveClaims(payload)
  assertNoFakeRemoteDistributionClaims(payload)
  assertNoFakeLicenseKeyClaims(payload)
  assertNoClientProvisioningClaims(payload)
}

export const DEFAULT_PILOT_READINESS_GATES = [
  { gate_key: 'security_activation_complete', gate_label: 'Phase E.3 Security Activation Complete', gate_category: 'prerequisite', sort_order: 1 },
  { gate_key: 'deployment_activation_complete', gate_label: 'Phase E.4 Deployment Activation Complete', gate_category: 'prerequisite', sort_order: 2 },
  { gate_key: 'database_schema_validated', gate_label: 'Database Schema Validated', gate_category: 'infrastructure', sort_order: 3 },
  { gate_key: 'migration_history_clean', gate_label: 'Migration History Clean', gate_category: 'infrastructure', sort_order: 4 },
  { gate_key: 'environment_variables_set', gate_label: 'Environment Variables Configured', gate_category: 'infrastructure', sort_order: 5 },
  { gate_key: 'stripe_connect_configured', gate_label: 'Stripe Connect Configured', gate_category: 'payments', sort_order: 6 },
  { gate_key: 'payment_provider_verified', gate_label: 'Payment Provider Verified', gate_category: 'payments', sort_order: 7 },
  { gate_key: 'pos_integration_verified', gate_label: 'POS Integration Verified', gate_category: 'integrations', sort_order: 8 },
  { gate_key: 'inventory_sync_verified', gate_label: 'Inventory Sync Verified', gate_category: 'integrations', sort_order: 9 },
  { gate_key: 'communication_delivery_verified', gate_label: 'Communication Delivery Verified', gate_category: 'integrations', sort_order: 10 },
  { gate_key: 'smokecraft_module_ready', gate_label: 'SmokeCraft Module Pilot-Ready', gate_category: 'modules', sort_order: 11 },
  { gate_key: 'crafthub_module_ready', gate_label: 'CraftHub Module Pilot-Ready', gate_category: 'modules', sort_order: 12 },
  { gate_key: 'pos360_module_ready', gate_label: 'POS360 Module Pilot-Ready', gate_category: 'modules', sort_order: 13 },
  { gate_key: 'eat_module_ready', gate_label: 'E.A.T. Module Pilot-Ready', gate_category: 'modules', sort_order: 14 },
  { gate_key: 'passport_module_ready', gate_label: 'Passport Module Pilot-Ready', gate_category: 'modules', sort_order: 15 },
  { gate_key: 'kds_fulfillment_verified', gate_label: 'KDS Fulfillment Verified', gate_category: 'operations', sort_order: 16 },
  { gate_key: 'order_lifecycle_verified', gate_label: 'Order Lifecycle Verified', gate_category: 'operations', sort_order: 17 },
  { gate_key: 'staff_access_verified', gate_label: 'Staff Access Verified', gate_category: 'operations', sort_order: 18 },
  { gate_key: 'venue_admin_access_verified', gate_label: 'Venue Admin Access Verified', gate_category: 'operations', sort_order: 19 },
  { gate_key: 'security_audit_passed', gate_label: 'Security Audit Passed', gate_category: 'compliance', sort_order: 20 },
  { gate_key: 'data_privacy_review_passed', gate_label: 'Data Privacy Review Passed', gate_category: 'compliance', sort_order: 21 },
  { gate_key: 'pilot_venue_confirmed', gate_label: 'Pilot Venue Confirmed', gate_category: 'pilot', sort_order: 22 },
]

export const DEFAULT_PILOT_MODULES = [
  { module_key: 'smokecraft', module_label: 'SmokeCraft', module_family: 'smokecraft' },
  { module_key: 'crafthub', module_label: 'CraftHub', module_family: 'crafthub' },
  { module_key: 'pos360', module_label: 'POS360', module_family: 'pos360' },
  { module_key: 'eat', module_label: 'E.A.T.', module_family: 'eat' },
  { module_key: 'passport', module_label: 'Passport', module_family: 'passport' },
  { module_key: 'pourcraft', module_label: 'PourCraft', module_family: 'pourcraft' },
  { module_key: 'beercraft', module_label: 'BeerCraft', module_family: 'beercraft' },
  { module_key: 'winecraft', module_label: 'WineCraft', module_family: 'winecraft' },
  { module_key: 'novee_os_core', module_label: 'NOVEE OS Core', module_family: 'novee_os' },
  { module_key: 'kds_fulfillment', module_label: 'KDS Fulfillment', module_family: 'operations' },
  { module_key: 'order_lifecycle', module_label: 'Order Lifecycle', module_family: 'operations' },
  { module_key: 'payment_bridge', module_label: 'Payment Bridge', module_family: 'payments' },
  { module_key: 'inventory_sync', module_label: 'Inventory Sync', module_family: 'integrations' },
]
