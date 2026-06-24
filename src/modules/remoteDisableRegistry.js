// Remote disable registry — Phase 4.
//
// Honest prototype logic for recording a "disable this module" decision —
// either for one vendor or globally. This is NOT a live remote-control
// channel: calling disableModuleForVendor()/disableModuleGlobally() only
// updates this in-memory record, the same way the rest of Phase 4 is a
// local prototype. No network call reaches any real device, POS terminal,
// or vendor system as a result of calling these functions.

export const DISABLE_SCOPE = {
  VENDOR: 'vendor',
  GLOBAL: 'global',
}

export const RESTORE_STATUS = {
  NOT_REQUESTED: 'not_requested',
  REQUESTED: 'requested',
  RESTORED: 'restored',
}

// In-memory only — restarts/reloads clear this. A real system would
// persist disable records in a database with an audit trail, not here.
const disableRecords = []

function uid() {
  return `disable_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function createDisableRecord({ scope, moduleId, vendorId, reason, disabledBy }) {
  return {
    id: uid(),
    scope,
    moduleId,
    vendorId: scope === DISABLE_SCOPE.VENDOR ? vendorId ?? null : null,
    reason: reason ?? null,
    disabledBy: disabledBy ?? null,
    timestamp: Date.now(),
    restoreStatus: RESTORE_STATUS.NOT_REQUESTED,
  }
}

/** Records a vendor-scoped disable. Does not touch any live system. */
export function disableModuleForVendor({ moduleId, vendorId, reason, disabledBy }) {
  const record = createDisableRecord({ scope: DISABLE_SCOPE.VENDOR, moduleId, vendorId, reason, disabledBy })
  disableRecords.push(record)
  return record
}

/** Records a global disable (applies to every vendor). Does not touch any live system. */
export function disableModuleGlobally({ moduleId, reason, disabledBy }) {
  const record = createDisableRecord({ scope: DISABLE_SCOPE.GLOBAL, moduleId, vendorId: null, reason, disabledBy })
  disableRecords.push(record)
  return record
}

/** Marks a disable record as restore-requested. Placeholder only — does not actually restore anything live. */
export function requestRestore(disableRecordId) {
  const record = disableRecords.find(r => r.id === disableRecordId)
  if (!record) return null
  record.restoreStatus = RESTORE_STATUS.REQUESTED
  return record
}

export function getDisableRecords() {
  return [...disableRecords]
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
  isModuleDisabledForVendor,
}
