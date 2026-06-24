// Novi vendor module assignment registry — Phase 8.
//
// Honest prototype data structure for which vendor is assigned which Novi
// module, and the enabled/disabled state of that assignment. This is NOT a
// live deployment system and NOT a billing/licensing system — it only
// records assignment decisions made through this prototype layer. No
// network call, device, or vendor system is touched by anything in this
// file. In-memory only; restarts/reloads clear it, same as Phase 4/5/6.

import { getNoviModule } from './noviModuleRegistry.js'

export const ASSIGNMENT_STATUS = {
  ASSIGNED: 'assigned',
  REVOKED: 'revoked',
}

export const ENVIRONMENT = {
  DEMO: 'demo',
  STAGING: 'staging',
  PRODUCTION: 'production',
}

// In-memory only — a real system would persist this in a database.
const assignments = []

function uid() {
  return `assignment_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Returns true only if the module exists in the Novi registry and reports
 * itself as vendor-assignable today (controlMode !== NOT_READY). This is
 * the same readiness data Phase 6/7 already derived — never re-judged here.
 */
export function isModuleAssignable(moduleId) {
  const module = getNoviModule(moduleId)
  return Boolean(module?.vendorAssignable)
}

/**
 * Creates a new assignment record. Refuses to assign a module that the
 * registry itself reports as not vendor-assignable (e.g. Atmosphere while
 * it is not_ready) rather than silently allowing it and faking readiness.
 */
export function assignModuleToVendor({ vendorId, vendorName, moduleId, environment, assignedBy, notes }) {
  if (!isModuleAssignable(moduleId)) {
    return { ok: false, reason: 'module_not_assignable', record: null }
  }

  const record = {
    id: uid(),
    vendorId: vendorId ?? null,
    vendorName: vendorName ?? null,
    moduleId: moduleId ?? null,
    assignmentStatus: ASSIGNMENT_STATUS.ASSIGNED,
    environment: environment ?? ENVIRONMENT.DEMO,
    assignedBy: assignedBy ?? null,
    assignedAt: Date.now(),
    notes: notes ?? null,
    enabled: true,
  }
  assignments.push(record)
  return { ok: true, reason: null, record }
}

export function revokeAssignment(assignmentId) {
  const record = assignments.find(a => a.id === assignmentId)
  if (!record) return null
  record.assignmentStatus = ASSIGNMENT_STATUS.REVOKED
  record.enabled = false
  return record
}

export function setAssignmentEnabled(assignmentId, enabled) {
  const record = assignments.find(a => a.id === assignmentId)
  if (!record) return null
  record.enabled = Boolean(enabled)
  return record
}

export function getAssignments() {
  return [...assignments]
}

export function getAssignmentsForVendor(vendorId) {
  return assignments.filter(a => a.vendorId === vendorId)
}

export function getAssignmentsForModule(moduleId) {
  return assignments.filter(a => a.moduleId === moduleId)
}

export function getAssignedModuleIds(vendorId) {
  return assignments
    .filter(a => a.vendorId === vendorId && a.assignmentStatus === ASSIGNMENT_STATUS.ASSIGNED)
    .map(a => a.moduleId)
}

export function getEnabledModuleIds(vendorId) {
  return assignments
    .filter(a => a.vendorId === vendorId && a.assignmentStatus === ASSIGNMENT_STATUS.ASSIGNED && a.enabled)
    .map(a => a.moduleId)
}

export function getDisabledModuleIds(vendorId) {
  return assignments
    .filter(a => a.vendorId === vendorId && a.assignmentStatus === ASSIGNMENT_STATUS.ASSIGNED && !a.enabled)
    .map(a => a.moduleId)
}

export default {
  ASSIGNMENT_STATUS,
  ENVIRONMENT,
  isModuleAssignable,
  assignModuleToVendor,
  revokeAssignment,
  setAssignmentEnabled,
  getAssignments,
  getAssignmentsForVendor,
  getAssignmentsForModule,
  getAssignedModuleIds,
  getEnabledModuleIds,
  getDisabledModuleIds,
}
