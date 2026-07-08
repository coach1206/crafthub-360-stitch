/**
 * NOVEE OS — Security Activation Contracts (Phase D.6 / Phase E.3)
 * contains_secrets: false
 * No fake certifications. No fake providers. No live enforcement without feature flag.
 */

export const SECURITY_PROVIDER_TYPES = [
  'auth', 'secrets', 'waf', 'monitoring', 'vulnerability_scanner',
  'compliance', 'audit', 'encryption', 'incident_response', 'access_control',
]

export const SECURITY_GATE_CATEGORIES = [
  'environment', 'secrets', 'authentication', 'database', 'network',
  'access_control', 'audit', 'payment', 'communication', 'deployment',
  'training', 'rollback',
]

export const SECURITY_GATE_STATUSES = ['pending', 'passed', 'blocked', 'missing_evidence', 'not_required', 'preview_only']

export const SECURITY_RISK_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info']

export const SECURITY_EVIDENCE_STATUSES = ['pending', 'submitted', 'verified', 'rejected', 'not_applicable']

export const SAFE_SECURITY_CLAIM_LABELS = [
  'security_activation_center_exists',
  'security_gates_tracked',
  'security_blockers_visible',
  'remote_distribution_blocked_until_security_ready',
  'audit_logging_tracked',
  'risk_registry_exists',
  'evidence_tracking_exists',
  'no_fake_certification_claims',
  'no_fake_provider_connection_claims',
  'no_exposed_secrets',
]

export const FORBIDDEN_CERTIFICATION_CLAIMS = [
  'soc2_certified', 'soc_2_certified', 'iso_certified', 'iso_27001_certified',
  'hipaa_compliant', 'pci_compliant', 'pci_dss_compliant',
  'gdpr_certified', 'fedramp_authorized',
  'penetration_tested', 'pentest_passed', 'vuln_scan_passed',
  'vulnerability_scan_passed', 'zero_vulnerabilities',
]

export const FORBIDDEN_PROVIDER_CONNECTION_CLAIMS = [
  'live_waf_connected', 'live_security_provider_connected',
  'live_monitoring_connected', 'live_auth_provider_connected',
  'live_secrets_manager_connected', 'live_encryption_connected',
  'production_security_active',
]

export const FORBIDDEN_SECRET_FIELDS = [
  'api_key', 'secret_key', 'secret', 'token', 'password', 'credential',
  'private_key', 'jwt_secret', 'database_url', 'connection_string',
  'stripe_key', 'sendgrid_key', 'twilio_auth', 'aws_secret',
  'client_secret', 'access_token', 'refresh_token',
]

export const DEFAULT_SECURITY_GATES = [
  { gate_key: 'environment_security_lock',          gate_name: 'Environment Security Lock',            gate_category: 'environment',   required_for_deployment: true, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'NODE_ENV and environment variables not verified for production.' },
  { gate_key: 'secrets_not_exposed_lock',           gate_name: 'Secrets Not Exposed',                 gate_category: 'secrets',       required_for_deployment: true, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Secrets exposure audit not completed.' },
  { gate_key: 'production_node_env_lock',           gate_name: 'NODE_ENV Production Lock',            gate_category: 'environment',   required_for_deployment: true, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'NODE_ENV=production not verified in deployment environment.' },
  { gate_key: 'database_ssl_lock',                 gate_name: 'Database SSL Lock',                   gate_category: 'database',      required_for_deployment: true, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Database SSL/TLS connection not verified.' },
  { gate_key: 'admin_rbac_lock',                   gate_name: 'Admin RBAC Lock',                     gate_category: 'access_control', required_for_deployment: true, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Role-based access control not fully enforced for all admin routes.' },
  { gate_key: 'tenant_isolation_lock',              gate_name: 'Tenant Isolation Lock',               gate_category: 'access_control', required_for_deployment: true, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Multi-tenant data isolation not verified.' },
  { gate_key: 'audit_logging_lock',                gate_name: 'Audit Logging Lock',                  gate_category: 'audit',         required_for_deployment: true, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Security audit logging not fully enabled.' },
  { gate_key: 'rate_limit_lock',                   gate_name: 'Rate Limiting Lock',                  gate_category: 'network',       required_for_deployment: true, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'API rate limiting not configured for production.' },
  { gate_key: 'provider_credential_lock',          gate_name: 'Provider Credential Lock',            gate_category: 'secrets',       required_for_deployment: true, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Provider credentials not secured via secrets manager reference.' },
  { gate_key: 'payment_security_lock',              gate_name: 'Payment Security Lock',               gate_category: 'payment',       required_for_deployment: true, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Payment security gates not verified (Stripe, PCI scope).' },
  { gate_key: 'communication_delivery_lock',        gate_name: 'Communication Delivery Lock',         gate_category: 'communication', required_for_deployment: true, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Communication security gates not verified.' },
  { gate_key: 'remote_distribution_security_lock',  gate_name: 'Remote Distribution Security Lock',  gate_category: 'deployment',    required_for_deployment: true, required_for_remote_distribution: true,  status: 'blocked', evidence_required: true,  evidence_present: false, blocker_reason: 'All upstream security gates must pass before remote distribution is allowed.' },
  { gate_key: 'rollback_security_lock',             gate_name: 'Rollback Security Lock',              gate_category: 'rollback',      required_for_deployment: true, required_for_remote_distribution: true,  status: 'pending', evidence_required: true,  evidence_present: false, blocker_reason: 'Deployment rollback plan not verified.' },
  { gate_key: 'user_training_security_acknowledgment_lock', gate_name: 'User Training Security Acknowledgment', gate_category: 'training', required_for_deployment: false, required_for_remote_distribution: true, status: 'pending', evidence_required: true, evidence_present: false, blocker_reason: 'Operator security training acknowledgment not recorded.' },
]

export const DEFAULT_SECURITY_PROVIDERS = [
  { provider_key: 'auth_identity',         provider_name: 'Authentication / Identity',    provider_type: 'auth',                 status: 'preview', configured: false, production_ready: false, live_connection_enabled: false, credential_reference_only: true },
  { provider_key: 'secrets_management',    provider_name: 'Secrets Management',           provider_type: 'secrets',              status: 'preview', configured: false, production_ready: false, live_connection_enabled: false, credential_reference_only: true },
  { provider_key: 'waf_edge_protection',   provider_name: 'WAF / Edge Protection',        provider_type: 'waf',                  status: 'preview', configured: false, production_ready: false, live_connection_enabled: false, credential_reference_only: true },
  { provider_key: 'monitoring',            provider_name: 'Monitoring',                   provider_type: 'monitoring',           status: 'preview', configured: false, production_ready: false, live_connection_enabled: false, credential_reference_only: true },
  { provider_key: 'vulnerability_scanner', provider_name: 'Vulnerability Scanner',        provider_type: 'vulnerability_scanner', status: 'preview', configured: false, production_ready: false, live_connection_enabled: false, credential_reference_only: true },
  { provider_key: 'audit_logging',         provider_name: 'Audit Logging',                provider_type: 'audit',                status: 'preview', configured: false, production_ready: false, live_connection_enabled: false, credential_reference_only: true },
  { provider_key: 'encryption',            provider_name: 'Encryption',                   provider_type: 'encryption',           status: 'preview', configured: false, production_ready: false, live_connection_enabled: false, credential_reference_only: true },
  { provider_key: 'compliance',            provider_name: 'Compliance',                   provider_type: 'compliance',           status: 'preview', configured: false, production_ready: false, live_connection_enabled: false, credential_reference_only: true },
  { provider_key: 'incident_response',     provider_name: 'Incident Response',            provider_type: 'incident_response',    status: 'preview', configured: false, production_ready: false, live_connection_enabled: false, credential_reference_only: true },
  { provider_key: 'access_control',        provider_name: 'Access Control',               provider_type: 'access_control',       status: 'preview', configured: false, production_ready: false, live_connection_enabled: false, credential_reference_only: true },
]

export const DEFAULT_SECURITY_RISKS = [
  { risk_key: 'secrets_in_env',           risk_title: 'Secrets stored in environment variables without secrets manager', risk_category: 'secrets',         severity: 'high',     status: 'open', owner_role: 'founder', mitigation_summary: 'Migrate all credentials to a secrets manager reference pattern.', blocker: true },
  { risk_key: 'no_waf',                   risk_title: 'No WAF configured for production edge protection',               risk_category: 'network',          severity: 'high',     status: 'open', owner_role: 'founder', mitigation_summary: 'Configure WAF before live deployment.', blocker: true },
  { risk_key: 'no_rate_limiting',         risk_title: 'API rate limiting not configured',                               risk_category: 'network',          severity: 'medium',   status: 'open', owner_role: 'founder', mitigation_summary: 'Add rate limiting middleware to all public API routes.', blocker: true },
  { risk_key: 'no_audit_log_persistence', risk_title: 'Security audit log not persisted to database',                  risk_category: 'audit',            severity: 'medium',   status: 'open', owner_role: 'founder', mitigation_summary: 'Enable DB-backed audit logging.', blocker: false },
  { risk_key: 'no_ssl_verification',      risk_title: 'Database SSL connection not enforced',                          risk_category: 'database',         severity: 'high',     status: 'open', owner_role: 'founder', mitigation_summary: 'Enforce SSL on all database connections.', blocker: true },
  { risk_key: 'tenant_isolation_unverified', risk_title: 'Multi-tenant data isolation not formally verified',          risk_category: 'access_control',   severity: 'critical', status: 'open', owner_role: 'founder', mitigation_summary: 'Run tenant isolation audit across all DB queries.', blocker: true },
  { risk_key: 'no_rollback_plan',         risk_title: 'No deployment rollback plan defined',                           risk_category: 'deployment',       severity: 'medium',   status: 'open', owner_role: 'founder', mitigation_summary: 'Document and test rollback procedures.', blocker: false },
]

// ── Assertion helpers ─────────────────────────────────────────────────────────

export function assertNoExposedSecrets(payload) {
  if (!payload || typeof payload !== 'object') return
  for (const field of FORBIDDEN_SECRET_FIELDS) {
    if (field in payload) {
      throw new Error(`Security contract violation: field "${field}" must not appear in payloads. Use credential_reference_only pattern.`)
    }
  }
}

export function assertNoFakeCertificationClaims(payload) {
  if (!payload || typeof payload !== 'object') return
  for (const claim of FORBIDDEN_CERTIFICATION_CLAIMS) {
    if (payload[claim] === true) {
      throw new Error(`Security contract violation: claim "${claim}" is forbidden. No certification may be asserted without documented proof.`)
    }
  }
  const strVal = JSON.stringify(payload).toLowerCase()
  const forbidden = ['soc2_certified: true', 'iso_certified: true', 'pentest_passed: true', 'vuln_scan_passed: true']
  for (const f of forbidden) {
    if (strVal.includes(f)) {
      throw new Error(`Security contract violation: forbidden certification claim detected in payload: "${f}"`)
    }
  }
}

export function assertNoFakeProviderConnectionClaims(payload) {
  if (!payload || typeof payload !== 'object') return
  for (const claim of FORBIDDEN_PROVIDER_CONNECTION_CLAIMS) {
    if (payload[claim] === true) {
      throw new Error(`Security contract violation: claim "${claim}" is forbidden. No live provider connection may be claimed without verified integration.`)
    }
  }
  if (payload.live_connection_enabled === true) {
    throw new Error('Security contract violation: live_connection_enabled may not be set to true via preview endpoints.')
  }
}

export function assertNoFakeVulnerabilityScanClaims(payload) {
  if (!payload || typeof payload !== 'object') return
  const forbidden = ['vuln_scan_passed', 'vulnerability_scan_passed', 'zero_vulnerabilities', 'scan_clean']
  for (const f of forbidden) {
    if (payload[f] === true) {
      throw new Error(`Security contract violation: vulnerability scan claim "${f}" is forbidden without actual scan proof.`)
    }
  }
}

export function assertNoFakePenTestClaims(payload) {
  if (!payload || typeof payload !== 'object') return
  const forbidden = ['pentest_passed', 'penetration_tested', 'pen_test_complete', 'pentest_clean']
  for (const f of forbidden) {
    if (payload[f] === true) {
      throw new Error(`Security contract violation: penetration test claim "${f}" is forbidden without actual pen test proof.`)
    }
  }
}

export function assertRemoteDistributionBlockedUntilSecurityReady(summary) {
  if (summary && summary.remote_distribution_allowed === true) {
    throw new Error('Security contract violation: remote_distribution_allowed may not be set to true until all required security gates pass.')
  }
}

export function validateSecurityGatePayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Gate payload must be an object.')
  if (!SECURITY_GATE_STATUSES.includes(payload.status)) {
    throw new Error(`Invalid gate status "${payload.status}". Allowed: ${SECURITY_GATE_STATUSES.join(', ')}`)
  }
  if (payload.status === 'passed' && !payload.evidence_present) {
    throw new Error('Gate cannot be marked passed without evidence_present=true.')
  }
  assertNoExposedSecrets(payload)
}

export function validateSecurityProviderPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Provider payload must be an object.')
  if (!SECURITY_PROVIDER_TYPES.includes(payload.provider_type)) {
    throw new Error(`Invalid provider_type "${payload.provider_type}". Allowed: ${SECURITY_PROVIDER_TYPES.join(', ')}`)
  }
  assertNoExposedSecrets(payload)
  assertNoFakeProviderConnectionClaims(payload)
  assertNoFakeCertificationClaims(payload)
}

export function validateSecurityEvidencePayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Evidence payload must be an object.')
  if (!SECURITY_EVIDENCE_STATUSES.includes(payload.evidence_status)) {
    throw new Error(`Invalid evidence_status "${payload.evidence_status}". Allowed: ${SECURITY_EVIDENCE_STATUSES.join(', ')}`)
  }
  assertNoExposedSecrets(payload)
  assertNoFakeCertificationClaims(payload)
  assertNoFakeVulnerabilityScanClaims(payload)
  assertNoFakePenTestClaims(payload)
}

export default {
  SECURITY_PROVIDER_TYPES,
  SECURITY_GATE_CATEGORIES,
  SECURITY_GATE_STATUSES,
  SECURITY_RISK_SEVERITIES,
  SECURITY_EVIDENCE_STATUSES,
  SAFE_SECURITY_CLAIM_LABELS,
  FORBIDDEN_CERTIFICATION_CLAIMS,
  FORBIDDEN_PROVIDER_CONNECTION_CLAIMS,
  FORBIDDEN_SECRET_FIELDS,
  DEFAULT_SECURITY_GATES,
  DEFAULT_SECURITY_PROVIDERS,
  DEFAULT_SECURITY_RISKS,
}
