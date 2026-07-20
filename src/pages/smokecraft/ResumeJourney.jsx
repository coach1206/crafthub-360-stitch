import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { useSmokeCraftServerJourney } from '../../hooks/useSmokeCraftServerJourney.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftEntryHeaderBand from '../../components/smokecraft/SmokeCraftEntryHeaderBand.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { VISIT_STRUCTURE, ENTRY_LAYER_SCREENS, SUPPORTING_MODULES } from '../../constants/session.js'
import { getSessionByKey } from '../../constants/smokecraftJourney.js'
import { computeJourneyStatus } from '../../constants/smokecraftJourneyStatus.js'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

// Every route this app actually registers, across the numbered spine,
// Entry layer, and supporting modules — used to validate a candidate resume
// target before ever navigating to it. Never trust a persisted route blindly.
const KNOWN_ROUTES = new Set([
  ...VISIT_STRUCTURE.flatMap(v => v.sessions.map(s => s.route)),
  ...ENTRY_LAYER_SCREENS.map(s => s.route),
  ...SUPPORTING_MODULES.map(s => s.route),
].filter(Boolean))

// S1 Welcome to Today's Experience is now real and implemented (Package N)
// — it is the locked registry's authoritative starting destination for a
// brand new journey. (Its Package J stand-in, /smokecraft, is superseded.)
const NEW_JOURNEY_START_ROUTE = '/smokecraft/welcome'

// completedSteps ids that represent permanent account/Entry-layer state, not
// active-journey tasting progress — preserved when starting a new journey.
// S1 ('entry'/Welcome) is intentionally NOT preserved: it now represents
// having viewed *this* journey's introduction, so a new journey shows
// Welcome again, same as every other active-journey session.
export const PRESERVED_COMPLETED_STEP_IDS = ['enroll']

function resolveSafeResumeTarget(currentAllowed, persistedRoute) {
  if (persistedRoute && KNOWN_ROUTES.has(persistedRoute)) {
    return { route: persistedRoute, wasInvalidPersisted: false }
  }
  if (persistedRoute && !KNOWN_ROUTES.has(persistedRoute)) {
    // A previously-saved route no longer exists in the current registry —
    // fall back safely rather than navigating somewhere broken.
    if (currentAllowed?.route && KNOWN_ROUTES.has(currentAllowed.route)) {
      return { route: currentAllowed.route, wasInvalidPersisted: true }
    }
    return { route: '/smokecraft/identity', wasInvalidPersisted: true }
  }
  if (currentAllowed?.route && KNOWN_ROUTES.has(currentAllowed.route)) {
    return { route: currentAllowed.route, wasInvalidPersisted: false }
  }
  // Never hardcode /smokecraft here — fall back to the other known,
  // always-reachable Entry-layer screen instead.
  return { route: '/smokecraft/identity', wasInvalidPersisted: false }
}

function formatTimestamp(ts) {
  if (!ts) return null
  try { return new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) } catch { return null }
}

export default function ResumeJourney() {
  const { session, update } = useGuestSession()
  const { isDemoMode, currentAllowed, completedSessions } = useSmokeCraftProgress()
  const { journey, setResumeCache, startNewJourney } = useSmokeCraftJourney()
  const { startOrResumeJourney } = useSmokeCraftServerJourney()
  const navigate = useNavigate()
  const resetLock = useRef(false)

  useEffect(() => {
    try {
      const key = 'sc_active_screen'
      sessionStorage.setItem(key, '/smokecraft/resume')
      return () => {
        try { if (sessionStorage.getItem(key) === '/smokecraft/resume') sessionStorage.removeItem(key) } catch {}
      }
    } catch {}
  }, [])

  const [phase, setPhase] = useState('loading') // loading | error | ready
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)

  useEffect(() => {
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    try {
      const t = setTimeout(() => setPhase('ready'), 200)
      return () => clearTimeout(t)
    } catch {
      setPhase('error')
    }
  }, [])

  function handleRetry() {
    setPhase('loading')
    setTimeout(() => setPhase('ready'), 200)
  }

  const resolved = useMemo(
    () => resolveSafeResumeTarget(currentAllowed, journey.resumeRoute),
    [currentAllowed, journey.resumeRoute]
  )

  // Captured once, from whatever was actually persisted before this mount's
  // self-healing effect (below) corrects it — the effect updates
  // journey.resumeRoute in place, so re-deriving "was it invalid" from the
  // now-corrected value would always read false. This is what the "invalid
  // resume target" disclosure banner reads.
  const [wasInvalidOnLoad] = useState(
    () => resolveSafeResumeTarget(currentAllowed, journey.resumeRoute).wasInvalidPersisted
  )

  // Cache the live-validated resume target so it survives to the next visit
  // even if the guest closes the app mid-journey (idempotent — only writes
  // when the value actually changed).
  useEffect(() => {
    if (phase !== 'ready') return
    if (journey.resumeRoute === resolved.route && journey.resumeScreenId === currentAllowed?.id) return
    setSaveStatus('saving')
    setResumeCache(resolved.route, currentAllowed?.id || null)
    const t = setTimeout(() => setSaveStatus('idle'), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, resolved.route, currentAllowed?.id])

  const completedSteps = session?.completedSteps || []
  const hasProgress = completedSteps.some(id => !PRESERVED_COMPLETED_STEP_IDS.includes(id))
  // Journey-visual-sequence-final pass — single authoritative source for
  // completion + percentage, replacing two independently-computed values
  // that could disagree (see smokecraftJourneyStatus.js for the full
  // root-cause explanation).
  const journeyStatus = useMemo(() => computeJourneyStatus(completedSteps), [completedSteps])
  const journeyComplete = journeyStatus.isComplete
  const completionPercent = journeyStatus.completionPercent

  const lastCompletedSession = useMemo(() => {
    let best = null
    for (const id of completedSteps) {
      const s = getSessionByKey(id)
      if (s && (!best || s.session > best.session)) best = s
    }
    return best
  }, [completedSteps])
  const lastSaved = formatTimestamp(journey.journeyUpdatedAt)

  function handleResume() {
    triggerHaptic('medium')
    // Fire-and-forget server reconciliation: verifies (or re-establishes)
    // the authoritative server journey for the real selected venue.
    // Never blocks the existing, unchanged local-progress navigation —
    // reconciliation failures/timeouts are silently absorbed, matching
    // this screen's approved visual behavior exactly.
    if (journey.selectedVenue && !journey.selectedVenue.skipped) {
      startOrResumeJourney({
        venueId: journey.selectedVenue.id,
        sessionNumber: Math.min(completedSessions.length + 1, 27) || 1,
        phase: 'resume',
        sourceVersion: 'package-d',
      }).catch(() => {})
    }
    navigate(resolved.route)
  }

  function handleStartNewClick() {
    triggerHaptic('light')
    setConfirmingReset(true)
  }

  function handleCancelReset() {
    setConfirmingReset(false)
  }

  function handleConfirmReset() {
    if (resetLock.current) return
    resetLock.current = true
    triggerHaptic('medium')

    const archiveEntry = journeyComplete
      ? {
          journeyId: journey.activeJourneyId,
          cigarName: journey.selectedCigar?.name || null,
          completedAt: journey.sessionCompletion?.completedAt || Date.now(),
        }
      : null

    startNewJourney(archiveEntry)

    // Reset only active-journey session gating (completedSteps) — XP, rank,
    // and badges (the cumulative reward ledger) are intentionally untouched.
    update(prev => ({
      ...prev,
      completedSteps: prev.completedSteps.filter(id => PRESERVED_COMPLETED_STEP_IDS.includes(id)),
      currentSmokecraftStep: null,
    }))

    navigate(NEW_JOURNEY_START_ROUTE)
  }

  function handleReviewCompleted() {
    triggerHaptic('light')
    navigate('/smokecraft/final-review')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: `
        radial-gradient(ellipse at 20% -10%, rgba(233,193,118,0.10), transparent 55%),
        radial-gradient(ellipse at 100% 110%, ${WOOD_DIM}, transparent 60%),
        linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)
      `,
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
        <SmokeCraftEntryHeaderBand
          eyebrow="SmokeCraft 360 — Entry"
          title="Resume or Start New Journey"
          image={SC_ASSETS.resume}
          imagePosition="center 35%"
          overlayStrength={0.85}
          status={<>
            {isOffline && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 4 }}>Offline: showing your locally saved data.</div>}
            {saveStatus === 'saving' && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 4 }}>Saving…</div>}
          </>}
        />
      </div>

      <main style={{
        position: 'absolute', top: 'clamp(120px,16vh,160px)', bottom: 'clamp(120px,16vh,160px)',
        left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {phase === 'loading' && (
            <div role="status" aria-live="polite" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(28px,5vw,44px)', textAlign: 'center' }}>
              <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'sc-spin5 0.9s linear infinite' }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Loading your saved journey…</p>
              <style>{'@keyframes sc-spin5 { to { transform: rotate(360deg); } }'}</style>
            </div>
          )}

          {phase === 'error' && (
            <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>Something went wrong loading your journey.</p>
              <button type="button" onClick={handleRetry} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
                Retry
              </button>
            </div>
          )}

          {phase === 'ready' && !confirmingReset && (
            <>
              {!hasProgress && (
                <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>No saved journey yet — start your first SmokeCraft 360 session.</p>
                </div>
              )}

              {hasProgress && (
                <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,2.4vw,24px)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
                    {journeyComplete ? 'Journey Completed' : 'Saved Journey'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: CREAM }}>
                    <div>Venue: <span style={{ color: GOLD_DIM }}>{journey.selectedVenue?.name || (journey.selectedVenue?.skipped ? 'No venue selected' : 'Not selected')}</span></div>
                    <div>Cigar: <span style={{ color: GOLD_DIM }}>{journey.selectedCigar?.name || 'Not yet selected'}</span></div>
                    <div>Current phase: <span style={{ color: GOLD_DIM }}>{currentAllowed?.visitTitle || '—'}</span></div>
                    <div>Current session: <span style={{ color: GOLD_DIM }}>{currentAllowed ? `S${currentAllowed.session} — ${currentAllowed.label}` : '—'}</span></div>
                    <div>Last completed session: <span style={{ color: GOLD_DIM }}>{lastCompletedSession ? `S${lastCompletedSession.session} — ${lastCompletedSession.label}` : 'None yet'}</span></div>
                    <div>Last saved: <span style={{ color: GOLD_DIM }}>{lastSaved || 'Not yet saved'}</span></div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(229,226,225,0.55)', marginBottom: 4 }}>
                      <span>Completion (27-session spine)</span><span>{completionPercent}%</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(233,193,118,0.15)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${completionPercent}%`, background: GOLD, borderRadius: 3 }} />
                    </div>
                  </div>
                  {wasInvalidOnLoad && (
                    <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(229,170,100,0.85)' }}>
                      Your previously saved screen is no longer available — resuming at your current session instead.
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button" onClick={handleStartNewClick}
                  style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 24, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 14, padding: '14px 20px', cursor: 'pointer', outline: 'none', minHeight: 52 }}
                >
                  Start New Journey
                </button>
                {journeyComplete && (
                  <button
                    type="button" onClick={handleReviewCompleted}
                    style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 24, color: 'rgba(229,226,225,0.75)', fontFamily: 'Georgia, serif', fontSize: 13, padding: '12px 20px', cursor: 'pointer', outline: 'none', minHeight: 48 }}
                  >
                    Review Completed Journey
                  </button>
                )}
              </div>

              {journey.previousCompletedJourneys?.length > 0 && (
                <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.4)' }}>
                  {journey.previousCompletedJourneys.length} prior completed journey{journey.previousCompletedJourneys.length === 1 ? '' : 's'} on record.
                </div>
              )}
            </>
          )}

          {phase === 'ready' && confirmingReset && (
            <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(18px,2.8vw,26px)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(229,170,100,0.95)', marginBottom: 10 }}>Start a new journey?</div>
              <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.6, color: CREAM }}>
                This will reset your current cigar selection, tasting notes, scorecard ratings, AI summary, and pairing recommendation for this journey, and stamp a new journey record.
              </p>
              <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.6, color: 'rgba(229,226,225,0.7)' }}>
                Your account, venue preference, earned XP, rank, rewards, achievements, and Passport history are preserved and will not be affected.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button" onClick={handleConfirmReset}
                  style={{ background: GOLD, border: 'none', borderRadius: 20, color: '#0a0603', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 13, padding: '10px 18px', cursor: 'pointer', outline: 'none', minHeight: 44 }}
                >
                  Confirm — Start New Journey
                </button>
                <button
                  type="button" onClick={handleCancelReset}
                  style={{ background: 'transparent', border: `1.5px solid ${BORDER}`, borderRadius: 20, color: 'rgba(229,226,225,0.75)', fontFamily: 'Georgia, serif', fontSize: 13, padding: '10px 18px', cursor: 'pointer', outline: 'none', minHeight: 44 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Journey-visual-sequence-final pass — this bar previously always
          showed "Resume Journey" as primary, even for a completed journey
          (the exact "RESUME JOURNEY is also visible" alongside "Journey
          Completed" contradiction reported live). Primary action now
          follows the same authoritative journeyComplete value the page
          body already uses. */}
      <SmokeCraftNavBar
        primary={journeyComplete ? 'Review Completed Journey →' : 'Resume Journey →'}
        onPrimary={journeyComplete ? handleReviewCompleted : handleResume}
        primaryDisabled={!hasProgress || confirmingReset}
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft/identity')}
      />
    </div>
  )
}
