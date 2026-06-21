/**
 * Shared Ops Control Bridge — create/update control commands in
 * shared:controlCommands and read shared:systemStatus.
 *
 * Commands flow E.A.T. → POS3 (and back) over the same local-first bus.
 * Each command reuses the normalized ops event shape and is mirrored onto the
 * ops event feed so command activity shows up in command-hub feeds.
 */

import { OPS_KEYS, opsGet, opsSet, getControlCommands, getSystemStatus } from './opsStorage.js'
import { normalizeEvent, emit, STATUS, OPS_EVENT_NAME } from './opsEventBus.js'

export { getControlCommands, getSystemStatus, STATUS }

function persist(commands) {
  opsSet(OPS_KEYS.commands, commands.slice(-300))
  try { window.dispatchEvent(new CustomEvent(OPS_EVENT_NAME, { detail: null })) } catch {}
}

/** Create a new control command and append it to shared:controlCommands. */
export function createCommand(partial) {
  const cmd = normalizeEvent({ ...partial, status: partial.status || STATUS.PENDING })
  const commands = getControlCommands()
  commands.push(cmd)
  persist(commands)
  // Mirror onto the event feed so it is visible in live feeds.
  emit({ ...cmd, eventType: cmd.eventType || 'CONTROL_COMMAND' })
  return cmd
}

function updateCommand(id, patch) {
  const commands = getControlCommands()
  const idx = commands.findIndex((c) => c.id === id)
  if (idx === -1) return null
  commands[idx] = { ...commands[idx], ...patch }
  persist(commands)
  return commands[idx]
}

export function markCommandStatus(id, status) {
  const resolved = [STATUS.COMPLETED, STATUS.FAILED, STATUS.CANCELLED].includes(status)
  return updateCommand(id, { status, resolvedAt: resolved ? Date.now() : null })
}

export const completeCommand = (id) => markCommandStatus(id, STATUS.COMPLETED)
export const failCommand     = (id) => markCommandStatus(id, STATUS.FAILED)
export const receiveCommand  = (id) => markCommandStatus(id, STATUS.RECEIVED)
export const cancelCommand   = (id) => markCommandStatus(id, STATUS.CANCELLED)

/** Read commands targeting a given system. */
export function commandsFor(system) {
  return getControlCommands().filter((c) => c.targetSystem === system)
}
