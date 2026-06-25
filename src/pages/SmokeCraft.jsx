import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../context/GuestSessionContext.jsx'
import { getNextSmokecraftRoute } from '../constants/session.js'
import { triggerHaptic } from '../utils/haptics.js'
import { getVenueHomeContent } from '../data/venueHomeContent.js'

export default function SmokeCraft() {
  const navigate = useNavigate()
  const { session } = useGuestSession()

  const completedSteps     = session.completedSteps ?? []
  const hasPreviousSession = completedSteps.length > 0
  const stampCount         = session.passport?.earnedStamps?.length ?? session.smokecraftStamps?.length ?? 0
  const badgeCount         = session.badges?.length ?? 0
  const mentorCount        = session.mentors?.length ?? 0
  const isReturningUser    = hasPreviousSession || stampCount > 0 || badgeCount > 0

  const venueContent = getVenueHomeContent(session.venueId)
  const pairingSlide = venueContent?.heroRotator?.find(slide => slide.id === 'pairing')

  function handleHowItWorks() {
    navigate('/smokecraft/how-it-works')
  }

  function handleEnterChallenge() {
    navigate('/smokecraft/challenge')
  }

  function handleStartSession() {
    triggerHaptic('medium')
    navigate('/smokecraft/enroll')
  }

  function handleContinue() {
    navigate(getNextSmokecraftRoute(session.completedSteps))
  }

  function handleSignIn() {
    navigate('/signin')
  }

  function handleBrowseHumidor() {
    navigate('/smokecraft/humidor')
  }

  function handleGuestPass() {
    navigate('/smokecraft/guest-pass')
  }

  function handleDemoExperience() {
    navigate('/smokecraft/demo')
  }

  function handleViewPassport() {
    navigate('/smokecraft/passport')
  }

  function handleScanQR() {
    navigate('/smokecraft/scan')
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

      {/* ── Ambient Lounge Background — the approved PROFILE DISCOVER 11.png scene, full-bleed, visible ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }} aria-hidden="true">
        <img
          src="/PROFILE DISCOVER 11.png"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(100deg, rgba(5,3,2,0.92) 0%, rgba(5,3,2,0.74) 32%, rgba(5,3,2,0.32) 58%, rgba(5,3,2,0.46) 100%)',
        }} />
      </div>

      {/* ── Top Bar ───────────────────────────────────────────────── */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(10,7,5,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 2px 18px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.4)', background: 'linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#E6C76A', letterSpacing: '0.05em', fontFamily: '"JetBrains Mono",monospace' }}>SC</span>
          </div>
          <div>
            <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 19, fontWeight: 700, color: '#E6C76A', letterSpacing: '-0.01em', lineHeight: 1.1 }}>SmokeCraft</div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(244,236,218,0.5)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>Crafted Experiences</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(244,236,218,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {stampCount} stamp{stampCount === 1 ? '' : 's'} · {badgeCount} badge{badgeCount === 1 ? '' : 's'} · {mentorCount} mentor{mentorCount === 1 ? '' : 's'}
          </span>
          <button className="sc-tactile" onClick={() => navigate('/')} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.35)', overflow: 'hidden', cursor: 'pointer', background: 'rgba(212,175,55,0.08)' }}>
            <img src="/assets/smokecraft/cropped/passport-cover.jpg" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main style={{ position: 'relative', zIndex: 10, maxWidth: 1320, margin: '0 auto', padding: '124px 32px 180px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 64, alignItems: 'start' }} className="smokecraft-grid">

          {/* Left Column */}
          <div className="sc-fade-in smokecraft-left-col" style={{ gridColumn: 'span 1' }}>
            {/* Welcome label */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.32)', background: 'rgba(212,175,55,0.1)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#E6C76A' }}>smoking_rooms</span>
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#E6C76A', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
                {isReturningUser ? 'Welcome back to SmokeCraft 360' : 'Welcome to SmokeCraft 360'}
              </span>
            </div>

            {/* Headline */}
            <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(34px, 5vw, 58px)', fontWeight: 700, lineHeight: 1.08, color: '#F4ECDA', letterSpacing: '-0.02em', marginBottom: 14 }}>
              Discover your<br />
              <em style={{ color: '#E6C76A', fontStyle: 'italic' }}>cigar profile.</em>
            </h2>

            {/* Body */}
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(244,236,218,0.65)', maxWidth: 440, marginBottom: 24 }}>
              Your personalized cigar journey starts here. Explore. Learn. Pair. Track every step with craftsmanship and purpose.
            </p>

            {/* ── Stepped action journey ──────────────────────────── */}

            {/* Top row: How It Works, Enter Challenge */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <button
                className="sc-tactile"
                onClick={handleHowItWorks}
                style={{ height: 50, padding: '0 22px', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(212,175,55,0.32)', color: '#E6C76A', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>menu_book</span>
                How It Works
              </button>
              <button
                className="sc-tactile"
                onClick={handleEnterChallenge}
                style={{ height: 50, padding: '0 22px', borderRadius: 10, cursor: 'pointer', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.32)', color: '#E6C76A', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>emoji_events</span>
                Enter Challenge
              </button>
            </div>

            {/* Main row: strongest CTA */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <button
                className="sc-tactile"
                onClick={handleStartSession}
                style={{ height: 60, padding: '0 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #E9C176, #B8952A)', color: '#1A1207', fontFamily: '"JetBrains Mono",monospace', fontSize: 13, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 28px rgba(212,175,55,0.38)' }}
              >
                Start Your SmokeCraft Session
                <span className="material-symbols-outlined" style={{ fontSize: 19 }}>chevron_right</span>
              </button>

              {hasPreviousSession && (
                <button
                  className="sc-tactile"
                  onClick={handleContinue}
                  style={{ height: 60, padding: '0 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(91,143,201,0.1)', border: '1px solid rgba(123,168,219,0.45)', color: '#9DC2EE', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  Continue Previous Session
                </button>
              )}
            </div>

            {/* Secondary utility links — kept functional, intentionally muted so they don't compete with the approved composition */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 8 }}>
              <button className="sc-tactile" onClick={handleSignIn} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(244,236,218,0.55)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>login</span> Sign In
              </button>
              <button className="sc-tactile" onClick={handleBrowseHumidor} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(244,236,218,0.55)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>inventory_2</span> Browse Humidor
              </button>
              <button className="sc-tactile" onClick={handleGuestPass} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(244,236,218,0.55)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>badge</span> Venue Guest Pass
              </button>
              <button className="sc-tactile" onClick={handleDemoExperience} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(244,236,218,0.55)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>visibility</span> Demo Experience
              </button>
              <button className="sc-tactile" onClick={handleViewPassport} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(244,236,218,0.55)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>menu_book</span> View Passport
              </button>
              <button className="sc-tactile" onClick={handleScanQR} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(244,236,218,0.55)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>qr_code_scanner</span> Scan QR Code
              </button>
            </div>
          </div>

          {/* Right Column — two stacked cards, matching the approved PROFILE DISCOVER 11.png composition */}
          <div className="sc-fade-in smokecraft-right-col" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* "Your Passport to Discovery" card */}
            <div
              className="sc-card-tactile"
              onClick={() => navigate('/passport')}
              style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(8,5,3,0.62)', backdropFilter: 'blur(10px)', cursor: 'pointer', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', display: 'flex', minHeight: 178 }}
            >
              <div style={{ flex: 1, padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#E6C76A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>360 Passport</div>
                  <p style={{ fontFamily: '"Playfair Display",serif', fontSize: 21, fontWeight: 700, lineHeight: 1.25, color: '#F4ECDA', margin: '0 0 8px' }}>Your Passport to Discovery</p>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(244,236,218,0.6)', margin: 0, maxWidth: 240 }}>Build your passport, collect stamps, and track your journey.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {Array.from({ length: 4 }, (_, i) => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < (session.smokecraftStamps?.length ?? 0) ? '#E6C76A' : 'rgba(212,175,55,0.25)' }} />
                    ))}
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#E6C76A', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                    View Passport <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
                  </span>
                </div>
              </div>
              <div style={{ width: '38%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                <img
                  src="/assets/smokecraft/cropped/passport-cover.jpg"
                  alt="360 Passport"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'rotate(-3deg) scale(1.15)' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,5,3,0.5), transparent 50%)' }} />
              </div>
            </div>

            {/* "Tonight's Featured Pairing" card — real venue content, no fabricated copy */}
            {pairingSlide ? (
              <div
                className="sc-card-tactile"
                onClick={() => navigate(pairingSlide.route)}
                style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(8,5,3,0.62)', backdropFilter: 'blur(10px)', cursor: 'pointer', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', display: 'flex', minHeight: 178 }}
              >
                <div style={{ flex: 1, padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#E6C76A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Tonight At This Venue</div>
                    <p style={{ fontFamily: '"Playfair Display",serif', fontSize: 21, fontWeight: 700, lineHeight: 1.25, color: '#F4ECDA', margin: '0 0 8px' }}>{pairingSlide.title}</p>
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(244,236,218,0.6)', margin: 0, maxWidth: 240 }}>{pairingSlide.subtitle}</p>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#E6C76A', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                    Explore Pairing <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
                  </span>
                </div>
                <div style={{ width: '38%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={pairingSlide.image}
                    alt={pairingSlide.title}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,5,3,0.5), transparent 50%)' }} />
                </div>
              </div>
            ) : (
              <div style={{ borderRadius: 20, border: '1px solid rgba(212,175,55,0.22)', background: 'rgba(8,5,3,0.62)', padding: '22px 24px', minHeight: 178, display: 'flex', alignItems: 'center' }}>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(244,236,218,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>No featured pairing today</span>
              </div>
            )}
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

      {/* Desktop grid responsive style */}
      <style>{`
        @media (min-width: 1024px) {
          .smokecraft-grid {
            grid-template-columns: minmax(0, 38%) minmax(0, 62%) !important;
          }
        }
        @media (max-width: 1023px) {
          .smokecraft-right-col {
            order: -1;
          }
          .smokecraft-left-col {
            order: 2;
          }
          .smokecraft-nav-header nav {
            gap: 16px !important;
          }
        }
        @media (max-width: 640px) {
          .smokecraft-nav-header {
            padding: 0 16px !important;
          }
          .smokecraft-pair-grid {
            grid-template-columns: 1fr !important;
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
