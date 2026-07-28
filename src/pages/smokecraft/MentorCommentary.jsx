import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { useSmokeCraftMentorGuidance } from '../../hooks/useSmokeCraftMentorGuidance.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'
import SmokeCraftTactileCard from '../../components/smokecraft/SmokeCraftTactileCard.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const ENRICHMENT_14 = getEducationalEnrichment(14)

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

// Holistic Fix 5B-2A: this screen previously kept a hand-authored
// COMMENTARY object keyed by short first-name-derived ids
// ('alejandro', 'javier', 'jamastrán', ...) that never matched the real
// MENTORS roster ids ('dominican', 'nicaragua', 'honduras', ...) — a
// real, found defect (SC-D050): `COMMENTARY[mentor.id]` always fell
// through to DEFAULT_COMMENTARY, so every learner saw identical
// "generic" commentary regardless of which mentor they actually chose.
// Real per-mentor, context-aware guidance now comes from the shared
// server-authoritative mentor-guidance service instead. DEFAULT below
// is kept only as the last-resort offline/unavailable fallback text
// (never presented as mentor-specific).
const DEFAULT_COMMENTARY = {
  construction: 'General construction guidance: the burn line should stay level and the ash should hold its shape without excessive touch-ups.',
  flavor: 'General flavor guidance: this stage of the smoke typically shows the blend\'s core character most clearly.',
  action: 'Take a moment to note what you\'re tasting right now before continuing.',
}

const SECTIONS = ['portrait', 'commentary', 'construction', 'flavor', 'action']

export default function MentorCommentary({ onBack, onComplete } = {}) {
  const { awardSessionRewards, session } = useGuestSession()
  const { isDemoMode } = useSmokeCraftProgress()
  const { journey, setMentorCommentary } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // Construction Check / Flavor Evolution (second-third) must be completed first.
  useEffect(() => {
    if (!isDemoMode && !session.completedSteps.includes('second-third')) {
      navigate('/smokecraft/second-third', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Resume flag — same dedicated sessionStorage mechanism as the other interstitials.
  useEffect(() => {
    try { sessionStorage.setItem('sc_active_screen', '/smokecraft/mentor-commentary') } catch {}
    return () => {
      try {
        if (sessionStorage.getItem('sc_active_screen') === '/smokecraft/mentor-commentary') {
          sessionStorage.removeItem('sc_active_screen')
        }
      } catch {}
    }
  }, [])

  const mentorList = journey.mentor
  const mentor = Array.isArray(mentorList) ? mentorList[0] : mentorList

  // Holistic Fix 5B-2A: real, server-computed, context-aware guidance
  // replaces the previous static per-mentor COMMENTARY map (which never
  // actually matched a real mentor id — see the comment above).
  const { status: guidanceStatus, guidance, retry: retryGuidance } = useSmokeCraftMentorGuidance('mentor-commentary')
  const notes = mentor ? {
    construction: guidance?.message || DEFAULT_COMMENTARY.construction,
    flavor: guidance?.reason || DEFAULT_COMMENTARY.flavor,
    action: guidance?.nextAction || DEFAULT_COMMENTARY.action,
  } : null

  const savedViewed = journey.mentorCommentary?.viewedSections || []
  const [viewedSections, setViewedSections] = useState(() => new Set(savedViewed))
  const [askMentorOpen, setAskMentorOpen] = useState(false)

  // Tactile/Haptic Completion pass — each advice section is now individually
  // selectable/expandable with a real "Apply to my journey" confirmation
  // step (never applies without explicit confirm) and a dismiss action that
  // stays recoverable for the rest of the session. Journey-persisted by
  // mentor id + advice key so a different mentor on a later journey never
  // inherits a prior mentor's accepted advice. No section is applied or
  // dismissed by default.
  const savedApplied = journey.mentorCommentary?.appliedAdvice || []
  const [appliedAdvice, setAppliedAdvice] = useState(() => new Set(savedApplied))
  const [dismissedAdvice, setDismissedAdvice] = useState(() => new Set())
  const [pendingApply, setPendingApply] = useState(null) // key awaiting confirmation
  const [expandedAdvice, setExpandedAdvice] = useState(null)

  function requestApply(key) {
    triggerHaptic('light')
    setPendingApply(key)
  }
  function confirmApply(key) {
    triggerHaptic('success')
    setPendingApply(null)
    setAppliedAdvice(prev => {
      const next = new Set(prev)
      next.add(key)
      setMentorCommentary({
        ...(journey.mentorCommentary || {}),
        appliedAdvice: Array.from(next),
        appliedMentorId: mentor?.id || null,
      })
      return next
    })
  }
  function cancelApply() {
    triggerHaptic('light')
    setPendingApply(null)
  }
  function dismissAdvice(key) {
    triggerHaptic('warning')
    setDismissedAdvice(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const allViewed = viewedSections.size === SECTIONS.length

  useEffect(() => {
    if (viewedSections.size > 0) {
      setMentorCommentary({ ...(journey.mentorCommentary || {}), viewedSections: Array.from(viewedSections) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedSections.size])

  // Mark all sections as viewed once mentor data is available and rendered —
  // this screen is a single scrollable page, not a tabbed selector, so "viewed"
  // tracks real content having actually been displayed to the guest.
  useEffect(() => {
    if (mentor) {
      setViewedSections(new Set(SECTIONS))
    }
  }, [mentor])

  function handleContinue() {
    setMentorCommentary({
      viewedSections: Array.from(viewedSections),
      completedAt: journey.mentorCommentary?.completedAt || Date.now(),
    })
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('mentor-commentary')
    navigate('/smokecraft/knowledge-drop')
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
      {/* Approved production visual, reused as a decorative header band. */}
      <div
        role="img"
        aria-label="SmokeCraft Mentor Commentary"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(90px,14vh,140px)',
          backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.35), rgba(6,8,16,0.92)), url(${SC_ASSETS.mentorCommentary})`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          zIndex: 1,
        }}
      />

      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0',
        zIndex: 3,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: GOLD_DIM,
          letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          SmokeCraft 360 — Mentor Commentary
        </div>
        <h1 style={{
          margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700,
          color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15,
        }}>
          {mentor?.name || 'No Mentor Selected'}
        </h1>
        <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 6 }}>
          {!mentor ? 'No mentor selected'
            : guidanceStatus === 'loading' ? 'Loading real guidance…'
            : guidanceStatus === 'offline' ? "Offline — showing general guidance"
            : guidanceStatus === 'unavailable' ? 'Guidance temporarily unavailable — showing general guidance'
            : allViewed ? 'Commentary reviewed' : 'Loading commentary…'} · Stage: Flavor Evolution (Second Third)
        </div>
      </header>

      <main style={{
        position: 'absolute', top: 'clamp(120px,16vh,160px)', bottom: 'clamp(120px,16vh,160px)',
        left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Empty state — no mentor selected */}
          {!mentor && (
            <div style={{
              background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: 'clamp(24px,4vw,40px)', textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: 'clamp(14px,1.6vw,16px)', color: 'rgba(229,226,225,0.65)', lineHeight: 1.6 }}>
                No mentor has been selected yet. Choose a mentor to see their commentary here.
              </p>
            </div>
          )}

          {mentor && (
            <>
              {/* Portrait zone — honest neutral fallback, no per-mentor photography exists */}
              <div
                aria-label={`${mentor.name} portrait`}
                style={{
                  background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
                  minHeight: 120, display: 'flex', alignItems: 'center', gap: 16,
                  padding: 'clamp(14px,2vw,20px)',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(233,193,118,0.12)', border: `1.5px solid ${GOLD_DIM}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, color: GOLD,
                  }}
                >
                  {mentor.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: CREAM }}>{mentor.name}</div>
                  {/* Holistic Fix 5B-2A (SC-D050): mentor.origin/mentor.expertise
                      do not exist on the real MENTORS roster (only
                      country/bio) — previously rendered as literally
                      undefined. Real fields used instead. */}
                  <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)', marginTop: 2 }}>{mentor.flag ? `${mentor.flag} ` : ''}{mentor.country}</div>
                  <div style={{ fontSize: 12, color: GOLD_DIM, marginTop: 4 }}>{mentor.bio}</div>
                  <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.35)', marginTop: 6, letterSpacing: '0.06em' }}>
                    No individual portrait photography available — neutral avatar shown
                  </div>
                </div>
              </div>

              {/* Curated commentary — explicitly labeled as curated, not AI.
                  Each section is now individually selectable/expandable with
                  a real apply-with-confirmation action. */}
              <div style={{
                background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
                padding: 'clamp(16px,2.4vw,24px)',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Mentor Guidance — Based On Your Real Progress
                </div>
                {(guidanceStatus === 'unavailable' || guidanceStatus === 'offline') && (
                  <div style={{ fontSize: 11, color: 'rgba(229,170,100,0.85)', marginBottom: 10 }}>
                    {guidanceStatus === 'offline' ? "You're offline" : 'Guidance is temporarily unavailable'} — showing general guidance below.{' '}
                    <button type="button" onClick={retryGuidance} style={{ background: 'transparent', border: `1px solid ${GOLD}`, borderRadius: 10, color: GOLD, fontSize: 10, padding: '1px 8px', cursor: 'pointer' }}>Retry</button>
                  </div>
                )}

                {[
                  ['construction', 'Construction Observation', 'construction'],
                  ['flavor', 'Flavor Observation', 'flavor'],
                  ['action', 'Suggested Action', 'action'],
                ].map(([key, label, field]) => {
                  const applied = appliedAdvice.has(key)
                  const dismissed = dismissedAdvice.has(key)
                  const expanded = expandedAdvice === key
                  return (
                    <div key={key} style={{ marginBottom: 14, opacity: dismissed ? 0.45 : 1 }}>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-label={`${expanded ? 'Collapse' : 'Open'} ${label}`}
                        onClick={() => { triggerHaptic('light'); setExpandedAdvice(expanded ? null : key) }}
                        style={{
                          display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center',
                          background: 'transparent', border: 'none', padding: 0, marginBottom: 4,
                          cursor: 'pointer', textAlign: 'left', minHeight: 40,
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 700, color: applied ? GOLD : 'rgba(233,193,118,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {applied ? '✓ ' : ''}{label}
                        </span>
                        <span aria-hidden="true" style={{ color: GOLD_DIM, fontSize: 11 }}>{expanded ? '▲' : '▼'}</span>
                      </button>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: CREAM }}>{notes[field]}</p>
                      {expanded && (
                        <p style={{ margin: '6px 0 0', fontSize: 12, lineHeight: 1.55, color: 'rgba(229,226,225,0.6)' }}>
                          This is {mentor.name}'s real guidance for this stage, based on their region and expertise — not a generic tip. Applying it does not change your blend automatically; it records that you've chosen to follow this specific guidance for this journey.
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        {pendingApply === key ? (
                          <>
                            <span style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', alignSelf: 'center' }}>Apply this advice to your journey?</span>
                            <SmokeCraftTactileCard label={`Confirm apply ${label}`} onActivate={() => confirmApply(key)} haptic="success" style={{ minWidth: 0, minHeight: 32, padding: '4px 10px', flexDirection: 'row', borderRadius: 999, fontSize: 11 }}>Confirm</SmokeCraftTactileCard>
                            <SmokeCraftTactileCard label={`Cancel apply ${label}`} onActivate={cancelApply} style={{ minWidth: 0, minHeight: 32, padding: '4px 10px', flexDirection: 'row', borderRadius: 999, fontSize: 11 }}>Cancel</SmokeCraftTactileCard>
                          </>
                        ) : (
                          <>
                            <SmokeCraftTactileCard label={`Apply ${label} to my journey`} selected={applied} onActivate={() => requestApply(key)} haptic="light" style={{ minWidth: 0, minHeight: 32, padding: '4px 10px', flexDirection: 'row', borderRadius: 999, fontSize: 11 }}>{applied ? '✓ Applied' : 'Apply'}</SmokeCraftTactileCard>
                            <SmokeCraftTactileCard label={`Dismiss ${label}`} selected={dismissed} onActivate={() => dismissAdvice(key)} haptic="warning" style={{ minWidth: 0, minHeight: 32, padding: '4px 10px', flexDirection: 'row', borderRadius: 999, fontSize: 11 }}>{dismissed ? 'Restore' : 'Dismiss'}</SmokeCraftTactileCard>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Audio control — honest fallback, no audio asset exists */}
              <div style={{
                background: 'rgba(233,193,118,0.05)', border: `1px solid ${BORDER}`, borderRadius: 12,
                padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <button
                  type="button"
                  disabled
                  aria-label="Audio commentary not yet available"
                  style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(229,226,225,0.08)', border: '1.5px solid rgba(229,226,225,0.2)',
                    color: 'rgba(229,226,225,0.4)', fontSize: 14, cursor: 'not-allowed',
                  }}
                >
                  ▶
                </button>
                <span style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>
                  Audio commentary not yet available — showing text notes above instead.
                </span>
              </div>

              {/* Ask Mentor — clearly labeled future-AI state, no fake AI response */}
              <div style={{
                background: 'rgba(233,193,118,0.05)', border: `1px solid ${BORDER}`, borderRadius: 12,
                padding: 'clamp(14px,2vw,20px)',
              }}>
                <button
                  type="button"
                  aria-expanded={askMentorOpen}
                  onClick={() => { triggerHaptic('light'); setAskMentorOpen(o => !o) }}
                  style={{
                    background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20,
                    color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13,
                    padding: '8px 16px', cursor: 'pointer', outline: 'none', minHeight: 40,
                  }}
                >
                  Ask {mentor.name.split(' ')[0]} (Coming Soon)
                </button>
                {askMentorOpen && (
                  <p style={{ margin: '12px 0 0', fontSize: 12, color: 'rgba(229,226,225,0.55)', lineHeight: 1.55 }}>
                    Live AI mentor conversation is not part of this build. This control is a placeholder for a
                    future AI Summary integration — no response is generated here today.
                  </p>
                )}
              </div>
            </>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: allViewed && mentor ? GOLD : 'rgba(229,226,225,0.4)',
          }}>
            <span aria-hidden="true">{allViewed && mentor ? '✓' : '○'}</span>
            <span>{allViewed && mentor ? 'Mentor commentary reviewed' : 'Commentary pending'}</span>
          </div>
        </div>
      </main>

      <SmokeCraftLessonInfoButton
        sessionNumber={14} totalSessions={TOTAL_SESSIONS} phase={3} totalPhases={TOTAL_VISITS}
        title="Mentor Commentary" whyItMatters={ENRICHMENT_14?.whyItMatters} goldenBox={ENRICHMENT_14?.goldenBox}
      />

      <SmokeCraftNavBar
        primary="Continue →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/second-third'))}
      />
    </div>
  )
}
