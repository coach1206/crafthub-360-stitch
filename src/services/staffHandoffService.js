/**
 * Staff Handoff Service — builds, stores, and retrieves the handoff payload
 * passed from a customer-facing SmokeCraft session to POS 3.
 *
 * Stored in sessionStorage only (cleared when the browser tab closes).
 * Never stores credentials or PINs — only the handoff/session data.
 */

const HANDOFF_KEY     = 'smokecraft_staff_handoff'
const STAFF_SESSION_KEY = 'smokecraft_staff_session'

/** Builds the staffHandoff payload from the guest session + optional table/notes. */
export function buildHandoffPayload(session, { tableId = null, staffNotes = '' } = {}) {
  const profile = session?.profile || {}
  const customerName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || null

  return {
    sessionId:              session?.sessionId || session?.guestId || null,
    tableId,
    customerName,
    selectedCigar:          session?.smokeCraft?.selectedFormat || null,
    selectedPairing:        session?.smokeCraft?.pairingSelections || null,
    humidorRecommendation:  session?.smokeCraft?.humidorRecommendation || null,
    purchaseRequest:        session?.smokeCraft?.purchaseRequest || null,
    mentorSelections:       { mentor: session?.selectedMentor || null, country: session?.selectedMentorCountry || null },
    rewardStatus:           { xp: session?.xp || 0, rank: session?.rank || null, leaderboard: session?.leaderboard || null },
    staffNotes,
    status:                 'pending_staff_acceptance',
    createdAt:              Date.now(),
  }
}

export function saveHandoff(payload) {
  try { sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(payload)) } catch {}
}

export function loadHandoff() {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

/** Marks the stored handoff as accepted by staff. */
export function acceptHandoff() {
  const current = loadHandoff()
  if (!current) return null
  const next = { ...current, status: 'accepted_by_staff', acceptedAt: Date.now() }
  saveHandoff(next)
  return next
}

export function clearHandoff() {
  try { sessionStorage.removeItem(HANDOFF_KEY) } catch {}
}

/** Persists safe staff session info only — never the raw PIN. */
export function saveStaffSession({ email, role, venueId = null, staffName = null }) {
  const session = {
    email,
    role,
    authenticated:  true,
    authenticatedAt: Date.now(),
    venueId,
    staffName,
  }
  try { sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session)) } catch {}
  return session
}

export function loadStaffSession() {
  try {
    const raw = sessionStorage.getItem(STAFF_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function clearStaffSession() {
  try { sessionStorage.removeItem(STAFF_SESSION_KEY) } catch {}
}
