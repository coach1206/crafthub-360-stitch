/**
 * NOVEE OS — Deployment Activation Contracts (Phase D.7 / Phase E.4)
 * contains_secrets: false
 * No fake production proof. No live deployment. Rollback execution disabled.
 */

export const DEPLOYMENT_ENVIRONMENT_TYPES = [
  'local', 'preview', 'staging', 'production', 'railway', 'vercel', 'github', 'external',
]

export const DEPLOYMENT_HOSTING_PROVIDERS = [
  'railway', 'vercel', 'github_actions', 'aws', 'gcp', 'azure', 'digitalocean', 'self_hosted', 'external',
]

export const DEPLOYMENT_GATE_STATUSES = ['pending', 'passed', 'blocked', 'missing_evidence', 'not_required', 'preview_only']

export const DEPLOYMENT_PACKAGE_TYPES = [
  'platform_core', 'module_bundle', 'venue_package', 'client_package', 'preview_package', 'production_candidate',
]

export const DEPLOYMENT_PACKAGE_STATUSES = ['preview', 'staging', 'pending_verification', 'verified', 'blocked', 'production_candidate']

export const DEPLOYMENT_EVIDENCE_STATUSES = ['pending', 'submitted', 'verified', 'rejected', 'not_applicable']

export const SAFE_DEPLOYMENT_CLAIM_LABELS = [
  'deployment_activation_center_exists',
  'deployment_gates_tracked',
  'deployment_blockers_visible',
  'rollback_planning_records_tracked',
  'rollback_execution_disabled',
  'remote_distribution_blocked_until_deployment_ready',
  'security_gate_dependency_enforced',
  'no_fake_production_proof',
  'no_fake_railway_readiness_claims',
  'no_fake_vercel_readiness_claims',
  'no_exposed_deployment_secrets',
]

export const FORBIDDEN_FAKE_DEPLOYMENT_CLAIMS = [
  'production_deployment_live', 'live_production_enabled', 'deploy_live',
  'railway_verified_live', 'vercel_verified_live', 'github_workflow_verified_live',
  'build_passed_in_production', 'all_verifications_passed_in_production',
  'rollback_execution_enabled', 'client_remote_deployment_available',
  'remote_distribution_live',
]

export const FORBIDDEN_SECRET_FIELDS = [
  'api_key', 'secret_key', 'secret', 'token', 'password', 'credential',
  'private_key', 'jwt_secret', 'database_url', 'connection_string',
  'stripe_key', 'stripe_secret', 'sendgrid_key', 'twilio_auth',
  'railway_token', 'vercel_token', 'github_token', 'openai_key',
  'aws_secret', 'client_secret', 'access_token', 'refresh_token', 'webhook_secret',
]

export const DEFAULT_DEPLOYMENT_GATES = [
  { gate_key: 'security_activation_gate',        gate_name: 'Security Activation Gate',          gate_category: 'security',      required_for_deployment: true,  required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Phase E.3 Security Activation must complete all 14 gates before deployment proceeds.' },
  { gate_key: 'production_environment_gate',      gate_name: 'Production Environment Gate',       gate_category: 'environment',   required_for_deployment: true,  required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Production environment not verified.' },
  { gate_key: 'railway_database_gate',            gate_name: 'Railway Database Gate',             gate_category: 'database',      required_for_deployment: true,  required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Railway PostgreSQL connection not verified for production.' },
  { gate_key: 'node_env_production_gate',         gate_name: 'NODE_ENV Production Gate',          gate_category: 'environment',   required_for_deployment: true,  required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'NODE_ENV=production not confirmed in deployment environment.' },
  { gate_key: 'database_ssl_gate',                gate_name: 'Database SSL Gate',                 gate_category: 'database',      required_for_deployment: true,  required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Database SSL/TLS not enforced in production.' },
  { gate_key: 'migration_status_gate',            gate_name: 'Migration Status Gate',             gate_category: 'database',      required_for_deployment: true,  required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'All 062 migrations not confirmed as run in production database.' },
  { gate_key: 'build_status_gate',                gate_name: 'Build Status Gate',                 gate_category: 'build',         required_for_deployment: true,  required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Production build not verified as clean.' },
  { gate_key: 'verification_scripts_gate',        gate_name: 'Verification Scripts Gate',         gate_category: 'verification',  required_for_deployment: true,  required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'All verification scripts not confirmed passing in production environment.' },
  { gate_key: 'frontend_routes_gate',             gate_name: 'Frontend Routes Gate',              gate_category: 'frontend',      required_for_deployment: true,  required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Frontend route coverage not verified in production build.' },
  { gate_key: 'api_routes_gate',                  gate_name: 'API Routes Gate',                   gate_category: 'backend',       required_for_deployment: true,  required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Backend API routes not smoke-tested in production environment.' },
  { gate_key: 'provider_activation_gate',         gate_name: 'Provider Activation Gate',          gate_category: 'providers',     required_for_deployment: false, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Phase D.1 provider activation not fully verified.' },
  { gate_key: 'payment_activation_gate',          gate_name: 'Payment Activation Gate',           gate_category: 'payments',      required_for_deployment: false, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Phase D.2 payment activation not verified.' },
  { gate_key: 'external_pos_activation_gate',     gate_name: 'External POS Activation Gate',      gate_category: 'pos',           required_for_deployment: false, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Phase D.3 external POS activation not verified.' },
  { gate_key: 'inventory_activation_gate',        gate_name: 'Inventory Activation Gate',         gate_category: 'inventory',     required_for_deployment: false, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Phase D.4 inventory activation not verified.' },
  { gate_key: 'communication_activation_gate',    gate_name: 'Communication Activation Gate',     gate_category: 'communication', required_for_deployment: false, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Phase D.5 communication activation not verified.' },
  { gate_key: 'deployment_audit_gate',            gate_name: 'Deployment Audit Gate',             gate_category: 'audit',         required_for_deployment: true,  required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Deployment audit log not active.' },
  { gate_key: 'rollback_plan_gate',               gate_name: 'Rollback Plan Gate',                gate_category: 'rollback',      required_for_deployment: true,  required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Rollback plan not documented and verified.' },
  { gate_key: 'safe_claims_gate',                 gate_name: 'Safe Claims Gate',                  gate_category: 'compliance',    required_for_deployment: true,  required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Safe claims audit not completed.' },
  { gate_key: 'documentation_gate',               gate_name: 'Documentation Gate',                gate_category: 'documentation', required_for_deployment: false, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Deployment documentation not verified as complete.' },
]

export const DEFAULT_DEPLOYMENT_PACKAGES = [
  { package_key: 'novee_os_core',           package_name: 'NOVEE OS Core',             package_type: 'platform_core',        version_label: '1.0.0-preview', status: 'preview', build_status: 'not_built', verification_status: 'not_verified', security_gate_status: 'pending', deployment_ready: false, remote_distribution_ready: false, safe_claim: 'preview_only' },
  { package_key: 'crafthub_360_bundle',     package_name: 'CraftHub 360 Bundle',       package_type: 'module_bundle',        version_label: '1.0.0-preview', status: 'preview', build_status: 'not_built', verification_status: 'not_verified', security_gate_status: 'pending', deployment_ready: false, remote_distribution_ready: false, safe_claim: 'preview_only' },
  { package_key: 'smokecraft_360_bundle',   package_name: 'SmokeCraft 360 Bundle',     package_type: 'module_bundle',        version_label: '1.0.0-preview', status: 'preview', build_status: 'not_built', verification_status: 'not_verified', security_gate_status: 'pending', deployment_ready: false, remote_distribution_ready: false, safe_claim: 'preview_only' },
  { package_key: 'pos360_bundle',           package_name: 'POS360 Bundle',             package_type: 'module_bundle',        version_label: '1.0.0-preview', status: 'preview', build_status: 'not_built', verification_status: 'not_verified', security_gate_status: 'pending', deployment_ready: false, remote_distribution_ready: false, safe_claim: 'preview_only' },
  { package_key: 'eat_360_bundle',          package_name: 'E.A.T. 360 Bundle',         package_type: 'module_bundle',        version_label: '1.0.0-preview', status: 'preview', build_status: 'not_built', verification_status: 'not_verified', security_gate_status: 'pending', deployment_ready: false, remote_distribution_ready: false, safe_claim: 'preview_only' },
  { package_key: 'passport_360_bundle',     package_name: 'Passport 360 Bundle',       package_type: 'module_bundle',        version_label: '1.0.0-preview', status: 'preview', build_status: 'not_built', verification_status: 'not_verified', security_gate_status: 'pending', deployment_ready: false, remote_distribution_ready: false, safe_claim: 'preview_only' },
  { package_key: 'venue_preview_package',   package_name: 'Venue Preview Package',     package_type: 'preview_package',      version_label: '1.0.0-preview', status: 'preview', build_status: 'not_built', verification_status: 'not_verified', security_gate_status: 'pending', deployment_ready: false, remote_distribution_ready: false, safe_claim: 'preview_only' },
  { package_key: 'production_candidate',    package_name: 'Production Candidate Package', package_type: 'production_candidate', version_label: 'pending',      status: 'blocked', build_status: 'not_built', verification_status: 'not_verified', security_gate_status: 'pending', deployment_ready: false, remote_distribution_ready: false, safe_claim: 'blocked_until_all_gates_pass' },
]

export const DEFAULT_ROLLBACK_PLANS = [
  { plan_key: 'core_platform_rollback',     plan_name: 'NOVEE OS Core Rollback Plan',      rollback_available: false, rollback_execution_enabled: false, rollback_tested: false, blocker_reason: 'Rollback plan not documented. Production deployment must occur first.', safe_claim: 'rollback_planning_tracked' },
  { plan_key: 'database_rollback',          plan_name: 'Database Migration Rollback Plan', rollback_available: false, rollback_execution_enabled: false, rollback_tested: false, blocker_reason: 'Database rollback procedures not defined.', safe_claim: 'rollback_planning_tracked' },
  { plan_key: 'frontend_rollback',          plan_name: 'Frontend Bundle Rollback Plan',    rollback_available: false, rollback_execution_enabled: false, rollback_tested: false, blocker_reason: 'Frontend rollback not defined. Deploy must be versioned first.', safe_claim: 'rollback_planning_tracked' },
  { plan_key: 'provider_rollback',          plan_name: 'Provider Integration Rollback',    rollback_available: false, rollback_execution_enabled: false, rollback_tested: false, blocker_reason: 'Provider rollback requires live integration first.', safe_claim: 'rollback_planning_tracked' },
]

// ── Assertion helpers ──────────────────────────────────────────────────────────

export function assertNoExposedDeploymentSecrets(payload) {
  if (!payload || typeof payload !== 'object') return
  for (const field of FORBIDDEN_SECRET_FIELDS) {
    if (field in payload) {
      throw new Error(`Deployment contract violation: field "${field}" must not appear in payloads. Never expose secrets.`)
    }
  }
}

export function assertNoFakeProductionProofClaims(payload) {
  if (!payload || typeof payload !== 'object') return
  for (const claim of FORBIDDEN_FAKE_DEPLOYMENT_CLAIMS) {
    if (payload[claim] === true) {
      throw new Error(`Deployment contract violation: claim "${claim}" is forbidden without verified production proof.`)
    }
  }
}

export function assertNoFakeRailwayReadinessClaims(payload) {
  if (!payload || typeof payload !== 'object') return
  if (payload.railway_verified_live === true || payload.railway_production_ready === true) {
    throw new Error('Deployment contract violation: Railway production readiness may not be claimed without actual environment verification.')
  }
}

export function assertNoFakeVercelReadinessClaims(payload) {
  if (!payload || typeof payload !== 'object') return
  if (payload.vercel_verified_live === true || payload.vercel_production_ready === true) {
    throw new Error('Deployment contract violation: Vercel production readiness may not be claimed without actual environment verification.')
  }
}

export function assertNoFakeBuildPassClaims(payload) {
  if (!payload || typeof payload !== 'object') return
  if (payload.build_passed_in_production === true || payload.build_verified_production === true) {
    throw new Error('Deployment contract violation: build_passed_in_production may not be claimed without actual CI/CD proof.')
  }
}

export function assertNoFakeVerificationPassClaims(payload) {
  if (!payload || typeof payload !== 'object') return
  if (payload.all_verifications_passed_in_production === true || payload.verification_passed_production === true) {
    throw new Error('Deployment contract violation: verification pass claims require actual production script execution proof.')
  }
}

export function assertNoRollbackExecutionClaims(payload) {
  if (!payload || typeof payload !== 'object') return
  if (payload.rollback_execution_enabled === true) {
    throw new Error('Deployment contract violation: rollback_execution_enabled may not be set to true. Rollback execution belongs to Phase E.6.')
  }
}

export function assertNoRemoteDistributionBeforeDeploymentReady(summary) {
  if (summary && summary.remote_distribution_ready === true) {
    throw new Error('Deployment contract violation: remote_distribution_ready may not be set to true until all deployment gates pass.')
  }
}

export function assertSecurityGateRequired(summary) {
  if (summary && summary.security_gate_bypassed === true) {
    throw new Error('Deployment contract violation: security gate cannot be bypassed. Phase E.3 Security Activation must pass first.')
  }
}

export function validateDeploymentGatePayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Gate payload must be an object.')
  if (!DEPLOYMENT_GATE_STATUSES.includes(payload.status)) {
    throw new Error(`Invalid gate status "${payload.status}". Allowed: ${DEPLOYMENT_GATE_STATUSES.join(', ')}`)
  }
  if (payload.status === 'passed' && !payload.evidence_present) {
    throw new Error('Deployment gate cannot be marked passed without evidence_present=true.')
  }
  assertNoExposedDeploymentSecrets(payload)
  assertNoFakeProductionProofClaims(payload)
}

export function validateDeploymentPackagePayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Package payload must be an object.')
  if (!DEPLOYMENT_PACKAGE_TYPES.includes(payload.package_type)) {
    throw new Error(`Invalid package_type "${payload.package_type}". Allowed: ${DEPLOYMENT_PACKAGE_TYPES.join(', ')}`)
  }
  assertNoExposedDeploymentSecrets(payload)
  assertNoFakeProductionProofClaims(payload)
  assertNoFakeBuildPassClaims(payload)
  assertNoFakeVerificationPassClaims(payload)
  assertNoRollbackExecutionClaims(payload)
}

export function validateDeploymentEnvironmentPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Environment payload must be an object.')
  if (!DEPLOYMENT_ENVIRONMENT_TYPES.includes(payload.environment_type)) {
    throw new Error(`Invalid environment_type "${payload.environment_type}". Allowed: ${DEPLOYMENT_ENVIRONMENT_TYPES.join(', ')}`)
  }
  assertNoExposedDeploymentSecrets(payload)
  assertNoFakeProductionProofClaims(payload)
  assertNoFakeRailwayReadinessClaims(payload)
  assertNoFakeVercelReadinessClaims(payload)
}

export function validateDeploymentEvidencePayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Evidence payload must be an object.')
  if (!DEPLOYMENT_EVIDENCE_STATUSES.includes(payload.evidence_status)) {
    throw new Error(`Invalid evidence_status "${payload.evidence_status}". Allowed: ${DEPLOYMENT_EVIDENCE_STATUSES.join(', ')}`)
  }
  assertNoExposedDeploymentSecrets(payload)
  assertNoFakeProductionProofClaims(payload)
  assertNoFakeBuildPassClaims(payload)
  assertNoFakeVerificationPassClaims(payload)
}

export default {
  DEPLOYMENT_ENVIRONMENT_TYPES,
  DEPLOYMENT_HOSTING_PROVIDERS,
  DEPLOYMENT_GATE_STATUSES,
  DEPLOYMENT_PACKAGE_TYPES,
  DEPLOYMENT_PACKAGE_STATUSES,
  DEPLOYMENT_EVIDENCE_STATUSES,
  SAFE_DEPLOYMENT_CLAIM_LABELS,
  FORBIDDEN_FAKE_DEPLOYMENT_CLAIMS,
  FORBIDDEN_SECRET_FIELDS,
  DEFAULT_DEPLOYMENT_GATES,
  DEFAULT_DEPLOYMENT_PACKAGES,
  DEFAULT_ROLLBACK_PLANS,
}
