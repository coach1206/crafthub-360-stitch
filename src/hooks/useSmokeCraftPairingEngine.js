import { useState, useCallback } from 'react'
import * as api from '../services/smokecraft/pairingEngineApiClient.js'

/**
 * Holistic Fix 5B-1 — the ONE shared pairing adapter every active pairing
 * screen must use. Never computes a score itself; every state below is
 * driven by a real server response (or a real client-side network
 * condition like offline), never fabricated.
 *
 * status: idle | no-cigar | no-beverage | calculating | ready |
 *         low-confidence | no-safe-recommendation | error | offline |
 *         session-expired
 * saveStatus: idle | saving | saved | already-saved | error
 */
export function useSmokeCraftPairingEngine() {
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [ranked, setRanked] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [lastInput, setLastInput] = useState(null)
  const [lastSourceRoute, setLastSourceRoute] = useState(null)

  function classifyFailure(res) {
    if (res.status === 401 || res.status === 403) return 'session-expired'
    if (res.error === 'offline' || res.status === 0) return 'offline'
    return 'error'
  }

  const requestRecommendation = useCallback(async (input, sourceRoute) => {
    setLastInput(input); setLastSourceRoute(sourceRoute)
    if (!input.pairingType) { setStatus('no-beverage'); return }
    if (!input.strength && !input.cigarShape) { setStatus('no-cigar'); return }
    setStatus('calculating')
    const res = await api.recommendPairing(input, sourceRoute)
    if (!res.ok) { setStatus(classifyFailure(res)); return }
    setResult(res)
    if (res.compatScore < 40) setStatus('no-safe-recommendation')
    else if (res.compatScore < 60) setStatus('low-confidence')
    else setStatus('ready')
  }, [])

  const requestRanking = useCallback(async (input, sourceRoute) => {
    setLastInput(input); setLastSourceRoute(sourceRoute)
    if (!input.strength && !input.cigarShape) { setStatus('no-cigar'); return }
    setStatus('calculating')
    const res = await api.rankPairings(input, sourceRoute)
    if (!res.ok) { setStatus(classifyFailure(res)); return }
    setRanked(res.results)
    setStatus((res.results[0]?.compatScore ?? 0) < 40 ? 'no-safe-recommendation' : 'ready')
  }, [])

  const retry = useCallback(() => {
    if (!lastInput) return
    if (ranked !== null) requestRanking(lastInput, lastSourceRoute)
    else requestRecommendation(lastInput, lastSourceRoute)
  }, [lastInput, lastSourceRoute, ranked, requestRanking, requestRecommendation])

  const save = useCallback(async (input, idempotencyKey, learnerRating, learnerNotes, sourceRoute) => {
    setSaveStatus('saving')
    const res = await api.savePairing(input, idempotencyKey, learnerRating, learnerNotes, sourceRoute)
    if (!res.ok) { setSaveStatus('error'); return res }
    setSaveStatus(res.alreadySaved ? 'already-saved' : 'saved')
    return res
  }, [])

  return {
    status, result, ranked, saveStatus,
    requestRecommendation, requestRanking, retry, save,
    // This screen does not currently distinguish an authenticated account
    // from a guest client-side (no such detection exists yet in
    // SmokeCraft) — real identity/ownership is still fully enforced
    // server-side regardless of this flag's value.
    isGuestMode: true,
  }
}
