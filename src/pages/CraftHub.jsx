import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const MEMBER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAVHJ2SzxRud4TlDpwaxtX3u9n40Q6_8d5BLZfa64d_WnZotERlYnufPIsu6-9aSejlf7hY9jDhosQvHPJFJzOB2bsJ32ziJNwxTLQ6cz79j9nd79IvKOPXYe_U7OJy5wt-xdsL8joikKRPXYAi7TSQCkkUH4CI0ziETptnyOUcgAir2E2MHLOcI0dklaL6Fhysc3E6hSZx_OiE8VCcCDhm4r3PomHCoiWQrlVfEYUOC0GzlPPXwfQ_41OGRNiNywCPNsZC7lByNx4'

const MODULES = [
  {
    id:    'smokecraft',
    title: 'SmokeCraft 360',
    desc:  'Curated tobacco selections, humidor tracking, and tasting rituals.',
    icon:  'chair',
    route: '/smokecraft',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBibwIn3K4im-7feOc6MbE0qrLgoKLyluRCrG3hjStuvfdpV18KH3A62G-Qz_6SVfNrj8RmOIz4hgjZbsiGf5vrfo17Uf0QYtARmYGCz3AONU-8UZEcE8OSFgxjJwc2qzjNic1fMb52TVcCBU_2QQ-yDTSHGdEzFFXRQYmR_R8lGcWMHEeM5hpoR4wpZFsjtro1GAI7dOrXg5xHk9gr32bXN3Vbzy7Ng-LmBNF7rU_vEhH3psYZXs9IvOT6qmbzmAV5Jtgn4Cdo8XQ',
  },
  {
    id:    'pourcraft',
    title: 'PourCraft 360',
    desc:  'Bespoke spirit flights, rare bottle access, and cocktail mixology.',
    icon:  'liquor',
    route: '/pourcraft',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjHHIqUqm4IOBASD9e2CFzmQ4Vt8WRSqfeXFt8t_1i2pPsfxMn84WFBCXRIk_Bd1AjSxcXHBCeNc41pSby-goSyKfSuQe5AOAaLaBlpi6JnD_7fhr1sPy6VbWBiTzmjmFzEwjw8z5kQIVkiKACQgwi-HzB-sAbPIleq_5tachES6TA9xVwf7i_1v1HOewxIVMzGkOsmiCHglJ001ONH5Cj1WC3TTNUZGDRHqfeKBppL49vwAMhY09pzWoCB-KDVF6TYDa-xhKCOS8',
  },
  {
    id:    'beercraft',
    title: 'BeerCraft 360',
    desc:  'Micro-brewery discovery, cask ale tracking, and artisan pairings.',
    icon:  'sports_bar',
    route: '/beercraft',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7VKTY8DSDP4GuM4QjYR6EUZ4LubDo2yCakN2HYV6KyES6tx4THIbwtZKTJGP7jwwJa0Y6Mpwe7t4lB4Z6ZrtkphJapCLIUjlAPK5yHz-y4rHZPgVcmGAqu2dBojUcETurbHllrTS7OdYNtG59QmMelXGI4jLltYxca6qYZFERSoyNOPC51Er70AmYxHA9cNjDpdI-4qDJHTY_Buz0AhxIxquJ5jyxJLlm9k4VqSjh11zr9yTQ5djQ81CEGXwI41JwzsUu5pAUzB4',
  },
  {
    id:    'winecraft',
    title: 'WineCraft 360',
    desc:  'Sommelier-led cellar tours, vintage alerts, and terroir insights.',
    icon:  'wine_bar',
    route: '/winecraft',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDN-VSDDSik_99uYcdNQK9qplzBEeBHFI5GylQ4yLuTVURyE09ShNJzs5TFDa5QWyyJqQjK9XXkZtTSgGc3zY8-pfx1LHbrOayvxB1x5xOIbt0i472thBGJ6WOX3Jl2NwrYJNbGUYOeMCs-mohmkNWfHVU7VLntJ1SjdlDhqth5FyEiWKPI00krkamgowHVvovuXEXO1EBTHCDeFDRxeFFSoRI5OGRdtY96RyQbRrtNMWUqWI7x4AuazZYNAIqroB1vsEBlsjx7su8',
  },
]

export default function CraftHub() {
  const navigate  = useNavigate()
  const cardRefs  = useRef([])

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

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary selection:text-on-primary overflow-hidden" style={{ position: 'relative' }}>

      {/* ── CH logo full background ───────────────────────────── */}
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

          {/* Left: menu button */}
          <div className="flex items-center">
            <button
              className="material-symbols-outlined text-primary text-3xl hover:bg-primary/10 transition-colors p-3 rounded-full active:scale-95 duration-300 ease-out"
              style={{ minWidth: 48, minHeight: 48 }}
              onClick={() => navigate('/')}
              aria-label="Back to Lounge"
            >
              arrow_back
            </button>
          </div>

          {/* Center: brand wordmark */}
          <h1 className="font-display-lg text-headline-xl tracking-widest uppercase text-primary">
            THE RESERVE
          </h1>

          {/* Right: member avatar */}
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

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="max-w-container-max-width mx-auto px-gutter py-12 h-[calc(100vh-96px)] overflow-y-auto scroll-smooth hide-scrollbar">

        {/* Section heading */}
        <div className="mb-12 text-center">
          <p className="font-label-lg text-label-lg tracking-[0.3em] uppercase text-primary mb-2">
            Select Your Journey
          </p>
          <h2 className="font-headline-xl text-headline-xl text-on-surface">CRAFTHUB MODULES</h2>
        </div>

        {/* 2-column module card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32">
          {MODULES.map((mod, idx) => (
            <div
              key={mod.id}
              ref={(el) => (cardRefs.current[idx] = el)}
              onClick={() => navigate(mod.route)}
              onMouseDown={() => onCardDown(idx)}
              onMouseUp={() => onCardReset(idx)}
              onMouseLeave={() => onCardReset(idx)}
              className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer shadow-2xl transition-all duration-500 hover:shadow-primary/20 card-container"
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
              <div className="absolute bottom-0 left-0 w-full glass-panel p-8 flex justify-between items-end z-20">
                <div>
                  <h3 className="font-headline-lg text-headline-lg text-primary mb-1">{mod.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">{mod.desc}</p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-label-sm text-label-sm text-primary mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    TAP TO ENTER
                  </span>
                  <div className="w-16 h-16 rounded-full border border-primary/30 flex items-center justify-center bg-surface-container/50 group-hover:bg-primary transition-all duration-500">
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

          {/* Lounge — active (this is the hub screen) */}
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center gap-1 text-primary-fixed-dim bg-primary-container/20 rounded-xl px-8 py-4 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(233,193,118,0.3)]"
          >
            <span className="material-symbols-outlined">chair</span>
            <span className="font-label-lg text-label-lg tracking-widest uppercase">Lounge</span>
          </button>

          <button
            onClick={() => navigate('/smokecraft')}
            className="flex flex-col items-center justify-center gap-1 text-on-surface-variant px-8 py-4 hover:text-primary duration-500 active:translate-y-1 transition-all"
          >
            <span className="material-symbols-outlined">liquor</span>
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
