import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { useSmokeCraftServerJourney } from '../../hooks/useSmokeCraftServerJourney.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

// Static description of what the locked 27-session journey may cover — not
// per-guest data, so it's safe as fixed copy (no fabrication risk).
const LEARNING_OBJECTIVES = [
  { title: 'Cigar Identity & Construction', desc: 'Get to know your cigar’s brand, blend, wrapper, and build.' },
  { title: 'Terroir & Tobacco Origin', desc: 'Explore the soil, climate, and region behind the leaf.' },
  { title: 'Cutting & Lighting', desc: 'Learn proper cut technique and an even, deliberate light.' },
  { title: 'Flavor Discovery', desc: 'Track how flavor notes emerge and evolve draw by draw.' },
  { title: 'Strength & Body', desc: 'Understand how strength and body build across the smoke.' },
  { title: 'Pairing', desc: 'Discover complementary pairings suited to your cigar.' },
  { title: 'Mentor Education', desc: 'Get real-time guidance from your selected mentor.' },
  { title: 'Reflection & Scorecard', desc: 'Rate your experience and capture personal notes.' },
  { title: 'Rewards & Passport Progress', desc: 'Earn XP, badges, and a SmokeCraft Passport stamp.' },
]

function formatTimestamp(ts) {
  if (!ts) return null
  try { return new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) } catch { return null }
}

export default function WelcomeExperience() {
  const { awardSessionRewards, session } = useGuestSession()
  const { isDemoMode, completedSessions } = useSmokeCraftProgress()
  const { journey, setWelcomeState, setResumeCache } = useSmokeCraftJourney()
  const { startOrResumeJourney } = useSmokeCraftServerJourney()
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const key = 'sc_active_screen'
      sessionStorage.setItem(key, '/smokecraft/welcome')
      return () => {
        try { if (sessionStorage.getItem(key) === '/smokecraft/welcome') sessionStorage.removeItem(key) } catch {}
      }
    } catch {}
  }, [])

  const [phase, setPhase] = useState('loading') // loading | error | ready
  const [overviewOpen, setOverviewOpen] = useState(false)
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

  // Resume-state restoration: record this as the guest's current screen and
  // cache it as a validated resume candidate — idempotent (only writes when
  // something actually changed), never awards XP or marks completion merely
  // for opening the screen.
  useEffect(() => {
    if (phase !== 'ready') return
    const patch = {}
    if (!journey.welcomeViewedAt) patch.welcomeViewedAt = Date.now()
    if (journey.currentScreenId !== 'entry') patch.currentScreenId = 'entry'
    if (Object.keys(patch).length > 0) setWelcomeState(patch)
    if (journey.resumeRoute !== '/smokecraft/welcome' || journey.resumeScreenId !== 'entry') {
      setResumeCache('/smokecraft/welcome', 'entry')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const openOverview = useCallback(() => {
    triggerHaptic('light')
    setOverviewOpen(true)
    if (!journey.learningObjectivesViewed) setWelcomeState({ learningObjectivesViewed: true })
  }, [journey.learningObjectivesViewed, setWelcomeState])

  const closeOverview = useCallback(() => {
    setOverviewOpen(false)
  }, [])

  const completed = session.completedSteps.includes('entry')

  function handleBegin() {
    triggerHaptic('medium')
    if (!completed) {
      awardSessionRewards('entry')
      setWelcomeState({ s1CompletedAt: journey.s1CompletedAt || Date.now() })
    }
    // Fire-and-forget: creates (or resumes) the authoritative server
    // journey when a real venue is selected. Never blocks navigation —
    // this screen's existing local-progress UX is unchanged whether the
    // server call succeeds, fails, or the guest has no real venue yet
    // (VENUES=[] today, see SMOKECRAFT_MANAGEMENT_SYNC_VENUE_MODEL_AUDIT.md).
    if (journey.selectedVenue && !journey.selectedVenue.skipped) {
      startOrResumeJourney({
        venueId: journey.selectedVenue.id,
        sessionNumber: 1,
        phase: 'entry',
        sourceVersion: 'package-d',
      }).catch(() => {})
    }
    navigate('/smokecraft/humidor-match')
  }

  const identityName = journey.identity?.preferredName || journey.identity?.fullName || null
  const venueName = journey.selectedVenue?.name || null
  const venueSkipped = !!journey.selectedVenue?.skipped
  const cigar = journey.selectedCigar
  const mentorList = journey.mentor
  const mentor = Array.isArray(mentorList) ? mentorList[0] : mentorList
  const knowledgeLevel = journey.identity?.experienceLevel || null
  const completionPercent = Math.round(((completedSessions?.length || 0) / 27) * 100)
  const journeyStatus = completionPercent > 0 ? `Journey in progress — ${completionPercent}% complete` : 'New journey — nothing completed yet'

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
      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0',
        zIndex: 3,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6 }}>
          SmokeCraft 360 — Session Preparation
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700, color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15 }}>
          Welcome to Today’s Experience{identityName ? `, ${identityName}` : ''}
        </h1>
        {isOffline && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 4 }}>Offline: showing your locally saved data.</div>}
      </header>

      <main style={{
        position: 'absolute', top: 'clamp(120px,16vh,160px)', bottom: 'clamp(120px,16vh,160px)',
        left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {phase === 'loading' && (
            <div role="status" aria-live="polite" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(28px,5vw,44px)', textAlign: 'center' }}>
              <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'sc-spin6 0.9s linear infinite' }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Preparing today’s experience…</p>
              <style>{'@keyframes sc-spin6 { to { transform: rotate(360deg); } }'}</style>
            </div>
          )}

          {phase === 'error' && (
            <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>Something went wrong loading today’s experience.</p>
              <button type="button" onClick={handleRetry} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
                Retry
              </button>
            </div>
          )}

          {phase === 'ready' && (
            <>
              {/* Identity / venue / status summary */}
              <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,2.4vw,24px)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Today’s Experience</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: CREAM }}>
                  <div>Guest: <span style={{ color: GOLD_DIM }}>{identityName || 'Guest'}</span></div>
                  <div>Venue: <span style={{ color: GOLD_DIM }}>{venueName || (venueSkipped ? 'No venue selected' : 'Not selected yet')}</span></div>
                  <div>Knowledge level: <span style={{ color: GOLD_DIM }}>{knowledgeLevel || 'Not shared yet'}</span></div>
                  <div>Estimated length: <span style={{ color: GOLD_DIM }}>Not available — no duration estimate is tracked in this build</span></div>
                  <div>Status: <span style={{ color: GOLD_DIM }}>{journeyStatus}</span></div>
                </div>
              </div>

              {/* Cigar preview — only real data */}
              <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2.2vw,20px)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Cigar Preview</div>
                {cigar ? (
                  <div style={{ fontSize: 13, color: CREAM }}>
                    <div style={{ fontWeight: 700 }}>{cigar.name}</div>
                    <div style={{ color: 'rgba(229,226,225,0.55)', marginTop: 2 }}>{[cigar.origin, cigar.wrapper].filter(Boolean).join(' · ')}</div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.45)', fontStyle: 'italic' }}>No cigar selected yet — you’ll choose one in the next step.</p>
                )}
              </div>

              {/* Mentor preview — only real data */}
              <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2.2vw,20px)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Mentor Preview</div>
                {mentor ? (
                  <div style={{ fontSize: 13, color: CREAM }}>
                    <div style={{ fontWeight: 700 }}>{mentor.name}</div>
                    <div style={{ color: 'rgba(229,226,225,0.55)', marginTop: 2 }}>{mentor.origin}</div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.45)', fontStyle: 'italic' }}>No mentor selected yet — mentor guidance happens later in your journey.</p>
                )}
              </div>

              {/* View Journey Overview control */}
              <button
                type="button"
                aria-expanded={overviewOpen}
                aria-controls="journey-overview-panel"
                onClick={openOverview}
                style={{
                  background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20,
                  color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13,
                  padding: '10px 18px', cursor: 'pointer', outline: 'none', minHeight: 44,
                }}
              >
                View Journey Overview
              </button>

              {overviewOpen && (
                <div
                  id="journey-overview-panel"
                  role="dialog"
                  aria-label="Journey overview"
                  style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,2.4vw,24px)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>What You’ll Learn Today</div>
                    <button
                      type="button" aria-label="Close journey overview"
                      onClick={closeOverview}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(229,226,225,0.6)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {LEARNING_OBJECTIVES.map(o => (
                      <div key={o.title}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: CREAM }}>{o.title}</div>
                        <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.55)' }}>{o.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accessibility help */}
              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.4)' }}>
                Need accessibility assistance? Ask a venue host at any time — visible controls throughout this journey support keyboard navigation and screen readers.
              </div>

              {completed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: GOLD }}>
                  <span aria-hidden="true">✓</span>
                  <span>Welcome viewed{journey.s1CompletedAt ? ` — ${formatTimestamp(journey.s1CompletedAt)}` : ''}</span>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <SmokeCraftNavBar
        primary="Begin Experience →"
        onPrimary={handleBegin}
        primaryDisabled={phase !== 'ready'}
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft/resume')}
      />
    </div>
  )
}
