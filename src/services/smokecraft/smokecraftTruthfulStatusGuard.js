/**
 * SmokeCraft Truthful Status Guard (R23)
 *
 * Prevents false success language from appearing in UI without verified evidence.
 * Every integration and async action must pass through this guard before
 * showing a completion or connected state to the user.
 *
 * Protected status words — these may NOT appear in UI unless evidence is present:
 *   Connected, Synced, Live, Active, Delivered, Paid, Available, Completed,
 *   Confirmed, Submitted, Claimed, Ordered
 *
 * Safe fallback language when evidence is absent:
 *   Not configured, Demo data, Manual mode, Offline, Pending, Failed,
 *   Retry required, Unknown, Awaiting confirmation
 */

// ── Evidence shape ───────────────────────────────────────────────────────────

/**
 * Build an evidence record for a completed action.
 * Pass this to assertTruthfulStatus() to unlock a success label.
 */
export function buildEvidence({
  providerId = null,      // provider response or record ID
  timestamp = null,       // ISO timestamp of verified event
  demoMode = false,       // true = demo, not real
  manualMode = false,     // true = manual override acknowledged
  apiResponseStatus = null, // HTTP status from provider (200, etc.)
  persisted = false,      // true = record confirmed in storage
  correlationId = null,   // request correlation/trace ID
}) {
  return { providerId, timestamp, demoMode, manualMode, apiResponseStatus, persisted, correlationId }
}

// ── Protected status words ───────────────────────────────────────────────────

const PROTECTED_WORDS = [
  'connected', 'synced', 'live', 'active', 'delivered', 'paid',
  'available', 'completed', 'confirmed', 'submitted', 'claimed', 'ordered',
]

function hasProtectedWord(label) {
  const lower = (label || '').toLowerCase()
  return PROTECTED_WORDS.some(w => lower.includes(w))
}

// ── Fallback map ─────────────────────────────────────────────────────────────

const FALLBACK_LABELS = {
  connected:   'Not configured',
  synced:      'Pending sync',
  live:        'Demo data',
  active:      'Not active',
  delivered:   'Pending',
  paid:        'Awaiting confirmation',
  available:   'Offline',
  completed:   'Incomplete',
  confirmed:   'Awaiting confirmation',
  submitted:   'Not submitted',
  claimed:     'Not claimed',
  ordered:     'Order pending',
}

function getFallback(label) {
  const lower = (label || '').toLowerCase()
  for (const [word, fallback] of Object.entries(FALLBACK_LABELS)) {
    if (lower.includes(word)) return fallback
  }
  return 'Unknown'
}

// ── Evidence validator ───────────────────────────────────────────────────────

function evidenceIsValid(evidence) {
  if (!evidence) return false
  if (evidence.demoMode) return true       // demo mode is honest — allow with label
  if (evidence.manualMode) return true     // manual override is honest — allow with label
  // Real evidence requires at least one of: provider ID, successful API status, or persisted record
  return (
    evidence.providerId != null ||
    (evidence.apiResponseStatus != null && evidence.apiResponseStatus >= 200 && evidence.apiResponseStatus < 300) ||
    evidence.persisted === true
  )
}

// ── Primary guard function ───────────────────────────────────────────────────

/**
 * Returns the display label appropriate for the current state.
 *
 * @param {string} successLabel - The label to show when verified (e.g. "Connected")
 * @param {object|null} evidence - Evidence record from buildEvidence()
 * @param {object} options
 * @param {boolean} options.warnOnFallback - Log a warning when falling back
 * @returns {{ label: string, verified: boolean, mode: string }}
 */
export function assertTruthfulStatus(successLabel, evidence = null, { warnOnFallback = false } = {}) {
  const hasProtected = hasProtectedWord(successLabel)

  if (!hasProtected) {
    // Non-protected label — allow unconditionally
    return { label: successLabel, verified: true, mode: 'unrestricted' }
  }

  if (!evidenceIsValid(evidence)) {
    const fallback = getFallback(successLabel)
    if (warnOnFallback) {
      console.warn(`[TruthfulStatus] Protected word in "${successLabel}" — no verified evidence. Showing: "${fallback}"`)
    }
    return { label: fallback, verified: false, mode: 'fallback' }
  }

  if (evidence.demoMode) {
    return { label: `${successLabel} (Demo)`, verified: true, mode: 'demo' }
  }
  if (evidence.manualMode) {
    return { label: `${successLabel} (Manual)`, verified: true, mode: 'manual' }
  }

  return { label: successLabel, verified: true, mode: 'verified' }
}

// ── Integration-specific helpers ─────────────────────────────────────────────

/**
 * Returns the display state for a POS360 handoff.
 * Requires a provider order ID or persisted record.
 */
export function pos360HandoffStatus(orderResponse) {
  const evidence = orderResponse
    ? buildEvidence({
        providerId: orderResponse.orderId || orderResponse.id || null,
        apiResponseStatus: orderResponse.status || null,
        persisted: !!orderResponse.saved,
        timestamp: orderResponse.timestamp || new Date().toISOString(),
      })
    : null
  return assertTruthfulStatus('Ordered', evidence)
}

/**
 * Returns the display state for an E.A.T. sync.
 */
export function eatSyncStatus(syncResponse) {
  const evidence = syncResponse
    ? buildEvidence({
        providerId: syncResponse.syncId || null,
        apiResponseStatus: syncResponse.httpStatus || null,
        persisted: syncResponse.persisted === true,
        timestamp: syncResponse.timestamp || null,
      })
    : null
  return assertTruthfulStatus('Synced', evidence)
}

/**
 * Returns the display state for a humidor connection.
 */
export function humidorConnectionStatus(connectionState) {
  const evidence = connectionState?.connected
    ? buildEvidence({
        providerId: connectionState.deviceId || null,
        timestamp: connectionState.lastSeen || null,
        persisted: true,
      })
    : null
  return assertTruthfulStatus('Connected', evidence)
}

/**
 * Returns the display state for a Passport stamp claim.
 */
export function passportClaimStatus(claimRecord) {
  const evidence = claimRecord
    ? buildEvidence({
        providerId: claimRecord.stampId || claimRecord.id || null,
        persisted: !!claimRecord.saved,
        timestamp: claimRecord.claimedAt || null,
        demoMode: claimRecord.demo === true,
      })
    : null
  return assertTruthfulStatus('Claimed', evidence)
}

/**
 * Returns the display state for a score submission.
 */
export function scorecardSubmitStatus(submitRecord) {
  const evidence = submitRecord
    ? buildEvidence({
        providerId: submitRecord.scoreId || submitRecord.id || null,
        persisted: !!submitRecord.saved,
        timestamp: submitRecord.submittedAt || null,
        demoMode: submitRecord.demo === true,
      })
    : null
  return assertTruthfulStatus('Submitted', evidence)
}

/**
 * Returns the display state for a purchase request.
 */
export function purchaseRequestStatus(requestRecord) {
  const evidence = requestRecord
    ? buildEvidence({
        providerId: requestRecord.requestId || null,
        persisted: !!requestRecord.saved,
        timestamp: requestRecord.requestedAt || null,
        demoMode: requestRecord.demo === true,
      })
    : null
  return assertTruthfulStatus('Ordered', evidence)
}

/**
 * Returns the display state for a management sync.
 */
export function managementSyncStatus(syncRecord) {
  const evidence = syncRecord
    ? buildEvidence({
        providerId: syncRecord.syncId || null,
        persisted: syncRecord.persisted === true,
        timestamp: syncRecord.syncedAt || null,
        demoMode: syncRecord.demo === true,
      })
    : null
  return assertTruthfulStatus('Synced', evidence)
}
