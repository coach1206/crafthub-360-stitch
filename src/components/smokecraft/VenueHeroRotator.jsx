import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const ROTATE_MS = 6000

// Polished fallback texture — used whenever a slide has no image or the
// image fails to load. Never renders a broken image or "pending" box.
const FALLBACK_GRADIENT = 'radial-gradient(circle at 30% 20%, rgba(212,175,55,0.22), transparent 45%), linear-gradient(150deg, #2a1c0e, #120b05)'

function SlideImage({ image, title }) {
  const [failed, setFailed] = useState(false)
  if (!image || failed) {
    return <div style={{ width: '100%', height: '100%', background: FALLBACK_GRADIENT }} aria-hidden="true" />
  }
  return (
    <img
      src={image}
      alt={title}
      onError={() => setFailed(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  )
}

export default function VenueHeroRotator({ content }) {
  const navigate = useNavigate()
  const slides = content?.heroRotator?.length ? content.heroRotator : []
  const [index, setIndex] = useState(0)
  const timerRef = useRef(null)

  const advance = useCallback((dir) => {
    setIndex(i => (i + dir + slides.length) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (slides.length < 2) return
    timerRef.current = setInterval(() => advance(1), ROTATE_MS)
    return () => clearInterval(timerRef.current)
  }, [advance, slides.length])

  if (!slides.length) {
    return (
      <div
        className="sc-card-tactile"
        style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, border: '1px solid rgba(212,175,55,0.28)', background: FALLBACK_GRADIENT, minHeight: 188, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: 'rgba(244,236,218,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Venue content coming soon
        </span>
      </div>
    )
  }

  const slide = slides[index]

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => advance(1), ROTATE_MS)
  }

  return (
    <div
      className="sc-card-tactile"
      onClick={() => navigate(slide.route)}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, border: '1px solid rgba(212,175,55,0.28)', background: 'linear-gradient(150deg, rgba(36,24,12,0.92), rgba(14,9,5,0.94))', cursor: 'pointer', boxShadow: '0 14px 38px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,236,178,0.06)' }}
    >
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#E6C76A', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '18px 26px 0' }}>
        Tonight at This Venue
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: '14px 26px 22px' }}>
        <div style={{ width: 168, height: 152, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.28)', flexShrink: 0, boxShadow: '0 8px 22px rgba(0,0,0,0.45)' }}>
          <SlideImage image={slide.image} title={slide.title} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#F4ECDA', marginBottom: 5, lineHeight: 1.2 }}>{slide.title}</h4>
          <p style={{ fontSize: 13, color: 'rgba(244,236,218,0.62)', lineHeight: 1.55, marginBottom: 16 }}>{slide.subtitle}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#E6C76A' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{slide.icon || 'chevron_right'}</span>
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Explore</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          </div>
        </div>
      </div>

      {/* Manual controls + position dots */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px 16px' }}
      >
        <button
          type="button"
          className="sc-tactile"
          aria-label="Previous"
          onClick={() => { advance(-1); resetTimer() }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.32)', background: 'rgba(255,255,255,0.04)', color: '#E6C76A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
        </button>

        <div style={{ display: 'flex', gap: 6 }}>
          {slides.map((s, i) => (
            <span
              key={s.id}
              style={{
                width: i === index ? 18 : 6, height: 6, borderRadius: 3,
                background: i === index ? '#E6C76A' : 'rgba(212,175,55,0.28)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        <button
          type="button"
          className="sc-tactile"
          aria-label="Next"
          onClick={() => { advance(1); resetTimer() }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.32)', background: 'rgba(255,255,255,0.04)', color: '#E6C76A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
        </button>
      </div>
    </div>
  )
}
