// Novi remote disable service — Phase 8.
//
// Honest prototype logic for recording a "disable this module" decision
// from the Novi OS side, either for one vendor or globally, plus a restore
// placeholder. This mirrors the existing Phase 4 remoteDisableRegistry.js
// pattern but lives in the Novi-side service layer so the Deployment
// Center page has a Novi-native source to call instead of reaching into
// CraftHub's own prototype registry directly.
//
// This is NOT a live remote-control channel. No network call reaches any
// real device, POS terminal, or vendor system as a result of calling these
// functions. In-memory only — restarts/reloads clear it.

export const DISABLE_SCOPE = {
  VENDOR: 'vendor',
  GLOBAL: 'global',
}

export const RESTORE_STATUS = {
  NOT_REQUESTED: 'not_requested',
  REQUESTED: 'requested',
  RESTORED: 'restored',
}

// In-memory only — a real system would persist disable records durably.
const disableRecords = []

function uid() {
  return `novi_disable_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function createDisableRecord({ scope, moduleId, vendorId, reason, actor, environment }) {
  return {
    id: uid(),
    scope,
    moduleId: moduleId ?? null,
    vendorId: scope === DISABLE_SCOPE.VENDOR ? vendorId ?? null : null,
    reason: reason ?? null,
    actor: actor ?? null,
    timestamp: Date.now(),
    environment: environment ?? null,
    restoreStatus: RESTORE_STATUS.NOT_REQUESTED,
  }
}

/** Records a vendor-scoped disable. Prototype only — touches no live system. */
export function disableModuleForVendor({ moduleId, vendorId, reason, actor, environment }) {
  const record = createDisableRecord({ scope: DISABLE_SCOPE.VENDOR, moduleId, vendorId, reason, actor, environment })
  disableRecords.push(record)
  return record
}

/** Records a global disable (applies to every vendor). Prototype only — touches no live system. */
export function disableModuleGlobally({ moduleId, reason, actor, environment }) {
  const record = createDisableRecord({ scope: DISABLE_SCOPE.GLOBAL, moduleId, vendorId: null, reason, actor, environment })
  disableRecords.push(record)
  return record
}

/** Marks a disable record as restore-requested. Placeholder only — does not actually restore anything live. */
export function requestRestore({ disableRecordId, actor }) {
  const record = disableRecords.find(r => r.id === disableRecordId)
  if (!record) return null
  record.restoreStatus = RESTORE_STATUS.REQUESTED
  record.restoreRequestedBy = actor ?? null
  record.restoreRequestedAt = Date.now()
  return record
}

export function getDisableRecords() {
  return [...disableRecords]
}

export function getDisableRecordsForVendor(vendorId) {
  return disableRecords.filter(r => r.vendorId === vendorId)
}

export function getDisableRecordsForModule(moduleId) {
  return disableRecords.filter(r => r.moduleId === moduleId)
}

export function isModuleDisabledForVendor(moduleId, vendorId) {
  return disableRecords.some(r =>
    r.restoreStatus !== RESTORE_STATUS.RESTORED &&
    r.moduleId === moduleId &&
    (r.scope === DISABLE_SCOPE.GLOBAL || (r.scope === DISABLE_SCOPE.VENDOR && r.vendorId === vendorId)),
  )
}

export default {
  DISABLE_SCOPE,
  RESTORE_STATUS,
  disableModuleForVendor,
  disableModuleGlobally,
  requestRestore,
  getDisableRecords,
  getDisableRecordsForVendor,
  getDisableRecordsForModule,
  isModuleDisabledForVendor,
}
