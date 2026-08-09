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
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const ENRICHMENT_4 = getEducationalEnrichment(4)

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

const SECTIONS = [
  {
    id: 'country',
    title: 'Country',
    img: SC_ASSETS.terroir,
    body: 'Every cigar begins with a country of origin — Cuba, Nicaragua, the Dominican Republic, Honduras, and others each impart a distinct regional character shaped by generations of local cultivation practice.',
  },
  {
    id: 'region',
    title: 'Region',
    img: SC_ASSETS.terroir,
    body: 'Within a country, specific growing regions — such as the Vuelta Abajo in Cuba or the Estelí valley in Nicaragua — develop their own microclimates and soil profiles, producing leaf that tastes noticeably different even from a neighboring valley.',
  },
  {
    id: 'soil',
    title: 'Soil',
    img: SC_ASSETS.terroirSoil,
    body: 'Soil composition — sandy loam, clay loam, volcanic, or limestone-rich — directly affects nutrient uptake, root development, and ultimately the mineral character and body of the finished leaf.',
  },
  {
    id: 'climate',
    title: 'Climate',
    img: SC_ASSETS.terroir,
    body: 'Rainfall, humidity, and temperature over the growing season determine leaf thickness and oil content. Warmer, wetter climates tend to produce fuller-bodied leaf; drier climates often yield a lighter, more refined profile.',
  },
  {
    id: 'growing',
    title: 'Growing Conditions',
    img: SC_ASSETS.terroir,
    body: 'Shade-grown versus sun-grown cultivation, plant spacing, and harvest timing are all growing-condition decisions made by the farmer that shape wrapper color, leaf texture, and how the tobacco will later ferment and age.',
  },
  {
    id: 'why',
    title: 'Why It Matters',
    img: SC_ASSETS.terroir,
    body: 'Terroir is why no two regions — and rarely two harvests — taste identical. Understanding it gives you a vocabulary for describing what you taste and a way to predict what you might enjoy next.',
  },
]

const ACTIVITY_KEY = 'terroir'
// The 5 real shaping factors (excludes 'why', meta-commentary about
// terroir itself, not a factor to weigh).
const REQUIRED_CHECKPOINTS = ['country', 'region', 'soil', 'climate', 'growing']

export default function Terroir({ onBack, onComplete } = {}) {
  const { awardSessionRewards, session, loadTastingDraft, saveTastingDraft, submitSelectionAttempt } = useGuestSession()
  const { isDemoMode } = useSmokeCraftProgress()
  const { journey, setTerroir } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // Meet Your Cigar (S3, built in Package I) must be completed first — the
  // true locked predecessor per Package J's spine, superseding Mentor
  // Selection which Package H used only as a stand-in.
  useEffect(() => {
    if (!isDemoMode && !session.completedSteps.includes('meet-your-cigar')) {
      navigate('/smokecraft/meet-your-cigar', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mark this screen as the guest's active position for Resume, exactly like
  // LightingTutorial.jsx's dedicated sessionStorage flag (Package E).
  useEffect(() => {
    try { sessionStorage.setItem('sc_active_screen', '/smokecraft/terroir') } catch {}
    return () => {
      try {
        if (sessionStorage.getItem('sc_active_screen') === '/smokecraft/terroir') {
          sessionStorage.removeItem('sc_active_screen')
        }
      } catch {}
    }
  }, [])

  const savedViewed = journey.terroir?.viewedSections || []
  // SC-D081: defaulted to null, so a normal player landed on an almost-
  // entirely-empty viewport ("Select a section above…") until they clicked
  // a tab — real content existed but nothing was shown by default. Default
  // to the first section instead, matching how a real player actually reads
  // the page top-to-bottom.
  const [sectionId, setSectionId]   = useState(SECTIONS[0]?.id ?? null)
  const [viewedSections, setViewedSections] = useState(() => new Set(savedViewed))
  const [imgStatus, setImgStatus]   = useState('idle') // idle | loading | loaded | error

  const section = sectionId ? SECTIONS.find(s => s.id === sectionId) : null
  const allViewed = viewedSections.size === SECTIONS.length

  // Required-Interaction Closure Package D: the player must inspect all
  // 5 real terroir factors AND submit a final synthesis — which factor
  // they judge most shapes a cigar's character — before this session
  // can complete server-side.
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

  // Persist progress to canonical journey state whenever it changes.
  useEffect(() => {
    if (viewedSections.size > 0) {
      setTerroir({ viewedSections: Array.from(viewedSections) })
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
    setImgStatus('loading')
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
      setFeedback({ message: 'Review Country, Region, Soil, Climate, and Growing Conditions before continuing.' })
      return
    }
    if (!synthesis) {
      setFeedback({ message: 'Select which factor you judge most shapes a cigar\'s character.' })
      return
    }
    setDone(true)
    setTerroir({ viewedSections: Array.from(viewedSections), completedAt: journey.terroir?.completedAt || Date.now() })

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
    awardSessionRewards('terroir')
    navigate('/smokecraft/format')
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
          SmokeCraft 360 — Terroir
        </div>
        <h1 style={{
          margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700,
          color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15,
        }}>
          {section ? section.title : 'Explore the Terroir'}
        </h1>

        {/* Live React zone: topic/section selection */}
        <div
          role="tablist"
          aria-label="Terroir sections"
          style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}
        >
          {SECTIONS.map(s => {
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
          {viewedSections.size} of {SECTIONS.length} sections viewed
        </div>
      </header>

      <main style={{
        position: 'absolute', top: 'clamp(160px,22vh,220px)', bottom: 'clamp(120px,16vh,160px)',
        left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Empty state — no section selected yet */}
          {!section && (
            <div style={{
              background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: 'clamp(24px,4vw,40px)', textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: 'clamp(14px,1.6vw,16px)', color: 'rgba(229,226,225,0.65)', lineHeight: 1.6 }}>
                Select a section above to begin exploring what shapes this cigar's terroir.
              </p>
            </div>
          )}

          {section && (
            <>
              {/* Replaceable image zone — real load/error state, not fabricated */}
              <div
                aria-label={`${section.title} reference image`}
                style={{
                  background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
                  minHeight: 'clamp(160px,26vh,260px)', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {imgStatus === 'error' ? (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <span style={{ fontSize: 28, color: GOLD_DIM }} aria-hidden="true">⚠</span>
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>
                      Image unavailable for {section.title}
                    </p>
                  </div>
                ) : (
                  <img
                    key={section.id}
                    src={section.img}
                    alt={`${section.title} — Terroir`}
                    onLoad={() => setImgStatus('loaded')}
                    onError={() => setImgStatus('error')}
                    style={{
                      width: '100%', height: '100%', maxHeight: 320,
                      objectFit: 'cover', display: 'block',
                      opacity: imgStatus === 'loaded' ? 1 : 0.15,
                      transition: 'opacity 0.25s',
                    }}
                  />
                )}
                {imgStatus === 'loading' && (
                  <div aria-live="polite" style={{
                    position: 'absolute', fontSize: 12, color: 'rgba(229,226,225,0.5)',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    Loading…
                  </div>
                )}
              </div>

              {/* Educational content panel */}
              <div style={{
                background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
                padding: 'clamp(16px,2.4vw,24px)',
              }}>
                <p style={{
                  margin: 0, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65,
                  color: CREAM,
                }}>
                  {section.body}
                </p>
              </div>
            </>
          )}

          {/* Completed state */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: allViewed ? GOLD : 'rgba(229,226,225,0.4)',
          }}>
            <span aria-hidden="true">{allViewed ? '✓' : '○'}</span>
            <span>{allViewed ? 'All terroir sections reviewed' : `${SECTIONS.length - viewedSections.size} section${SECTIONS.length - viewedSections.size === 1 ? '' : 's'} remaining`}</span>
          </div>

          {requiredViewed && (
            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
                Required: Which factor do you judge most shapes a cigar's character?
              </div>
              <div role="radiogroup" aria-label="Most influential terroir factor" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {REQUIRED_CHECKPOINTS.map(id => {
                  const label = SECTIONS.find(s => s.id === id)?.title || id
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
        sessionNumber={4} totalSessions={TOTAL_SESSIONS} phase={1} totalPhases={TOTAL_VISITS}
        title="Terroir" whyItMatters={ENRICHMENT_4?.whyItMatters} goldenBox={ENRICHMENT_4?.goldenBox}
      />

      <SmokeCraftNavBar
        primary={done ? 'Checking…' : 'Continue →'}
        onPrimary={handleContinue}
        primaryDisabled={done}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/meet-your-cigar'))}
      />
    </div>
  )
}
