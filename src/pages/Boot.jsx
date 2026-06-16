import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loadSession } from '../services/sessionStorageService.js'
import { useDemoMode } from '../context/DemoModeContext.jsx'
import BootScreen from '../components/BootScreen.jsx'

// ── Timing constants (ms) ────────────────────────────────────────────────────
const FADE_IN_MS  = 700
const FADE_OUT_MS = 600
const STAGE_GAP   = 100

// ── Boot stage definitions ────────────────────────────────────────────────────
// backgroundImage: place matching PNG in public/boot/ — gradient fallback used if absent.
// items: used by the animation system for progressive reveal timing.
//        Must mirror statusItems or connectionItems so timing aligns with display.
const BOOT_STAGES = [
  {
    id:             'profound',
    logo:           '/logos/profound-innovation.png',
    title:          'PROFOUND INNOVATIONS',
    subtitle:       'Software & Systems Development Company',
    backgroundImage: '/boot/profound-boot.png',
    bootMessage:    'Initializing systems',
    progress:       92,
    statusItems: [
      { label: 'System Core',      value: 'Online'   },
      { label: 'Neural Interface', value: 'Active'   },
      { label: 'Data Stream',      value: 'Syncing'  },
      { label: 'Security Layer',   value: 'Verified' },
      { label: 'Modules',          value: 'Loaded'   },
    ],
    connectionItems: [],
    items:   ['System Core', 'Neural Interface', 'Data Stream', 'Security Layer', 'Modules'],
    holdMs:  1900,
    logoH:   220,
  },
  {
    id:             'novee-os',
    logo:           '/logos/novee-os.png',
    title:          'NOVEE OS',
    subtitle:       'Powering Core Systems',
    backgroundImage: '/boot/novee-boot.png',
    bootMessage:    'Initializing system',
    progress:       87,
    statusItems: [
      { label: 'System Check',   value: 'OK'     },
      { label: 'Core Modules',   value: 'OK'     },
      { label: 'Network Status', value: 'Online' },
      { label: 'Secure Link',    value: 'Active' },
      { label: 'Data Sync',      value: '100%'   },
      { label: 'Encryption',     value: 'Active' },
    ],
    connectionItems: [],
    items:   ['System Check', 'Core Modules', 'Network Status', 'Secure Link', 'Data Sync', 'Encryption'],
    holdMs:  2200,
    logoH:   190,
  },
  {
    id:             'crafthub',
    logo:           '/logos/crafthub.png',
    title:          'CRAFTHUB',
    subtitle:       'Integrate · Connect · Elevate',
    backgroundImage: '/boot/crafthub-boot.png',
    bootMessage:    'Loading CraftHub network',
    progress:       78,
    statusItems:    [],
    connectionItems: [
      { label: 'SmokeCraft 360', value: 'Connected' },
      { label: 'PourCraft 360',  value: 'Connected' },
      { label: 'BeerCraft 360',  value: 'Connected' },
      { label: 'WineCraft 360',  value: 'Connected' },
    ],
    items:   ['SmokeCraft 360', 'PourCraft 360', 'BeerCraft 360', 'WineCraft 360'],
    holdMs:  2600,
    logoH:   200,
  },
  {
    id:             'eat',
    logo:           '/logos/eat-system.png',
    title:          'E.A.T. System',
    subtitle:       'Enterprise · Automate · Transform',
    backgroundImage: '/boot/eat-system-boot.png',
    bootMessage:    'System boot sequence',
    progress:       82,
    statusItems:    [],
    connectionItems: [
      { label: 'Venue Control', value: 'Connected' },
      { label: 'Inventory',     value: 'Connected' },
      { label: 'POS 3',         value: 'Connected' },
      { label: 'Kitchen',       value: 'Connected' },
      { label: 'Bar',           value: 'Connected' },
      { label: 'Humidor',       value: 'Connected' },
    ],
    items:   ['Venue Control', 'Inventory', 'POS 3', 'Kitchen', 'Bar', 'Humidor'],
    holdMs:  2600,
    logoH:   190,
  },
  {
    id:             'passport',
    logo:           '/logos/passport-360.png',
    title:          '360 Passport Connection',
    subtitle:       'Networking · Relationships · Experiences',
    backgroundImage: '/boot/passport-boot.png',
    bootMessage:    'Activating global connection layer',
    progress:       95,
    statusItems: [
      { label: 'Members',         value: 'Connected' },
      { label: 'Events',          value: 'Connected' },
      { label: 'Passport Stamps', value: 'Active'    },
      { label: 'Network Layer',   value: 'Online'    },
      { label: 'Experience Sync', value: 'Ready'     },
    ],
    connectionItems: [],
    items:   ['Members', 'Events', 'Passport Stamps', 'Network Layer', 'Experience Sync'],
    holdMs:  3000,
    logoH:   190,
  },
]

export default function Boot() {
  const navigate          = useNavigate()
  const [searchParams]    = useSearchParams()
  const { enterDemoMode } = useDemoMode()

  // ── Intro sequence state ──────────────────────────────────────────────────
  const [introPhase,    setIntroPhase]    = useState('playing') // 'playing' | 'done'
  const [stageIndex,    setStageIndex]    = useState(0)
  const [stageVisible,  setStageVisible]  = useState(false)
  const [itemsRevealed, setItemsRevealed] = useState(0)

  // ── Boot UI state (Hold to Activate screen) ───────────────────────────────
  const [bootVisible,   setBootVisible]   = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [holding,       setHolding]       = useState(false)
  const [activating,    setActivating]    = useState(false)
  const [cursor,        setCursor]        = useState({ x: -80, y: -80 })
  const [showFallback,  setShowFallback]  = useState(false)

  const holdTimer     = useRef(null)
  const fallbackTimer = useRef(null)
  const introTimers   = useRef([])
  const skipped       = useRef(false)

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clearIntroTimers = useCallback(() => {
    introTimers.current.forEach(t => clearTimeout(t))
    introTimers.current = []
  }, [])

  const after = useCallback((ms, fn) => {
    const t = setTimeout(fn, ms)
    introTimers.current.push(t)
    return t
  }, [])

  // ── Transition: intro → boot UI ───────────────────────────────────────────
  const startBootUI = useCallback(() => {
    setIntroPhase('done')
    setStageVisible(false)
    after(200, () => {
      setBootVisible(true)
      after(500, () => setHeaderVisible(true))
      fallbackTimer.current = setTimeout(() => setShowFallback(true), 14000)
    })
  }, [after])

  // ── Skip intro on click ───────────────────────────────────────────────────
  const skipIntro = useCallback(() => {
    if (skipped.current || introPhase === 'done') return
    skipped.current = true
    clearIntroTimers()
    startBootUI()
  }, [introPhase, clearIntroTimers, startBootUI])

  // ── Play one stage recursively ────────────────────────────────────────────
  const playStage = useCallback((idx) => {
    if (skipped.current) return
    if (idx >= BOOT_STAGES.length) { startBootUI(); return }

    const stage = BOOT_STAGES[idx]
    setStageIndex(idx)
    setItemsRevealed(0)
    setStageVisible(false)

    after(STAGE_GAP, () => {
      setStageVisible(true)

      if (stage.items.length > 0) {
        const spacing = Math.min(400, (stage.holdMs - 200) / stage.items.length)
        stage.items.forEach((_, i) => {
          after(FADE_IN_MS + 200 + i * spacing, () => {
            setItemsRevealed(prev => Math.max(prev, i + 1))
          })
        })
      }

      after(FADE_IN_MS + stage.holdMs, () => {
        setStageVisible(false)
        after(FADE_OUT_MS + STAGE_GAP, () => playStage(idx + 1))
      })
    })
  }, [after, startBootUI])

  // ── Boot entry ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStorage.getItem('novee_booted')) {
      const returnPath = sessionStorage.getItem('novee_boot_return')
        || loadSession()?.system?.lastVisitedRoute
        || '/crafthub'
      sessionStorage.removeItem('novee_boot_return')
      navigate(returnPath, { replace: true })
      return
    }

    if (searchParams.get('preview') === '1') {
      skipped.current = true
      startBootUI()
      return
    }

    const onMove = (e) => setCursor({ x: e.clientX - 20, y: e.clientY - 20 })
    document.addEventListener('mousemove', onMove)
    document.body.style.cursor = 'none'

    playStage(0)

    return () => {
      clearIntroTimers()
      clearTimeout(holdTimer.current)
      clearTimeout(fallbackTimer.current)
      document.removeEventListener('mousemove', onMove)
      document.body.style.cursor = ''
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hold to Activate ──────────────────────────────────────────────────────
  function startHold() {
    setHolding(true)
    holdTimer.current = setTimeout(() => {
      setActivating(true)
      setTimeout(() => {
        sessionStorage.setItem('novee_booted', '1')
        const returnPath = sessionStorage.getItem('novee_boot_return')
          || loadSession()?.system?.lastVisitedRoute
          || '/crafthub'
        sessionStorage.removeItem('novee_boot_return')
        navigate(returnPath)
      }, 800)
    }, 1500)
  }

  function endHold() {
    clearTimeout(holdTimer.current)
    setHolding(false)
  }

  function handleDemoMode() {
    clearTimeout(fallbackTimer.current)
    enterDemoMode()
    navigate('/crafthub', { replace: true })
  }

  function handleActivate() {
    sessionStorage.setItem('novee_booted', '1')
    const returnPath = sessionStorage.getItem('novee_boot_return')
      || loadSession()?.system?.lastVisitedRoute
      || '/crafthub'
    sessionStorage.removeItem('novee_boot_return')
    navigate(returnPath, { replace: true })
  }

  const stage = BOOT_STAGES[stageIndex] || BOOT_STAGES[0]

  return (
    <div
      className="relative w-full overflow-hidden bg-background text-on-background"
      style={{
        minHeight:  'max(884px, 100dvh)',
        transition: 'opacity 0.8s cubic-bezier(0.7,0,0.3,1), transform 0.8s cubic-bezier(0.7,0,0.3,1)',
        opacity:    activating ? 0 : 1,
        transform:  activating ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      {/* Custom cursor dot */}
      <div
        className="fixed w-10 h-10 rounded-full border border-primary/30 pointer-events-none z-[100] mix-blend-screen transition-all duration-150"
        style={{ left: cursor.x, top: cursor.y, boxShadow: '0 0 15px rgba(233,193,118,0.2)' }}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          STAGES 1–5 — CINEMATIC INTRO SEQUENCE
      ══════════════════════════════════════════════════════════════════════ */}
      {introPhase === 'playing' && (
        <div
          className="fixed inset-0 z-50 select-none"
          style={{ cursor: 'none' }}
          onClick={skipIntro}
        >
          {/* Stage fade wrapper */}
          <div
            style={{
              width:      '100%',
              height:     '100vh',
              opacity:    stageVisible ? 1 : 0,
              transition: `opacity ${stageVisible ? FADE_IN_MS : FADE_OUT_MS}ms cubic-bezier(0.4,0,0.2,1)`,
            }}
          >
            <BootScreen
              brandName={stage.title}
              brandSubtitle={stage.subtitle}
              logo={stage.logo}
              logoHeight={stage.logoH}
              backgroundImage={stage.backgroundImage}
              bootMessage={stage.bootMessage}
              progress={stage.progress}
              statusItems={stage.statusItems}
              connectionItems={stage.connectionItems}
              itemsRevealed={itemsRevealed}
            />
          </div>

          {/* Stage progress dots */}
          <div
            style={{
              position:  'absolute',
              bottom:    44,
              left:      '50%',
              transform: 'translateX(-50%)',
              display:   'flex',
              gap:       10,
              alignItems: 'center',
              zIndex:    20,
            }}
          >
            {BOOT_STAGES.map((s, i) => (
              <div
                key={s.id}
                style={{
                  width:        i === stageIndex ? 22 : 6,
                  height:       6,
                  borderRadius: 3,
                  background:   i === stageIndex
                    ? '#C9A84C'
                    : i < stageIndex
                      ? 'rgba(201,168,76,0.35)'
                      : 'rgba(201,168,76,0.10)',
                  boxShadow:  i === stageIndex ? '0 0 10px rgba(201,168,76,0.55)' : 'none',
                  transition: 'all 0.4s ease',
                }}
              />
            ))}
          </div>

          {/* Skip hint */}
          <div
            style={{
              position:      'absolute',
              bottom:        18,
              right:         26,
              zIndex:        20,
              fontFamily:    '"JetBrains Mono", monospace',
              fontSize:      9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color:         'rgba(201,168,76,0.18)',
            }}
          >
            click to skip
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 6 — CINEMATIC ACTIVATION SCREEN (Hold to Activate)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          opacity:       bootVisible ? 1 : 0,
          transition:    'opacity 1.2s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: bootVisible ? 'auto' : 'none',
        }}
      >
        {/* ── Cinematic background ─────────────────────────────────────────── */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#010b1e', overflow: 'hidden' }}>
          <img
            src="/boot/crafthub-boot.png"
            alt=""
            aria-hidden="true"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          {/* Edge vignette */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(1,11,30,0.60) 0%, rgba(1,11,30,0.20) 30%, rgba(1,11,30,0.45) 65%, rgba(1,11,30,0.95) 100%), linear-gradient(to right, rgba(1,11,30,0.65) 0%, transparent 22%, transparent 78%, rgba(1,11,30,0.65) 100%)',
          }} />
          {/* Data grid texture */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, opacity: 0.05,
            backgroundImage: 'linear-gradient(rgba(56,189,248,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.9) 1px, transparent 1px)',
            backgroundSize: '58px 58px',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, black 20%, transparent 80%)',
            maskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, black 20%, transparent 80%)',
          }} />
        </div>

        {/* ── Moving data lines ────────────────────────────────────────────── */}
        <div aria-hidden="true" className="boot-screen__data-lines" style={{ position: 'fixed', zIndex: 2 }}>
          {[
            { top: '15%', animationDuration: '5.1s', animationDelay: '0.2s'  },
            { top: '32%', animationDuration: '4.3s', animationDelay: '1.0s'  },
            { top: '50%', animationDuration: '6.6s', animationDelay: '0.5s'  },
            { top: '67%', animationDuration: '3.9s', animationDelay: '1.8s'  },
            { top: '82%', animationDuration: '5.5s', animationDelay: '0.0s'  },
          ].map((s, i) => (
            <div key={i} className="boot-screen__data-line" style={s} />
          ))}
        </div>

        {/* ── Concentric glow rings ────────────────────────────────────────── */}
        <div aria-hidden="true" className="boot-screen__rings" style={{ position: 'fixed', zIndex: 3 }}>
          {[
            { size: 300, border: '1px solid rgba(201,168,76,0.22)', animationDelay: '0.0s', animationDuration: '3.6s' },
            { size: 410, border: '1px solid rgba(56,189,248,0.13)', animationDelay: '0.9s', animationDuration: '4.5s' },
            { size: 520, border: '1px solid rgba(56,189,248,0.07)', animationDelay: '1.8s', animationDuration: '5.4s' },
          ].map(({ size, border, animationDelay, animationDuration }) => (
            <div key={size} className="boot-screen__ring" style={{ width: size, height: size, border, animationDelay, animationDuration }} />
          ))}
        </div>

        {/* ── Blue center glow ─────────────────────────────────────────────── */}
        <div aria-hidden="true" style={{
          position: 'fixed', inset: 0, zIndex: 4, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 48% 45% at 50% 42%, rgba(14,80,200,0.20) 0%, rgba(56,189,248,0.06) 55%, transparent 80%)',
        }} />

        {/* ── Header bar ──────────────────────────────────────────────────── */}
        <div
          style={{
            position:   'fixed', top: '1.5rem', left: 0, right: 0,
            zIndex:     20, display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '0 2rem',
            opacity:    headerVisible ? 1 : 0,
            transition: 'opacity 1s ease',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'rgba(2,16,52,0.72)', border: '1px solid rgba(56,189,248,0.18)',
            borderLeft: '2px solid rgba(56,189,248,0.55)', borderRadius: 4,
            padding: '0.4rem 0.9rem', backdropFilter: 'blur(10px)',
          }}>
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.48)' }}>Status</span>
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(56,189,248,0.92)', fontWeight: 700 }}>System Ready</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'rgba(2,16,52,0.72)', border: '1px solid rgba(56,189,248,0.18)',
            borderRight: '2px solid rgba(56,189,248,0.55)', borderRadius: 4,
            padding: '0.4rem 0.9rem', backdropFilter: 'blur(10px)',
          }}>
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.48)' }}>Secure Link</span>
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(56,189,248,0.92)', fontWeight: 700 }}>Active</span>
          </div>
        </div>

        {/* ── Left status panel ────────────────────────────────────────────── */}
        <div className="boot-screen__side-panel boot-screen__side-panel--left" style={{ position: 'fixed', zIndex: 10 }}>
          {[
            { label: 'SmokeCraft 360', value: 'Connected' },
            { label: 'PourCraft 360',  value: 'Connected' },
            { label: 'BeerCraft 360',  value: 'Connected' },
            { label: 'WineCraft 360',  value: 'Connected' },
          ].map(({ label, value }) => (
            <div key={label} className="boot-screen__status-panel">
              <span className="boot-screen__status-label">{label}</span>
              <span className="boot-screen__status-value">{value}</span>
            </div>
          ))}
        </div>

        {/* ── Right status panel ───────────────────────────────────────────── */}
        <div className="boot-screen__side-panel boot-screen__side-panel--right" style={{ position: 'fixed', zIndex: 10 }}>
          {[
            { label: 'POS 3',     value: 'Online'  },
            { label: 'E.A.T.',    value: 'Online'  },
            { label: 'Inventory', value: 'Synced'  },
            { label: 'Network',   value: 'Secured' },
          ].map(({ label, value }) => (
            <div key={label} className="boot-screen__status-panel">
              <span className="boot-screen__status-label">{label}</span>
              <span className="boot-screen__status-value">{value}</span>
            </div>
          ))}
        </div>

        {/* ── Center content ───────────────────────────────────────────────── */}
        <div style={{
          position:       'fixed', inset: 0, zIndex: 10,
          display:        'flex', flexDirection: 'column',
          alignItems:     'center', justifyContent: 'center',
          gap:            '1.25rem', padding: '0 2rem',
          textAlign:      'center',
        }}>
          {/* Logo */}
          <div className="boot-screen__logo">
            <img
              src="/logos/crafthub.png"
              alt="CraftHub 360"
              draggable={false}
              style={{ height: 160, width: 'auto', maxWidth: 400, objectFit: 'contain', userSelect: 'none' }}
            />
          </div>

          {/* Brand */}
          <h1 className="boot-screen__title">CRAFTHUB 360</h1>
          <div className="boot-screen__divider" />
          <p className="boot-screen__subtitle">Connected Hospitality Intelligence</p>

          {/* Hold to Activate */}
          <button
            style={{
              position:       'relative',
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              height:         72,
              width:          320,
              borderRadius:   16,
              border:         holding ? '1.5px solid rgba(201,168,76,1)' : '1.5px solid rgba(201,168,76,0.35)',
              background:     holding ? 'rgba(201,168,76,0.15)' : 'rgba(2,16,52,0.65)',
              boxShadow:      holding ? '0 0 60px rgba(201,168,76,0.30), inset 0 0 30px rgba(201,168,76,0.08)' : '0 0 30px rgba(56,189,248,0.08)',
              backdropFilter: 'blur(12px)',
              cursor:         'pointer',
              outline:        'none',
              transform:      holding ? 'scale(0.94)' : 'scale(1)',
              transition:     'all 0.2s ease',
              userSelect:     'none',
            }}
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={(e) => { e.preventDefault(); startHold() }}
            onTouchEnd={endHold}
          >
            <span style={{
              fontFamily:    '"JetBrains Mono", monospace',
              fontSize:      '0.9rem',
              fontWeight:    700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color:         'rgba(201,168,76,0.92)',
            }}>
              HOLD TO ACTIVATE
            </span>
            <span style={{
              fontFamily:    '"JetBrains Mono", monospace',
              fontSize:      '0.58rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         'rgba(56,189,248,0.55)',
              marginTop:     4,
            }}>
              {holding ? 'Activating...' : 'Press and hold to enter'}
            </span>
          </button>

          {/* Preview Demo */}
          <button
            onClick={handleDemoMode}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            8,
              height:         38,
              padding:        '0 20px',
              borderRadius:   20,
              background:     'rgba(56,189,248,0.06)',
              border:         '1px solid rgba(56,189,248,0.18)',
              cursor:         'pointer',
              fontFamily:     '"JetBrains Mono", monospace',
              fontSize:       '0.6rem',
              fontWeight:     700,
              letterSpacing:  '0.18em',
              color:          'rgba(56,189,248,0.55)',
              textTransform:  'uppercase',
              transition:     'all 0.2s ease',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = 'rgba(56,189,248,0.12)'
              e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'
              e.currentTarget.style.color       = 'rgba(56,189,248,0.9)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'rgba(56,189,248,0.06)'
              e.currentTarget.style.borderColor = 'rgba(56,189,248,0.18)'
              e.currentTarget.style.color       = 'rgba(56,189,248,0.55)'
            }}
          >
            PREVIEW DEMO
          </button>

          {/* Footer version line */}
          <p style={{
            fontFamily:    '"JetBrains Mono", monospace',
            fontSize:      '0.55rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.18)',
            marginTop:     '0.25rem',
          }}>
            V.4.2.0 · Premium Core · Secure Link Active
          </p>
        </div>
      </div>

      {/* ── Boot fallback ─────────────────────────────────────────────────── */}
      {showFallback && (
        <div
          style={{
            position:       'fixed',
            bottom:         '2rem',
            left:           '50%',
            transform:      'translateX(-50%)',
            zIndex:         200,
            background:     'rgba(5,5,5,0.92)',
            border:         '1px solid rgba(201,168,76,0.4)',
            borderRadius:   '12px',
            padding:        '1.25rem 2rem',
            textAlign:      'center',
            backdropFilter: 'blur(12px)',
            fontFamily:     'Georgia, serif',
            minWidth:       '320px',
          }}
        >
          <p style={{ color: 'rgba(201,168,76,0.6)', fontSize: '0.78rem', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>
            NOVEE OS is preparing your experience.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleActivate}
              style={{
                background:    '#C9A84C',
                color:         '#050505',
                border:        'none',
                padding:       '0.875rem 2.5rem',
                borderRadius:  '6px',
                fontFamily:    'Georgia, serif',
                fontSize:      '0.88rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor:        'pointer',
                fontWeight:    600,
                minHeight:     '52px',
                width:         '100%',
              }}
            >
              Continue
            </button>
            <button
              onClick={handleDemoMode}
              style={{
                background:    'transparent',
                color:         'rgba(201,168,76,0.5)',
                border:        '1px solid rgba(201,168,76,0.25)',
                padding:       '0.625rem 2.5rem',
                borderRadius:  '6px',
                fontFamily:    '"JetBrains Mono", monospace',
                fontSize:      '0.72rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor:        'pointer',
                width:         '100%',
              }}
            >
              Preview Demo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
