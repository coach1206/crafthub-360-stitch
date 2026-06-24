import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../context/GuestSessionContext.jsx'
import { getNextSmokecraftRoute } from '../constants/session.js'
import { triggerHaptic } from '../utils/haptics.js'
import { getVenueHomeContent } from '../data/venueHomeContent.js'
import VenueHeroRotator from '../components/smokecraft/VenueHeroRotator.jsx'

export default function SmokeCraft() {
  const navigate = useNavigate()
  const { session } = useGuestSession()

  const completedSteps     = session.completedSteps ?? []
  const hasPreviousSession = completedSteps.length > 0
  const hasUnfinishedSession = hasPreviousSession && !completedSteps.includes('session-complete')
  const stampCount         = session.passport?.earnedStamps?.length ?? session.smokecraftStamps?.length ?? 0
  const badgeCount         = session.badges?.length ?? 0
  const mentorCount        = session.mentors?.length ?? 0
  const hasEventHistory    = completedSteps.includes('leaf-challenge')
  const isReturningUser    = hasPreviousSession || stampCount > 0 || badgeCount > 0

  const venueContent = getVenueHomeContent(session.venueId)

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

      {/* ── Ambient Lounge Tone (no photo bleed — image lives in the hero showcase panel) ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }} aria-hidden="true">
        <div style={{
          position: 'absolute', inset: 0,
          background: '#050302',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 78% 8%, rgba(212,175,55,0.14), transparent 48%), radial-gradient(ellipse at 10% 92%, rgba(91,143,201,0.10), transparent 46%), radial-gradient(ellipse at 50% 50%, rgba(80,52,18,0.10), transparent 70%)',
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 64, alignItems: 'start' }} className="smokecraft-grid">

          {/* Left Column */}
          <div className="sc-fade-in smokecraft-left-col" style={{ gridColumn: 'span 1' }}>
            {/* Welcome label */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.32)', background: 'rgba(212,175,55,0.1)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#E6C76A' }}>smoking_rooms</span>
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#E6C76A', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
                {isReturningUser ? 'Welcome back to SmokeCraft 360' : 'Welcome to SmokeCraft 360'}
              </span>
            </div>

            {/* Returning-user history check */}
            {isReturningUser && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 22, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(212,175,55,0.22)', background: 'rgba(212,175,55,0.05)' }}>
                {hasUnfinishedSession && (
                  <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#9DC2EE', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Unfinished tasting in progress
                  </span>
                )}
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(244,236,218,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {stampCount} stamp{stampCount === 1 ? '' : 's'} · {badgeCount} badge{badgeCount === 1 ? '' : 's'} · {mentorCount} mentor{mentorCount === 1 ? '' : 's'}{hasEventHistory ? ' · event challenge completed' : ''}
                </span>
              </div>
            )}

            {/* Headline */}
            <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 700, lineHeight: 1.08, color: '#F4ECDA', letterSpacing: '-0.02em', marginBottom: 20 }}>
              Discover your<br />
              <em style={{ color: '#E6C76A', fontStyle: 'italic' }}>cigar profile.</em>
            </h2>

            {/* Body */}
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(244,236,218,0.65)', maxWidth: 480, marginBottom: 36 }}>
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

            {/* Second row: Sign In, Browse Humidor */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <button
                className="sc-tactile"
                onClick={handleSignIn}
                style={{ height: 48, padding: '0 20px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.32)', color: '#E6C76A', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>login</span>
                Sign In
              </button>
              <button
                className="sc-tactile"
                onClick={handleBrowseHumidor}
                style={{ height: 48, padding: '0 20px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.32)', color: '#E6C76A', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>inventory_2</span>
                Browse Humidor
              </button>
            </div>

            {/* Third row: Venue Guest Pass, Demo Experience */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <button
                className="sc-tactile"
                onClick={handleGuestPass}
                style={{ height: 48, padding: '0 20px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.32)', color: '#E6C76A', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>badge</span>
                Venue Guest Pass
              </button>
              <button
                className="sc-tactile"
                onClick={handleDemoExperience}
                style={{ height: 48, padding: '0 20px', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(123,168,219,0.35)', color: '#9DC2EE', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                Demo Experience
              </button>
            </div>

            {/* Utility row: View Passport, Scan QR Code */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button
                className="sc-tactile"
                onClick={handleViewPassport}
                style={{ height: 42, padding: '0 16px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(212,175,55,0.2)', color: 'rgba(230,199,106,0.75)', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>menu_book</span>
                View Passport
              </button>
              <button
                className="sc-tactile"
                onClick={handleScanQR}
                style={{ height: 42, padding: '0 16px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(212,175,55,0.2)', color: 'rgba(230,199,106,0.75)', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>qr_code_scanner</span>
                Scan QR Code
              </button>
            </div>
          </div>

          {/* Right Column — Cards */}
          <div className="sc-fade-in smokecraft-right-col" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Hero Showcase — dominant visible visual, full image, light overlay only at the base for legibility */}
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, border: '1px solid rgba(212,175,55,0.4)', minHeight: 340, boxShadow: '0 20px 52px rgba(0,0,0,0.55), 0 0 60px rgba(201,168,76,0.12)' }}>
              <img
                src="/assets/smokecraft/cropped/discover-profile-hero.jpg"
                alt="Discover your cigar profile — featured humidor selection"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,3,2,0) 55%, rgba(5,3,2,0.62) 100%)' }} />
              <div style={{ position: 'absolute', top: 16, left: 16, padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(5,3,2,0.55)', backdropFilter: 'blur(6px)' }}>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#E6C76A', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>Featured Selection</span>
              </div>
              <div style={{ position: 'absolute', bottom: 18, left: 20, right: 20 }}>
                <p style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#F4ECDA', margin: 0 }}>From the house humidor</p>
                <p style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 12, color: 'rgba(244,236,218,0.7)', margin: '4px 0 0' }}>A glimpse of what's waiting in your profile.</p>
              </div>
            </div>

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

            {/* Venue-controlled rotating hero card (humidor, pairing, challenge, etc.) */}
            <VenueHeroRotator content={venueContent} />

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
            grid-template-columns: 1fr 1fr !important;
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
