import { useNavigate } from 'react-router-dom'
import { useDemoMode } from '../context/DemoModeContext.jsx'
import TicketTicker from '../components/common/TicketTicker.jsx'
import StaffHandoffButton from '../components/staffhandoff/StaffHandoffButton.jsx'

const MEMBER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAVHJ2SzxRud4TlDpwaxtX3u9n40Q6_8d5BLZfa64d_WnZotERlYnufPIsu6-9aSejlf7hY9jDhosQvHPJFJzOB2bsJ32ziJNwxTLQ6cz79j9nd79IvKOPXYe_U7OJy5wt-xdsL8joikKRPXYAi7TSQCkkUH4CI0ziETptnyOUcgAir2E2MHLOcI0dklaL6Fhysc3E6hSZx_OiE8VCcCDhm4r3PomHCoiWQrlVfEYUOC0GzlPPXwfQ_41OGRNiNywCPNsZC7lByNx4'

const G  = '#C9A84C'
const GL = '#E8D5A3'
const BORDER = 'rgba(201,168,76,0.22)'

// CraftHub 360 — the public venue/table experience. Guests, staff, and
// managers all work from here. NOVEE OS (the private licensing/deployment
// system) is never reachable from this screen.
const ACTIONS = [
  { id: 'enter',   label: 'ENTER CRAFTHUB',    icon: 'chair',          route: '/smokecraft',  desc: 'Craft experiences — SmokeCraft, PourCraft, BeerCraft, WineCraft.' },
  { id: 'pos3',    label: 'POS 3',             icon: 'point_of_sale',  route: '/pos',          desc: 'Transaction and order flow for staff.' },
  { id: 'eat',     label: 'E.A.T. MANAGER HUB', icon: 'restaurant',    route: '/eat',          desc: 'Manager operations — kitchen, bar, humidor, inventory, alerts.' },
  { id: 'passport', label: 'PASSPORT',         icon: 'menu_book',      route: '/passport',     desc: 'Member passport, stamps, and connections.' },
]

const OPERATIONAL_SIGNALS = [
  { label: 'Kitchen',  icon: 'soup_kitchen',   status: 'Online' },
  { label: 'Bar',      icon: 'sports_bar',     status: 'Online' },
  { label: 'Humidor',  icon: 'smoking_rooms',  status: 'Synced' },
]

export default function CraftHub() {
  const navigate = useNavigate()
  const { enterDemoMode } = useDemoMode()

  function handleDemoMode() {
    enterDemoMode()
    navigate('/smokecraft')
  }

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary selection:text-on-primary" style={{ position: 'relative' }}>

      {/* ── Background ─────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <img
          src="/ch-logo.jpeg"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.18 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(4,3,1,0.86) 0%, rgba(10,7,2,0.7) 50%, rgba(4,3,1,0.88) 100%)' }} />
      </div>

      {/* ── Top App Bar ──────────────────────────────────────── */}
      <header className="w-full top-0 sticky bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-50">
        <div className="flex justify-between items-center h-24 px-gutter max-w-container-max-width mx-auto">
          <div className="flex flex-col">
            <h1 className="font-display-lg text-headline-xl tracking-widest uppercase text-primary leading-none">CRAFTHUB 360</h1>
            <span className="font-label-sm text-label-sm tracking-[0.2em] uppercase text-on-surface-variant/60 mt-1">Guest · Staff · Manager Experience</span>
          </div>
          <div
            onClick={() => navigate('/passport')}
            className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden hover:opacity-80 transition-opacity cursor-pointer active:scale-95 duration-300 ease-out"
          >
            <img src={MEMBER_AVATAR} alt="Member Passport" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* ── Live Venue Ticker ────────────────────────────────── */}
      <TicketTicker craft="all" />

      {/* ── DayOne360 Travel permanent ticker ───────────────────── */}
      <div
        onClick={() => navigate('/dayone360')}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          padding: '10px 24px', background: 'rgba(10,8,5,0.85)',
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <span className="material-symbols-outlined" style={{ color: G, fontSize: 18 }}>flight_takeoff</span>
        <span style={{ color: G, fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          DayOne360 Travel
        </span>
        <span style={{ color: 'rgba(232,213,163,0.6)', fontSize: 11 }}>
          Craft tourism, VIP trips, and destination experiences — tap to explore
        </span>
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="max-w-container-max-width mx-auto px-gutter py-12 relative z-10">

        <div className="mb-10 text-center">
          <p className="font-label-lg text-label-lg tracking-[0.3em] uppercase text-primary mb-2">
            Guest Table Sessions · Staff Handoff · Craft Experiences
          </p>
          <h2 className="font-headline-xl text-headline-xl text-on-surface">WELCOME TO CRAFTHUB</h2>
        </div>

        {/* Primary action buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => navigate(action.route)}
              className="group relative flex items-center gap-5 p-6 rounded-2xl border transition-all duration-300 text-left"
              style={{ background: 'rgba(20,16,9,0.7)', borderColor: BORDER }}
            >
              <div className="w-14 h-14 rounded-full border flex items-center justify-center flex-shrink-0" style={{ borderColor: `${G}55`, background: `${G}14` }}>
                <span className="material-symbols-outlined" style={{ color: G, fontSize: 26 }}>{action.icon}</span>
              </div>
              <div>
                <div style={{ color: GL, fontWeight: 700, fontSize: 14, letterSpacing: '0.1em' }}>{action.label}</div>
                <div style={{ color: 'rgba(200,184,154,0.65)', fontSize: 12, marginTop: 4 }}>{action.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Staff Table Handoff trigger — visible to public, login-gated inside */}
        <div className="mb-10 flex justify-center">
          <StaffHandoffButton />
        </div>

        {/* Demo Mode */}
        <div className="mb-12 flex justify-center">
          <button
            onClick={handleDemoMode}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, height: 44,
              padding: '0 24px', borderRadius: 22, background: 'rgba(201,168,76,0.08)',
              border: `1px solid ${BORDER}`, color: 'rgba(201,168,76,0.75)',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
            DEMO MODE
          </button>
        </div>

        {/* Kitchen / Bar / Humidor operational signals */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {OPERATIONAL_SIGNALS.map(s => (
            <div key={s.label} className="flex flex-col items-center gap-2 p-4 rounded-xl border" style={{ borderColor: BORDER, background: 'rgba(20,16,9,0.5)' }}>
              <span className="material-symbols-outlined" style={{ color: G, fontSize: 22 }}>{s.icon}</span>
              <span style={{ color: GL, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</span>
              <span style={{ color: 'rgba(201,168,76,0.6)', fontSize: 10 }}>{s.status}</span>
            </div>
          ))}
        </div>

      </main>

      {/* ── Bottom Navigation Bar ─────────────────────────────── */}
      <nav className="w-full h-[100px] z-50 bg-surface-container-low/90 backdrop-blur-2xl border-t border-primary/20 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] relative">
        <div className="flex justify-around items-center w-full max-w-4xl mx-auto h-full">
          <button
            onClick={() => navigate('/smokecraft')}
            className="flex flex-col items-center justify-center gap-1 text-primary-fixed-dim bg-primary-container/20 rounded-xl px-8 py-4 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(233,193,118,0.3)]"
          >
            <span className="material-symbols-outlined">chair</span>
            <span className="font-label-lg text-label-lg tracking-widest uppercase">Humidor</span>
          </button>

          <button
            onClick={() => navigate('/winecraft')}
            className="flex flex-col items-center justify-center gap-1 text-on-surface-variant px-8 py-4 hover:text-primary duration-500 active:translate-y-1 transition-all"
          >
            <span className="material-symbols-outlined">wine_bar</span>
            <span className="font-label-lg text-label-lg tracking-widest uppercase">Cellar</span>
          </button>

          <button
            onClick={() => navigate('/passport')}
            className="flex flex-col items-center justify-center gap-1 text-on-surface-variant px-8 py-4 hover:text-primary duration-500 active:translate-y-1 transition-all"
          >
            <span className="material-symbols-outlined">menu_book</span>
            <span className="font-label-lg text-label-lg tracking-widest uppercase">Passport</span>
          </button>
        </div>
      </nav>

    </div>
  )
}
