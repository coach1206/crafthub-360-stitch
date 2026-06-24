// Novi remote deployment contract — Phase 9.
//
// Defines the official data shape a future, real live-deployment system
// would fill in. This file does not deploy anything — it is a contract
// (a typed shape + an honest-defaults factory), the same role
// moduleIntegrationContract.js played in Phase 3. `liveDeploymentAllowed`
// is hardcoded to `false` here and is not a per-call parameter precisely
// because no real deployment transport exists yet; flipping it to `true`
// is a deliberate, separate, future change — not something any caller of
// this file can do today.

export const DEPLOYMENT_MODE = {
  PREVIEW: 'preview',
  STAGING: 'staging',
  PRODUCTION: 'production',
}

export const ASSIGNMENT_STATUS = {
  ASSIGNED: 'assigned',
  NOT_ASSIGNED: 'not_assigned',
  REVOKED: 'revoked',
}

export const READINESS_STATUS = {
  READY: 'ready',
  NOT_READY: 'not_ready',
}

export const LICENSE_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
  UNKNOWN: 'unknown',
}

export const ENVIRONMENT = {
  DEMO: 'demo',
  STAGING: 'staging',
  PRODUCTION: 'production',
}

/**
 * Builds a deployment contract record with honest defaults. Every field a
 * caller doesn't supply stays at its safest, least-presumptive value —
 * never an invented "ready"/"active"/"approved" state. `liveDeploymentAllowed`
 * cannot be overridden by the caller; it is always `false` until a future
 * phase intentionally changes this file.
 */
export function createDeploymentContract(partial = {}) {
  return {
    vendorId: partial.vendorId ?? null,
    moduleId: partial.moduleId ?? null,
    deploymentProfile: partial.deploymentProfile ?? null,
    assignmentStatus: partial.assignmentStatus ?? ASSIGNMENT_STATUS.NOT_ASSIGNED,
    readinessStatus: partial.readinessStatus ?? READINESS_STATUS.NOT_READY,
    licenseStatus: partial.licenseStatus ?? LICENSE_STATUS.UNKNOWN,
    environment: partial.environment ?? ENVIRONMENT.DEMO,
    requestedBy: partial.requestedBy ?? null,
    approvedBy: partial.approvedBy ?? null,
    deploymentMode: partial.deploymentMode ?? DEPLOYMENT_MODE.PREVIEW,
    securityChecksRequired: true,
    rollbackRequired: true,
    auditRequired: true,
    // Hard-locked. Not settable via `partial` — see file header.
    liveDeploymentAllowed: false,
  }
}

export default {
  DEPLOYMENT_MODE,
  ASSIGNMENT_STATUS,
  READINESS_STATUS,
  LICENSE_STATUS,
  ENVIRONMENT,
  createDeploymentContract,
}
