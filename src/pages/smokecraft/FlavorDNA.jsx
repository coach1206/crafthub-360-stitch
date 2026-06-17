import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'

// APPROVED SMOKECRAFT VISUAL RULE:
// No stock-photo fallback URLs, no CSS-drawn graphics, no cartoon/placeholder art.
// If a real image is missing, render "Image pending" only.
function FlavorDNAImage({ src, alt, className, style }) {
  const [failed, setFailed] = useState(!src)
  if (!failed && src) {
    return (
      <img
        className={className}
        style={style}
        alt={alt}
        src={src}
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <div
      className={className}
      style={{
        ...style,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(10,6,3,0.85)', border: '1px solid rgba(233,193,118,0.24)',
        color: 'rgba(233,193,118,0.5)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
      }}
    >
      Image pending
    </div>
  )
}

const OCCASIONS = [
  {
    label: 'Relaxing',
    sub: 'Unwind & Enjoy',
    img: null,
    color: '#8B4513',
  },
  {
    label: 'Celebrating',
    sub: 'Raise a Glass',
    img: null,
    color: '#C4860A',
  },
  {
    label: 'Business',
    sub: 'Focus & Achieve',
    img: null,
    color: '#4A4A4A',
  },
  {
    label: 'Date Night',
    sub: 'Intimate Moments',
    img: null,
    color: '#8B1A3A',
  },
  {
    label: 'Sports',
    sub: 'Game Day Energy',
    img: null,
    color: '#1A4A1A',
  },
  {
    label: 'VIP',
    sub: 'Exclusive Access',
    img: null,
    color: '#2A1A5A',
  },
]

const INTENSITY_OPTIONS = [
  {
    v: 'smooth',
    label: 'Smooth',
    sub: 'Mild · Silky · Easy draw',
    img: null,
  },
  {
    v: 'bold',
    label: 'Bold',
    sub: 'Full · Robust · Complex',
    img: null,
  },
]

const CHARACTERS = [
  { label: 'Sweet',   img: null },
  { label: 'Spicy',   img: null },
  { label: 'Earthy',  img: null },
  { label: 'Creamy',  img: null },
  { label: 'Woody',   img: null },
  { label: 'Peppery', img: null },
]

const AROMATICS = [
  { label: 'Coffee',    icon: 'coffee' },
  { label: 'Chocolate', icon: 'cookie' },
  { label: 'Vanilla',   icon: 'icecream' },
  { label: 'Oak',       icon: 'nature' },
  { label: 'Leather',   icon: 'wallet' },
  { label: 'Fruit',     icon: 'nutrition' },
  { label: 'Spice',     icon: 'flare' },
]

const GOLD = 'linear-gradient(135deg,#8b6914,#e9c176,#f5d98a,#c5a059,#8b6914)'

export default function FlavorDNA() {
  const navigate = useNavigate()
  const { addXP, completeStep, awardStamp } = useGuestSession()

  const [intensity, setIntensity]   = useState(null)
  const [characters, setCharacters] = useState(new Set())
  const [aromatics, setAromatics]   = useState(new Set())
  const [bodyLabel, setBodyLabel]   = useState('Medium')
  const [occasion, setOccasion]     = useState('Relaxing')
  const [showModal, setShowModal]   = useState(false)

  function toggleSet(setter, key) {
    setter(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  function handleFinalize() {
    awardStamp('taste-profile', 'flavor-dna')
    addXP(XP_AWARDS.FLAVOR_DNA_COMPLETE)
    completeStep('flavor-dna')
    setShowModal(true)
  }

  function handleContinue() {
    setShowModal(false)
    navigate('/smokecraft/pairing')
  }

  const S = {
    page:    { minHeight: '100dvh', background: '#0A0705', color: '#E5E2E1', fontFamily: '"Hanken Grotesk",sans-serif', overflowX: 'hidden', position: 'relative' },
    header:  { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(10,7,5,0.82)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,175,55,0.12)' },
    main:    { position: 'relative', zIndex: 10, paddingTop: 100, paddingBottom: 120, maxWidth: 1100, margin: '0 auto', padding: '100px 28px 120px' },
    section: { marginBottom: 40 },
    label:   { fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 6 },
    sectionTitle: { fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#EDE8DF', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  }

  return (
    <div style={S.page}>
      {/* Smoke texture overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: "url('https://www.transparenttextures.com/patterns/black-leather.png')", opacity: 0.15, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse at 20% 60%, rgba(212,175,55,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D4AF37', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#D4AF37' }}>CraftHub 360</span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['Explore', 'Inventory', 'Passport', 'Assistant'].map((l, i) => (
            <span key={l} style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 14, color: i === 2 ? '#D4AF37' : '#6A5A40', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#D4AF37'} onMouseLeave={e => e.target.style.color = i === 2 ? '#D4AF37' : '#6A5A40'}
            >{l}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>Julian Sterling</div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#6A5A40', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Platinum Member</div>
          </div>
          <button style={{ padding: '8px 18px', borderRadius: 20, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}>
            👑 Grand Lounge
          </button>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main style={S.main}>

        {/* Progress */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>Step 10 of 20</span>
            <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, color: '#6A5A40', fontStyle: 'italic' }}>Sensory Mapping</span>
          </div>
          <div style={{ height: 3, background: 'rgba(212,175,55,0.15)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '50%', height: '100%', background: GOLD, borderRadius: 4, transition: 'width 0.8s ease' }} />
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: '#EDE8DF', marginBottom: 10 }}>Sensory Profile</h2>
          <p style={{ fontSize: 15, color: '#7A6A50' }}>Build your Flavor DNA to unlock personalized cigar experiences.</p>
        </div>

        {/* ── Atmosphere Card ──────────────────────────────── */}
        <div style={{ borderRadius: 16, border: '1px solid rgba(212,175,55,0.18)', background: 'rgba(18,12,6,0.85)', overflow: 'hidden', marginBottom: 36 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 200 }}>
            <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14, padding: '4px 10px', borderRadius: 12, border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.06)', width: 'fit-content' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#D4AF37' }}>radio_button_checked</span>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Occasion Influence</span>
              </div>
              <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#D4AF37', marginBottom: 12, lineHeight: 1.2 }}>Atmosphere Shapes Flavor</h3>
              <p style={{ fontSize: 13, color: '#7A6A50', lineHeight: 1.7, marginBottom: 16, maxWidth: 340 }}>
                Your occasion influences mood, pace, and palate. Selecting today's occasion helps us recommend cigars and pairings that match the moment.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#6A5A40' }}>Selected:</span>
                <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, color: '#D4AF37', fontStyle: 'italic', fontWeight: 700 }}>{occasion}</span>
              </div>
            </div>
            <div style={{ position: 'relative', overflow: 'hidden', minHeight: 200 }}>
              <FlavorDNAImage
                src={null}
                alt="SmokeCraft atmosphere"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(14,8,2,0.6) 0%, transparent 40%)' }} />
              {/* SmokeCraft badge overlay */}
              <div style={{ position: 'absolute', top: 16, right: 16, padding: '6px 12px', borderRadius: 8, background: 'rgba(10,7,5,0.75)', border: '1px solid rgba(212,175,55,0.4)', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'center' }}>SMOKECRAFT</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(212,175,55,0.6)', letterSpacing: '0.1em', textAlign: 'center' }}>360</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Today's Occasion ─────────────────────────────── */}
        <div style={S.section}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#D4AF37' }}>event</span>
              <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#EDE8DF' }}>Today's Occasion</span>
            </div>
            <p style={{ fontSize: 13, color: '#6A5A40', marginLeft: 30 }}>Choose the occasion that best fits your moment.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
            {OCCASIONS.map(occ => {
              const active = occasion === occ.label
              return (
                <button
                  key={occ.label}
                  onClick={() => setOccasion(occ.label)}
                  style={{ background: active ? 'rgba(212,175,55,0.1)' : 'rgba(18,12,6,0.7)', border: `1px solid ${active ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.15)'}`, borderRadius: 14, padding: '16px 8px 14px', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.15)'; e.currentTarget.style.transform = 'translateY(0)' } }}
                >
                  {/* Medallion coin */}
                  <div style={{ position: 'relative', width: 72, height: 72 }}>
                    {/* Outer laurel ring */}
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: active ? GOLD : 'linear-gradient(135deg,#4A3A18,#8B6914,#4A3A18)', padding: 3 }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `rgba(${occ.color === '#8B4513' ? '139,69,19' : occ.color === '#C4860A' ? '196,134,10' : occ.color === '#4A4A4A' ? '74,74,74' : occ.color === '#8B1A3A' ? '139,26,58' : occ.color === '#1A4A1A' ? '26,74,26' : '42,26,90'},0.25)` }}>
                      </div>
                    </div>
                    {/* Inner photo circle */}
                    <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.3)' }}>
                      <FlavorDNAImage src={occ.img} alt={occ.label} style={{ width: '100%', height: '100%', objectFit: 'cover', fontSize: 6 }} />
                      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, rgba(0,0,0,0.2), rgba(0,0,0,0.5))` }} />
                    </div>
                    {/* Active glow ring */}
                    {active && <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', boxShadow: '0 0 16px rgba(212,175,55,0.5)', pointerEvents: 'none' }} />}
                  </div>
                  <div>
                    <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#D4AF37' : '#C8BAA2', textAlign: 'center', marginBottom: 2 }}>{occ.label}</div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: active ? 'rgba(212,175,55,0.7)' : '#4A3A20', letterSpacing: '0.06em', textAlign: 'center' }}>{occ.sub}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Smooth or Bold ───────────────────────────────── */}
        <div style={S.section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#D4AF37' }}>air</span>
            <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#EDE8DF' }}>Smooth or bold?</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {INTENSITY_OPTIONS.map(opt => {
              const active = intensity === opt.v
              return (
                <button
                  key={opt.v}
                  onClick={() => setIntensity(opt.v)}
                  style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: `1px solid ${active ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.18)'}`, cursor: 'pointer', height: 160, transition: 'all 0.25s', outline: 'none' }}
                >
                  <FlavorDNAImage src={opt.img} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'flex' }} />
                  <div style={{ position: 'absolute', inset: 0, background: active ? 'rgba(10,7,2,0.45)' : 'rgba(10,7,2,0.65)', transition: 'background 0.25s' }} />
                  {active && <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 2px rgba(212,175,55,0.6)', borderRadius: 13, pointerEvents: 'none' }} />}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, fontWeight: 700, color: active ? '#D4AF37' : '#EDE8DF', letterSpacing: '-0.01em' }}>{opt.label}</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: active ? 'rgba(212,175,55,0.8)' : '#7A6A50', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{opt.sub}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Character ────────────────────────────────────── */}
        <div style={S.section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#D4AF37' }}>psychology</span>
            <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#EDE8DF' }}>Character?</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {CHARACTERS.map(c => {
              const active = characters.has(c.label)
              return (
                <button
                  key={c.label}
                  onClick={() => toggleSet(setCharacters, c.label)}
                  style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: `1px solid ${active ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.15)'}`, cursor: 'pointer', height: 90, transition: 'all 0.2s', outline: 'none' }}
                >
                  <FlavorDNAImage src={c.img} alt={c.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'flex' }} />
                  <div style={{ position: 'absolute', inset: 0, background: active ? 'rgba(8,5,2,0.4)' : 'rgba(8,5,2,0.6)', transition: 'background 0.2s' }} />
                  {active && <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 2px rgba(212,175,55,0.6)', borderRadius: 11, pointerEvents: 'none' }} />}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 14, fontWeight: 700, color: active ? '#D4AF37' : '#C8BAA2', letterSpacing: '0.02em' }}>{c.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Aromatic Nuances ─────────────────────────────── */}
        <div style={{ ...S.section, marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#D4AF37' }}>tune</span>
            <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#EDE8DF' }}>Aromatic Nuances?</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {AROMATICS.map(({ label, icon }) => {
              const active = aromatics.has(label)
              return (
                <button
                  key={label}
                  onClick={() => toggleSet(setAromatics, label)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 50, border: `1px solid ${active ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.2)'}`, background: active ? 'rgba(212,175,55,0.12)' : 'rgba(18,12,6,0.6)', color: active ? '#D4AF37' : '#8A7A60', fontSize: 14, fontWeight: active ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: active ? '#D4AF37' : '#6A5A40' }}>{icon}</span>
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Body Preference ──────────────────────────────── */}
        <div style={{ ...S.section, marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#D4AF37' }}>fitness_center</span>
            <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#EDE8DF' }}>Body Preference?</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Mild', 'Medium', 'Full'].map(lbl => (
              <button
                key={lbl}
                onClick={() => setBodyLabel(lbl)}
                style={{ flex: 1, padding: '14px 0', borderRadius: 10, border: `1px solid ${bodyLabel === lbl ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.18)'}`, background: bodyLabel === lbl ? 'rgba(212,175,55,0.12)' : 'rgba(18,12,6,0.6)', color: bodyLabel === lbl ? '#D4AF37' : '#6A5A40', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
              >{lbl}</button>
            ))}
          </div>
        </div>

        {/* ── Passport Milestone Banner ────────────────────── */}
        <div style={{ borderRadius: 16, border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(18,12,6,0.9)', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 0 }}>
          {/* Passport book */}
          <div style={{ width: 110, flexShrink: 0, background: 'linear-gradient(160deg,#2D1A0A,#1A0D04)', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.02) 0px,rgba(255,255,255,0.02) 1px,transparent 1px,transparent 8px)' }} />
            <div style={{ width: 60, height: 80, borderRadius: 4, background: 'linear-gradient(160deg,#1A0F06,#2D1A0A)', border: '2px solid rgba(212,175,55,0.55)', boxShadow: '4px 4px 16px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', padding: '8px 6px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#D4AF37' }}>public</span>
              </div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#D4AF37', letterSpacing: '0.1em', textAlign: 'center', lineHeight: 1.5 }}>CH360</div>
            </div>
          </div>

          {/* Text */}
          <div style={{ flex: 1, padding: '24px 24px' }}>
            <h4 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#EDE8DF', marginBottom: 8 }}>Passport Milestone</h4>
            <p style={{ fontSize: 13, color: '#7A6A50', lineHeight: 1.65 }}>
              {"You're about to earn the "}
              <strong style={{ color: '#D4AF37', fontWeight: 700 }}>Taste Profile Completion Stamp</strong>
              {". Complete this profile to unlock personalized humidors, pairing recommendations, and exclusive cellar access."}
            </p>
          </div>

          {/* Stamp circle + button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 28px', flexShrink: 0 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '2px dashed rgba(212,175,55,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'rgba(212,175,55,0.5)', fontVariationSettings: "'FILL' 1" }}>approval</span>
            </div>
            <button
              onClick={handleFinalize}
              style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: GOLD, color: '#0A0705', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 0 20px rgba(212,175,55,0.3)', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Finalize Profile →
            </button>
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#4A3A20', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Save &amp; Continue</span>
          </div>
        </div>

      </main>

      {/* ── Stamp Modal ─────────────────────────────────────── */}
      {showModal && (
        <div onClick={handleContinue} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(14,10,5,0.97)', backdropFilter: 'blur(24px)', padding: '44px 36px', textAlign: 'center', boxShadow: '0 40px 120px rgba(0,0,0,0.7)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 72, color: '#D4AF37', fontVariationSettings: "'FILL' 1", display: 'block', marginBottom: 20 }}>stars</span>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#D4AF37', marginBottom: 12 }}>Stamp Earned</h3>
            <p style={{ fontSize: 15, color: '#7A6A50', lineHeight: 1.7, marginBottom: 32 }}>Your Sensory Profile is now mapped. Your CraftHub Passport has been updated with the Taste Profile Completion Stamp.</p>
            <button onClick={handleContinue} style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: GOLD, color: '#0A0705', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Continue Journey
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .smokecraft-grid-6 { grid-template-columns: repeat(3,1fr) !important; }
          .smokecraft-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
