/**
 * Shared Ops Storage — thin localStorage get/set/append helpers for the
 * local-first ops event bus shared between SmokeCraft, POS3, E.A.T. and NOVEE.
 *
 * No backend. All cross-system signalling is local-first via localStorage.
 *
 * Keys:
 *  - shared:opsEvents       → array of normalized ops event objects
 *  - shared:controlCommands → array of control command objects
 *  - shared:systemStatus    → object describing live system status
 */

export const OPS_KEYS = {
  events:   'shared:opsEvents',
  commands: 'shared:controlCommands',
  status:   'shared:systemStatus',
}

const MAX_EVENTS = 300

export function opsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function opsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** Append an item to an array stored at `key`, trimmed to the last MAX_EVENTS. */
export function opsAppend(key, item) {
  const list = opsGet(key, [])
  const next = Array.isArray(list) ? list : []
  next.push(item)
  opsSet(key, next.slice(-MAX_EVENTS))
  return item
}

export function getOpsEvents() {
  return opsGet(OPS_KEYS.events, [])
}

export function getControlCommands() {
  return opsGet(OPS_KEYS.commands, [])
}

export function getSystemStatus() {
  return opsGet(OPS_KEYS.status, {
    POS3:  { online: true,  label: 'System Online' },
    EAT:   { online: true,  label: 'Managed by E.A.T.' },
    NOVEE: { online: true,  label: 'NOVEE OS' },
  })
}

export function setSystemStatus(status) {
  return opsSet(OPS_KEYS.status, status)
}
