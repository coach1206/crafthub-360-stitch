import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loadSession } from '../services/sessionStorageService.js'
import { useDemoMode } from '../context/DemoModeContext.jsx'

// ── Timing constants (ms) ────────────────────────────────────────────────────
const FADE_IN_MS  = 700
const FADE_OUT_MS = 600
const STAGE_GAP   = 100   // pause between stages

// ── Configurable boot stage array ────────────────────────────────────────────
// Each stage supports: id, logo, title, subtitle, items (connecting list),
//                      holdMs, glow (radial bg color).
// Future modules can be inserted without rebuilding the boot system.
const BOOT_STAGES = [
  {
    id:       'profound',
    logo:     '/logos/profound-innovation.png',
    title:    'PROFOUND INNOVATION',
    subtitle: 'Software & Systems Development Company',
    items:    [],
    holdMs:   1900,
    glow:     'rgba(201,168,76,0.09)',
    logoH:    220,
  },
  {
    id:       'novee-os',
    logo:     '/logos/novee-os.png',
    title:    'NOVEE OS',
    subtitle: 'SYSTEM INITIALIZING',
    items:    [],
    holdMs:   2200,
    glow:     'rgba(201,168,76,0.13)',
    logoH:    190,
  },
  {
    id:       'crafthub',
    logo:     '/logos/crafthub.png',
    title:    'CRAFTHUB 360',
    subtitle: 'LOADING',
    items:    ['SmokeCraft 360', 'PourCraft 360', 'BeerCraft 360', 'WineCraft 360'],
    holdMs:   2600,
    glow:     'rgba(201,168,76,0.08)',
    logoH:    200,
  },
  {
    id:       'eat',
    logo:     '/logos/eat-system.png',
    title:    'E.A.T. SYSTEM',
    subtitle: 'ENVIRONMENT · ASSET · TRANSACTIONS',
    items:    ['Kitchen', 'Humidor', 'Bar', 'POS 3'],
    holdMs:   2600,
    glow:     'rgba(100,160,80,0.07)',
    logoH:    190,
  },
  {
    id:       'passport',
    logo:     '/logos/passport-360.png',
    title:    '360 PASSPORT CONNECTION',
    subtitle: 'NETWORKING · RELATIONSHIPS · EXPERIENCES',
    items:    ['Members', 'Events', 'Mentors', 'Experiences', 'Venues', 'Travel'],
    holdMs:   3000,
    glow:     'rgba(201,168,76,0.15)',
    logoH:    190,
  },
]

export default function Boot() {
  const navigate          = useNavigate()
  const [searchParams]    = useSearchParams()
  const { enterDemoMode } = useDemoMode()

  // ── Intro sequence state ─────────────────────────────────────────────────
  const [introPhase,    setIntroPhase]    = useState('playing') // 'playing' | 'done'
  const [stageIndex,    setStageIndex]    = useState(0)
  const [stageVisible,  setStageVisible]  = useState(false)
  const [itemsRevealed, setItemsRevealed] = useState(0)

  // ── Boot UI state (stage 6) ──────────────────────────────────────────────
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

  // ── Helpers ──────────────────────────────────────────────────────────────
  const clearIntroTimers = useCallback(() => {
    introTimers.current.forEach(t => clearTimeout(t))
    introTimers.current = []
  }, [])

  const after = useCallback((ms, fn) => {
    const t = setTimeout(fn, ms)
    introTimers.current.push(t)
    return t
  }, [])

  // ── Transition: intro → boot UI ──────────────────────────────────────────
  const startBootUI = useCallback(() => {
    setIntroPhase('done')
    setStageVisible(false)
    after(200, () => {
      setBootVisible(true)
      after(500, () => setHeaderVisible(true))
      // Fallback only starts once Hold to Activate is visible
      fallbackTimer.current = setTimeout(() => setShowFallback(true), 14000)
    })
  }, [after])

  // ── Skip intro on click ──────────────────────────────────────────────────
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

    // Fade in
    after(STAGE_GAP, () => {
      setStageVisible(true)

      // Progressive sub-item reveal during hold phase
      if (stage.items.length > 0) {
        const spacing = Math.min(400, (stage.holdMs - 200) / stage.items.length)
        stage.items.forEach((_, i) => {
          after(FADE_IN_MS + 200 + i * spacing, () => {
            setItemsRevealed(prev => Math.max(prev, i + 1))
          })
        })
      }

      // Fade out → next stage
      after(FADE_IN_MS + stage.holdMs, () => {
        setStageVisible(false)
        after(FADE_OUT_MS + STAGE_GAP, () => playStage(idx + 1))
      })
    })
  }, [after, startBootUI])

  // ── Boot entry ────────────────────────────────────────────────────────────
  useEffect(() => {
    // Already booted → skip everything
    if (sessionStorage.getItem('novee_booted')) {
      const returnPath = sessionStorage.getItem('novee_boot_return')
        || loadSession()?.system?.lastVisitedRoute
        || '/'
      sessionStorage.removeItem('novee_boot_return')
      navigate(returnPath, { replace: true })
      return
    }

    // ?preview=1 → skip intro, go straight to boot UI
    if (searchParams.get('preview') === '1') {
      skipped.current = true
      startBootUI()
      return
    }

    // Cursor tracking
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
          || '/'
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
    navigate('/', { replace: true })
  }

  function handleActivate() {
    sessionStorage.setItem('novee_booted', '1')
    const returnPath = sessionStorage.getItem('novee_boot_return')
      || loadSession()?.system?.lastVisitedRoute
      || '/'
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
          STAGES 1–5 — INTRO SEQUENCE
      ══════════════════════════════════════════════════════════════════════ */}
      {introPhase === 'playing' && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none"
          style={{ background: '#0C0A07', cursor: 'none' }}
          onClick={skipIntro}
        >
          {/* Ambient radial glow — shifts per stage */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 65% 55% at 50% 44%, ${stage.glow}, transparent 72%)`,
              transition: 'background 1.4s ease',
            }}
          />

          {/* Rain particles — pure CSS */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            <style>{`
              @keyframes novee-rain {
                0%   { transform: translateY(-110%) }
                100% { transform: translateY(110%) }
              }
            `}</style>
            {Array.from({ length: 22 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position:   'absolute',
                  top:        0,
                  left:       `${(i / 22) * 100}%`,
                  width:      1,
                  height:     '50%',
                  opacity:    0.025 + (i % 4) * 0.005,
                  background: 'linear-gradient(to bottom, transparent, #C9A84C 50%, transparent)',
                  animation:  `novee-rain ${2.6 + (i % 6) * 0.35}s linear ${(i % 9) * 0.28}s infinite`,
                }}
              />
            ))}
          </div>

          {/* Stage content — fades in/out via opacity */}
          <div
            style={{
              opacity:       stageVisible ? 1 : 0,
              transition:    `opacity ${stageVisible ? FADE_IN_MS : FADE_OUT_MS}ms cubic-bezier(0.4,0,0.2,1)`,
              display:       'flex',
              flexDirection: 'column',
              alignItems:    'center',
              gap:           28,
              textAlign:     'center',
              padding:       '0 2rem',
              maxWidth:      620,
            }}
          >
            {/* Logo */}
            <img
              src={stage.logo}
              alt={stage.title}
              draggable={false}
              style={{
                height:    stage.logoH,
                width:     'auto',
                maxWidth:  560,
                objectFit: 'contain',
                filter:    'drop-shadow(0 0 48px rgba(201,168,76,0.32))',
                userSelect: 'none',
              }}
            />

            {/* Gold divider + subtitle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{
                height:     1,
                width:      220,
                background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.45), transparent)',
              }} />
              <p style={{
                fontFamily:    '"JetBrains Mono", monospace',
                fontSize:      10,
                letterSpacing: '0.28em',
                color:         'rgba(201,168,76,0.45)',
                textTransform: 'uppercase',
                margin:        0,
              }}>
                {stage.subtitle}
              </p>
            </div>

            {/* Connecting / Loading items */}
            {stage.items.length > 0 && (
              <div style={{
                display:       'flex',
                flexDirection: 'column',
                gap:           8,
                marginTop:     4,
                minWidth:      240,
                width:         '100%',
                maxWidth:      340,
              }}>
                {stage.items.map((item, i) => (
                  <div
                    key={item}
                    style={{
                      display:    'flex',
                      alignItems: 'center',
                      gap:        12,
                      opacity:    itemsRevealed > i ? 1 : 0,
                      transform:  itemsRevealed > i ? 'translateX(0)' : 'translateX(-14px)',
                      transition: 'opacity 0.45s ease, transform 0.45s ease',
                    }}
                  >
                    <div style={{
                      width:        6,
                      height:       6,
                      borderRadius: '50%',
                      background:   '#C9A84C',
                      boxShadow:    '0 0 10px rgba(201,168,76,0.65)',
                      flexShrink:   0,
                    }} />
                    <span style={{
                      fontFamily:    '"JetBrains Mono", monospace',
                      fontSize:      11,
                      letterSpacing: '0.18em',
                      color:         'rgba(201,168,76,0.8)',
                      textTransform: 'uppercase',
                      flex:          1,
                      textAlign:     'left',
                    }}>
                      {item}
                    </span>
                    <span style={{
                      fontFamily:    '"JetBrains Mono", monospace',
                      fontSize:      9,
                      letterSpacing: '0.14em',
                      color:         'rgba(201,168,76,0.35)',
                      textTransform: 'uppercase',
                      opacity:       itemsRevealed > i ? 1 : 0,
                      transition:    'opacity 0.3s ease 0.2s',
                    }}>
                      ✓ CONNECTED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stage progress dots */}
          <div style={{
            position:   'absolute',
            bottom:     44,
            display:    'flex',
            gap:        10,
            alignItems: 'center',
          }}>
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
                  boxShadow:    i === stageIndex ? '0 0 10px rgba(201,168,76,0.55)' : 'none',
                  transition:   'all 0.4s ease',
                }}
              />
            ))}
          </div>

          {/* Skip hint */}
          <div style={{
            position:      'absolute',
            bottom:        18,
            right:         26,
            fontFamily:    '"JetBrains Mono", monospace',
            fontSize:      9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color:         'rgba(201,168,76,0.18)',
          }}>
            click to skip
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 6 — MAIN NOVEE OS BOOT UI (Hold to Activate)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          opacity:       bootVisible ? 1 : 0,
          transition:    'opacity 1.2s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: bootVisible ? 'auto' : 'none',
        }}
      >
        {/* Background cinematic layer */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <img
            alt="Luxury Private Lounge"
            className="w-full h-full object-cover scale-110 blur-[8px]"
            src="/background-lounge-airy.jpg"
          />
          <div className="absolute inset-0 smoke-overlay" />
        </div>

        {/* Main content */}
        <main className="relative z-10 w-full h-screen flex flex-col items-center justify-between py-16 px-8">

          {/* Header */}
          <header
            className="w-full flex justify-between items-center h-20 transition-opacity duration-1000"
            style={{ opacity: headerVisible ? 1 : 0 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-primary">terminal</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-lg text-label-lg text-primary tracking-widest">SYSTEM INITIALIZED</span>
                <span className="font-body-md text-body-md text-on-surface-variant/60">V.4.2.0. PREMIUM_CORE</span>
              </div>
            </div>
            <div className="glass-panel px-6 py-2 rounded-full border border-primary/10">
              <span className="font-label-lg text-label-lg text-primary">SECURE LINK: ACTIVE</span>
            </div>
          </header>

          {/* Brand Identity */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-12 animate-pulse-gold">
              <h1 className="font-display-lg text-display-lg gold-foil-text tracking-tighter mb-2">NOVEE OS</h1>
              <div className="h-[1px] w-64 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto" />
              <h2 className="font-headline-md text-headline-md text-on-surface-variant mt-4 tracking-widest uppercase">CRAFTHUB 360</h2>
            </div>
            <p className="font-body-lg text-body-lg text-on-surface/40 uppercase tracking-[0.4em] text-sm">
              Connected Hospitality Intelligence
            </p>
          </div>

          {/* Service Registry panel */}
          <aside className="fixed left-8 top-1/2 -translate-y-1/2">
            <div className="glass-panel p-6 rounded-xl space-y-6 w-72 shadow-2xl shadow-black/50 border-l-2 border-l-primary/40 relative overflow-hidden scan-effect">
              <h3 className="font-label-lg text-label-lg text-on-surface-variant/50 border-b border-outline-variant pb-2">
                SERVICE REGISTRY
              </h3>
              <div className="space-y-4">
                {[
                  { icon: 'point_of_sale', label: 'POS 3' },
                  { icon: 'restaurant',    label: 'E.A.T.' },
                  { icon: 'smoking_rooms', label: 'SmokeCraft' },
                  { icon: 'wine_bar',      label: 'Cellar-Sync' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary/80">{icon}</span>
                      <span className="font-label-lg text-label-lg text-on-surface">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_#e9c176]" />
                      <span className="font-label-sm text-label-sm text-primary/80">READY</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-outline-variant">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary origin-left animate-progress-finish" />
                  </div>
                  <span className="font-label-sm text-label-sm text-primary font-bold">100%</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Bottom: Hold to Activate + Demo + Stats */}
          <div className="flex flex-col items-center gap-6 pb-4">

            {/* Hold to Activate */}
            <button
              className="group relative outline-none flex flex-col items-center justify-center h-[72px] w-[320px] rounded-2xl glass-panel border border-primary/30 amber-glow animate-pulse-gold transition-all duration-500 select-none"
              style={{
                transform:   holding ? 'scale(0.94)' : 'scale(1)',
                background:  holding ? 'rgba(233,193,118,0.15)' : 'rgba(31,31,32,0.4)',
                borderColor: holding ? 'rgba(233,193,118,1)' : undefined,
                boxShadow:   holding ? '0 0 60px rgba(233,193,118,0.3)' : undefined,
              }}
              onMouseDown={startHold}
              onMouseUp={endHold}
              onMouseLeave={endHold}
              onTouchStart={(e) => { e.preventDefault(); startHold() }}
              onTouchEnd={endHold}
            >
              <div className="absolute -inset-1 bg-primary/5 rounded-2xl blur-xl group-hover:bg-primary/10 transition-all duration-700" />
              <div className="relative flex flex-col items-center">
                <span className="font-headline-md text-headline-md text-primary tracking-[0.2em] font-bold text-lg">
                  HOLD TO ACTIVATE
                </span>
                <span className="material-symbols-outlined text-primary/60 text-sm animate-bounce mt-1">
                  keyboard_double_arrow_down
                </span>
              </div>
            </button>

            {/* Demo Mode */}
            <button
              onClick={handleDemoMode}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            8,
                height:         40,
                padding:        '0 20px',
                borderRadius:   20,
                background:     'rgba(201,168,76,0.06)',
                border:         '1px solid rgba(201,168,76,0.2)',
                cursor:         'pointer',
                fontFamily:     '"JetBrains Mono", monospace',
                fontSize:       10,
                fontWeight:     700,
                letterSpacing:  '0.18em',
                color:          'rgba(201,168,76,0.55)',
                textTransform:  'uppercase',
                transition:     'all 0.2s ease',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background  = 'rgba(201,168,76,0.12)'
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
                e.currentTarget.style.color       = 'rgba(201,168,76,0.85)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = 'rgba(201,168,76,0.06)'
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'
                e.currentTarget.style.color       = 'rgba(201,168,76,0.55)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>visibility</span>
              PREVIEW DEMO
            </button>

            {/* Stats */}
            <div className="flex gap-16 mt-2">
              {[
                { label: 'TEMPERATURE',     value: '68°F / 20°C' },
                { label: 'HUMIDITY',        value: '70% RH' },
                { label: 'LOUNGE CAPACITY', value: '12 MEMBERS' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant/40">{label}</span>
                  <span className="font-body-md text-body-md text-on-surface">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Film grain overlay */}
        <div
          className="pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-10"
          style={{ background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' x='0' y='0' fill='%23fff' opacity='.08'/%3E%3Crect width='1' height='1' x='2' y='2' fill='%23fff' opacity='.05'/%3E%3C/svg%3E\")" }}
        />
        <div className="pointer-events-none fixed inset-0 z-40 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
      </div>

      {/* ── Boot fallback ──────────────────────────────────────────────────── */}
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
