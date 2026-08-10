import { useState, useEffect, useCallback } from 'react'
import { useSmokeCraftJourney } from '../context/SmokeCraftJourneyContext.jsx'
import { fetchMentorGuidance } from '../services/smokecraft/mentorGuidanceApiClient.js'

/**
 * Holistic Fix 5B-2A — the ONE shared mentor-guidance adapter every
 * active mentor screen/panel must use. Reads the real selected mentor
 * from SmokeCraftJourneyContext (the single canonical, server-synced
 * source per Holistic Fix 5A's dual-ownership fix) and requests
 * server-computed, context-aware guidance for it — never computes
 * guidance itself, never fabricates a message.
 *
 * Holistic Fix 5B-2A-1: `pairingContext` (optional) is the learner's
 * CURRENT, not-yet-necessarily-saved cigar+beverage selection on
 * Pairing Lab / Personalized Pairing Recommendations. When provided,
 * the server recomputes the score with the exact same pairing-engine
 * function the pairing screens themselves use, so this guidance can
 * never contradict the real pairing result on screen.
 *
 * status: no-mentor | loading | ready | unavailable | offline |
 *         session-expired
 */
export function useSmokeCraftMentorGuidance(screenContext, pairingContext) {
  const { journey } = useSmokeCraftJourney()
  const mentor = Array.isArray(journey?.mentor) ? journey.mentor[0] : null
  const pairingKey = pairingContext ? JSON.stringify(pairingContext) : null

  const [status, setStatus] = useState(mentor ? 'loading' : 'no-mentor')
  const [guidance, setGuidance] = useState(null)

  const load = useCallback(async () => {
    if (!mentor) { setStatus('no-mentor'); setGuidance(null); return }
    setStatus('loading')
    const res = await fetchMentorGuidance(mentor.id, screenContext, pairingContext)
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) setStatus('session-expired')
      else if (res.error === 'offline' || res.status === 0) setStatus('offline')
      else setStatus('unavailable')
      return
    }
    setGuidance(res.guidance)
    setStatus('ready')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentor?.id, screenContext, pairingKey])

  useEffect(() => { load() }, [load])

  return { status, guidance, mentor, retry: load, isGuestMode: true }
}
