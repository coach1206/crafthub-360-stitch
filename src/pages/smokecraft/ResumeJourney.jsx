import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { useStartNewSmokeCraftJourney } from '../../hooks/useStartNewSmokeCraftJourney.js'
import { useSmokeCraftServerJourney } from '../../hooks/useSmokeCraftServerJourney.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftEntryHeaderBand from '../../components/smokecraft/SmokeCraftEntryHeaderBand.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { VISIT_STRUCTURE, ENTRY_LAYER_SCREENS, SUPPORTING_MODULES } from '../../constants/session.js'
import { getSessionByNumber } from '../../constants/smokecraftJourney.js'
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
  const { journey, setResumeCache } = useSmokeCraftJourney()
  const { startNewSmokeCraftJourney } = useStartNewSmokeCraftJourney()
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
  // Journey-visual-sequence-final pass — single authoritative source for
  // completion + percentage, replacing two independently-computed values
  // that could disagree (see smokecraftJourneyStatus.js for the full
  // root-cause explanation).
  const journeyStatus = useMemo(() => computeJourneyStatus(completedSteps), [completedSteps])
  const journeyComplete = journeyStatus.isComplete
  const completionPercent = journeyStatus.completionPercent
  // Start-vs-Resume remediation pass — hasProgress previously scanned raw
  // completedSteps for ANY non-preserved id, so a legacy record with a
  // later session's id present but no earlier required session genuinely
  // complete (journeyStatus.hasStarted === false, completionPercent === 0)
  // still showed the Saved Journey card and enabled "Resume Journey" —
  // exactly the reported defect for a user with no real active progress.
  // hasProgress is now the same single authoritative signal used for
  // current/last-completed/percent, so a "no valid active journey" state
  // can never coexist with a rendered Saved Journey card.
  const hasProgress = journeyStatus.hasStarted

  // Emergency Root-Cause pass — a guest with no real curriculum progress
  // (hasProgress === false) no longer gets an inline "No Active SmokeCraft
  // Journey" card on this page; Resume now redirects immediately to the
  // landing page, which already owns the single canonical Start CTA. This
  // removes a second, competing "no active journey" rendering path — the
  // landing page's own computeJourneyStatus-driven CTA logic (unchanged,
  // already correct) is the only place that state is ever displayed.
  useEffect(() => {
    if (phase === 'ready' && !hasProgress) {
      navigate('/smokecraft', { replace: true })
    }
  }, [phase, hasProgress, navigate])

  // Live remediation pass — derived from the same authoritative,
  // contiguous-prefix journeyStatus used for currentAllowed/completionPercent
  // above, never from an independent max-scan over completedSteps. A
  // max-scan could report a high-numbered session (e.g. S27) as "last
  // completed" purely because its id was present in a legacy record, even
  // when an earlier required session (e.g. S1) was never actually
  // completed and currentAllowed correctly still points at it — the exact
  // "Current session: S1 / Last completed: S27 / 63%" contradiction this
  // pass fixes. See smokecraftJourneyStatus.js for the full explanation.
  const lastCompletedSession = useMemo(
    () => journeyStatus.lastCompletedSessionNumber ? getSessionByNumber(journeyStatus.lastCompletedSessionNumber) : null,
    [journeyStatus.lastCompletedSessionNumber]
  )
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
    // Emergency Live Remediation pass — one canonical start function, used
    // by every Start entry point on this page (see
    // useStartNewSmokeCraftJourney.js for the full root-cause explanation:
    // this used to only reset SmokeCraftJourneyContext, never the sibling
    // GuestSessionContext fields where the reported stale learner name,
    // mentor, and cigar actually lived).
    const route = startNewSmokeCraftJourney({ firstRoute: NEW_JOURNEY_START_ROUTE })
    navigate(route)
  }

  function handleReviewCompleted() {
    triggerHaptic('light')
    navigate('/smokecraft/final-review')
  }

  // No-flash guard — render nothing while the no-active-journey redirect
  // effect above is in flight, matching SmokeCraftSessionGuard's own
  // established no-flash-of-protected-content pattern.
  if (phase === 'ready' && !hasProgress) return null

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

          {/* !hasProgress case now redirects before this point is ever reached (see the no-flash guard above) — the inline "No Active SmokeCraft Journey" card was removed as a second, competing render path for that state. */}
          {phase === 'ready' && !confirmingReset && hasProgress && (
            <>
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

              {/* Start-vs-Resume remediation pass — the primary action here now
                  follows the exact 3-state CTA contract (no valid active
                  journey / valid incomplete journey / valid completed
                  journey), matching the bottom nav bar exactly. When no valid
                  active journey exists, "Start" needs no confirmation (there
                  is nothing recoverable to lose) — the confirm dialog only
                  appears when starting over would discard real progress. */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!hasProgress && (
                  <button
                    type="button" onClick={() => navigate(startNewSmokeCraftJourney({ firstRoute: NEW_JOURNEY_START_ROUTE }))}
                    style={{ background: GOLD, border: 'none', borderRadius: 24, color: '#0a0603', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, padding: '14px 20px', cursor: 'pointer', outline: 'none', minHeight: 52 }}
                  >
                    START SMOKECRAFT JOURNEY
                  </button>
                )}
                {hasProgress && !journeyComplete && (
                  <button
                    type="button" onClick={handleResume}
                    style={{ background: GOLD, border: 'none', borderRadius: 24, color: '#0a0603', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, padding: '14px 20px', cursor: 'pointer', outline: 'none', minHeight: 52 }}
                  >
                    RESUME SMOKECRAFT JOURNEY
                  </button>
                )}
                {journeyComplete && (
                  <button
                    type="button" onClick={handleReviewCompleted}
                    style={{ background: GOLD, border: 'none', borderRadius: 24, color: '#0a0603', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, padding: '14px 20px', cursor: 'pointer', outline: 'none', minHeight: 52 }}
                  >
                    VIEW COMPLETED JOURNEY
                  </button>
                )}
                {hasProgress && (
                  <button
                    type="button" onClick={handleStartNewClick}
                    style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 24, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 14, padding: '14px 20px', cursor: 'pointer', outline: 'none', minHeight: 52 }}
                  >
                    START NEW SMOKECRAFT JOURNEY
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

      {/* Journey-visual-sequence-final / Start-vs-Resume remediation passes —
          this bar previously always showed "Resume Journey" as primary, even
          for a completed journey, AND even for no valid active journey at
          all (disabled but still labeled "Resume Journey"). Primary action
          and label now follow the exact same 3-state CTA contract as the
          page body: no valid active journey -> Start, valid incomplete ->
          Resume, valid complete -> View Completed. */}
      <SmokeCraftNavBar
        primary={!hasProgress ? 'START SMOKECRAFT JOURNEY →' : journeyComplete ? 'VIEW COMPLETED JOURNEY →' : 'RESUME SMOKECRAFT JOURNEY →'}
        onPrimary={!hasProgress ? () => navigate(startNewSmokeCraftJourney({ firstRoute: NEW_JOURNEY_START_ROUTE })) : journeyComplete ? handleReviewCompleted : handleResume}
        primaryDisabled={confirmingReset}
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft/identity')}
      />
    </div>
  )
}
