/**
 * SmokeCraft Management Sync — server journey state layer (Package C).
 *
 * Bridges the existing, local-only SmokeCraftJourneyContext to the real
 * Package B backend. The server becomes authoritative for: journey
 * identity, ownership, venue validation, snapshot version, payload hash,
 * completion timestamp, sync event identity/status. Local state remains
 * the source of truth for in-progress UI selections until explicitly
 * saved — this hook never replaces the existing context, it extends it
 * via journey.managementSync (see setManagementSyncState).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSmokeCraftJourney } from '../context/SmokeCraftJourneyContext.jsx'
import * as api from '../services/smokecraft/managementSyncApiClient.js'

// Module-level guard: guest-session establishment must be idempotent per
// browser session, not per component mount/remount — a second mounted
// consumer of this hook (e.g. navigating between screens) must not
// re-issue a session request.
let guestSessionPromise = null

export function useSmokeCraftServerJourney() {
  const { journey, setManagementSyncState } = useSmokeCraftJourney()
  const ms = journey.managementSync || {}

  const [identityState, setIdentityState] = useState(() =>
    typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'initializing'
  )
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  // ── Guest session (idempotent per browser session) ──────────────────
  const ensureGuestSession = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setIdentityState('offline')
      return { ok: false, error: 'offline' }
    }
    if (!guestSessionPromise) {
      guestSessionPromise = api.establishGuestSession()
    }
    const result = await guestSessionPromise
    if (!mountedRef.current) return result
    if (result.ok) {
      setIdentityState('ready')
    } else {
      setIdentityState(result.error === 'offline' ? 'offline' : 'unauthorized')
      guestSessionPromise = null // allow a real retry, not a cached failure
    }
    return result
  }, [])

  useEffect(() => {
    ensureGuestSession()
  }, [ensureGuestSession])

  // ── Venue validation ─────────────────────────────────────────────────
  // Does not create a journey — only proves the venue_id is real/active.
  // Journey creation happens separately (startOrResumeJourney), so a
  // guest browsing venues never creates a server journey merely by
  // looking.
  const validateVenue = useCallback(async (venueId) => {
    if (!venueId) return { ok: false, error: 'invalid_venue_identifier' }
    // No dedicated "validate only" endpoint exists in Package B — journey
    // creation itself performs the validation (requireValidVenue runs
    // before the journey insert). Package C reuses that same validation
    // by attempting a lightweight journey lookup path is not available
    // either, so venue validity is confirmed at the point a journey is
    // actually started (see startOrResumeJourney), consistent with "do
    // not create a journey merely because a venue was selected."
    return { ok: true, deferred: true }
  }, [])

  // ── Start or resume ──────────────────────────────────────────────────
  const startInFlightRef = useRef(null)

  const startOrResumeJourney = useCallback(async ({ venueId, sessionNumber, phase, sourceVersion, tenantId = 'smokecraft-360' }) => {
    // Reconciliation priority (Phase 7): (1) valid server ownership +
    // record, (2) latest server snapshot, (3) compatible local unsynced
    // state, (4) clean start.
    if (ms.serverJourneyId) {
      const existing = await api.getJourney(ms.serverJourneyId)
      if (existing.ok) {
        // Reconciliation tier 2: pull the latest server snapshot version
        // so a newer server-side save (e.g. from another device) is
        // reflected rather than silently trusting a possibly-stale local
        // snapshotVersion value.
        const latestSnap = await api.getLatestSnapshot(ms.serverJourneyId)
        const nextState = {
          ...ms,
          serverJourneyId: existing.journey.journeyId,
          serverStatus: existing.journey.status,
          ownershipError: null,
        }
        if (latestSnap.ok && latestSnap.snapshotVersion !== ms.snapshotVersion) {
          nextState.snapshotVersion = latestSnap.snapshotVersion
          nextState.stale = ms.snapshotVersion != null // a real, newer server version existed than what we had locally
        }
        setManagementSyncState(nextState)
        return { ok: true, journey: existing.journey, resumed: true }
      }
      // Journey no longer resolves for us (not found / not ours / stale)
      // — do not silently keep a dead reference; fall through to a clean
      // start rather than repeatedly failing against a bad ID.
      setManagementSyncState({ ...ms, serverJourneyId: null, ownershipError: existing.error })
    }

    // Prevent duplicate creation from double-click / remount / retry —
    // a single in-flight promise is shared by all callers until it
    // resolves.
    if (startInFlightRef.current) return startInFlightRef.current

    const guest = await ensureGuestSession()
    if (!guest.ok) return { ok: false, error: guest.error }

    const p = api.createJourney(venueId, { tenantId, sessionNumber, phase, sourceVersion }).then(result => {
      startInFlightRef.current = null
      if (!result.ok) {
        setManagementSyncState({ ...ms, venueError: result.error === 'venue_not_found' || result.error === 'venue_inactive' ? result.error : null })
        return { ok: false, error: result.error }
      }
      setManagementSyncState({
        ...ms,
        serverJourneyId: result.journey.journeyId,
        venueId: result.journey.venueId,
        sessionNumber: result.journey.sessionNumber,
        serverStatus: result.journey.status,
        venueError: null,
        ownershipError: null,
      })
      return { ok: true, journey: result.journey, resumed: false }
    })
    startInFlightRef.current = p
    return p
  }, [ms, setManagementSyncState, ensureGuestSession])

  // ── Snapshot ──────────────────────────────────────────────────────────
  const snapshotInFlightRef = useRef(false)

  // Each step below accepts an optional explicit journeyId override —
  // required when chaining start -> snapshot -> complete -> sync in a
  // single caller: journey.managementSync (and therefore `ms`) only
  // updates on the *next* render, so a chained call relying on `ms`
  // alone would read a stale (pre-update) closure value. The override
  // lets a caller pass the ID it just received directly.
  const saveSnapshot = useCallback(async (payload, journeyIdOverride) => {
    const journeyId = journeyIdOverride || ms.serverJourneyId
    if (!journeyId) return { ok: false, error: 'journey_not_found' }
    if (snapshotInFlightRef.current) return { ok: false, error: 'save_in_progress' }
    snapshotInFlightRef.current = true
    setManagementSyncState({ ...ms, serverJourneyId: journeyId, saveState: 'saving' })
    const result = await api.createSnapshot(journeyId, payload)
    snapshotInFlightRef.current = false
    if (!result.ok) {
      setManagementSyncState({ ...ms, serverJourneyId: journeyId, saveState: 'failed' })
      return result
    }
    setManagementSyncState({
      ...ms,
      serverJourneyId: journeyId,
      snapshotVersion: result.snapshotVersion,
      saveState: 'saved',
      lastSavedAt: Date.now(),
    })
    return result
  }, [ms, setManagementSyncState])

  // ── Completion ────────────────────────────────────────────────────────
  const completeOnServer = useCallback(async (journeyIdOverride) => {
    const journeyId = journeyIdOverride || ms.serverJourneyId
    if (!journeyId) return { ok: false, error: 'journey_not_found' }
    const result = await api.completeJourney(journeyId)
    if (!result.ok) return result
    setManagementSyncState({ ...ms, serverJourneyId: journeyId, serverStatus: result.journey.status, completedAt: result.journey.completedAt })
    return result
  }, [ms, setManagementSyncState])

  // ── Sync (explicit action only — never called by an effect on mount) ──
  const syncInFlightRef = useRef(false)

  const requestSync = useCallback(async (destination = 'venue_insights', journeyIdOverride) => {
    const journeyId = journeyIdOverride || ms.serverJourneyId
    if (!journeyId) return { ok: false, error: 'journey_not_found' }
    if (syncInFlightRef.current) return { ok: false, error: 'sync_in_progress' }
    syncInFlightRef.current = true
    setManagementSyncState({ ...ms, serverJourneyId: journeyId, syncStatus: 'pending' })
    const result = await api.requestManagementSync(journeyId, destination)
    syncInFlightRef.current = false
    if (!result.ok) {
      setManagementSyncState({ ...ms, serverJourneyId: journeyId, syncStatus: 'failed', syncError: result.error })
      return result
    }
    setManagementSyncState({ ...ms, serverJourneyId: journeyId, syncStatus: result.status, syncEventId: result.eventId, lastSyncedAt: Date.now() })
    return result
  }, [ms, setManagementSyncState])

  const refreshSyncStatus = useCallback(async () => {
    if (!ms.serverJourneyId) return { ok: false, error: 'journey_not_found' }
    return api.getManagementSyncStatus(ms.serverJourneyId)
  }, [ms.serverJourneyId])

  return {
    identityState,
    managementSync: ms,
    ensureGuestSession,
    validateVenue,
    startOrResumeJourney,
    saveSnapshot,
    completeOnServer,
    requestSync,
    refreshSyncStatus,
  }
}
