import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../context/GuestSessionContext.jsx'
import { useDemoMode } from '../context/DemoModeContext.jsx'
import { getNextSmokecraftRoute } from '../constants/session.js'

export default function SmokeCraft() {
  const navigate = useNavigate()
  const { session } = useGuestSession()
  const { enterDemoMode } = useDemoMode()
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)

  const hasPreviousSession = (session.completedSteps?.length ?? 0) > 0

  function handleStartNew() {
    navigate('/smokecraft/enroll')
  }

  function handleContinue() {
    navigate(getNextSmokecraftRoute(session.completedSteps))
  }

  function handleEventChallenge() {
    navigate('/smokecraft/leaf-challenge')
  }

  function handleViewPassport() {
    navigate('/passport')
  }

  function handleBrowseHumidor() {
    navigate('/smokecraft/humidor-match')
  }

  function handleDemoExperience() {
    enterDemoMode()
    navigate('/smokecraft/enroll')
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
    <div style={{ minHeight: '100dvh', background: '#050302', color: '#F4ECDA', fontFamily: '"Hanken Grotesk",sans-serif', overflowX: 'hidden', position: 'relative' }}>

      {/* ── Cinematic Lounge Background ──────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }} aria-hidden="true">
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/assets/smokecraft/cropped/management-sync-bg.jpg')",
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          filter: 'brightness(0.5) saturate(1.15) contrast(1.08)',
          transform: 'scale(1.04)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 78% 8%, rgba(212,175,55,0.16), transparent 48%), radial-gradient(ellipse at 10% 92%, rgba(91,143,201,0.12), transparent 46%), linear-gradient(180deg, rgba(5,3,2,0.86) 0%, rgba(5,3,2,0.55) 38%, rgba(5,3,2,0.72) 68%, rgba(5,3,2,0.95) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(120deg, transparent 0%, rgba(255,236,178,0.05) 40%, transparent 60%)',
          mixBlendMode: 'screen',
        }} />
      </div>

      {/* ── Top Bar ───────────────────────────────────────────────── */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(10,7,5,0.75)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 2px 18px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.4)', background: 'linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#E6C76A', letterSpacing: '0.05em', fontFamily: '"JetBrains Mono",monospace' }}>360</span>
          </div>
          <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#E6C76A', letterSpacing: '-0.01em' }}>CraftHub 360</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: 'rgba(244,236,218,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Grand Lounge</span>
          <button className="sc-tactile" onClick={() => navigate('/')} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.35)', overflow: 'hidden', cursor: 'pointer', background: 'rgba(212,175,55,0.08)' }}>
            <img src="/assets/smokecraft/cropped/passport-cover.jpg" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main style={{ position: 'relative', zIndex: 10, maxWidth: 1320, margin: '0 auto', padding: '124px 32px 140px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 64, alignItems: 'center' }} className="smokecraft-grid">

          {/* Left Column */}
          <div className="sc-fade-in" style={{ gridColumn: 'span 1' }}>
            {/* Welcome label */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.32)', background: 'rgba(212,175,55,0.1)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#E6C76A' }}>smoking_rooms</span>
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#E6C76A', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>Welcome to SmokeCraft 360</span>
            </div>

            {/* Headline */}
            <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 700, lineHeight: 1.08, color: '#F4ECDA', letterSpacing: '-0.02em', marginBottom: 20 }}>
              Discover your<br />
              <em style={{ color: '#E6C76A', fontStyle: 'italic' }}>cigar profile.</em>
            </h2>

            {/* Body */}
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(244,236,218,0.65)', maxWidth: 480, marginBottom: 36 }}>
              Your personalized cigar journey starts here. Explore. Learn. Pair. Track every step with craftsmanship and purpose.
            </p>

            {/* CTA Buttons — required entry-gate action set */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <button
                className="sc-tactile"
                onClick={handleStartNew}
                style={{ height: 56, padding: '0 28px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #E9C176, #B8952A)', color: '#1A1207', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 24px rgba(212,175,55,0.32)' }}
              >
                Start New SmokeCraft Session
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
              </button>

              {hasPreviousSession && (
                <button
                  className="sc-tactile"
                  onClick={handleContinue}
                  style={{ height: 56, padding: '0 28px', borderRadius: 10, cursor: 'pointer', background: 'rgba(91,143,201,0.1)', border: '1px solid rgba(123,168,219,0.45)', color: '#9DC2EE', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  Continue Previous Session
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
              {[
                { label: 'Enter Event Challenge', onClick: handleEventChallenge, icon: 'emoji_events' },
                { label: 'View My Passport',       onClick: handleViewPassport,  icon: 'menu_book' },
                { label: 'Browse Humidor',          onClick: handleBrowseHumidor, icon: 'inventory_2' },
                { label: 'Demo Experience',         onClick: handleDemoExperience, icon: 'visibility' },
              ].map(btn => (
                <button
                  key={btn.label}
                  className="sc-tactile"
                  onClick={btn.onClick}
                  style={{ height: 48, padding: '0 20px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.32)', color: '#E6C76A', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{btn.icon}</span>
                  {btn.label}
                </button>
              ))}
              <button
                className="sc-tactile"
                onClick={() => setHowItWorksOpen(true)}
                style={{ height: 48, padding: '0 20px', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(212,175,55,0.22)', color: 'rgba(230,199,106,0.8)', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                How It Works
              </button>
            </div>

            {/* Hint row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 440 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#E6C76A' }}>star</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(244,236,218,0.55)', lineHeight: 1.6 }}>
                Begin your guided cigar profile, earn passport stamps, and unlock personalized pairings.
              </p>
            </div>
          </div>

          {/* Right Column — Cards */}
          <div className="sc-fade-in" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* 360 Passport Card */}
            <div
              className="sc-card-tactile"
              onClick={() => navigate('/passport')}
              style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, border: '1px solid rgba(212,175,55,0.28)', background: 'linear-gradient(150deg, rgba(36,24,12,0.92), rgba(14,9,5,0.94))', cursor: 'pointer', boxShadow: '0 14px 38px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,236,178,0.06)' }}
            >
              <div style={{ display: 'flex', gap: 0 }}>
                {/* Passport book visual */}
                <div style={{ width: 184, flexShrink: 0, background: 'radial-gradient(circle at 50% 30%, rgba(212,175,55,0.22), transparent 45%), linear-gradient(160deg, #3D2B1A, #1E1208)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 188, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.018) 0px,rgba(255,255,255,0.018) 1px,transparent 1px,transparent 8px)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', width: 162, height: 162, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.1)', boxShadow: 'inset 0 0 34px rgba(212,175,55,0.09)' }} />
                  <img
                    src="/assets/smokecraft/cropped/passport-cover.jpg"
                    alt="360 Passport"
                    style={{ position: 'relative', width: 128, height: 168, objectFit: 'cover', objectPosition: 'top', borderRadius: 9, border: '1px solid rgba(212,175,55,0.42)', boxShadow: '14px 18px 24px rgba(0,0,0,0.62)', transform: 'rotate(-5deg)' }}
                  />
                </div>

                {/* Card text */}
                <div style={{ flex: 1, padding: '26px 26px 22px' }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#E6C76A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>360 Passport</div>
                  <p style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.35, color: '#F4ECDA', marginBottom: 16 }}>
                    Build your passport, collect stamps, and track your journey.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#E6C76A', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>View Passport</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                    {Array.from({ length: 4 }, (_, i) => (
                      <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${i < (session.smokecraftStamps?.length ?? 0) ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.2)'}`, background: i < (session.smokecraftStamps?.length ?? 0) ? 'rgba(212,175,55,0.18)' : 'transparent', boxShadow: i < (session.smokecraftStamps?.length ?? 0) ? '0 0 12px rgba(212,175,55,0.25)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: i < (session.smokecraftStamps?.length ?? 0) ? '#E6C76A' : 'rgba(244,236,218,0.4)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Pairing Card */}
            <div
              className="sc-card-tactile"
              onClick={() => navigate('/smokecraft/pairing')}
              style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, border: '1px solid rgba(212,175,55,0.28)', background: 'linear-gradient(150deg, rgba(36,24,12,0.92), rgba(14,9,5,0.94))', cursor: 'pointer', boxShadow: '0 14px 38px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,236,178,0.06)' }}
            >
              <div style={{ padding: '24px 26px' }}>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#E6C76A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>Recommended Pairing</div>
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  <div style={{ width: 168, height: 152, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.28)', flexShrink: 0, boxShadow: '0 8px 22px rgba(0,0,0,0.45)' }}>
                    <img
                      src="/assets/smokecraft/cropped/flavor-dna-bg.jpg"
                      alt="Padrón 1964"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#F4ECDA', marginBottom: 5, lineHeight: 1.2 }}>Padrón 1964 Anniversary</h4>
                    <p style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(244,236,218,0.5)', letterSpacing: '0.08em', marginBottom: 10 }}>Maduro · Nicaragua</p>
                    <p style={{ fontSize: 13, color: 'rgba(244,236,218,0.62)', lineHeight: 1.55, marginBottom: 16 }}>Rich cocoa, espresso, and dark fruit with a long, velvety finish.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#E6C76A' }}>
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

      {/* ── Bottom Control Dock ───────────────────────────────────── */}
      <nav className="smokecraft-bottom-nav" style={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 50, height: 84, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', background: 'rgba(20,14,8,0.72)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 20, boxShadow: '0 12px 36px rgba(0,0,0,0.5)' }}>
        {bottomNav.map(item => (
          <button
            key={item.label}
            className="smokecraft-bottom-nav-item sc-tactile"
            onClick={() => navigate(item.to)}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              background: item.active ? 'rgba(212,175,55,0.14)' : 'transparent',
              border: 'none',
              borderRadius: 14,
              cursor: 'pointer',
              padding: '0 16px',
              transition: 'background 0.2s ease',
            }}
          >
            {/* Icon */}
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid ${item.active ? 'rgba(212,175,55,0.5)' : 'rgba(212,175,55,0.16)'}`, background: item.active ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: item.active ? '#E6C76A' : 'rgba(244,236,218,0.5)' }}>{item.icon}</span>
            </div>
            {/* Label */}
            <div className="smokecraft-bottom-nav-copy" style={{ textAlign: 'left', minWidth: 0 }}>
              <div className="smokecraft-bottom-nav-label" style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: item.active ? '#E6C76A' : 'rgba(244,236,218,0.55)', marginBottom: 2, whiteSpace: 'nowrap' }}>{item.label}</div>
              <div className="smokecraft-bottom-nav-sub" style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 10, color: item.active ? 'rgba(244,236,218,0.55)' : 'rgba(244,236,218,0.35)', whiteSpace: 'nowrap' }}>{item.sub}</div>
            </div>
          </button>
        ))}
      </nav>

      {/* ── How It Works Modal ──────────────────────────────────────── */}
      {howItWorksOpen && (
        <div
          onClick={() => setHowItWorksOpen(false)}
          className="smokecraft-how-overlay"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="smokecraft-how-modal"
          >
            <div className="smokecraft-how-atmosphere" aria-hidden="true" />
            <button
              className="smokecraft-how-close"
              onClick={() => setHowItWorksOpen(false)}
              aria-label="Close How It Works"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <header className="smokecraft-how-header">
              <div className="smokecraft-how-feather" aria-hidden="true">
                <span className="material-symbols-outlined">eco</span>
              </div>
              <h3>How It Works</h3>
            </header>

            {[
              {
                num: '01',
                title: 'Enroll & Discover',
                desc: 'Answer a few guided questions about your palate. We build your personal cigar profile from your preferences.',
                image: '/assets/smokecraft/cropped/passport-cover.jpg',
                icon: 'assignment',
              },
              {
                num: '02',
                title: 'Learn the Craft',
                desc: 'Explore origins, tobacco leaves, vitola shapes, and the art of blending through interactive modules.',
                image: '/assets/smokecraft/cropped/cut-toast-light-bg.jpg',
                icon: 'school',
              },
              {
                num: '03',
                title: 'Earn Passport Stamps',
                desc: 'Complete each chapter to stamp your 360 Passport. Stamps unlock exclusive pairings and member benefits.',
                image: '/assets/smokecraft/cropped/passport-stamp-bg.jpg',
                icon: 'workspace_premium',
              },
              {
                num: '04',
                title: 'Unlock Your Pairing',
                desc: 'Your profile generates a personalized cigar and spirit pairing, curated to your flavour DNA.',
                image: '/assets/smokecraft/cropped/management-sync-bg.jpg',
                icon: 'local_bar',
              },
            ].map(step => (
              <article key={step.num} className="smokecraft-how-step">
                <div className="smokecraft-how-image">
                  <img src={step.image} alt="" />
                  <span className="material-symbols-outlined">{step.icon}</span>
                </div>
                <div className="smokecraft-how-step-copy">
                  <div className="smokecraft-how-step-kicker">
                    <strong>{Number(step.num)}</strong>
                    <span>Step {step.num}</span>
                  </div>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </article>
            ))}

            <button
              onClick={() => { setHowItWorksOpen(false); navigate('/smokecraft/enroll') }}
              className="smokecraft-how-start"
            >
              <span>Start SmokeCraft</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            <div className="smokecraft-how-mark" aria-hidden="true">SC</div>
          </div>
        </div>
      )}

      {/* Desktop grid responsive style */}
      <style>{`
        .smokecraft-how-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          min-height: 100dvh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 20px 18px 28px;
          overflow-y: auto;
          background:
            radial-gradient(ellipse at 50% 12%, rgba(212,175,55,0.16), transparent 34%),
            radial-gradient(ellipse at 16% 45%, rgba(255,255,255,0.08), transparent 24%),
            rgba(0,0,0,0.88);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
        }
        .smokecraft-how-modal {
          position: relative;
          width: min(640px, 100%);
          min-height: min-content;
          border-radius: 28px;
          border: 1.5px solid rgba(233,193,118,0.82);
          padding: 28px 40px 28px;
          overflow: hidden;
          color: #f4ead7;
          background:
            linear-gradient(180deg, rgba(16,14,13,0.96), rgba(8,5,3,0.98)),
            url('/assets/smokecraft/cropped/management-sync-bg.jpg');
          background-size: cover;
          background-position: center;
          box-shadow:
            0 0 0 1px rgba(255,246,216,0.08),
            0 0 42px rgba(233,193,118,0.3),
            0 32px 110px rgba(0,0,0,0.78),
            inset 0 0 70px rgba(233,193,118,0.08);
        }
        .smokecraft-how-modal::before,
        .smokecraft-how-modal::after,
        .smokecraft-how-atmosphere {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .smokecraft-how-modal::before {
          background:
            radial-gradient(ellipse at 50% 6%, rgba(255,226,150,0.22), transparent 34%),
            radial-gradient(ellipse at 50% 78%, rgba(233,193,118,0.13), transparent 32%),
            linear-gradient(90deg, rgba(0,0,0,0.38), transparent 26%, transparent 72%, rgba(0,0,0,0.34));
          z-index: 0;
        }
        .smokecraft-how-modal::after {
          z-index: 0;
          border-radius: inherit;
          box-shadow: inset 0 0 30px rgba(255,233,166,0.11), inset 0 -70px 80px rgba(0,0,0,0.42);
        }
        .smokecraft-how-atmosphere {
          z-index: 0;
          background:
            radial-gradient(ellipse at 4% 32%, rgba(255,255,255,0.15), transparent 30%),
            radial-gradient(ellipse at 92% 40%, rgba(255,255,255,0.12), transparent 28%),
            radial-gradient(ellipse at 18% 92%, rgba(255,255,255,0.11), transparent 28%);
          filter: blur(18px);
          mix-blend-mode: screen;
          opacity: 0.86;
        }
        .smokecraft-how-header,
        .smokecraft-how-step,
        .smokecraft-how-start,
        .smokecraft-how-close,
        .smokecraft-how-mark {
          position: relative;
          z-index: 1;
        }
        .smokecraft-how-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 48px;
          height: 48px;
          border-radius: 999px;
          border: 1.5px solid rgba(233,193,118,0.72);
          color: #e9c176;
          background: rgba(0,0,0,0.28);
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(233,193,118,0.12);
        }
        .smokecraft-how-header {
          text-align: center;
          padding: 0 54px 18px;
        }
        .smokecraft-how-feather {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          color: #f3cb72;
          margin-bottom: 2px;
        }
        .smokecraft-how-feather::before,
        .smokecraft-how-feather::after {
          content: "";
          width: 64px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(233,193,118,0.48), transparent);
        }
        .smokecraft-how-feather .material-symbols-outlined {
          font-size: 34px;
          transform: rotate(-24deg);
          filter: drop-shadow(0 0 12px rgba(233,193,118,0.5));
        }
        .smokecraft-how-header h3 {
          margin: 0;
          font-family: "Playfair Display", serif;
          font-size: clamp(48px, 7vw, 72px);
          line-height: 1;
          color: #f7d88a;
          letter-spacing: 0;
          text-shadow:
            0 0 8px rgba(255,236,178,0.68),
            0 0 28px rgba(233,193,118,0.42),
            0 6px 18px rgba(0,0,0,0.82);
        }
        .smokecraft-how-header h3::after {
          content: "";
          display: block;
          width: 150px;
          height: 13px;
          margin: 4px auto 0;
          background:
            radial-gradient(circle, rgba(255,226,150,0.85) 0 2px, transparent 3px),
            linear-gradient(90deg, transparent, rgba(233,193,118,0.5), transparent);
          background-repeat: no-repeat;
          background-position: center;
        }
        .smokecraft-how-step {
          min-height: 130px;
          margin-bottom: 12px;
          padding: 12px 18px 12px 12px;
          border: 1px solid rgba(233,193,118,0.36);
          border-radius: 16px;
          display: grid;
          grid-template-columns: 116px minmax(0, 1fr);
          gap: 18px;
          align-items: center;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 20% 50%, rgba(233,193,118,0.16), transparent 36%),
            linear-gradient(135deg, rgba(255,255,255,0.07), rgba(13,9,5,0.72));
          box-shadow: 0 0 22px rgba(233,193,118,0.12), inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .smokecraft-how-step::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 88% 32%, rgba(255,255,255,0.08), transparent 28%),
            linear-gradient(90deg, transparent, rgba(233,193,118,0.04), transparent);
        }
        .smokecraft-how-image {
          position: relative;
          width: 104px;
          height: 104px;
          border-radius: 999px;
          border: 1.5px solid rgba(233,193,118,0.68);
          overflow: hidden;
          box-shadow: 0 0 26px rgba(233,193,118,0.24), inset 0 0 20px rgba(0,0,0,0.58);
        }
        .smokecraft-how-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(0.95) contrast(1.08) brightness(0.74);
        }
        .smokecraft-how-image::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 36% 24%, rgba(255,230,170,0.2), transparent 32%), linear-gradient(180deg, transparent, rgba(0,0,0,0.42));
        }
        .smokecraft-how-image .material-symbols-outlined {
          position: absolute;
          right: 9px;
          bottom: 8px;
          z-index: 1;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: #130905;
          background: linear-gradient(135deg, #e9c176, #fff0aa 48%, #b98527);
          font-size: 17px;
        }
        .smokecraft-how-step-kicker {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 4px;
        }
        .smokecraft-how-step-kicker strong {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          border: 1px solid rgba(233,193,118,0.72);
          display: grid;
          place-items: center;
          color: #f7d88a;
          font-family: "Playfair Display", serif;
          font-size: 22px;
          line-height: 1;
          box-shadow: 0 0 16px rgba(233,193,118,0.25);
        }
        .smokecraft-how-step-kicker span {
          color: #e9c176;
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }
        .smokecraft-how-step h4 {
          margin: 0 0 4px;
          color: #f8eee1;
          font-family: "Playfair Display", serif;
          font-size: 26px;
          line-height: 1.08;
          text-shadow: 0 3px 16px rgba(0,0,0,0.72);
        }
        .smokecraft-how-step p {
          margin: 0;
          color: rgba(248,238,225,0.72);
          font-size: 13px;
          line-height: 1.48;
        }
        .smokecraft-how-start {
          width: 100%;
          min-height: 68px;
          margin-top: 14px;
          border: 1px solid rgba(255,236,180,0.78);
          border-radius: 14px;
          color: #130905;
          background:
            linear-gradient(180deg, rgba(255,242,191,0.95), rgba(217,145,37,0.94) 55%, rgba(163,86,15,0.95)),
            radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.5), transparent 48%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          cursor: pointer;
          font-family: "JetBrains Mono", monospace;
          font-size: 15px;
          font-weight: 950;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          box-shadow: 0 0 38px rgba(233,193,118,0.48), inset 0 2px 0 rgba(255,255,255,0.48), inset 0 -3px 10px rgba(88,34,0,0.34);
        }
        .smokecraft-how-start:active,
        .smokecraft-how-close:active {
          transform: scale(0.97);
        }
        .smokecraft-how-start .material-symbols-outlined {
          font-size: 22px;
          letter-spacing: 0;
        }
        .smokecraft-how-mark {
          width: 46px;
          height: 30px;
          margin: 13px auto 0;
          color: rgba(233,193,118,0.62);
          font-family: "Playfair Display", serif;
          font-size: 15px;
          display: grid;
          place-items: center;
          text-shadow: 0 0 14px rgba(233,193,118,0.36);
        }
        @media (min-width: 1024px) {
          .smokecraft-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 760px) {
          .smokecraft-how-overlay {
            padding: 12px;
          }
          .smokecraft-how-modal {
            border-radius: 22px;
            padding: 24px 18px 22px;
          }
          .smokecraft-how-close {
            width: 42px;
            height: 42px;
            top: 14px;
            right: 14px;
          }
          .smokecraft-how-header {
            padding: 6px 40px 14px;
          }
          .smokecraft-how-feather::before,
          .smokecraft-how-feather::after {
            width: 42px;
          }
          .smokecraft-how-step {
            grid-template-columns: 82px minmax(0, 1fr);
            gap: 12px;
            min-height: 112px;
            padding: 10px;
          }
          .smokecraft-how-image {
            width: 78px;
            height: 78px;
          }
          .smokecraft-how-step h4 {
            font-size: 21px;
          }
          .smokecraft-how-step p {
            font-size: 12px;
            line-height: 1.38;
          }
          .smokecraft-how-start {
            min-height: 62px;
            font-size: 12px;
            letter-spacing: 0.2em;
            gap: 10px;
          }
        }
        @media (max-width: 760px) {
          .smokecraft-bottom-nav {
            height: 72px !important;
            bottom: 10px !important;
            left: 10px !important;
            right: 10px !important;
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
          .smokecraft-bottom-nav-sub {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
