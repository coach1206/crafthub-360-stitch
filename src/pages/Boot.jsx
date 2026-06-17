import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { loadSession } from '../services/sessionStorageService.js'
import { useDemoMode } from '../context/DemoModeContext.jsx'
import { useSecurity } from '../context/SecurityContext.jsx'
import { loadStaffSession } from '../services/staffHandoffService.js'
import BootScreen from '../components/BootScreen.jsx'

// /boot is a developer/founder/admin-only system console. Public and staff
// users are sent straight to the public CraftHub experience.
const BOOT_ALLOWED_ROLES = new Set(['founder_level_0', 'admin', 'developer'])

// ── Timing constants (ms) ────────────────────────────────────────────────────
const FADE_IN_MS  = 250
const FADE_OUT_MS = 200
const STAGE_GAP   = 50

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
    fullBleedImage: true,
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
    holdMs:  300,
    logoH:   220,
  },
  {
    id:             'novee-os',
    logo:           '/logos/novee-os.png',
    title:          'NOVEE OS',
    subtitle:       'Powering Core Systems',
    backgroundImage: '/boot/novee-boot.png',
    fullBleedImage: true,
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
    holdMs:  300,
    logoH:   190,
  },
  {
    id:             'crafthub',
    logo:           '/logos/crafthub.png',
    title:          'CRAFTHUB',
    subtitle:       'Integrate · Connect · Elevate',
    backgroundImage: '/boot/crafthub-boot.png',
    fullBleedImage: true,
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
    holdMs:  300,
    logoH:   200,
  },
  {
    id:             'eat',
    logo:           '/logos/eat-system.png',
    title:          'E.A.T. System',
    subtitle:       'Enterprise · Automate · Transform',
    backgroundImage: '/boot/eat-system-boot.png',
    fullBleedImage: true,
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
    holdMs:  300,
    logoH:   190,
  },
  {
    id:             'passport',
    logo:           '/logos/passport-360.png',
    title:          '360 Passport Connection',
    subtitle:       'Networking · Relationships · Experiences',
    backgroundImage: '/boot/passport-boot.png',
    fullBleedImage: true,
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
    holdMs:  300,
    logoH:   190,
  },
]

export default function Boot() {
  const navigate          = useNavigate()
  const [searchParams]    = useSearchParams()
  const { enterDemoMode } = useDemoMode()
  const { role }          = useSecurity()

  const [introPhase,    setIntroPhase]    = useState('playing')
  const [stageIndex,    setStageIndex]    = useState(0)
  const [stageVisible,  setStageVisible]  = useState(false)
  const [itemsRevealed, setItemsRevealed] = useState(0)

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

  const clearIntroTimers = useCallback(() => {
    introTimers.current.forEach(t => clearTimeout(t))
    introTimers.current = []
  }, [])

  const after = useCallback((ms, fn) => {
    const t = setTimeout(fn, ms)
    introTimers.current.push(t)
    return t
  }, [])

  const startBootUI = useCallback(() => {
    setIntroPhase('done')
    setStageVisible(false)
    after(200, () => {
      setBootVisible(true)
      after(500, () => setHeaderVisible(true))
      fallbackTimer.current = setTimeout(() => setShowFallback(true), 600)
    })
  }, [after])

  const skipIntro = useCallback(() => {
    if (skipped.current || introPhase === 'done') return
    skipped.current = true
    clearIntroTimers()
    startBootUI()
  }, [introPhase, clearIntroTimers, startBootUI])

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

  useEffect(() => {
    if (loadStaffSession()?.role !== 'founder' && !BOOT_ALLOWED_ROLES.has(role)) return

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

  // /boot is a developer/founder/admin-only system console — never shown to
  // public, guest, or staff users. Send everyone else straight to CraftHub.
  const staffSession = loadStaffSession()
  if (staffSession?.role !== 'founder' && !BOOT_ALLOWED_ROLES.has(role)) {
    return <Navigate to="/crafthub" replace />
  }

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
      <div
        className="fixed w-10 h-10 rounded-full border border-primary/30 pointer-events-none z-[100] mix-blend-screen transition-all duration-150"
        style={{ left: cursor.x, top: cursor.y, boxShadow: '0 0 15px rgba(233,193,118,0.2)' }}
      />

      {introPhase === 'playing' && (
        <div
          className="fixed inset-0 z-50 select-none"
          style={{ cursor: 'none' }}
          onClick={skipIntro}
        >
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

          <div
            style={{
              position:   'absolute',
              bottom:     44,
              left:       '50%',
              transform:  'translateX(-50%)',
              display:    'flex',
              gap:        10,
              alignItems: 'center',
              zIndex:     20,
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

      <div
        style={{
          opacity:       bootVisible ? 1 : 0,
          transition:    'opacity 1.2s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: bootVisible ? 'auto' : 'none',
        }}
      >
        <div className="fixed inset-0 z-0 overflow-hidden">
          <img
            alt="Luxury Private Lounge"
            className="w-full h-full object-cover scale-110 blur-[8px]"
            src="/background-lounge-airy.jpg"
          />
          <div className="absolute inset-0 smoke-overlay" />
        </div>

        <main className="relative z-10 w-full h-screen flex flex-col items-center justify-between py-16 px-8">
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

          <div className="flex flex-col items-center gap-6 pb-4">
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

        <div
          className="pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-10"
          style={{ background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' x='0' y='0' fill='%23fff' opacity='.08'/%3E%3Crect width='1' height='1' x='2' y='2' fill='%23fff' opacity='.05'/%3E%3C/svg%3E\")" }}
        />
        <div className="pointer-events-none fixed inset-0 z-40 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
      </div>

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
