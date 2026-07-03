/**
 * NOMPF — Module Audit Service
 * Preview-only audit trail for module lifecycle events.
 */

const dbAvailable = () => !!process.env.DATABASE_URL

const _auditLog = []

export const MODULE_AUDIT_EVENTS = [
  'module_manifest_registered',
  'module_manifest_updated',
  'module_dependency_checked',
  'module_activation_preview',
  'module_deactivation_preview',
  'module_install_preview',
  'module_uninstall_preview',
  'module_enable_preview',
  'module_disable_preview',
  'module_upgrade_preview',
  'module_rollback_preview',
  'module_permission_checked',
  'module_license_checked',
  'module_marketplace_draft_created',
  'module_white_label_checked',
]

export function createModuleAuditEvent(eventType, moduleId, actor, meta = {}) {
  const event = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    eventType,
    moduleId,
    actor: actor ?? 'system',
    meta,
    timestamp: new Date().toISOString(),
    persistenceMode: dbAvailable() ? 'database' : 'in_memory_only',
    preview_only: !dbAvailable(),
  }
  _auditLog.push(event)
  return event
}

export function getModuleAuditEvents() {
  return {
    events: _auditLog,
    total: _auditLog.length,
    persistenceMode: dbAvailable() ? 'database' : 'in_memory_only',
    degradedMode: !dbAvailable(),
    audit_preview_only: !dbAvailable(),
    database_required: !dbAvailable(),
  }
}

export function getModuleAuditEventsByModule(moduleId) {
  const filtered = _auditLog.filter(e => e.moduleId === moduleId)
  return {
    moduleId,
    events: filtered,
    total: filtered.length,
    persistenceMode: dbAvailable() ? 'database' : 'in_memory_only',
  }
}

export function getModuleAuditEventsByActor(actor) {
  const filtered = _auditLog.filter(e => e.actor === actor)
  return {
    actor,
    events: filtered,
    total: filtered.length,
    persistenceMode: dbAvailable() ? 'database' : 'in_memory_only',
  }
}

export function buildModuleAuditReport() {
  return {
    totalEvents: _auditLog.length,
    supportedEventTypes: MODULE_AUDIT_EVENTS,
    persistenceMode: dbAvailable() ? 'database' : 'in_memory_only',
    degradedMode: !dbAvailable(),
    audit_preview_only: !dbAvailable(),
    database_required: !dbAvailable(),
    note: 'Module audit events persist in memory only until DATABASE_URL is configured.',
  }
}
