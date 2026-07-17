import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { TOTAL_SESSIONS } from '../../constants/session.js'
import {
  calculateRecommendations,
  getTotalConfiguredXP,
  getSuggestedEvents,
  getSuggestedQuiz,
  getRelatedChallenges,
} from '../../services/smokecraft/recommendedJourneyService.js'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

export default function SessionComplete() {
  const { session, update, awardSessionRewards, awardStamp } = useGuestSession()
  const { journey, setSessionCompletion } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('loading') // loading | error | ready
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

  // S27 completion — idempotent, unchanged mechanism from before this
  // package (awardSessionRewards already no-ops if 'session-complete' is
  // already in completedSteps). No XP is awarded merely for opening this
  // page beyond this one, already-idempotent completion signal.
  useEffect(() => {
    if (!session.completedSteps.includes('session-complete')) {
      awardSessionRewards('session-complete')
      awardStamp('journey-complete', 'session-complete')
      triggerHaptic('success')
    }
    if (!journey.sessionCompletion?.completedAt) {
      setSessionCompletion({ ...(journey.sessionCompletion || {}), completedAt: Date.now() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pure, deterministic recommendation — same session/journey input always
  // yields the same output. Recomputed on every render so it updates the
  // instant underlying data changes, and stays identical across refresh
  // when nothing has changed.
  const recommendations = useMemo(() => calculateRecommendations(session, journey), [session, journey])
  const totalConfiguredXP = useMemo(() => getTotalConfiguredXP(), [])
  const suggestedEvents = useMemo(() => getSuggestedEvents(), [])
  const suggestedQuiz = useMemo(() => getSuggestedQuiz(session), [session])
  const relatedChallenges = useMemo(
    () => recommendations.primary ? getRelatedChallenges(session, recommendations.primary.id) : [],
    [session, recommendations.primary]
  )

  // Persist the recommendation viewed state + selection into the canonical
  // sc_journey_v1 sessionCompletion field — no new storage key.
  useEffect(() => {
    if (phase !== 'ready') return
    const cur = journey.sessionCompletion || {}
    const primaryId = recommendations.primary?.id || null
    const alternateIds = recommendations.alternates.map(a => a.id)
    if (cur.primaryRecommendationId === primaryId && JSON.stringify(cur.alternateRecommendationIds || []) === JSON.stringify(alternateIds) && cur.viewedAt) return
    setSessionCompletion({
      ...cur,
      primaryRecommendationId: primaryId,
      alternateRecommendationIds: alternateIds,
      viewedAt: cur.viewedAt || Date.now(),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, recommendations.primary, recommendations.alternates])

  const guestName = journey?.identity?.preferredName || journey?.identity?.fullName || null
  const cigarName = journey?.selectedCigar?.name || null
  const mentorName = Array.isArray(journey?.mentor) && journey.mentor.length > 0
    ? journey.mentor[0]?.name || null : null
  const pairingRec = journey?.pairing?.recommendation || null
  const flavorNotes = journey?.flavorMemory?.selectedFlavors || []
  const formatLabel = journey?.format?.label || null
  const completedCount = session?.completedSteps?.length || 0
  const progressPct = Math.round((completedCount / TOTAL_SESSIONS) * 100)
  const achievementsEarned = journey?.achievements?.earned ? Object.keys(journey.achievements.earned).length : 0
  const badgesEarned = session?.badges?.length || 0

  function handleRetry() {
    setPhase('loading')
    setTimeout(() => setPhase('ready'), 200)
  }

  function handleSelectJourney(cat) {
    triggerHaptic('light')
    setSessionCompletion({ ...(journey.sessionCompletion || {}), selectedNextJourneyId: cat.id })
  }

  function handleStartJourney(cat) {
    if (!cat?.route) return
    triggerHaptic('medium')
    setSessionCompletion({ ...(journey.sessionCompletion || {}), selectedNextJourneyId: cat.id })
    navigate(cat.route)
  }

  function handleExploreAll() {
    triggerHaptic('light')
    navigate('/smokecraft/resume')
  }

  function handleViewProgress() {
    triggerHaptic('light')
    navigate('/smokecraft/rewards')
  }

  const selectedNextJourneyId = journey.sessionCompletion?.selectedNextJourneyId || null

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
      fontFamily: 'Georgia, serif',
    }}>
      {/* Approved production visual — the new "Recommend next journey.png"
          asset has not yet been added to this repository (confirmed via
          full-filesystem search); the current approved Session Complete
          shell is reused here until the new asset is registered, per the
          same precedent established in Packages P and R. Any sample names,
          XP, progress, or badge values baked into this artwork are layout
          reference only — every value shown below is live React content. */}
      <div
        role="img"
        aria-label="SmokeCraft 360 — Recommended Next Journey"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(90px,14vh,140px)',
          backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.35), rgba(6,8,16,0.92)), url(${SC_ASSETS.recommendedNextJourney})`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          zIndex: 1,
        }}
      />

      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0', zIndex: 3 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6 }}>
          SmokeCraft 360 — Session 27 of {TOTAL_SESSIONS}
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700, color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15 }}>
          Recommended Next Journey
        </h1>
        {isOffline && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', marginTop: 4 }}>Offline: showing your locally saved data.</div>}
      </header>

      <main
        tabIndex={-1}
        style={{
          position: 'absolute', top: 'clamp(150px,20vh,190px)', bottom: 'clamp(120px,16vh,160px)',
          left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
          padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
        }}
      >
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>

          {phase === 'loading' && (
            <div role="status" aria-live="polite" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(28px,5vw,44px)', textAlign: 'center' }}>
              <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'rnj-spin 0.9s linear infinite' }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Preparing your journey summary…</p>
              <style>{'@keyframes rnj-spin { to { transform: rotate(360deg); } }'}</style>
            </div>
          )}

          {phase === 'error' && (
            <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>Something went wrong loading your recommendations.</p>
              <button type="button" onClick={handleRetry} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
                Retry
              </button>
            </div>
          )}

          {phase === 'ready' && (
            <>
              {/* Journey summary — real, saved data only */}
              <section aria-label="Your completed journey" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Journey Complete</h2>
                <div style={{ fontSize: 13, color: CREAM, marginBottom: 4 }}>
                  {guestName ? `${guestName} — ` : ''}{cigarName || 'Your SmokeCraft 360 experience'}
                </div>
                {(mentorName || pairingRec || flavorNotes.length > 0 || formatLabel) && (
                  <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', lineHeight: 1.7, marginTop: 6 }}>
                    {mentorName && <div>Mentor: {mentorName}</div>}
                    {formatLabel && <div>Format: {formatLabel}</div>}
                    {pairingRec && <div>Pairing recommendation: {pairingRec}</div>}
                    {flavorNotes.length > 0 && <div>Flavor notes: {flavorNotes.join(', ')}</div>}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: GOLD_DIM, textTransform: 'uppercase' }}>Progress</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: CREAM }}>{completedCount} / {TOTAL_SESSIONS} ({progressPct}%)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: GOLD_DIM, textTransform: 'uppercase' }}>XP Earned</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: GOLD }}>{session?.xp || 0} XP</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: GOLD_DIM, textTransform: 'uppercase' }}>Achievements</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: CREAM }}>{achievementsEarned}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: GOLD_DIM, textTransform: 'uppercase' }}>Badges</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: CREAM }}>{badgesEarned}</div>
                  </div>
                </div>
              </section>

              {/* Primary recommendation */}
              <section aria-label="Primary recommended journey" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recommended Next Journey</h2>
                {!recommendations.hasSignal ? (
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.55)' }}>
                    Not enough saved activity yet to personalize a recommendation. Complete more of your SmokeCraft journey to unlock one.
                  </p>
                ) : (
                  <>
                    <div style={{ fontSize: 18, fontWeight: 700, color: CREAM, marginBottom: 6 }}>{recommendations.primary.title}</div>
                    <div style={{ fontSize: 12, color: GOLD_DIM, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Why It Fits</div>
                    <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 12, color: 'rgba(229,226,225,0.7)', lineHeight: 1.7 }}>
                      {recommendations.primary.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => handleStartJourney(recommendations.primary)}
                        style={{ padding: '8px 18px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, fontSize: 13, fontFamily: 'Georgia, serif', cursor: 'pointer', minHeight: 44 }}>
                        Start Journey
                      </button>
                      <button type="button" onClick={() => handleSelectJourney(recommendations.primary)} aria-pressed={selectedNextJourneyId === recommendations.primary.id}
                        style={{ padding: '8px 18px', borderRadius: 20, border: `1.5px solid ${BORDER}`, background: selectedNextJourneyId === recommendations.primary.id ? 'rgba(233,193,118,0.12)' : 'transparent', color: 'rgba(229,226,225,0.75)', fontSize: 13, fontFamily: 'Georgia, serif', cursor: 'pointer', minHeight: 44 }}>
                        {selectedNextJourneyId === recommendations.primary.id ? 'Selected' : 'Select'}
                      </button>
                    </div>

                    {/* Related challenges / modules */}
                    <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>
                      <div>Related educational modules: {recommendations.primary.relatedModules.length > 0 ? recommendations.primary.relatedModules.join(', ') : 'Not available'}</div>
                      <div>Related challenges: {relatedChallenges.length > 0 ? relatedChallenges.map(c => c.title).join(', ') : 'Not available'}</div>
                      <div>Estimated journey depth: Not available — no verified depth-estimation rule is configured yet.</div>
                      <div>Available XP for a new journey: {totalConfiguredXP > 0 ? `${totalConfiguredXP} XP` : 'Not available'}</div>
                    </div>
                  </>
                )}
              </section>

              {/* Alternate recommendations */}
              {recommendations.alternates.length > 0 && (
                <section aria-label="Alternate recommended journeys" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                  <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Alternate Journeys</h2>
                  <div role="list" aria-label="Alternate journeys" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {recommendations.alternates.map(cat => (
                      <div key={cat.id} role="listitem" style={{ border: `1.5px solid ${selectedNextJourneyId === cat.id ? GOLD : BORDER}`, borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: CREAM }}>{cat.title}</div>
                          <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>{cat.reasons[0] || 'Not available'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" onClick={() => handleSelectJourney(cat)} aria-pressed={selectedNextJourneyId === cat.id}
                            style={{ padding: '5px 12px', borderRadius: 12, border: `1.5px solid ${BORDER}`, background: 'transparent', color: 'rgba(229,226,225,0.75)', fontSize: 11, fontFamily: 'Georgia, serif', cursor: 'pointer', minHeight: 36 }}>
                            {selectedNextJourneyId === cat.id ? 'Selected' : 'Select'}
                          </button>
                          <button type="button" onClick={() => handleStartJourney(cat)}
                            style={{ padding: '5px 12px', borderRadius: 12, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, fontSize: 11, fontFamily: 'Georgia, serif', cursor: 'pointer', minHeight: 36 }}>
                            Start
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Suggested events — real data only */}
              <section aria-label="Suggested events" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                <h2 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Suggested Events</h2>
                {suggestedEvents.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>No upcoming events available.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {suggestedEvents.map(ev => (
                      <div key={ev.id} style={{ fontSize: 12, color: 'rgba(229,226,225,0.7)' }}>{ev.title} — {ev.venue}, {ev.city}</div>
                    ))}
                  </div>
                )}
              </section>

              {/* Suggested quiz — real Knowledge Check data only */}
              <section aria-label="Suggested quiz" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                <h2 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Suggested Quiz</h2>
                {suggestedQuiz ? (
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(229,226,225,0.7)' }}>Try the {suggestedQuiz.moduleId} Knowledge Check next.</p>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>Not available — you've completed every configured Knowledge Check.</p>
                )}
              </section>

              {/* Next reward — real, unearned winner categories only */}
              <section aria-label="Next reward" style={{ background: 'rgba(233,193,118,0.06)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'rgba(229,226,225,0.55)' }}>
                Next reward: Not available — no further configured reward rule exists beyond your current earned rewards.
              </section>

              {/* Controls */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={handleExploreAll}
                  style={{ padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${BORDER}`, background: 'transparent', color: 'rgba(229,226,225,0.75)', fontSize: 13, fontFamily: 'Georgia, serif', cursor: 'pointer', minHeight: 44 }}>
                  Explore All Journeys
                </button>
                <button type="button" onClick={handleViewProgress}
                  style={{ padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${BORDER}`, background: 'transparent', color: 'rgba(229,226,225,0.75)', fontSize: 13, fontFamily: 'Georgia, serif', cursor: 'pointer', minHeight: 44 }}>
                  View Progress
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <SmokeCraftNavBar
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft/rewards')}
      />
    </div>
  )
}
