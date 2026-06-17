import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemoMode } from '../context/DemoModeContext.jsx'
import TicketTicker from '../components/common/TicketTicker.jsx'
import StaffHandoffButton from '../components/staffhandoff/StaffHandoffButton.jsx'

const MEMBER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAVHJ2SzxRud4TlDpwaxtX3u9n40Q6_8d5BLZfa64d_WnZotERlYnufPIsu6-9aSejlf7hY9jDhosQvHPJFJzOB2bsJ32ziJNwxTLQ6cz79j9nd79IvKOPXYe_U7OJy5wt-xdsL8joikKRPXYAi7TSQCkkUH4CI0ziETptnyOUcgAir2E2MHLOcI0dklaL6Fhysc3E6hSZx_OiE8VCcCDhm4r3PomHCoiWQrlVfEYUOC0GzlPPXwfQ_41OGRNiNywCPNsZC7lByNx4'

// Large touchscreen module tiles — the actual CraftHub 360 venue/table
// experience. Craft modules + venue operation flow, all in one screen.
const MODULES = [
  { id: 'smokecraft', title: 'SmokeCraft 360', desc: 'Curated tobacco selections, humidor tracking, tasting rituals.', icon: 'chair',         route: '/smokecraft', image: '/smokecraft.jpg' },
  { id: 'pourcraft',  title: 'PourCraft 360',  desc: 'Bespoke spirit flights, rare bottle access, cocktail mixology.', icon: 'liquor',        route: '/pourcraft',  image: '/pourcraft.jpg' },
  { id: 'beercraft',  title: 'BeerCraft 360',  desc: 'Micro-brewery discovery, cask ale tracking, artisan pairings.',  icon: 'sports_bar',    route: '/beercraft',  image: '/beercraft.jpg' },
  { id: 'winecraft',  title: 'WineCraft 360',  desc: 'Sommelier-led cellar tours, vintage alerts, terroir insights.',  icon: 'wine_bar',      route: '/winecraft',  image: '/winecraft.jpg' },
  { id: 'pos3',       title: 'POS 3',          desc: 'Transaction, order, and payment flow for staff at the table.',  icon: 'point_of_sale', route: '/pos',        image: '/pos3.jpg' },
  { id: 'eat',        title: 'E.A.T. Manager Hub', desc: 'Kitchen, bar, humidor, inventory, alerts, venue operations.', icon: 'restaurant',   route: '/eat',        image: '/eat-command.jpg' },
  { id: 'passport',   title: 'Passport',       desc: 'Member passport, stamps, connections, and benefits.',           icon: 'menu_book',     route: '/passport',   image: '/passport.jpg' },
  { id: 'dayone360',  title: 'DayOne360 Travel', desc: 'Craft tourism, VIP trips, and destination experiences.',      icon: 'flight_takeoff', route: '/dayone360', image: '/crafthub-gold.jpg' },
]

export default function CraftHub() {
  const navigate  = useNavigate()
  const cardRefs  = useRef([])
  const { enterDemoMode } = useDemoMode()

  /* Parallax: card images shift with mouse position */
  useEffect(() => {
    const onMove = (e) => {
      const cx = window.innerWidth  / 2
      const cy = window.innerHeight / 2
      const rx = (e.clientX - cx) / cx
      const ry = (e.clientY - cy) / cy

      cardRefs.current.forEach((card) => {
        if (!card) return
        const img = card.querySelector('.parallax-bg')
        if (img) img.style.transform = `scale(1.1) translate(${rx * 10}px, ${ry * 10}px)`
      })
    }
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  const onCardDown  = (i) => { if (cardRefs.current[i]) cardRefs.current[i].style.transform = 'scale(0.97)' }
  const onCardReset = (i) => { if (cardRefs.current[i]) cardRefs.current[i].style.transform = 'scale(1)' }

  function handleDemoMode() {
    enterDemoMode()
    navigate('/smokecraft')
  }

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary selection:text-on-primary overflow-hidden" style={{ position: 'relative' }}>

      {/* ── Background ─────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <img
          src="/ch-logo.jpeg"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.22 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(4,3,1,0.82) 0%, rgba(10,7,2,0.65) 50%, rgba(4,3,1,0.84) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 60%)' }} />
      </div>

      {/* ── Top App Bar ──────────────────────────────────────── */}
      <header className="w-full top-0 sticky bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-50">
        <div className="flex justify-between items-center h-24 px-gutter max-w-container-max-width mx-auto">
          <div className="flex items-center">
            <button
              className="material-symbols-outlined text-primary text-3xl hover:bg-primary/10 transition-colors p-3 rounded-full active:scale-95 duration-300 ease-out"
              style={{ minWidth: 48, minHeight: 48 }}
              onClick={handleDemoMode}
              aria-label="Demo Mode"
            >
              visibility
            </button>
          </div>

          <h1 className="font-display-lg text-headline-xl tracking-widest uppercase text-primary">
            CRAFTHUB 360
          </h1>

          <div className="flex items-center">
            <div
              onClick={() => navigate('/passport')}
              className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden hover:opacity-80 transition-opacity cursor-pointer active:scale-95 duration-300 ease-out"
            >
              <img src={MEMBER_AVATAR} alt="Member Passport" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Live Venue Ticker — specials/events ─────────────────── */}
      <TicketTicker craft="all" />

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="max-w-container-max-width mx-auto px-gutter py-12 h-[calc(100vh-96px-158px)] overflow-y-auto scroll-smooth hide-scrollbar">

        <div className="mb-10 text-center">
          <p className="font-label-lg text-label-lg tracking-[0.3em] uppercase text-primary mb-2">
            Guest Table Session · Staff Handoff · Venue Operations
          </p>
          <h2 className="font-headline-xl text-headline-xl text-on-surface">CRAFTHUB MODULES</h2>
        </div>

        {/* Staff table handoff — large premium trigger */}
        <div className="mb-12 flex justify-center">
          <StaffHandoffButton />
        </div>

        {/* Large touchscreen module card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32">
          {MODULES.map((mod, idx) => (
            <div
              key={mod.id}
              ref={(el) => (cardRefs.current[idx] = el)}
              onClick={() => navigate(mod.route)}
              onMouseDown={() => onCardDown(idx)}
              onMouseUp={() => onCardReset(idx)}
              onMouseLeave={() => onCardReset(idx)}
              className="group relative h-[340px] rounded-2xl overflow-hidden cursor-pointer shadow-2xl transition-all duration-500 hover:shadow-primary/20 card-container"
            >
              {/* Full-bleed background image with parallax */}
              <div className="absolute inset-0 z-0">
                <img
                  src={mod.image}
                  alt={mod.title}
                  className="w-full h-full object-cover parallax-bg group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              </div>

              {/* Gold border on hover */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/50 transition-colors duration-500 rounded-2xl z-10" />

              {/* Glass-panel footer */}
              <div className="absolute bottom-0 left-0 w-full glass-panel p-7 flex justify-between items-end z-20">
                <div>
                  <h3 className="font-headline-lg text-headline-lg text-primary mb-1">{mod.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">{mod.desc}</p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-label-sm text-label-sm text-primary mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    TAP TO ENTER
                  </span>
                  <div className="w-14 h-14 rounded-full border border-primary/30 flex items-center justify-center bg-surface-container/50 group-hover:bg-primary transition-all duration-500">
                    <span className="material-symbols-outlined text-primary group-hover:text-on-primary transition-colors">
                      {mod.icon}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* ── Bottom Navigation Bar — always visible ─────────── */}
      <nav className="fixed bottom-0 w-full h-[100px] z-50 bg-surface-container-low/90 backdrop-blur-2xl border-t border-primary/20 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <div className="flex justify-around items-center w-full max-w-4xl mx-auto h-full">

          <button
            onClick={() => navigate('/crafthub')}
            className="flex flex-col items-center justify-center gap-1 text-primary-fixed-dim bg-primary-container/20 rounded-xl px-8 py-4 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(233,193,118,0.3)]"
          >
            <span className="material-symbols-outlined">chair</span>
            <span className="font-label-lg text-label-lg tracking-widest uppercase">Lounge</span>
          </button>

          <button
            onClick={() => navigate('/pos')}
            className="flex flex-col items-center justify-center gap-1 text-on-surface-variant px-8 py-4 hover:text-primary duration-500 active:translate-y-1 transition-all"
          >
            <span className="material-symbols-outlined">point_of_sale</span>
            <span className="font-label-lg text-label-lg tracking-widest uppercase">POS 3</span>
          </button>

          <button
            onClick={() => navigate('/eat')}
            className="flex flex-col items-center justify-center gap-1 text-on-surface-variant px-8 py-4 hover:text-primary duration-500 active:translate-y-1 transition-all"
          >
            <span className="material-symbols-outlined">restaurant</span>
            <span className="font-label-lg text-label-lg tracking-widest uppercase">E.A.T.</span>
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
