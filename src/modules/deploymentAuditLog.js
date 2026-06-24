// Deployment audit log — Phase 4.
//
// Honest prototype audit trail structure for module/vendor security
// events (access checks, disables, assignment changes). This is an
// in-memory log only — no database, no real deployment pipeline. It
// exists so moduleSecurityGuard.js / remoteDisableRegistry.js decisions
// can be recorded somewhere inspectable, which verifyVendorModuleSecurity.js
// relies on to confirm security events are actually being recorded.

export const AUDIT_ACTION = {
  ACCESS_CHECKED: 'access_checked',
  ACCESS_GRANTED: 'access_granted',
  ACCESS_DENIED: 'access_denied',
  MODULE_DISABLED: 'module_disabled',
  MODULE_RESTORED: 'module_restored',
  VENDOR_ASSIGNED: 'vendor_assigned',
}

export const AUDIT_STATUS = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  INFO: 'info',
}

// In-memory only — a real system would persist this durably. Prototype
// scope: enough structure to prove the audit trail concept end-to-end.
const auditLog = []

function uid() {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Records one audit entry. Every field the caller doesn't supply stays an
 * honest null rather than being guessed.
 */
export function recordAuditEvent({ vendorId, moduleId, action, status, actorRole, reason, environment, notes } = {}) {
  const entry = {
    id: uid(),
    vendorId: vendorId ?? null,
    moduleId: moduleId ?? null,
    action: action ?? null,
    status: status ?? AUDIT_STATUS.INFO,
    actorRole: actorRole ?? null,
    timestamp: Date.now(),
    reason: reason ?? null,
    environment: environment ?? null,
    notes: notes ?? null,
  }
  auditLog.push(entry)
  return entry
}

export function getAuditLog() {
  return [...auditLog]
}

export function getAuditLogForVendor(vendorId) {
  return auditLog.filter(entry => entry.vendorId === vendorId)
}

export function getAuditLogForModule(moduleId) {
  return auditLog.filter(entry => entry.moduleId === moduleId)
}

export default {
  AUDIT_ACTION,
  AUDIT_STATUS,
  recordAuditEvent,
  getAuditLog,
  getAuditLogForVendor,
  getAuditLogForModule,
}
