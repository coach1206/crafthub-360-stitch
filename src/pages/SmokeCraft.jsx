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

      {/* ── Ambient Lounge Background — a plain cigar/lounge photo crop (no baked-in UI), darkened
          heavily for cinematic mood. This is NOT the approved PROFILE DISCOVER 11.png mockup (which
          already contains its own headline/cards/buttons) — using that would duplicate the live UI
          composition below. ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }} aria-hidden="true">
        <img
          src="/assets/smokecraft/cropped/discover-profile-hero.jpg"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%', filter: 'brightness(0.46) saturate(1.12) contrast(1.08)' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(100deg, rgba(5,3,2,0.94) 0%, rgba(5,3,2,0.8) 30%, rgba(5,3,2,0.42) 58%, rgba(5,3,2,0.55) 100%)',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 12% 90%, rgba(212,175,55,0.14), transparent 46%)' }} />
      </div>

      {/* ── Top Bar ───────────────────────────────────────────────── */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 32px', background: 'rgba(10,7,5,0.5)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,175,55,0.14)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(244,236,218,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {stampCount} stamp{stampCount === 1 ? '' : 's'} · {badgeCount} badge{badgeCount === 1 ? '' : 's'} · {mentorCount} mentor{mentorCount === 1 ? '' : 's'}
          </span>
          <button className="sc-tactile" onClick={() => navigate('/')} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.35)', overflow: 'hidden', cursor: 'pointer', background: 'rgba(212,175,55,0.08)' }}>
            <img src="/assets/smokecraft/cropped/passport-cover.jpg" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main style={{ position: 'relative', zIndex: 10, maxWidth: 1320, margin: '0 auto', padding: '104px 32px 110px', minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 56, alignItems: 'center' }} className="smokecraft-grid">

          {/* Left Column */}
          <div className="sc-fade-in smokecraft-left-col" style={{ gridColumn: 'span 1' }}>

            {/* Large crest + wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', border: '1.5px solid rgba(212,175,55,0.55)', background: 'radial-gradient(circle at 35% 30%, rgba(212,175,55,0.3), rgba(212,175,55,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 24px rgba(212,175,55,0.22)' }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#E6C76A', letterSpacing: '0.02em', fontFamily: '"Playfair Display",serif' }}>SC</span>
              </div>
              <div>
                <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#F4ECDA', letterSpacing: '0.04em', lineHeight: 1.1 }}>SMOKECRAFT</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#E6C76A', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 2 }}>Crafted Experiences</div>
              </div>
            </div>

            {/* Welcome label */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.32)', background: 'rgba(212,175,55,0.1)' }}>
              <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 13, fontStyle: 'italic', color: '#E6C76A' }}>§</span>
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
                style={{ height: 50, padding: '0 22px', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(212,175,55,0.32)', color: '#E6C76A', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
                How It Works
              </button>
              <button
                className="sc-tactile"
                onClick={handleEnterChallenge}
                style={{ height: 50, padding: '0 22px', borderRadius: 10, cursor: 'pointer', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.32)', color: '#E6C76A', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
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
                <span style={{ fontSize: 17 }}>&rsaquo;</span>
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

            {/* Secondary utility links — kept functional, plain text with a refined CSS divider mark instead of icon glyphs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0, marginTop: 8, fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(244,236,218,0.55)' }}>
              {[
                { label: 'Sign In', onClick: handleSignIn },
                { label: 'Browse Humidor', onClick: handleBrowseHumidor },
                { label: 'Venue Guest Pass', onClick: handleGuestPass },
                { label: 'Demo Experience', onClick: handleDemoExperience },
                { label: 'View Passport', onClick: handleViewPassport },
                { label: 'Scan QR Code', onClick: handleScanQR },
              ].map((link, i) => (
                <span key={link.label} style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && <span style={{ margin: '0 12px', color: 'rgba(212,175,55,0.4)' }}>·</span>}
                  <button className="sc-tactile" onClick={link.onClick} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: 'inherit' }}>
                    {link.label}
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Right Column — two stacked cards, matching the approved PROFILE DISCOVER 11.png composition */}
          <div className="sc-fade-in smokecraft-right-col" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* "Your Passport to Discovery" card */}
            <div
              className="sc-card-tactile"
              onClick={() => navigate('/passport')}
              style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, border: '1px solid rgba(212,175,55,0.32)', background: 'rgba(8,5,3,0.62)', backdropFilter: 'blur(10px)', cursor: 'pointer', boxShadow: '0 20px 50px rgba(0,0,0,0.55)', display: 'flex', minHeight: 240 }}
            >
              <div style={{ flex: 1, padding: '28px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#E6C76A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>360 Passport</div>
                  <p style={{ fontFamily: '"Playfair Display",serif', fontSize: 27, fontWeight: 700, lineHeight: 1.2, color: '#F4ECDA', margin: '0 0 10px' }}>Your Passport to Discovery</p>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(244,236,218,0.62)', margin: 0, maxWidth: 260 }}>Build your passport, collect stamps, and track your journey.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {Array.from({ length: 4 }, (_, i) => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < (session.smokecraftStamps?.length ?? 0) ? '#E6C76A' : 'rgba(212,175,55,0.25)' }} />
                    ))}
                  </div>
                  <span style={{ color: '#E6C76A', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                    View Passport &rsaquo;
                  </span>
                </div>
              </div>
              <div style={{ width: '46%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                <img
                  src="/assets/smokecraft/cropped/passport-cover.jpg"
                  alt="360 Passport"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,5,3,0.42), transparent 42%)' }} />
              </div>
            </div>

            {/* "Tonight's Featured Pairing" card — real venue content, no fabricated copy */}
            {pairingSlide ? (
              <div
                className="sc-card-tactile"
                onClick={() => navigate(pairingSlide.route)}
                style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, border: '1px solid rgba(212,175,55,0.32)', background: 'rgba(8,5,3,0.62)', backdropFilter: 'blur(10px)', cursor: 'pointer', boxShadow: '0 20px 50px rgba(0,0,0,0.55)', display: 'flex', minHeight: 240 }}
              >
                <div style={{ flex: 1, padding: '28px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                  <div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#E6C76A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Tonight At This Venue</div>
                    <p style={{ fontFamily: '"Playfair Display",serif', fontSize: 27, fontWeight: 700, lineHeight: 1.2, color: '#F4ECDA', margin: '0 0 10px' }}>{pairingSlide.title}</p>
                    <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(244,236,218,0.62)', margin: 0, maxWidth: 260 }}>{pairingSlide.subtitle}</p>
                  </div>
                  <span style={{ color: '#E6C76A', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                    Explore Pairing &rsaquo;
                  </span>
                </div>
                <div style={{ width: '46%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={pairingSlide.image}
                    alt={pairingSlide.title}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,5,3,0.42), transparent 42%)' }} />
                </div>
              </div>
            ) : (
              <div style={{ borderRadius: 22, border: '1px solid rgba(212,175,55,0.22)', background: 'rgba(8,5,3,0.62)', padding: '28px 26px', minHeight: 240, display: 'flex', alignItems: 'center' }}>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(244,236,218,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>No featured pairing today</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Bottom Control Dock — slimmer, lower, monogram marks instead of icon glyphs ── */}
      <nav className="smokecraft-bottom-nav" style={{ position: 'fixed', bottom: 10, left: 16, right: 16, zIndex: 50, height: 60, display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px', background: 'rgba(20,14,8,0.72)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
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
              gap: 10,
              background: item.active ? 'rgba(212,175,55,0.14)' : 'transparent',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              padding: '0 14px',
              transition: 'background 0.2s ease',
            }}
          >
            {/* Monogram mark */}
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${item.active ? 'rgba(212,175,55,0.5)' : 'rgba(212,175,55,0.16)'}`, background: item.active ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 12, fontWeight: 700, color: item.active ? '#E6C76A' : 'rgba(244,236,218,0.5)' }}>{item.label.charAt(0)}</span>
            </div>
            {/* Label */}
            <div className="smokecraft-bottom-nav-copy" style={{ textAlign: 'left', minWidth: 0 }}>
              <div className="smokecraft-bottom-nav-label" style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: item.active ? '#E6C76A' : 'rgba(244,236,218,0.55)', marginBottom: 1, whiteSpace: 'nowrap' }}>{item.label}</div>
              <div className="smokecraft-bottom-nav-sub" style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 9, color: item.active ? 'rgba(244,236,218,0.55)' : 'rgba(244,236,218,0.35)', whiteSpace: 'nowrap' }}>{item.sub}</div>
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
