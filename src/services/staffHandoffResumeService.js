/**
 * Staff Handoff Resume Service — saves and restores full guest session state
 * during a staff handoff (SmokeCraft → POS360 or E.A.T.).
 *
 * Stored in sessionStorage only. Never stores PIN, credentials, or card data.
 * Cleared explicitly when staff returns to guest.
 */

const RESUME_KEY = 'sc_staff_handoff_resume'
const HANDOFF_META_KEY = 'sc_staff_handoff_meta'

/**
 * Save the full guest resume snapshot before entering staff mode.
 * Call this before navigating to /staff/pin.
 */
export function saveGuestResumeState(session, opts = {}) {
  const snapshot = {
    source:            'smokecraft',
    currentRoute:      opts.currentRoute || '/smokecraft',
    currentVisit:      opts.currentVisit || 1,
    currentSession:    opts.currentSession || 1,
    currentSessionId:  opts.currentSessionId || null,
    completedSteps:    session?.completedSteps || [],
    earnedBadges:      session?.badges || [],
    journeyXP:         session?.xp || 0,
    skillScore:        session?.skillScore || 0,
    challengeScore:    session?.challengeScore || 0,
    loyaltyPoints:     session?.loyaltyPoints || 0,
    passportStampCount: session?.passportStampCount || 0,
    lastUnlockedSession: opts.currentSession || 1,
    lastUnlockedVisit:   opts.currentVisit || 1,
    guestSessionId:    session?.sessionId || null,
    venueId:           opts.venueId || 'novee-grand-lounge',
    tabletId:          opts.tabletId || null,
    cartId:            opts.cartId || null,
    orderId:           opts.orderId || null,
    handoffTarget:     opts.handoffTarget || 'pos360',
    timestamp:         Date.now(),
  }
  try { sessionStorage.setItem(RESUME_KEY, JSON.stringify(snapshot)) } catch {}
  return snapshot
}

export function loadGuestResumeState() {
  try {
    const raw = sessionStorage.getItem(RESUME_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function clearGuestResumeState() {
  try { sessionStorage.removeItem(RESUME_KEY) } catch {}
}

/** Save handoff metadata (target, handoffId) separately so PIN screen can read it. */
export function saveHandoffMeta({ target, handoffId = null, startRoute }) {
  try { sessionStorage.setItem(HANDOFF_META_KEY, JSON.stringify({ target, handoffId, startRoute, savedAt: Date.now() })) } catch {}
}

export function loadHandoffMeta() {
  try {
    const raw = sessionStorage.getItem(HANDOFF_META_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function clearHandoffMeta() {
  try { sessionStorage.removeItem(HANDOFF_META_KEY) } catch {}
}
