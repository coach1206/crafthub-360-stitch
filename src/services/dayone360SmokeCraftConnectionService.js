/**
 * DayOne360 SmokeCraft Connection Service — Frontend
 * Reference: www.dayone360.com
 *
 * CONSTRAINTS:
 * - Does NOT claim live travel booking, relocation, or concierge fulfillment.
 * - Does NOT fake DayOne360 external website integration.
 * - backendConnected: true only when API confirms real DB persistence.
 * - Never blocks the guest screen — all calls fire-and-forget or graceful fallback.
 */

const BASE = '/api/dayone360/smokecraft'
const SAFE_CLAIM = 'dayone360_smokecraft_connection_internal'

async function d1Fetch(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) return { ok: false, backendConnected: false, safeClaim: SAFE_CLAIM }
    return await res.json()
  } catch {
    return { ok: false, backendConnected: false, safeClaim: SAFE_CLAIM }
  }
}

function localFallback(area) {
  return { ok: false, backendConnected: false, persistenceMode: 'local_fallback', safeClaim: SAFE_CLAIM, area }
}

export async function getDayOne360ConnectionHealth() {
  const json = await d1Fetch('/health')
  if (!json?.success || !json?.backendConnected) return localFallback('health')
  return { ok: true, backendConnected: true, safeClaim: SAFE_CLAIM, websiteReference: 'www.dayone360.com' }
}

export async function getDayOne360AssetInventory() {
  const json = await d1Fetch('/assets')
  if (!json?.success) return localFallback('assets')
  return { ok: true, backendConnected: json?.backendConnected ?? false, assets: json?.data?.assets || [], safeClaim: SAFE_CLAIM }
}

export async function createSmokeCraftDayOneConnection({ venueId, guestId, smokecraftSessionId, connectionType, workflowReference, metadata }) {
  const json = await d1Fetch('/connection', {
    method: 'POST',
    body: JSON.stringify({ venueId, guestId, smokecraftSessionId, connectionType, workflowReference, metadata }),
  })
  if (!json?.success || !json?.backendConnected) return localFallback('createSmokeCraftDayOneConnection')
  return { ok: true, backendConnected: true, connection: json?.data?.connection, safeClaim: SAFE_CLAIM }
}

export async function recordDayOneGuestWorkflowEvent({ connectionId, venueId, guestId, smokecraftSessionId, eventType, eventPayload }) {
  const json = await d1Fetch('/workflow-event', {
    method: 'POST',
    body: JSON.stringify({ connectionId, venueId, guestId, smokecraftSessionId, eventType, eventPayload }),
  })
  if (!json?.success || !json?.backendConnected) return localFallback('recordDayOneGuestWorkflowEvent')
  return { ok: true, backendConnected: true, workflowEvent: json?.data?.workflowEvent, safeClaim: SAFE_CLAIM }
}

export async function writeDayOneConnectionAuditEvent({ connectionId, venueId, eventType, syncStatus, backendConnected, metadata }) {
  const json = await d1Fetch('/audit/event', {
    method: 'POST',
    body: JSON.stringify({ connectionId, venueId, eventType, syncStatus, backendConnected, metadata }),
  })
  if (!json?.success || !json?.backendConnected) return localFallback('writeDayOneConnectionAuditEvent')
  return { ok: true, backendConnected: true, safeClaim: SAFE_CLAIM }
}
