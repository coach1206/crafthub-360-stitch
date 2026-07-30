/**
 * Package 2 — Golden Box frontend API client. Same conventions as
 * managementSyncApiClient.js / venueManagementApiClient.js: credentials
 * included, abort-controller timeout, normalized {ok,status,error}.
 */
const BASE = '/api/smokecraft/golden-box'

function normalizeError(status, body) {
  return { ok: false, status, error: body?.error || 'internal_error' }
}

async function request(path, { method = 'GET', body, timeoutMs = 12000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    let json = null
    try { json = await res.json() } catch { /* non-JSON */ }
    if (!res.ok) return normalizeError(res.status, json)
    return { ok: true, status: res.status, ...json }
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, status: 0, error: 'timeout' }
    return { ok: false, status: 0, error: 'offline' }
  } finally {
    clearTimeout(timer)
  }
}

export const listCompetitions = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return request(`/competitions${qs ? `?${qs}` : ''}`)
}
export const getCompetition = (competitionId) => request(`/competitions/${competitionId}`)
export const evaluateEligibility = (competitionId) => request(`/competitions/${competitionId}/eligibility`, { method: 'POST' })
export const createEntry = (competitionId) => request(`/competitions/${competitionId}/entries`, { method: 'POST' })
export const getEntry = (entryId) => request(`/entries/${entryId}`)
export const saveDraft = (entryId, payload) => request(`/entries/${entryId}/draft`, { method: 'PATCH', body: payload })
export const submitEntry = (entryId, idempotencyKey) => request(`/entries/${entryId}/submit`, { method: 'POST', body: idempotencyKey ? { idempotencyKey } : undefined })
export const withdrawEntry = (entryId) => request(`/entries/${entryId}/withdraw`, { method: 'POST' })
export const getResults = (competitionId, entryId) => request(`/competitions/${competitionId}/entries/${entryId}/results`)
export const requestAiAnalysis = (entryId, analysisType) => request(`/entries/${entryId}/ai-analysis`, { method: 'POST', body: { analysisType } })
export const listAiAnalyses = (entryId) => request(`/entries/${entryId}/ai-analysis`)
export const getXpHistory = () => request(`/xp/history`)

// ── Package 7A: judge dashboard, entry review, scorecard lifecycle ────
export const getJudgeAssignments = () => request(`/judges/me/assignments`)
export const getEntryForJudge = (entryId) => request(`/judges/me/entries/${entryId}`)
export const getJudgingRubric = () => request(`/judging/rubric`)
export const saveScorecardDraft = (entryId, scores, expectedVersion, idempotencyKey) => request(`/entries/${entryId}/scorecard/draft`, { method: 'POST', body: { scores, expectedVersion, idempotencyKey } })
export const submitScorecard = (entryId, scores, idempotencyKey) => request(`/entries/${entryId}/scorecard`, { method: 'POST', body: { scores, idempotencyKey } })
export const lockScorecard = (scorecardId) => request(`/scorecards/${scorecardId}/lock`, { method: 'POST' })
export const voidScorecard = (scorecardId, reason) => request(`/scorecards/${scorecardId}/void`, { method: 'POST', body: { reason } })
export const amendScorecard = (scorecardId, scores, reason) => request(`/scorecards/${scorecardId}/amend`, { method: 'POST', body: { scores, reason } })

// ── Package 7A: mentor review ──────────────────────────────────────────
export const saveMentorReviewDraft = (entryId, payload) => request(`/entries/${entryId}/mentor-review/draft`, { method: 'POST', body: payload })
export const submitMentorReview = (entryId) => request(`/entries/${entryId}/mentor-review/submit`, { method: 'POST' })
export const getOwnMentorDraft = (entryId) => request(`/entries/${entryId}/mentor-review/draft`)
export const getMentorReviewsForEntry = (entryId) => request(`/entries/${entryId}/mentor-reviews`)
