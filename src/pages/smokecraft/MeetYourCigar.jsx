import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'

const ENRICHMENT_3 = getEducationalEnrichment(3)

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'
const FALLBACK  = 'Not available for this cigar'

// Known real-world brand/blend-line split for the fixed 8-cigar catalog used by
// HumidorMatch.jsx (journey.selectedCigar.name). No fabricated attributes — this
// is only a display split of the cigar's already-real, already-selected name.
const BRAND_BLEND_MAP = {
  'Oliva Serie V':        { brand: 'Oliva',            blend: 'Serie V' },
  'Arturo Fuente Opus X': { brand: 'Arturo Fuente',     blend: 'Opus X' },
  'Padron 1964 Series':   { brand: 'Padrón',            blend: '1964 Series' },
  'Macanudo Café':        { brand: 'Macanudo',          blend: 'Café' },
  'CAO Flathead':         { brand: 'CAO',               blend: 'Flathead' },
  'Romeo y Julieta 1875': { brand: 'Romeo y Julieta',   blend: '1875' },
  'My Father Le Bijou':   { brand: 'My Father',         blend: 'Le Bijou' },
  'Cohiba Siglo VI':      { brand: 'Cohiba',             blend: 'Siglo VI' },
}

function buildSections(cigar) {
  const known = cigar ? BRAND_BLEND_MAP[cigar.name] : null
  return [
    { id: 'brand',  title: 'Brand',          value: known?.brand || cigar?.name || null },
    { id: 'blend',  title: 'Blend',          value: known?.blend || null },
    { id: 'wrapper', title: 'Wrapper',       value: cigar?.wrapper || null },
    { id: 'binder', title: 'Binder',         value: null },
    { id: 'filler', title: 'Filler',         value: null },
    { id: 'factory', title: 'Factory',       value: null },
    { id: 'masterBlender', title: 'Master Blender', value: null },
  ]
}

const ACTIVITY_KEY = 'meet-your-cigar'
// The only 3 sections that ever carry real, non-fallback content for
// this fixed 8-cigar catalog (binder/filler/factory/masterBlender are
// always "Not available") — the real, server-required checkpoints.
const REQUIRED_CHECKPOINTS = ['brand', 'blend', 'wrapper']

export default function MeetYourCigar({ onBack, onComplete } = {}) {
  const { awardSessionRewards, session, loadTastingDraft, saveTastingDraft, submitSelectionAttempt } = useGuestSession()
  const { isDemoMode } = useSmokeCraftProgress()
  const { journey, setMeetYourCigar } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // Choose Your Cigar (humidor-match) must be completed first.
  useEffect(() => {
    if (!isDemoMode && !session.completedSteps.includes('humidor-match')) {
      navigate('/smokecraft/humidor-match', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Resume flag — same dedicated sessionStorage mechanism as Lighting Tutorial,
  // Terroir, and Knowledge Drop.
  useEffect(() => {
    try { sessionStorage.setItem('sc_active_screen', '/smokecraft/meet-your-cigar') } catch {}
    return () => {
      try {
        if (sessionStorage.getItem('sc_active_screen') === '/smokecraft/meet-your-cigar') {
          sessionStorage.removeItem('sc_active_screen')
        }
      } catch {}
    }
  }, [])

  const cigar = journey.selectedCigar || null
  const sections = buildSections(cigar)

  const savedViewed = journey.meetYourCigar?.viewedSections || []
  // SC-D081: defaulted to null, so a normal player landed on an
  // almost-entirely-empty content panel until they clicked a tab.
  // Default to the first section instead.
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? null)
  const [viewedSections, setViewedSections] = useState(() => new Set(savedViewed))

  const section = sectionId ? sections.find(s => s.id === sectionId) : null
  const allViewed = viewedSections.size === sections.length

  // Required-Interaction Closure Package D: the player must inspect all
  // 3 real (non-fallback) sections AND submit a final synthesis —
  // reflecting on which detail most shaped their impression — before
  // this session can complete server-side. The server independently
  // validates completeness; a client-claimed "viewed"/"completed" flag
  // is never trusted.
  const [phase, setPhase] = useState('loading')
  const [synthesis, setSynthesis] = useState(null)
  const [draftVersion, setDraftVersion] = useState(0)
  const [draftLocked, setDraftLocked] = useState(false)
  const [done, setDone] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const requiredViewed = REQUIRED_CHECKPOINTS.every(id => viewedSections.has(id))

  useEffect(() => {
    let cancelled = false
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (cancelled) return
      if (!result.ok) { setPhase('error'); return }
      const d = result.draftData || {}
      if (d.checkpoints) {
        setViewedSections(prev => {
          const next = new Set(prev)
          for (const id of REQUIRED_CHECKPOINTS) if (d.checkpoints[id]) next.add(id)
          return next
        })
      }
      if (d.synthesis) setSynthesis(d.synthesis)
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTastingDraft])

  function handleRetryLoad() {
    setPhase('loading')
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (!result.ok) { setPhase('error'); return }
      setPhase('ready')
    })
  }

  useEffect(() => {
    if (viewedSections.size > 0) {
      setMeetYourCigar({ ...(journey.meetYourCigar || {}), viewedSections: Array.from(viewedSections) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedSections.size])

  useEffect(() => {
    if (phase !== 'ready' || done || draftLocked) return
    const t = setTimeout(() => {
      const checkpoints = {}
      for (const id of REQUIRED_CHECKPOINTS) if (viewedSections.has(id)) checkpoints[id] = true
      saveTastingDraft(ACTIVITY_KEY, { checkpoints, synthesis }, draftVersion).then(result => {
        if (result.alreadyCompleted) { setDraftLocked(true); return }
        if (result.conflict) { setDraftVersion(result.current.version); return }
        if (result.ok) setDraftVersion(result.current.version)
      })
    }, 900)
    return () => clearTimeout(t)
  }, [phase, viewedSections, synthesis, done, draftVersion, draftLocked, saveTastingDraft])

  function selectSection(id) {
    triggerHaptic('light')
    setSectionId(id)
    setFeedback(null)
    setViewedSections(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  async function handleContinue() {
    if (done) return
    if (!requiredViewed) {
      setFeedback({ message: 'Review Brand, Blend, and Wrapper before continuing.' })
      return
    }
    if (!synthesis) {
      setFeedback({ message: 'Select which detail most influenced your impression of this cigar.' })
      return
    }
    setDone(true)
    setMeetYourCigar({
      viewedSections: Array.from(viewedSections),
      completedAt: journey.meetYourCigar?.completedAt || Date.now(),
    })

    const checkpoints = {}
    for (const id of REQUIRED_CHECKPOINTS) checkpoints[id] = true
    const result = await submitSelectionAttempt(ACTIVITY_KEY, { checkpoints, synthesis })
    if (!result.ok) {
      setDone(false)
      setFeedback({ message: 'Unable to submit right now. Please try again.' })
      return
    }
    if (!result.data.correct) {
      setDone(false)
      setFeedback({ message: 'Your response was incomplete. Please review and try again.' })
      return
    }
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('meet-your-cigar')
    navigate('/smokecraft/terroir')
  }

  if (phase === 'loading') {
    return (
      <div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: NAVY_DEEP, color: 'rgba(229,226,225,0.7)', fontFamily: 'Georgia, serif', fontSize: 14 }}>
        Loading…
      </div>
    )
  }
  if (phase === 'error') {
    return (
      <div role="alert" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: NAVY_DEEP, color: 'rgba(233,193,118,0.85)', fontFamily: 'Georgia, serif', fontSize: 14 }}>
        <p style={{ margin: 0 }}>Something went wrong loading this session.</p>
        <button type="button" onClick={handleRetryLoad} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
          Retry
        </button>
      </div>
    )
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
      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0',
        zIndex: 3,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: GOLD_DIM,
          letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          SmokeCraft 360 — Meet Your Cigar
        </div>
        <h1 style={{
          margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700,
          color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15,
        }}>
          {cigar?.name || 'No Cigar Selected'}
        </h1>

        <div
          role="tablist"
          aria-label="Meet Your Cigar sections"
          style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}
        >
          {sections.map(s => {
            const active = sectionId === s.id
            const viewed = viewedSections.has(s.id)
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`${s.title}${viewed ? ' (viewed)' : ''}`}
                onClick={() => selectSection(s.id)}
                style={{
                  minWidth: 44, minHeight: 40,
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: `1.5px solid ${active ? GOLD : viewed ? 'rgba(233,193,118,0.4)' : 'rgba(229,226,225,0.2)'}`,
                  background: active ? 'rgba(233,193,118,0.12)' : 'transparent',
                  color: active ? GOLD : viewed ? 'rgba(233,193,118,0.75)' : 'rgba(229,226,225,0.7)',
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(11px,1.2vw,13px)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {viewed ? '✓ ' : ''}{s.title}
              </button>
            )
          })}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 6 }}>
          {viewedSections.size} of {sections.length} sections viewed
        </div>
      </header>

      <main style={{
        position: 'absolute', top: 'clamp(180px,24vh,240px)', bottom: 'clamp(120px,16vh,160px)',
        left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Empty state — no cigar selected at all */}
          {!cigar && (
            <div style={{
              background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: 'clamp(24px,4vw,40px)', textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: 'clamp(14px,1.6vw,16px)', color: 'rgba(229,226,225,0.65)', lineHeight: 1.6 }}>
                No cigar has been selected yet. Choose a cigar to see its details here.
              </p>
            </div>
          )}

          {/* SC-D080 fix (approved-media slot, Part 4): no dedicated Meet
              Your Cigar photography exists anywhere in the repository
              (public/assets/smokecraft/ and its cigars/ subfolder both
              checked). Rather than keep reusing Humidor Match's photography
              under a different screen's heading — still not the correct
              approved asset for this screen — this is now an honest,
              reserved-dimension media slot, matching the same disclosed
              pattern already used on Lighting Tutorial. Wiring the real
              approved asset later is a one-line change (replace this block
              with <SmokeCraftImageSurface surface="cigar-profile"
              src={SC_ASSETS.meetYourCigar} .../>) — no game logic changes. */}
          {cigar && (
            <div
              aria-label={`${cigar.name} reference image — pending approved photography`}
              style={{
                minHeight: 'clamp(140px,20vh,200px)', maxHeight: 220,
                background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: 20, boxSizing: 'border-box',
              }}
            >
              <span style={{ fontSize: 30, color: GOLD_DIM, lineHeight: 1 }} aria-hidden="true">🚬</span>
              <span style={{ fontSize: 12, color: 'rgba(229,226,225,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>
                {cigar.name} — reference image
              </span>
              <span style={{ fontSize: 11, color: 'rgba(229,226,225,0.3)', textAlign: 'center' }}>
                Dedicated photography pending owner approval
              </span>
            </div>
          )}

          {section && (
            <div style={{
              background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: 'clamp(16px,2.4vw,24px)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                {section.title}
              </div>
              <p style={{
                margin: 0, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65,
                color: section.value ? CREAM : 'rgba(229,226,225,0.5)',
                fontStyle: section.value ? 'normal' : 'italic',
              }}>
                {section.value || FALLBACK}
              </p>
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: allViewed ? GOLD : 'rgba(229,226,225,0.4)',
          }}>
            <span aria-hidden="true">{allViewed ? '✓' : '○'}</span>
            <span>{allViewed ? 'All cigar sections reviewed' : `${sections.length - viewedSections.size} section${sections.length - viewedSections.size === 1 ? '' : 's'} remaining`}</span>
          </div>

          {requiredViewed && (
            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
                Required: Which detail most influenced your impression of this cigar?
              </div>
              <div role="radiogroup" aria-label="Most influential detail" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {REQUIRED_CHECKPOINTS.map(id => {
                  const label = sections.find(s => s.id === id)?.title || id
                  const active = synthesis === id
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={label}
                      onClick={() => { triggerHaptic('light'); setFeedback(null); setSynthesis(id) }}
                      style={{
                        minHeight: 44, padding: '8px 16px', borderRadius: 20,
                        border: `1.5px solid ${active ? GOLD : 'rgba(229,226,225,0.25)'}`,
                        background: active ? 'rgba(233,193,118,0.14)' : 'transparent',
                        color: active ? GOLD : 'rgba(229,226,225,0.75)',
                        fontFamily: 'Georgia, serif', fontSize: 13, cursor: 'pointer', outline: 'none',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {feedback && (
            <div role="alert" style={{ background: 'rgba(120,20,20,0.9)', border: '1px solid rgba(255,150,150,0.5)', borderRadius: 8, padding: '8px 14px', color: '#ffdada', fontSize: 13, fontFamily: 'Georgia, serif' }}>
              {feedback.message}
            </div>
          )}
        </div>
      </main>

      <SmokeCraftLessonInfoButton
        sessionNumber={3} totalSessions={TOTAL_SESSIONS} phase={1} totalPhases={TOTAL_VISITS}
        title="Meet Your Cigar" whyItMatters={ENRICHMENT_3?.whyItMatters} goldenBox={ENRICHMENT_3?.goldenBox}
      />

      <SmokeCraftNavBar
        primary={done ? 'Checking…' : 'Continue →'}
        onPrimary={handleContinue}
        primaryDisabled={done}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/humidor-match'))}
      />
    </div>
  )
}
