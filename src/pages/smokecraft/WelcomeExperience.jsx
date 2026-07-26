import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { useSmokeCraftServerJourney } from '../../hooks/useSmokeCraftServerJourney.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { getRankFromXP } from '../../constants/session.js'
import { SMOKECRAFT_NAV_DESTINATIONS as NAV } from '../../constants/smokecraftNavigationRegistry.js'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

// System Audit Prompt 3B (SC-D001) — pixel-calibrated positions for the
// approved image's baked left sidebar and bottom icon strip (1448x1086
// session 1.png). Settings has no real SmokeCraft settings screen (only
// unrelated POS3/E.A.T. settings exist) — wired as a real, focusable,
// disabled button with an honest accessible name rather than a fabricated
// route or a silent dead hotspot.
// Holistic Fix 2 — migrated off local hardcoded route literals onto the
// one shared smokecraftNavigationRegistry (see that file's docstring for
// why this replaces the old per-screen pattern). Destinations are
// unchanged from the SC-D001 fix — only the source of truth moved.
const SIDEBAR_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',   route: NAV.HOME,        top: '20.4%' },
  { key: 'sessions',    label: 'Sessions',    route: NAV.JOURNEY,     top: '26.0%' },
  { key: 'rewards',     label: 'Rewards',     route: NAV.REWARDS,     top: '31.5%' },
  { key: 'passport',    label: 'Passport',    route: NAV.PASSPORT,    top: '37.0%' },
  { key: 'leaderboard', label: 'Leaderboard', route: NAV.LEADERBOARD, top: '42.5%' },
  { key: 'events',      label: 'Events',      route: NAV.EVENTS,      top: '48.1%' },
  { key: 'collections', label: 'Collections', route: NAV.COLLECTIONS, top: '53.6%' },
  { key: 'mentor',      label: 'Mentor',      route: NAV.MENTOR,      top: '59.1%' },
  { key: 'settings',    label: 'Settings (not yet available)', route: null, top: '64.6%', disabled: true },
]
const BOTTOM_STRIP_ITEMS = [
  { key: 'home',    label: 'Home',    route: NAV.HOME,               left: '2.8%' },
  { key: 'journey', label: 'Journey', route: NAV.JOURNEY,            left: '17.9%' },
  { key: 'learn',   label: 'Learn',   route: NAV.KNOWLEDGE,          left: '32.9%' },
  { key: 'create',  label: 'Create',  route: NAV.GOLDEN_BOX,         left: '57.0%' },
  { key: 'pairing', label: 'Pairing', route: NAV.PAIRING_STANDALONE, left: '71.1%' },
  { key: 'mentor2', label: 'Mentor',  route: NAV.MENTOR,             left: '85.0%' },
]

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

// Tactile/Haptic Completion pass — one shared expandable-summary pattern for
// every Welcome card (learner/venue/status, cigar, mentor, Session 1
// preview, Golden Box preview). Real accessible label per instance, real
// pressed/expanded state, no default-open panel, no fake data (the caller
// decides `summary`/`detail` content, this component only handles the
// interaction chrome).
function SummaryCard({ sectionKey, title, summary, detail, openPanel, onToggle, disabled }) {
  const isOpen = openPanel === sectionKey
  return (
    <div style={{ background: GLASS, border: `1px solid ${isOpen ? GOLD : BORDER}`, borderRadius: 12, padding: 'clamp(14px,2.2vw,20px)' }}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`welcome-panel-${sectionKey}`}
        aria-label={`${isOpen ? 'Collapse' : 'Open'} details for ${title}`}
        disabled={disabled}
        onClick={() => onToggle(sectionKey)}
        style={{
          display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
          background: 'transparent', border: 'none', padding: 0, marginBottom: 8,
          cursor: disabled ? 'default' : 'pointer', textAlign: 'left', minHeight: 44,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{title}</span>
        {!disabled && <span aria-hidden="true" style={{ color: GOLD_DIM, fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>}
      </button>
      {summary}
      {isOpen && detail && (
        <p id={`welcome-panel-${sectionKey}`} style={{ margin: '10px 0 0', fontSize: 12.5, lineHeight: 1.6, color: 'rgba(229,226,225,0.65)', borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
          {detail}
        </p>
      )}
    </div>
  )
}

function formatTimestamp(ts) {
  if (!ts) return null
  try { return new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) } catch { return null }
}

export default function WelcomeExperience({ onBack, onComplete } = {}) {
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
  // Tactile/Haptic Completion pass — each summary card is now a real
  // interactive control that opens a detail panel; no panel is open by
  // default. Which panels have been opened is journey-persisted (real
  // engagement signal, not a second interaction-state store).
  const [openPanel, setOpenPanel] = useState(null)
  const openedPanels = journey.welcomeOpenedPanels || []

  function togglePanel(key) {
    triggerHaptic('light')
    setOpenPanel(prev => (prev === key ? null : key))
    if (!openedPanels.includes(key)) {
      setWelcomeState({ welcomeOpenedPanels: [...openedPanels, key] })
    }
  }

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
    if (onComplete) {
      onComplete()
      return
    }
    if (!completed) awardSessionRewards('entry')
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
    <SmokeCraftScreenShell mode="image-shell" status="ready" imageProps={{ src: SC_ASSETS.session1, naturalW: 1448, naturalH: 1086, alt: 'SmokeCraft 360 — Welcome to Today’s Experience, Session 1' }}>
      <h1 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
        SmokeCraft 360 — Welcome to Today’s Experience{identityName ? `, ${identityName}` : ''}
      </h1>
      {isOffline && (
        <div style={{ position: 'absolute', left: '17.1%', top: '9.5%', fontSize: 12, color: 'rgba(229,226,225,0.7)', background: NAVY_DEEP, padding: '2px 8px', borderRadius: 6 }}>
          Offline: showing your locally saved data.
        </div>
      )}

      {/* SESSION PROGRESS box occlusion — real completion state, not baked "1 of 27 / 0%" */}
      <div style={{
        position: 'absolute', left: '81.2%', top: '10.1%', width: '18.9%', height: '13.8%',
        background: NAVY_DEEP, borderRadius: 8, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2, textAlign: 'center', padding: 4,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Session Progress</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: CREAM }}>{completedSessions?.length || 0} of 27</span>
        <span style={{ fontSize: 11, color: GOLD_DIM }}>{completionPercent}% Complete</span>
      </div>

      {/* Sidebar profile chip occlusion — real rank/XP, same technique as ResumeJourney/Rewards */}
      <div style={{
        position: 'absolute', left: '1%', top: '70.4%', width: '13.1%', height: '13.8%',
        background: NAVY_DEEP, borderRadius: 8, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2, textAlign: 'center', padding: 4,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: CREAM }}>{identityName || 'Guest'}</span>
        <span style={{ fontSize: 11, color: GOLD }}>{getRankFromXP(session?.xp || 0).name}</span>
        <span style={{ fontSize: 10, color: GOLD_DIM }}>{session?.xp || 0} pts</span>
      </div>

      {/* System Audit Prompt 3B (SC-D001) — the approved image's left sidebar,
          top bar, and bottom icon strip were entirely baked/dead: only the
          content panel and Begin Experience button had live controls. Pixel
          positions calibrated via PIL crop of the 1448x1086 approved image. */}
      <button
        type="button" aria-label="Back to Journey" data-testid="s1-back-to-journey"
        onClick={() => { triggerHaptic('light'); navigate('/smokecraft/resume') }}
        style={{ position: 'absolute', left: '15.9%', top: '0.9%', width: '11.0%', height: '4.4%', background: 'transparent', border: 'none', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation' }}
      />
      <button
        type="button" aria-label="Notifications" data-testid="s1-notifications" disabled
        style={{ position: 'absolute', left: '84.3%', top: '0.9%', width: '2.8%', height: '4.4%', background: 'transparent', border: 'none', cursor: 'default', pointerEvents: 'auto' }}
      />
      <button
        type="button" aria-label="Help" data-testid="s1-help" disabled
        style={{ position: 'absolute', left: '88.1%', top: '0.9%', width: '2.8%', height: '4.4%', background: 'transparent', border: 'none', cursor: 'default', pointerEvents: 'auto' }}
      />
      <button
        type="button" aria-label="Account" data-testid="s1-account"
        onClick={() => { triggerHaptic('light'); navigate('/smokecraft/identity') }}
        style={{ position: 'absolute', left: '91.9%', top: '0.9%', width: '3.1%', height: '4.4%', background: 'transparent', border: 'none', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation' }}
      />

      {SIDEBAR_ITEMS.map(item => (
        <button
          key={item.key} type="button" aria-label={item.label} data-testid={`s1-sidebar-${item.key}`}
          disabled={item.disabled}
          onClick={item.disabled ? undefined : () => { triggerHaptic('light'); navigate(item.route) }}
          style={{
            position: 'absolute', left: '1%', top: item.top, width: '13.1%', height: '4.4%',
            background: 'transparent', border: 'none', cursor: item.disabled ? 'default' : 'pointer',
            pointerEvents: 'auto', touchAction: 'manipulation',
          }}
        />
      ))}
      <button
        type="button" aria-label="Sign out — return to SmokeCraft landing" data-testid="s1-sign-out"
        onClick={() => { triggerHaptic('medium'); navigate('/smokecraft') }}
        style={{ position: 'absolute', left: '1%', top: '86.6%', width: '13.1%', height: '3.7%', background: 'transparent', border: 'none', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation' }}
      />

      {BOTTOM_STRIP_ITEMS.map(item => (
        <button
          key={item.key} type="button" aria-label={item.label} data-testid={`s1-bottom-${item.key}`}
          onClick={() => { triggerHaptic('light'); navigate(item.route) }}
          style={{
            position: 'absolute', left: item.left, top: '93.0%', width: '12%', height: '7.0%',
            background: 'transparent', border: 'none', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
          }}
        />
      ))}

      <main style={{
        position: 'absolute', left: '17.1%', top: '65.4%', width: '52.6%', height: '24.7%',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY_DEEP,
        borderRadius: 10, padding: 'clamp(10px,1.4vw,20px)', pointerEvents: 'auto',
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
              {/* Identity / venue / status summary — now a real interactive control */}
              <SummaryCard
                sectionKey="journey"
                title="Today’s Experience"
                openPanel={openPanel}
                onToggle={togglePanel}
                summary={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: CREAM }}>
                    <div>Guest: <span style={{ color: GOLD_DIM }}>{identityName || 'Guest'}</span></div>
                    <div>Venue: <span style={{ color: GOLD_DIM }}>{venueName || (venueSkipped ? 'No venue selected' : 'Not selected yet')}</span></div>
                    <div>Knowledge level: <span style={{ color: GOLD_DIM }}>{knowledgeLevel || 'Not shared yet'}</span></div>
                    <div>Status: <span style={{ color: GOLD_DIM }}>{journeyStatus}</span></div>
                  </div>
                }
                detail="Your journey status reflects real progress saved to this device — 27 sessions across 6 phases. It matters because Resume always picks up exactly where you left off, and your Golden Box eligibility depends on completing the curriculum sessions honestly, not just visiting screens. Next: continue reviewing this Welcome screen, then Begin Experience to enter Session 1."
              />

              {/* Cigar preview — now a real interactive control, only real data */}
              <SummaryCard
                sectionKey="cigar"
                title="Cigar Preview"
                openPanel={openPanel}
                onToggle={togglePanel}
                disabled={!cigar}
                summary={cigar ? (
                  <div style={{ fontSize: 13, color: CREAM }}>
                    <div style={{ fontWeight: 700 }}>{cigar.name}</div>
                    <div style={{ color: 'rgba(229,226,225,0.55)', marginTop: 2 }}>{[cigar.origin, cigar.wrapper].filter(Boolean).join(' · ')}</div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.45)', fontStyle: 'italic' }}>No cigar selected yet — you’ll choose one in the next step.</p>
                )}
                detail={cigar ? `This is the cigar you selected earlier in entry. Its origin and wrapper shape the flavor and strength profile you'll track across all three tasting thirds, and directly inform your eligibility for Golden Box blend comparisons later. Next: proceed to Session 1 to begin real tasting.` : null}
              />

              {/* Mentor preview — now a real interactive control, only real data */}
              <SummaryCard
                sectionKey="mentor"
                title="Mentor Preview"
                openPanel={openPanel}
                onToggle={togglePanel}
                disabled={!mentor}
                summary={mentor ? (
                  <div style={{ fontSize: 13, color: CREAM }}>
                    <div style={{ fontWeight: 700 }}>{mentor.name}</div>
                    <div style={{ color: 'rgba(229,226,225,0.55)', marginTop: 2 }}>{mentor.origin}</div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.45)', fontStyle: 'italic' }}>No mentor selected yet — mentor guidance happens later in your journey.</p>
                )}
                detail={mentor ? `${mentor.name} will provide real, mentor-specific commentary during your Second Third (Mentor Commentary session) — construction, flavor, and pairing guidance drawn from their real region and expertise, not generic text. This matters for the Golden Box Challenge, where your mentor's growing philosophy informs the judging rubric your submission is measured against. Next: your mentor's guidance appears later — no action needed now.` : null}
              />

              {/* Session 1 preview — new this pass, real data only */}
              <SummaryCard
                sectionKey="session1"
                title="Session 1 Preview"
                openPanel={openPanel}
                onToggle={togglePanel}
                summary={<div style={{ fontSize: 13, color: CREAM }}>Choose Your Cigar — <span style={{ color: GOLD_DIM }}>Humidor Match</span></div>}
                detail="Session 1 (Choose Your Cigar / Humidor Match) is the real start of your 27-session curriculum. You'll browse the humidor and select the cigar that carries through the rest of today's experience — your choice here is what the Cigar Preview above will reflect once made. Next: tap Begin Experience below to enter Session 1."
              />

              {/* Golden Box objective preview — new this pass, real data only */}
              <SummaryCard
                sectionKey="goldenbox"
                title="Golden Box Objective Preview"
                openPanel={openPanel}
                onToggle={togglePanel}
                summary={<div style={{ fontSize: 13, color: CREAM }}>Design, submit, and defend your own blend concept.</div>}
                detail="The Golden Box Challenge is a supporting module reachable once you've completed enrollment — it lets you design a blend concept, build packaging in the Packaging Studio, and submit it for mentor and judge review. It is not one of the 27 numbered curriculum sessions, but everything you learn in those sessions (terroir, construction, flavor, pairing) directly informs a stronger Golden Box submission. Next: Golden Box is reachable from the main SmokeCraft menu at any point after enrollment."
              />

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

      {phase === 'ready' && (
        <button
          type="button"
          aria-label="Start Session 1 — Begin Experience"
          onClick={handleBegin}
          style={{
            position: 'absolute', left: '73.2%', top: '84.3%', width: '22.8%', height: '4.6%',
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, pointerEvents: 'auto',
          }}
        />
      )}

      <SmokeCraftNavBar
        primary="Begin Experience →"
        onPrimary={handleBegin}
        primaryDisabled={phase !== 'ready'}
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft/resume')}
      />
    </SmokeCraftScreenShell>
  )
}
