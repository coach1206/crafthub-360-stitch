/**
 * NOVEE OS — Deployment Activation Feature Flags (Phase D.7 / Phase E.4)
 * contains_secrets: false
 * Live production, remote distribution, and rollback execution all default FALSE.
 */

const NOVEE_OS_DEPLOYMENT_ACTIVATION_FLAGS = {
  NOVEE_DEPLOYMENT_ACTIVATION_ENABLED:              true,
  NOVEE_DEPLOYMENT_LIVE_PRODUCTION_ENABLED:         false,
  NOVEE_DEPLOYMENT_REMOTE_DISTRIBUTION_ENABLED:     false,
  NOVEE_DEPLOYMENT_ROLLBACK_EXECUTION_ENABLED:      false,
  NOVEE_DEPLOYMENT_FAKE_PRODUCTION_PROOF_BLOCKED:   true,
  NOVEE_DEPLOYMENT_SECRET_EXPOSURE_BLOCKED:         true,
  NOVEE_DEPLOYMENT_FAKE_BUILD_PASS_BLOCKED:         true,
  NOVEE_DEPLOYMENT_FAKE_VERIFICATION_PASS_BLOCKED:  true,
  NOVEE_DEPLOYMENT_SECURITY_GATE_REQUIRED:          true,
  NOVEE_DEPLOYMENT_FRONTEND_SAFE_CLAIMS_ENABLED:    true,
  NOVEE_DEPLOYMENT_AUDIT_LOGGING_ENABLED:           true,
}

export function getNoveeOSDeploymentActivationFlags(overrides = {}) {
  return { ...NOVEE_OS_DEPLOYMENT_ACTIVATION_FLAGS, ...overrides }
}

export default NOVEE_OS_DEPLOYMENT_ACTIVATION_FLAGS
