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

export default function Terroir() {
  const { awardSessionRewards, session } = useGuestSession()
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
  const [sectionId, setSectionId]   = useState(null)
  const [viewedSections, setViewedSections] = useState(() => new Set(savedViewed))
  const [imgStatus, setImgStatus]   = useState('idle') // idle | loading | loaded | error

  const section = sectionId ? SECTIONS.find(s => s.id === sectionId) : null
  const allViewed = viewedSections.size === SECTIONS.length

  // Persist progress to canonical journey state whenever it changes.
  useEffect(() => {
    if (viewedSections.size > 0) {
      setTerroir({ viewedSections: Array.from(viewedSections) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedSections.size])

  function selectSection(id) {
    triggerHaptic('light')
    setSectionId(id)
    setImgStatus('loading')
    setViewedSections(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  function handleContinue() {
    setTerroir({ viewedSections: Array.from(viewedSections), completedAt: journey.terroir?.completedAt || Date.now() })
    awardSessionRewards('terroir')
    navigate('/smokecraft/format')
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
        </div>
      </main>

      <SmokeCraftNavBar
        primary="Continue →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft/meet-your-cigar')}
      />
    </div>
  )
}
