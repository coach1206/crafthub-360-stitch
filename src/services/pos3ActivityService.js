/**
 * POS 3 Activity Service — records guest activity signals and prepares
 * clean payloads for future Clover / Toast / Square / Shopify integration.
 * No external API calls are made in this prototype.
 */

const POS3_KEY = 'novee_pos3_activity'

// ── Signal recording ──────────────────────────────────────────────────────────

export function recordGuestActivity(session) {
  _append({
    type:      'guest_activity',
    sessionId: session.sessionId,
    data:      {
      completedSteps: session.completedSteps,
      xp:             session.xp,
      rank:           session.rank,
    },
  })
}

export function recordPairingInterest(session, pairings) {
  _append({
    type:      'pairing_interest',
    sessionId: session.sessionId,
    data:      { pairings },
  })
}

export function recordUpsellSignal(session, signal) {
  _append({
    type:      'upsell_signal',
    sessionId: session.sessionId,
    data:      signal,
  })
}

export function recordInventorySignal(session, signal) {
  _append({
    type:      'inventory_signal',
    sessionId: session.sessionId,
    data:      signal,
  })
}

// ── Payload builders ──────────────────────────────────────────────────────────

/**
 * Derives cigar + beverage pairing suggestions from the session.
 * Pure function — takes session as parameter.
 */
export function getSuggestedPairingsForPOS(session) {
  const level   = session.selectedLevel  || 'Novice'
  const country = session.selectedMentorCountry || ''
  const stored  = session.pos3?.suggestedPairings || []
  if (stored.length > 0) return stored

  const base = [
    { type: 'spirit',   name: 'Single Malt Scotch',  reason: 'Complements full-body construction' },
    { type: 'spirit',   name: 'Añejo Rum',            reason: 'Tropical-country origin harmony' },
    { type: 'beverage', name: 'Dark Espresso',         reason: 'Earthy & robust contrast pairing' },
    { type: 'food',     name: 'Dark Chocolate 72%',    reason: 'Bitter-sweet complement' },
  ]
  if (level === 'Aficionado' || level === 'Connoisseur') {
    base.unshift({ type: 'spirit', name: '18-Year Reserve Whiskey', reason: 'Premium tier pairing for experienced palate' })
  }
  if (country.toLowerCase().includes('nicaragua')) {
    base.push({ type: 'spirit', name: 'Flor de Caña Centenario 25', reason: 'Nicaraguan origin harmony' })
  }
  return base.slice(0, 4)
}

/**
 * Assembles the full POS 3 payload from any session object.
 * Pure function — ready for future API integration.
 */
export function preparePOS3Payload(session) {
  return {
    sessionId:             session.sessionId,
    guestNickname:         session.profile?.nickname || session.guestProfile?.nickname || 'Lounge Guest',
    selectedCraft:         session.selectedCraft || 'SmokeCraft 360',
    selectedLevel:         session.selectedLevel || 'Novice',
    selectedMentor:        session.selectedMentor || null,
    selectedMentorCountry: session.selectedMentorCountry || null,
    flavorPreferences:     session.smokeCraft?.flavorPreferences || [],
    pairingSelections:     session.smokeCraft?.pairingSelections || [],
    suggestedPairings:     getSuggestedPairingsForPOS(session),
    upsellRecommendations: session.pos3?.upsellRecommendations || [],
    completedSteps:        session.completedSteps || [],
    passportStampCount:    (session.passport?.earnedStamps || session.smokecraftStamps || []).length,
    xp:                    session.xp || 0,
    rank:                  session.rank || 'Novice',
    timestamp:             Date.now(),
  }
}

// ── Private ───────────────────────────────────────────────────────────────────

function _append(event) {
  try {
    const raw    = localStorage.getItem(POS3_KEY)
    const events = raw ? JSON.parse(raw) : []
    events.push({ ...event, timestamp: Date.now() })
    localStorage.setItem(POS3_KEY, JSON.stringify(events.slice(-100)))
  } catch { /* storage unavailable */ }
}
