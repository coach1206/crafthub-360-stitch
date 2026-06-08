/**
 * E.A.T. Command Analytics Service — records engagement signals and
 * assembles the management-only analytics payload.
 * Route: /eat-command (management only — never exposed to guests).
 */

const EAT_KEY = 'novee_eat_analytics'

// ── Signal recording ──────────────────────────────────────────────────────────

export function recordEnvironmentSignal(session, signal) {
  _append({ type: 'environment', sessionId: session?.sessionId, ...signal })
}

export function recordAssetSignal(session, signal) {
  _append({ type: 'asset', sessionId: session?.sessionId, ...signal })
}

export function recordTransactionSignal(session, signal) {
  _append({ type: 'transaction', sessionId: session?.sessionId, ...signal })
}

// ── Score + payload builders ──────────────────────────────────────────────────

/**
 * Calculates an engagement score (0–500) from any session object.
 * Pure function — no localStorage reads.
 */
export function calculateEngagementScore(session) {
  let score = 0
  score += Math.min((session.completedSteps?.length || 0) * 15, 150)
  score += Math.min((session.xp || 0) * 0.1, 100)
  if (session.profileComplete) score += 30
  if (session.selectedMentor)  score += 20
  const stamps = (session.passport?.earnedStamps || session.smokecraftStamps || []).length
  score += Math.min(stamps * 50, 150)
  if (session.goldenBox?.progress > 0 || session.goldenBoxProgress) score += 40
  if (session.smokeCraft?.pairingSelections?.length > 0) score += 30
  return Math.round(Math.min(score, 500))
}

/**
 * Assembles the full E.A.T. Command payload from any session object.
 * Pure function — ready for management dashboard display.
 */
export function prepareCommandCenterPayload(session) {
  const stamps   = session.passport?.earnedStamps || session.smokecraftStamps || []
  const score    = calculateEngagementScore(session)
  const lbScore  = session.leaderboard?.score || session.leaderboardScore || 0

  return {
    sessionId:    session.sessionId,
    createdAt:    session.createdAt,
    updatedAt:    session.updatedAt,

    guestProgress: {
      completedSteps: session.completedSteps || [],
      currentStep:    session.currentSmokecraftStep,
      xp:             session.xp || 0,
      rank:           session.rank || 'Novice',
    },

    activeCraft:        session.selectedCraft || null,
    selectedMentor:     session.selectedMentor || null,
    selectedLevel:      session.selectedLevel || null,
    profileComplete:    !!session.profileComplete,

    passportActivity: {
      passportId:    session.passport?.passportId,
      stampCount:    stamps.length,
      latestStamp:   session.passport?.latestStampId || session.latestStampId,
      ceremonySeen:  session.passport?.ceremonySeen || false,
    },

    leaderboardScore:  lbScore,
    pairingInterests:  session.smokeCraft?.pairingSelections || [],
    goldenBoxProgress: session.goldenBox?.progress || 0,
    upsellSignals:     session.pos3?.upsellRecommendations || [],

    staffAssistTriggered: session.eatCommand?.staffAssistTriggered || false,
    sessionValueEstimate: _estimateSessionValue(session),
    engagementScore:      score,
    environmentNotes:     session.eatCommand?.environmentNotes || [],

    timestamp: Date.now(),
  }
}

// ── Private ───────────────────────────────────────────────────────────────────

function _estimateSessionValue(session) {
  let value = 0
  if (session.selectedCraft)       value += 15
  if (session.selectedMentor)      value += 10
  const pairs = session.smokeCraft?.pairingSelections?.length || 0
  value += pairs * 8
  if (session.completedSteps?.includes('golden-box'))       value += 25
  if (session.completedSteps?.includes('session-complete')) value += 45
  return value
}

function _append(event) {
  try {
    const raw    = localStorage.getItem(EAT_KEY)
    const events = raw ? JSON.parse(raw) : []
    events.push({ ...event, timestamp: Date.now() })
    localStorage.setItem(EAT_KEY, JSON.stringify(events.slice(-200)))
  } catch { /* storage unavailable */ }
}
