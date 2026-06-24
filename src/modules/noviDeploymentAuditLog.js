// Novi deployment audit log — Phase 8.
//
// Honest prototype audit trail for Novi-side assignment/disable/restore
// preview actions. This is an in-memory log only — no database, no real
// deployment pipeline. It exists so noviVendorModuleAssignments.js and
// noviRemoteDisableService.js actions can be recorded somewhere
// inspectable, the same pattern as the Phase 4 deploymentAuditLog.js, kept
// as a separate Novi-side log since these are Novi-originated prototype
// actions, not CraftHub-originated ones.

export const NOVI_AUDIT_ACTION = {
  VENDOR_ASSIGNED_PREVIEW: 'vendor_assigned_preview',
  VENDOR_ASSIGNMENT_REVOKED_PREVIEW: 'vendor_assignment_revoked_preview',
  MODULE_DISABLED_PREVIEW: 'module_disabled_preview',
  MODULE_RESTORED_PREVIEW: 'module_restored_preview',
}

export const NOVI_AUDIT_STATUS = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  INFO: 'info',
}

// In-memory only — a real system would persist this durably. Prototype
// scope: enough structure to prove the audit trail concept end-to-end.
const auditLog = []

function uid() {
  return `novi_audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Records one audit entry. Every field the caller doesn't supply stays an
 * honest null rather than being guessed.
 */
export function recordNoviAuditEvent({ action, moduleId, vendorId, actorRole, status, reason, environment, notes } = {}) {
  const entry = {
    id: uid(),
    action: action ?? null,
    moduleId: moduleId ?? null,
    vendorId: vendorId ?? null,
    actorRole: actorRole ?? null,
    status: status ?? NOVI_AUDIT_STATUS.INFO,
    reason: reason ?? null,
    timestamp: Date.now(),
    environment: environment ?? null,
    notes: notes ?? null,
  }
  auditLog.push(entry)
  return entry
}

export function getNoviAuditLog() {
  return [...auditLog]
}

export function getNoviAuditLogForVendor(vendorId) {
  return auditLog.filter(entry => entry.vendorId === vendorId)
}

export function getNoviAuditLogForModule(moduleId) {
  return auditLog.filter(entry => entry.moduleId === moduleId)
}

export default {
  NOVI_AUDIT_ACTION,
  NOVI_AUDIT_STATUS,
  recordNoviAuditEvent,
  getNoviAuditLog,
  getNoviAuditLogForVendor,
  getNoviAuditLogForModule,
}
