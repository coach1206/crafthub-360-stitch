/**
 * Shared Ops Control Bridge — create/update control commands in
 * shared:controlCommands and read shared:systemStatus.
 *
 * Commands flow E.A.T. → POS3 (and back) over the same local-first bus.
 * Each command reuses the normalized ops event shape and is mirrored onto the
 * ops event feed so command activity shows up in command-hub feeds.
 */

import { OPS_KEYS, opsGet, opsSet, getControlCommands, getSystemStatus } from './opsStorage.js'
import { normalizeEvent, emit, STATUS, OPS_EVENT_NAME, SYSTEMS } from './opsEventBus.js'
import { saveEvent } from '../syncQueueService.js'

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

  // Durable outbox entry for E.A.T.-originated operational commands only
  // (commands flowing the other direction are POS3-sourced and already
  // covered by pos3Service.js's own sync events).
  if (cmd.sourceSystem === SYSTEMS.EAT) {
    saveEvent({
      sourceSystem: 'EAT',
      eventType: cmd.eventType || 'CONTROL_COMMAND',
      entityId: cmd.id,
      payload: { command: cmd },
    }).catch(() => {})
  }

  return cmd
}

function updateEventStatus(id, patch) {
  const events = opsGet(OPS_KEYS.events, [])
  const idx = events.findIndex((e) => e.id === id)
  if (idx === -1) return null
  events[idx] = { ...events[idx], ...patch }
  opsSet(OPS_KEYS.events, events)
  try { window.dispatchEvent(new CustomEvent(OPS_EVENT_NAME, { detail: null })) } catch {}
  return events[idx]
}

/**
 * Update a command/event's status by id. IDs are shared between
 * shared:controlCommands (created via createCommand) and shared:opsEvents
 * (created via emit() elsewhere, e.g. SmokeCraft → POS3/EAT handoffs), so
 * "Acknowledge/Resolve" UI can call this on either kind of id.
 */
function updateCommand(id, patch) {
  const commands = getControlCommands()
  const idx = commands.findIndex((c) => c.id === id)
  if (idx !== -1) {
    commands[idx] = { ...commands[idx], ...patch }
    persist(commands)
    updateEventStatus(id, patch)
    return commands[idx]
  }
  // Not a control command — try updating it as a plain ops event instead.
  return updateEventStatus(id, patch)
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
