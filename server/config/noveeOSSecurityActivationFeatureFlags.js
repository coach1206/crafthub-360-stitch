/**
 * NOVEE OS — Security Activation Feature Flags (Phase D.6 / Phase E.3)
 * contains_secrets: false
 * Live provider connections and production enforcement default to FALSE.
 */

const NOVEE_OS_SECURITY_ACTIVATION_FLAGS = {
  NOVEE_SECURITY_ACTIVATION_ENABLED:                          true,
  NOVEE_SECURITY_LIVE_PROVIDER_CONNECTIONS_ENABLED:           false,
  NOVEE_SECURITY_FAKE_CERTIFICATION_CLAIMS_BLOCKED:           true,
  NOVEE_SECURITY_SECRET_EXPOSURE_BLOCKED:                     true,
  NOVEE_SECURITY_FAKE_SCAN_RESULTS_BLOCKED:                   true,
  NOVEE_SECURITY_FAKE_PENTEST_RESULTS_BLOCKED:                true,
  NOVEE_SECURITY_REMOTE_DISTRIBUTION_REQUIRES_SECURITY_READY: true,
  NOVEE_SECURITY_FRONTEND_SAFE_CLAIMS_ENABLED:                true,
  NOVEE_SECURITY_AUDIT_LOGGING_ENABLED:                       true,
  NOVEE_SECURITY_PRODUCTION_ENFORCEMENT_ENABLED:              false,
}

export function getNoveeOSSecurityActivationFlags(overrides = {}) {
  return { ...NOVEE_OS_SECURITY_ACTIVATION_FLAGS, ...overrides }
}

export default NOVEE_OS_SECURITY_ACTIVATION_FLAGS
