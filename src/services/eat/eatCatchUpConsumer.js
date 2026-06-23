/**
 * E.A.T. Catch-Up Consumer — Phase 6D
 * Pulls backend-confirmed events (Phase 6B's durable event store, via
 * fetchEventsSince/fetchConfirmedEvents in syncApiClient.js) so E.A.T.'s
 * live feeds can backfill after a reconnect. This never reads local
 * IndexedDB pending records — only backend-confirmed events count as
 * "caught up", per the same confirm-before-claim rule as syncQueueService.js.
 */

import { fetchEventsSince, fetchConfirmedEvents } from '../syncApiClient.js'

const STATE_KEY = 'novee_eat_catchup_state'

const DEFAULT_STATE = {
  lastProcessedEventId:    null,
  lastProcessedCreatedAt:  null,
  lastSuccessfulCatchUpAt: null,
  lastAttemptedCatchUpAt:  null,
  totalProcessed:          0,
  totalFailed:             0,
  lastError:               null,
  mode:                    'idle',
  updatedAt:               null,
}

export function getCatchUpState() {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function setCatchUpState(patch) {
  const next = { ...getCatchUpState(), ...patch, updatedAt: Date.now() }
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(next))
  } catch {
    // localStorage unavailable/full — state simply won't persist this update
  }
  return next
}

export function resetCatchUpState() {
  try {
    localStorage.removeItem(STATE_KEY)
  } catch {}
  return { ...DEFAULT_STATE }
}

/**
 * Fetches confirmed events since the last processed cursor (or a recent
 * window if no cursor exists yet). Returns null on any backend failure —
 * callers must not infer "no events" from null.
 */
export async function fetchCatchUpEvents(options = {}) {
  const state = getCatchUpState()
  const cursor = options.cursor ?? state.lastProcessedCreatedAt

  if (cursor) {
    return fetchEventsSince(cursor)
  }
  return fetchConfirmedEvents({ sourceSystem: options.sourceSystem, limit: options.limit ?? 100 })
}

/**
 * Marks a single confirmed event as processed by advancing the cursor.
 * Does not apply any side effect to other systems — Phase 6D only tracks
 * catch-up progress; replaying events into other feeds is a future phase.
 */
export function markCatchUpEventProcessed(event) {
  setCatchUpState({
    lastProcessedEventId:   event.eventId,
    lastProcessedCreatedAt: event.createdAt || event.clientCreatedAt || Date.now(),
  })
}

export function processSingleCatchUpEvent(event) {
  if (!event || !event.eventId) {
    throw new Error('Invalid catch-up event: missing eventId')
  }
  markCatchUpEventProcessed(event)
  return event
}

/**
 * Runs one catch-up pass: fetch confirmed events since the cursor, advance
 * the cursor per event, and record an honest mode reflecting what actually
 * happened (no fake "caught_up" claim if the backend was unreachable).
 */
export async function processCatchUpEvents(options = {}) {
  setCatchUpState({ mode: 'catching_up', lastAttemptedCatchUpAt: Date.now() })

  const response = await fetchCatchUpEvents(options)

  if (!response || response.success !== true) {
    const error = !response
      ? 'No response from backend (offline or unavailable)'
      : (response.error || 'Backend reported failure fetching catch-up events')
    setCatchUpState({
      mode: response ? 'error' : 'degraded',
      lastError: error,
      totalFailed: getCatchUpState().totalFailed + 1,
    })
    return { success: false, processed: 0, error }
  }

  const events = response.data?.events || []
  let processed = 0
  for (const event of events) {
    try {
      processSingleCatchUpEvent(event)
      processed += 1
    } catch (err) {
      setCatchUpState({ lastError: err.message })
    }
  }

  setCatchUpState({
    mode: 'caught_up',
    lastError: null,
    lastSuccessfulCatchUpAt: Date.now(),
    totalProcessed: getCatchUpState().totalProcessed + processed,
  })

  return { success: true, processed, total: events.length }
}

/** Human-readable summary for the staff sync status UI — no fake claims. */
export function getCatchUpSummary() {
  const state = getCatchUpState()
  return {
    ...state,
    isStale: state.lastSuccessfulCatchUpAt
      ? Date.now() - state.lastSuccessfulCatchUpAt > 5 * 60 * 1000
      : true,
  }
}
