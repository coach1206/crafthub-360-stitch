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

export default function MeetYourCigar({ onBack, onComplete } = {}) {
  const { awardSessionRewards, session } = useGuestSession()
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
  const [sectionId, setSectionId] = useState(null)
  const [viewedSections, setViewedSections] = useState(() => new Set(savedViewed))
  const [imgStatus, setImgStatus] = useState('idle') // idle | loading | loaded | error

  const section = sectionId ? sections.find(s => s.id === sectionId) : null
  const allViewed = viewedSections.size === sections.length

  useEffect(() => {
    if (viewedSections.size > 0) {
      setMeetYourCigar({ ...(journey.meetYourCigar || {}), viewedSections: Array.from(viewedSections) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedSections.size])

  useEffect(() => {
    setImgStatus('loading')
  }, [])

  function selectSection(id) {
    triggerHaptic('light')
    setSectionId(id)
    setViewedSections(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  function handleContinue() {
    setMeetYourCigar({
      viewedSections: Array.from(viewedSections),
      completedAt: journey.meetYourCigar?.completedAt || Date.now(),
    })
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('meet-your-cigar')
    navigate('/smokecraft/terroir')
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

          {cigar && (
            <div
              aria-label="Cigar reference image"
              style={{
                background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
                minHeight: 'clamp(140px,20vh,200px)', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}
            >
              {imgStatus === 'error' ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <span style={{ fontSize: 28, color: GOLD_DIM }} aria-hidden="true">⚠</span>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>
                    Cigar image unavailable
                  </p>
                </div>
              ) : (
                <img
                  src={SC_ASSETS.meetYourCigar}
                  alt="Selected cigar reference"
                  onLoad={() => setImgStatus('loaded')}
                  onError={() => setImgStatus('error')}
                  style={{
                    width: '100%', height: '100%', maxHeight: 220,
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
        </div>
      </main>

      <SmokeCraftNavBar
        primary="Continue →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/humidor-match'))}
      />
    </div>
  )
}
