import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../context/GuestSessionContext.jsx'
import { getNextSmokecraftRoute, getLastSmokecraftRoute } from '../constants/session.js'

function PassportCoverVisual() {
  return (
    <div style={{ position: 'relative', width: 112, height: 138, transform: 'rotate(-5deg)', filter: 'drop-shadow(14px 18px 24px rgba(0,0,0,0.62))' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 9, background: 'linear-gradient(145deg, #201106 0%, #4A2A10 42%, #120905 100%)', border: '1px solid rgba(212,175,55,0.42)', overflow: 'hidden', boxShadow: 'inset 8px 0 16px rgba(0,0,0,0.46), inset -1px 0 0 rgba(255,230,168,0.18)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.055) 0 1px, transparent 1px 9px), repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 5px)', opacity: 0.38 }} />
        <div style={{ position: 'absolute', inset: 8, borderRadius: 6, border: '1px solid rgba(212,175,55,0.34)' }} />
        <div style={{ position: 'absolute', left: 13, top: 10, bottom: 10, width: 7, borderRadius: 5, background: 'linear-gradient(180deg, rgba(255,225,150,0.52), rgba(104,62,18,0.18))', boxShadow: '2px 0 7px rgba(0,0,0,0.38)' }} />
        <div style={{ position: 'absolute', left: 26, right: 14, top: 20, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.72), transparent)' }} />
        <div style={{ position: 'absolute', left: 30, right: 18, top: 33, textAlign: 'center', fontFamily: '"JetBrains Mono",monospace', fontSize: 8, lineHeight: 1.35, fontWeight: 900, letterSpacing: '0.14em', color: '#E6C76A', textShadow: '0 0 12px rgba(212,175,55,0.35)' }}>
          360<br />PASSPORT
        </div>
        <div style={{ position: 'absolute', left: 42, top: 66, width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(230,199,106,0.68)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(212,175,55,0.18), rgba(212,175,55,0.04) 62%, transparent)', boxShadow: '0 0 22px rgba(212,175,55,0.18)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 23, color: '#E6C76A', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>public</span>
        </div>
        <div style={{ position: 'absolute', left: 35, right: 23, top: 59, height: 52, borderTop: '1px solid rgba(212,175,55,0.22)', borderBottom: '1px solid rgba(212,175,55,0.22)', opacity: 0.78 }} />
        <div style={{ position: 'absolute', left: 28, right: 16, bottom: 21, display: 'flex', justifyContent: 'center', gap: 4 }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.42)', background: i === 0 ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.07)' }} />
          ))}
        </div>
        <div style={{ position: 'absolute', left: 30, right: 18, bottom: 10, textAlign: 'center', fontFamily: '"JetBrains Mono",monospace', fontSize: 5.5, letterSpacing: '0.18em', color: 'rgba(230,199,106,0.58)', textTransform: 'uppercase' }}>
          Member Journey
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, transparent 0%, rgba(255,236,178,0.16) 42%, transparent 58%)', mixBlendMode: 'screen' }} />
      </div>
      <div style={{ position: 'absolute', left: 11, right: -6, bottom: -6, height: 9, borderRadius: '0 0 7px 7px', background: 'linear-gradient(90deg, rgba(246,227,178,0.52), rgba(126,92,45,0.28))', transform: 'skewX(-18deg)', opacity: 0.86 }} />
    </div>
  )
}

export default function SmokeCraft() {
  const navigate = useNavigate()
  const { session } = useGuestSession()
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)

  function handleStart() {
    navigate(getNextSmokecraftRoute(session.completedSteps))
  }

  const bottomNav = [
    {
      icon: 'smoking_rooms',
      iconType: 'material',
      label: 'SMOKECRAFT',
      sub: 'Current journey.',
      to: '/smokecraft',
      active: true,
    },
    {
      icon: 'emoji_events',
      iconType: 'material',
      label: 'REWARDS',
      sub: 'Earn. Unlock. Enjoy.',
      to: '/smokecraft/leaderboard',
      active: false,
    },
    {
      icon: 'menu_book',
      iconType: 'material',
      label: 'PASSPORT',
      sub: 'Track your journey.',
      to: '/passport',
      active: true,
    },
    {
      icon: 'smoking_rooms',
      iconType: 'material',
      label: 'CRAFTHUB',
      sub: 'Module grid.',
      to: '/crafthub',
      active: false,
    },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(180deg, #080503 0%, #0A0705 46%, #050302 100%)', color: '#E5E2E1', fontFamily: '"Hanken Grotesk",sans-serif', overflowX: 'hidden', position: 'relative' }}>

      {/* ── Single cinematic hero background ─────────────────────── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 720, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <img
          src="/smokecraft-hero.png"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block', opacity: 0.54 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(8,5,2,0.92) 0%, rgba(8,5,2,0.72) 45%, rgba(8,5,2,0.9) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,5,2,0.16) 0%, rgba(10,7,5,0.78) 72%, #0A0705 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 24% 42%, rgba(212,175,55,0.12) 0%, transparent 48%)' }} />
      </div>

      {/* ── Top Bar ───────────────────────────────────────────────── */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(10,7,5,0.75)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#D4AF37', letterSpacing: '0.05em', fontFamily: '"JetBrains Mono",monospace' }}>360</span>
          </div>
          <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#D4AF37', letterSpacing: '-0.01em' }}>CraftHub 360</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#A89B86', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Grand Lounge</span>
          <button onClick={() => navigate('/')} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.25)', overflow: 'hidden', cursor: 'pointer', background: 'rgba(212,175,55,0.08)' }}>
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main style={{ position: 'relative', zIndex: 10, paddingTop: 100, paddingBottom: 140, maxWidth: 1280, margin: '0 auto', padding: '100px 32px 140px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48, alignItems: 'center' }} className="smokecraft-grid">

          {/* Left Column */}
          <div style={{ gridColumn: 'span 1' }}>
            {/* Welcome label */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.08)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#D4AF37' }}>smoking_rooms</span>
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>Welcome to SmokeCraft 360</span>
            </div>

            {/* Headline */}
            <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 700, lineHeight: 1.08, color: '#EDE8DF', letterSpacing: '-0.02em', marginBottom: 20 }}>
              Discover your<br />
              <em style={{ color: '#D4AF37', fontStyle: 'italic' }}>cigar profile.</em>
            </h2>

            {/* Body */}
            <p style={{ fontSize: 16, lineHeight: 1.7, color: '#A89B86', maxWidth: 480, marginBottom: 36 }}>
              Your personalized cigar journey starts here. Explore. Learn. Pair. Track every step with craftsmanship and purpose.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 32 }}>
              <button
                onClick={handleStart}
                style={{ height: 56, padding: '0 28px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #D4AF37, #B8952A)', color: '#0A0705', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 0 28px rgba(212,175,55,0.35)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Start SmokeCraft
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
              </button>

              <button
                onClick={() => setHowItWorksOpen(true)}
                style={{ height: 56, padding: '0 28px', borderRadius: 8, cursor: 'pointer', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.12)'; e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.06)'; e.currentTarget.style.transform = 'scale(1)' }}
              >
                How It Works
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
              </button>
            </div>

            {/* Hint row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 440 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#D4AF37' }}>star</span>
              </div>
              <p style={{ fontSize: 13, color: '#7A7060', lineHeight: 1.6 }}>
                Begin your guided cigar profile, earn passport stamps, and unlock personalized pairings.
              </p>
            </div>
          </div>

          {/* Right Column — Cards */}
          <div style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* 360 Passport Card */}
            <div
              onClick={() => navigate('/passport')}
              style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, border: '1px solid rgba(212,175,55,0.18)', background: 'rgba(18,12,6,0.82)', backdropFilter: 'blur(20px)', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.18)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ display: 'flex', gap: 0 }}>
                {/* Passport book visual */}
                <div style={{ width: 160, flexShrink: 0, background: 'radial-gradient(circle at 50% 30%, rgba(212,175,55,0.18), transparent 45%), linear-gradient(160deg, #3D2B1A, #1E1208)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.018) 0px,rgba(255,255,255,0.018) 1px,transparent 1px,transparent 8px)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', width: 142, height: 142, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.08)', boxShadow: 'inset 0 0 34px rgba(212,175,55,0.07)' }} />
                  <PassportCoverVisual />
                </div>

                {/* Card text */}
                <div style={{ flex: 1, padding: '24px 24px 20px' }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>360 Passport</div>
                  <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.35, color: '#EDE8DF', marginBottom: 16 }}>
                    Build your passport, collect stamps, and track your journey.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D4AF37', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>View Passport</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                    {Array.from({ length: 4 }, (_, i) => (
                      <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${i < session.smokecraftStamps.length ? 'rgba(212,175,55,0.6)' : 'rgba(122,100,60,0.3)'}`, background: i < session.smokecraftStamps.length ? 'rgba(212,175,55,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: i < session.smokecraftStamps.length ? '#D4AF37' : '#5A4A30' }}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Pairing Card */}
            <div
              onClick={() => navigate('/smokecraft/pairing')}
              style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, border: '1px solid rgba(212,175,55,0.18)', background: 'rgba(18,12,6,0.82)', backdropFilter: 'blur(20px)', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.18)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ padding: '20px 24px' }}>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>Recommended Pairing</div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{ width: 100, height: 80, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.2)', flexShrink: 0 }}>
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBjb17tZGWhWOsbXW8XcEiR4WIW8SRdSpM3JbzTootwik0rNdnLOw7S9JZ3EXsRrWIwqWrDXTd8Pvkve7yk0Djguo_fc3IWZ5D9c7ECY5EDcu6g5JsWk0HLo-pS1P0Sp_kNEtMoJ7_UWd-u_nKBePg_hyVmOWBd7C9H9b16E7bHFZlxdXVSBDqmCktK_b7wsck7DeYbjNOVSSREGTNzZg89N6q8Zqmzw_ubYO5Nur2k8euqiBLwOh-CQCTEjFfzzYA0LEgqcCTY6g"
                      alt="Padrón 1964"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#EDE8DF', marginBottom: 4, lineHeight: 1.2 }}>Padrón 1964 Anniversary</h4>
                    <p style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A6A50', letterSpacing: '0.08em', marginBottom: 8 }}>Maduro · Nicaragua</p>
                    <p style={{ fontSize: 12, color: '#8A7A66', lineHeight: 1.5, marginBottom: 14 }}>Rich cocoa, espresso, and dark fruit with a long, velvety finish.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D4AF37' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>smoking_rooms</span>
                      <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>View Pairing</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── Bottom Nav Bar ─────────────────────────────────────────── */}
      <nav className="smokecraft-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, height: 100, display: 'flex', alignItems: 'center', background: 'rgba(10,7,5,0.92)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(212,175,55,0.12)' }}>
        {bottomNav.map((item, i) => (
          <button
            key={item.label}
            className="smokecraft-bottom-nav-item"
            onClick={() => navigate(item.to)}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              background: item.active ? 'rgba(212,175,55,0.1)' : 'transparent',
              border: 'none',
              borderRight: i < bottomNav.length - 1 ? '1px solid rgba(212,175,55,0.08)' : 'none',
              borderTop: item.active ? '2px solid rgba(212,175,55,0.6)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              padding: '0 20px',
            }}
            onMouseEnter={e => { if (!item.active) e.currentTarget.style.background = 'rgba(212,175,55,0.05)' }}
            onMouseLeave={e => { if (!item.active) e.currentTarget.style.background = 'transparent' }}
          >
            {/* Icon */}
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: `1px solid ${item.active ? 'rgba(212,175,55,0.5)' : 'rgba(212,175,55,0.2)'}`, background: item.active ? 'rgba(212,175,55,0.18)' : 'rgba(212,175,55,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {item.iconType === 'material'
                ? <span className="material-symbols-outlined" style={{ fontSize: 22, color: item.active ? '#D4AF37' : '#6A5A40' }}>{item.icon}</span>
                : <img src={item.icon} alt="" style={{ width: 22, height: 22, objectFit: 'cover', borderRadius: '50%', filter: item.active ? 'none' : 'brightness(0.4) sepia(1) hue-rotate(5deg)' }} />
              }
            </div>
            {/* Label */}
            <div className="smokecraft-bottom-nav-copy" style={{ textAlign: 'left', minWidth: 0 }}>
              <div className="smokecraft-bottom-nav-label" style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: item.active ? '#D4AF37' : '#5A4A30', marginBottom: 3, whiteSpace: 'nowrap' }}>{item.label}</div>
              <div className="smokecraft-bottom-nav-sub" style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 11, color: item.active ? '#A89B86' : '#3A3020', whiteSpace: 'nowrap' }}>{item.sub}</div>
            </div>
            {/* Arrow */}
            <span className="material-symbols-outlined smokecraft-bottom-nav-arrow" style={{ fontSize: 16, color: item.active ? '#D4AF37' : '#3A3020', marginLeft: 4, flexShrink: 0 }}>chevron_right</span>
          </button>
        ))}
      </nav>

      {/* ── How It Works Modal ──────────────────────────────────────── */}
      {howItWorksOpen && (
        <div
          onClick={() => setHowItWorksOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 520, borderRadius: 20, border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(14,10,5,0.97)', backdropFilter: 'blur(24px)', padding: '36px 32px', boxShadow: '0 40px 120px rgba(0,0,0,0.7)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#D4AF37' }}>How It Works</h3>
              <button onClick={() => setHowItWorksOpen(false)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(122,100,60,0.4)', background: 'rgba(122,100,60,0.1)', color: '#7A6A50', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {[
              { num: '01', title: 'Enroll & Discover', desc: 'Answer a few guided questions about your palate. We build your personal cigar profile from your preferences.', icon: 'person_search' },
              { num: '02', title: 'Learn the Craft',   desc: 'Explore origins, tobacco leaves, vitola shapes, and the art of blending through interactive modules.', icon: 'school' },
              { num: '03', title: 'Earn Passport Stamps', desc: 'Complete each chapter to stamp your 360 Passport. Stamps unlock exclusive pairings and member benefits.', icon: 'menu_book' },
              { num: '04', title: 'Unlock Your Pairing', desc: 'Your profile generates a personalized cigar and spirit pairing, curated to your flavour DNA.', icon: 'local_bar' },
            ].map(step => (
              <div key={step.num} style={{ display: 'flex', gap: 18, marginBottom: 22, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#D4AF37' }}>{step.icon}</span>
                </div>
                <div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(212,175,55,0.6)', letterSpacing: '0.2em', marginBottom: 4 }}>STEP {step.num}</div>
                  <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#EDE8DF', marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: '#7A6A50', lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}

            <button
              onClick={() => { setHowItWorksOpen(false); handleStart() }}
              style={{ width: '100%', height: 52, marginTop: 8, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #D4AF37, #B8952A)', color: '#0A0705', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', boxShadow: '0 0 24px rgba(212,175,55,0.3)' }}
            >
              Start SmokeCraft →
            </button>
          </div>
        </div>
      )}

      {/* Desktop grid responsive style */}
      <style>{`
        @media (min-width: 1024px) {
          .smokecraft-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 760px) {
          .smokecraft-bottom-nav {
            height: 82px !important;
          }
          .smokecraft-bottom-nav-item {
            flex-direction: column !important;
            gap: 5px !important;
            padding: 8px 6px !important;
          }
          .smokecraft-bottom-nav-copy {
            text-align: center !important;
          }
          .smokecraft-bottom-nav-label {
            font-size: 8px !important;
            letter-spacing: 0.08em !important;
          }
          .smokecraft-bottom-nav-sub,
          .smokecraft-bottom-nav-arrow {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
