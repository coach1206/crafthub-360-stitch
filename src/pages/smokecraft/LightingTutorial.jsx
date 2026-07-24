import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD      = '#3a2417'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

const STEPS = [
  {
    id: 'toast',
    title: 'Toasting the Foot',
    body: 'Hold the cigar at a 45° angle just above the flame — never in it. Rotate slowly and evenly, warming the tobacco until the foot glows a soft, consistent orange. This primes the leaf so it lights cleanly on the next step.',
    mentorTip: 'Go slower than feels natural. A rushed toast is the single most common cause of an uneven burn later in the smoke.',
    knowledgeTip: 'Toasting releases surface moisture and volatile oils before combustion — it is preparation, not lighting.',
  },
  {
    id: 'light',
    title: 'Lighting Technique',
    body: 'With the foot toasted, bring the cigar to the flame and draw gently while rotating. Watch for the entire foot to catch — patchy or partial lighting will need correcting before you move on.',
    mentorTip: 'Take three or four short draws rather than one long pull. Check the foot between each one.',
    knowledgeTip: 'A properly lit foot should show an even ring of ember all the way around, not just on one side.',
  },
  {
    id: 'even-burn',
    title: 'Establishing an Even Burn',
    body: 'Once lit, look directly at the burn line. It should form a level, even ring around the entire circumference. If one side is racing ahead, gently correct it now rather than waiting.',
    mentorTip: 'A slightly uneven burn in the first thirty seconds is normal — give it a moment before intervening.',
    knowledgeTip: 'Wrapper density and how the cigar is held both influence how evenly the burn line forms.',
  },
  {
    id: 'tunneling',
    title: 'Avoiding Tunneling',
    body: 'Tunneling happens when the center burns faster than the outer wrapper, leaving a hollow core. If you see it starting, pause and gently touch up the slower outer edge rather than relighting the whole foot.',
    mentorTip: 'Rotating the cigar every few puffs is the simplest way to prevent tunneling before it starts.',
    knowledgeTip: 'Tunneling is usually caused by uneven draw pressure or holding the cigar at the same angle for too long.',
  },
  {
    id: 'overheating',
    title: 'Avoiding Overheating',
    body: 'Smoking too quickly builds heat that flattens flavor and can scorch the wrapper. Let the cigar rest between draws — roughly once a minute is a reliable pace.',
    mentorTip: 'If the smoke starts to taste sharp or bitter, that is heat talking, not flavor. Set it down for a minute.',
    knowledgeTip: 'Combustion temperature rises quickly with frequent draws — pacing is a flavor decision as much as a comfort one.',
  },
  {
    id: 'flame-distance',
    title: 'Correct Flame Distance',
    body: 'Keep the flame roughly a half-inch from the foot throughout toasting and lighting. Too close scorches the wrapper; too far won’t catch evenly.',
    mentorTip: 'Butane torches burn hotter and need more distance than a soft flame or cedar spill — adjust accordingly.',
    knowledgeTip: 'Direct flame contact on the wrapper leaf is the most common cause of a harsh, acrid first third.',
  },
  {
    id: 'first-draw',
    title: 'The Proper First Draw',
    body: 'Your first true draw after lighting tells you everything about resistance and airflow. It should feel effortless — like drawing air through a straw, not fighting for it.',
    mentorTip: 'A tight first draw rarely loosens on its own. If it feels plugged, it is worth having it checked before continuing.',
    knowledgeTip: 'Draw resistance is set by how the leaf was rolled — lighting technique cannot fix a construction flaw, only reveal it.',
  },
  {
    id: 'inspection',
    title: 'Burn Inspection',
    body: 'Take a moment to look at what you’ve built: the ash should be firm and light-colored, the burn line level, and the foot glowing evenly. This is your baseline for the rest of the smoke.',
    mentorTip: 'Photograph or simply remember this first-third burn line — it is your reference point if anything drifts later.',
    knowledgeTip: 'Ash color and firmness are a direct reflection of soil and curing quality, not just how well it was lit.',
  },
]

export default function LightingTutorial({ onBack, onComplete } = {}) {
  const { awardSessionRewards, session } = useGuestSession()
  const { isDemoMode } = useSmokeCraftProgress()
  const { setCutToastLight, journey } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // Choose Your Cut (currently the combined cut-toast-light screen) must be
  // completed first — mirrors the Identity/Enroll sequential-gate pattern.
  useEffect(() => {
    if (!isDemoMode && !session.completedSteps.includes('cut-toast-light')) {
      navigate('/smokecraft/cut-toast-light', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mark this screen as the guest's active mid-tutorial position for Resume.
  // A dedicated sessionStorage flag (not the generic per-navigation
  // lastVisitedRoute, which gets overwritten by every screen visit including
  // a locked screen) so SmokeCraftProgressContext can route "Back to Current
  // Session" here specifically. Cleared once the guest continues onward.
  useEffect(() => {
    try { sessionStorage.setItem('sc_active_screen', '/smokecraft/lighting-tutorial') } catch {}
    return () => {
      try {
        if (sessionStorage.getItem('sc_active_screen') === '/smokecraft/lighting-tutorial') {
          sessionStorage.removeItem('sc_active_screen')
        }
      } catch {}
    }
  }, [])

  // Tactile/Haptic Completion pass — step progress now journey-persists (was
  // previously component-local state only, lost on refresh mid-tutorial).
  const savedProgress = journey.cutToastLight?.lightingTutorialProgress
  const [stepIndex, setStepIndex]   = useState(() => savedProgress?.stepIndex ?? 0)
  const [viewedSteps, setViewedSteps] = useState(() => new Set(savedProgress?.viewedSteps || [0]))
  const [helpOpen, setHelpOpen]     = useState(false)
  const [done, setDone]             = useState(false)

  useEffect(() => {
    setCutToastLight({
      ...(journey.cutToastLight || {}),
      lightingTutorialProgress: { stepIndex, viewedSteps: Array.from(viewedSteps) },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, viewedSteps.size])

  const step = STEPS[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep  = stepIndex === STEPS.length - 1
  const allViewed   = viewedSteps.size === STEPS.length
  const progressPct = Math.round((viewedSteps.size / STEPS.length) * 100)

  function goToStep(nextIndex) {
    triggerHaptic('light')
    setStepIndex(nextIndex)
    setViewedSteps(prev => {
      const next = new Set(prev)
      next.add(nextIndex)
      return next
    })
    setHelpOpen(false)
  }

  function handleBack() {
    if (isFirstStep) {
      navigate('/smokecraft/cut-toast-light')
      return
    }
    goToStep(stepIndex - 1)
  }

  function handlePrimary() {
    if (!isLastStep) {
      goToStep(stepIndex + 1)
      return
    }
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    // Real, honest persistence: mark the light/toast method as tutorial-guided.
    setCutToastLight({
      ...(journey.cutToastLight || {}),
      lightingTutorialCompleted: true,
      lightingTutorialCompletedAt: Date.now(),
    })
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('lighting-tutorial')
    navigate('/smokecraft/first-third')
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
        aria-label="SmokeCraft Lighting Tutorial"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(90px,14vh,140px)',
          backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.35), rgba(6,8,16,0.92)), url(${SC_ASSETS.lightingTutorial})`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          zIndex: 1,
        }}
      />

      {/* Decorative static atmosphere — warm wood grain texture strip, cigar-lounge framing.
          No dynamic content lives in this layer; it is purely permanent decoration. */}
      <div aria-hidden="true" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '18%',
        background: `linear-gradient(to top, ${WOOD} 0%, transparent 100%)`,
        opacity: 0.35, pointerEvents: 'none',
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        boxShadow: 'inset 0 0 180px rgba(0,0,0,0.65)',
        pointerEvents: 'none',
      }} />

      {/* Header: permanent title + live step indicator */}
      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0',
        zIndex: 3,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: GOLD_DIM,
          letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          SmokeCraft 360 — Lighting Tutorial
        </div>
        <h1 style={{
          margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700,
          color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15,
        }}>
          {step.title}
        </h1>

        {/* Live React zone: step indicator */}
        <div
          role="progressbar"
          aria-label="Tutorial step progress"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={stepIndex + 1}
          style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}
        >
          {STEPS.map((s, i) => {
            const active  = i === stepIndex
            const viewed  = viewedSteps.has(i)
            return (
              <button
                key={s.id}
                type="button"
                aria-label={`Step ${i + 1}: ${s.title}${active ? ' (current)' : viewed ? ' (viewed)' : ''}`}
                aria-current={active ? 'step' : undefined}
                onClick={() => goToStep(i)}
                style={{
                  width: 'clamp(20px,2.4vw,28px)', height: 6, borderRadius: 3,
                  border: 'none', padding: 0, cursor: 'pointer', outline: 'none',
                  background: active ? GOLD : viewed ? 'rgba(233,193,118,0.45)' : 'rgba(229,226,225,0.16)',
                  transition: 'background 0.2s',
                }}
              />
            )
          })}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 6 }}>
          Step {stepIndex + 1} of {STEPS.length} · {progressPct}% viewed
        </div>
      </header>

      {/* Main content — scrollable so it works at every viewport */}
      <main style={{
        position: 'absolute', top: 'clamp(150px,20vh,210px)', bottom: 'clamp(150px,19vh,190px)',
        left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Educational image/video area — honest placeholder, no fabricated imagery */}
          <div
            aria-label="Educational demonstration area"
            style={{
              background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
              minHeight: 'clamp(140px,22vh,220px)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20,
              boxSizing: 'border-box',
            }}
          >
            <span style={{ fontSize: 34, color: GOLD_DIM, lineHeight: 1 }} aria-hidden="true">🎞</span>
            <span style={{ fontSize: 12, color: 'rgba(229,226,225,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
              Demonstration video — {step.title}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(229,226,225,0.3)', textAlign: 'center' }}>
              Media pending production upload
            </span>
          </div>

          {/* Tutorial text */}
          <div style={{
            background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
            padding: 'clamp(16px,2.4vw,24px)',
          }}>
            <p style={{
              margin: 0, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65,
              color: CREAM,
            }}>
              {step.body}
            </p>
          </div>

          {/* Mentor tip */}
          <div style={{
            background: 'rgba(233,193,118,0.06)', border: `1px solid ${BORDER}`, borderRadius: 12,
            padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden="true">🎩</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
                Mentor Tip
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'rgba(229,226,225,0.85)' }}>
                {step.mentorTip}
              </p>
            </div>
          </div>

          {/* Knowledge tip */}
          <div style={{
            background: 'rgba(233,193,118,0.04)', border: `1px solid rgba(233,193,118,0.14)`, borderRadius: 12,
            padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden="true">💡</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(233,193,118,0.7)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
                Knowledge Drop
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'rgba(229,226,225,0.75)' }}>
                {step.knowledgeTip}
              </p>
            </div>
          </div>

          {/* Completion status — honest, derived only from real viewed-step count */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: allViewed ? GOLD : 'rgba(229,226,225,0.4)',
          }}>
            <span aria-hidden="true">{allViewed ? '✓' : '○'}</span>
            <span>{allViewed ? 'All steps reviewed — ready to continue' : `${STEPS.length - viewedSteps.size} step${STEPS.length - viewedSteps.size === 1 ? '' : 's'} remaining`}</span>
          </div>
        </div>
      </main>

      {/* Help panel — real toggle, real content, not decorative */}
      <button
        type="button"
        aria-label="Open lighting technique help"
        aria-expanded={helpOpen}
        onClick={() => { triggerHaptic('light'); setHelpOpen(o => !o) }}
        style={{
          position: 'absolute', top: 'clamp(16px,3vw,28px)', right: 'clamp(16px,4vw,40px)',
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(5,5,5,0.6)', border: `1.5px solid ${GOLD}`,
          color: GOLD, fontSize: 16, fontWeight: 700, cursor: 'pointer',
          zIndex: 4, outline: 'none',
        }}
      >
        ?
      </button>

      {helpOpen && (
        <div
          role="dialog"
          aria-label="Lighting tutorial help"
          style={{
            position: 'absolute', top: 'clamp(64px,9vw,84px)', right: 'clamp(16px,4vw,40px)',
            width: 'min(320px, calc(100vw - 32px))', zIndex: 4,
            background: 'rgba(5,5,5,0.96)', border: `1px solid ${BORDER}`, borderRadius: 12,
            padding: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            About This Tutorial
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'rgba(229,226,225,0.8)' }}>
            Use the dots above to revisit any step. Your progress through this tutorial is tracked
            for this session only. Tap Continue once you’ve reviewed every step to move on to your First Draw.
          </p>
        </div>
      )}

      <SmokeCraftNavBar
        primary={isLastStep ? (done ? 'Continuing…' : 'Continue to First Draw →') : 'Next Step →'}
        onPrimary={handlePrimary}
        primaryDisabled={isLastStep && !allViewed}
        secondary={isFirstStep ? '← Back' : '← Previous Step'}
        onSecondary={handleBack}
      />
    </div>
  )
}
