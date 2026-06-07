import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const MEMBER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAgWXglzb_WYKEWLzx_GP2htMAmylt3mc4x271sR6Sgl-GSMFBDFFhp6UUSJ2p60KWwRXW1GJBT4BMHdiVk08RE8Q3Hqc0qlOGLkQ_-JOa7PIyCTDdIKun_viSNQVYI9HPXOQTsapFdp4Z7pFymCG7xoMHqziC0aay19DnTmthayXgUzViZ9CJ6o9n6ckNjypwlfJgv5k_Zae8mCfcyk6TKoenHMSe54VO9On3spC7zVcWvFUCHaTaJan02aA5niZ-u5z7nEY3caQw'

export default function Home() {
  const navigate  = useNavigate()
  const glowRef   = useRef(null)

  /* Apply leather texture to the body while this page is mounted */
  useEffect(() => {
    document.body.classList.add('leather-texture')
    return () => document.body.classList.remove('leather-texture')
  }, [])

  /* Ambient glow tracks the mouse */
  useEffect(() => {
    const onMove = (e) => {
      if (!glowRef.current) return
      glowRef.current.style.background =
        `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, rgba(233,193,118,0.08) 0%, transparent 50%)`
    }
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="text-on-surface min-h-screen flex flex-col overflow-hidden">

      {/* ── Top App Bar ──────────────────────────────────────── */}
      <header className="w-full top-0 sticky bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-50">
        <div className="flex justify-between items-center h-24 px-gutter max-w-container-max-width mx-auto">

          {/* Left: menu icon + brand wordmark */}
          <div className="flex items-center gap-6">
            <span className="material-symbols-outlined text-primary text-3xl cursor-pointer select-none">menu</span>
            <h1 className="font-display-lg text-headline-xl tracking-widest uppercase text-primary">
              THE RESERVE
            </h1>
          </div>

          {/* Right: desktop section links + member avatar */}
          <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-8">
              <button className="font-label-lg text-label-lg text-primary">Lounge</button>
              <button
                onClick={() => navigate('/smokecraft')}
                className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors"
              >
                Humidor
              </button>
              <button
                onClick={() => navigate('/winecraft')}
                className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors"
              >
                Cellar
              </button>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-primary/50 overflow-hidden bg-surface-container-high cursor-pointer">
              <img src={MEMBER_AVATAR} alt="Member Passport" className="w-full h-full object-cover" />
            </div>
          </div>

        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center relative p-gutter">

        {/* Ambient glow overlay (mouse-tracking) */}
        <div ref={glowRef} className="ambient-glow" style={{ zIndex: -1 }} />

        {/* Welcome title — floating animation */}
        <div className="text-center mb-16 floating relative z-10">
          <h2 className="font-headline-xl text-display-lg text-on-surface mb-4">
            Welcome to CraftHub 360
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6" />
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto tracking-wide">
            Where tradition meets precision. Your personal gateway to the ultimate sensory journey.
          </p>
        </div>

        {/* Giant Interaction Grid (2-column) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl relative z-10">

          {/* ① START EXPERIENCE — high-prominence gold foil CTA */}
          <button
            onClick={() => navigate('/crafthub')}
            className="group haptic-pulse relative overflow-hidden flex items-center justify-center rounded-xl gold-foil h-24 md:h-[140px] px-12 transition-all duration-300 hover:shadow-[0_0_40px_rgba(233,193,118,0.5)] active:translate-y-1"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="flex flex-col items-center gap-1">
              <span className="font-headline-md text-headline-md text-on-primary font-bold tracking-widest">
                START EXPERIENCE
              </span>
              <span className="font-label-sm text-label-sm text-on-primary/70">
                BEGIN YOUR CUSTOM CURATION
              </span>
            </div>
            <div className="absolute right-8 opacity-20 pointer-events-none">
              <span
                className="material-symbols-outlined text-6xl"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                play_arrow
              </span>
            </div>
          </button>

          {/* ② CONTINUE SESSION — glassmorphism */}
          <button
            onClick={() => navigate('/crafthub')}
            className="group haptic-pulse relative overflow-hidden flex items-center justify-center rounded-xl glass-morphism h-24 md:h-[140px] px-12 transition-all duration-500 hover:border-primary/60 active:translate-y-1"
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="flex flex-col items-center gap-1 text-primary">
              <span className="font-headline-md text-headline-md font-medium tracking-widest">
                CONTINUE SESSION
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                Resume where you left off
              </span>
            </div>
            <div className="absolute right-8 opacity-20 pointer-events-none">
              <span className="material-symbols-outlined text-6xl">history</span>
            </div>
          </button>

          {/* ③ OPEN CRAFTHUB — glassmorphism */}
          <button
            onClick={() => navigate('/crafthub')}
            className="group haptic-pulse relative overflow-hidden flex items-center justify-center rounded-xl glass-morphism h-24 md:h-[140px] px-12 transition-all duration-500 hover:border-primary/60 active:translate-y-1"
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="flex flex-col items-center gap-1 text-primary">
              <span className="font-headline-md text-headline-md font-medium tracking-widest">
                OPEN CRAFTHUB
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                Browse the master catalog
              </span>
            </div>
            <div className="absolute right-8 opacity-20 pointer-events-none">
              <span className="material-symbols-outlined text-6xl">grid_view</span>
            </div>
          </button>

          {/* ④ E.A.T. COMMAND — industrial steel / copper */}
          <button
            onClick={() => navigate('/eat')}
            className="group haptic-pulse relative overflow-hidden flex items-center justify-center rounded-xl industrial-steel h-24 md:h-[140px] px-12 transition-all duration-300 hover:brightness-110 active:translate-y-1"
          >
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/brushed-alum.png')" }}
            />
            <div className="flex flex-col items-center gap-1">
              <span className="font-headline-md text-headline-md font-bold tracking-widest text-secondary">
                E.A.T. COMMAND
              </span>
              <span className="font-label-sm text-label-sm opacity-70 uppercase">
                Internal Staff Operations Only
              </span>
            </div>
            <div className="absolute right-8 opacity-30 pointer-events-none">
              <span className="material-symbols-outlined text-6xl">settings_input_component</span>
            </div>
          </button>

        </div>

        {/* Subtle footer detail */}
        <div className="mt-auto py-8 text-center opacity-40 relative z-10">
          <span className="font-label-sm text-label-sm uppercase tracking-[0.4em] text-on-surface">
            Precision Craftsmanship • Authenticity Guaranteed
          </span>
        </div>

      </main>

      {/* ── Bottom Navigation Bar — mobile only (md:hidden) ── */}
      <nav className="md:hidden fixed bottom-0 w-full h-[100px] z-50 bg-surface-container-low/90 backdrop-blur-2xl border-t border-primary/20 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <div className="flex justify-around items-center w-full max-w-4xl mx-auto h-full">

          {/* Lounge — active state */}
          <button className="flex flex-col items-center justify-center gap-1 text-primary-fixed-dim bg-primary-container/20 rounded-xl px-8 py-4 transition-all">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              chair
            </span>
            <span className="font-label-lg text-label-lg tracking-widest uppercase">Lounge</span>
          </button>

          <button
            onClick={() => navigate('/smokecraft')}
            className="flex flex-col items-center justify-center gap-1 text-on-surface-variant px-8 py-4 hover:text-primary duration-500"
          >
            <span className="material-symbols-outlined text-2xl">liquor</span>
            <span className="font-label-lg text-label-lg tracking-widest uppercase">Humidor</span>
          </button>

          <button
            onClick={() => navigate('/winecraft')}
            className="flex flex-col items-center justify-center gap-1 text-on-surface-variant px-8 py-4 hover:text-primary duration-500"
          >
            <span className="material-symbols-outlined text-2xl">wine_bar</span>
            <span className="font-label-lg text-label-lg tracking-widest uppercase">Cellar</span>
          </button>

          <button
            onClick={() => navigate('/passport')}
            className="flex flex-col items-center justify-center gap-1 text-on-surface-variant px-8 py-4 hover:text-primary duration-500"
          >
            <span className="material-symbols-outlined text-2xl">menu_book</span>
            <span className="font-label-lg text-label-lg tracking-widest uppercase">Passport</span>
          </button>

        </div>
      </nav>

    </div>
  )
}
