/**
 * SmokeCraft Final QA Service — Frontend
 * Fetches final QA and release candidate data from /api/modules/smokecraft/final-qa/*.
 */

const BASE = '/api/modules/smokecraft/final-qa'

async function safeFetch(url) {
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
    if (!res.ok) return { error: `HTTP ${res.status}`, url }
    return await res.json()
  } catch (err) {
    return { error: err.message, url }
  }
}

export const getFinalQaStatus       = () => safeFetch(`${BASE}/status`)
export const getEndToEnd            = () => safeFetch(`${BASE}/end-to-end`)
export const getReleaseCandidate    = () => safeFetch(`${BASE}/release-candidate`)
export const getHandoff             = () => safeFetch(`${BASE}/handoff`)
export const getProductionBlockers  = () => safeFetch(`${BASE}/production-blockers`)
export const getDocumentationLock   = () => safeFetch(`${BASE}/documentation-lock`)
export const getProtectedFiles      = () => safeFetch(`${BASE}/protected-files`)
export const getHonestStatus        = () => safeFetch(`${BASE}/honest-status`)
export const getRoadmap             = () => safeFetch(`${BASE}/roadmap`)
