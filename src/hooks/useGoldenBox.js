import { useState, useCallback } from 'react'
import * as api from '../services/goldenBox/goldenBoxApiClient.js'
import { establishGuestSession } from '../services/smokecraft/managementSyncApiClient.js'

let sessionEstablished = false
export async function ensureIdentity() {
  if (sessionEstablished) return
  const result = await establishGuestSession()
  if (result.ok) sessionEstablished = true
}

/**
 * Package 2 — separates Golden Box state into clear categories (per the
 * mandate's state-management requirement): competition data, eligibility
 * data, entry data. UI-only temporary state (which panel is open, etc.)
 * stays local to each component, not here.
 */
export function useGoldenBoxCompetitions() {
  const [state, setState] = useState('idle') // idle|loading|ready|error
  const [competitions, setCompetitions] = useState([])

  const load = useCallback(async (params) => {
    setState('loading')
    await ensureIdentity()
    const result = await api.listCompetitions(params)
    if (!result.ok) { setState('error'); return }
    setCompetitions(result.competitions || [])
    setState('ready')
  }, [])

  return { state, competitions, load }
}

export function useGoldenBoxCompetitionDetail(competitionId) {
  const [state, setState] = useState('idle') // idle|loading|ready|not-found|error
  const [competition, setCompetition] = useState(null)
  const [eligibility, setEligibility] = useState(null)
  const [eligibilityState, setEligibilityState] = useState('idle') // idle|loading|ready|error

  const load = useCallback(async () => {
    if (!competitionId) return
    setState('loading')
    await ensureIdentity()
    const result = await api.getCompetition(competitionId)
    if (!result.ok) { setState(result.status === 404 ? 'not-found' : 'error'); return }
    setCompetition(result.competition)
    setState('ready')
  }, [competitionId])

  const checkEligibility = useCallback(async () => {
    setEligibilityState('loading')
    await ensureIdentity()
    const result = await api.evaluateEligibility(competitionId)
    if (!result.ok) { setEligibilityState('error'); return }
    setEligibility(result)
    setEligibilityState('ready')
  }, [competitionId])

  return { state, competition, load, eligibility, eligibilityState, checkEligibility }
}

export function useGoldenBoxEntry(entryId) {
  const [state, setState] = useState('idle') // idle|loading|ready|not-found|error
  const [entry, setEntry] = useState(null)
  const [visibility, setVisibility] = useState(null)
  const [savedComponents, setSavedComponents] = useState([]) // raw golden_box_blend_components rows, for rehydration
  // Package 7 — the entry's current golden_box_entry_versions row
  // (presentation_payload/pairing_selection/pairing_defense), for
  // rehydrating the Blend Story & Defense step. Already returned by
  // handleGetEntry since Package 4's rehydration fix; just not
  // previously exposed by this hook.
  const [currentVersion, setCurrentVersion] = useState(null)
  const [saveState, setSaveState] = useState('idle') // idle|saving|saved|failed|stale

  const load = useCallback(async () => {
    if (!entryId) return
    setState('loading')
    await ensureIdentity()
    const result = await api.getEntry(entryId)
    if (!result.ok) { setState(result.status === 404 ? 'not-found' : 'error'); return }
    setEntry(result.entry)
    setVisibility(result.visibility)
    setSavedComponents(result.components || [])
    setCurrentVersion(result.currentVersion || null)
    setState('ready')
  }, [entryId])

  const save = useCallback(async (payload) => {
    setSaveState('saving')
    const result = await api.saveDraft(entryId, payload)
    if (!result.ok) { setSaveState('failed'); return result }
    setSaveState('saved')
    await load()
    setTimeout(() => setSaveState('idle'), 2000)
    return result
  }, [entryId, load])

  const submit = useCallback(async () => {
    const result = await api.submitEntry(entryId)
    if (result.ok) await load()
    return result
  }, [entryId, load])

  return { state, entry, visibility, savedComponents, currentVersion, load, saveState, save, submit }
}
