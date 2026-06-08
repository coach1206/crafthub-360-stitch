import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'

const LAYERS = [
  {
    phase: '01',
    title: 'The Wrapper',
    icon: 'layers',
    contribution: 40,
    color: '#c5a059',
    zone: 'wrapper',
    body: "The outermost leaf defines the cigar's first impression. Grown in carefully controlled shade or under direct sun, it must be flawless — supple, oily, and uniform in color. It contributes up to 40% of the total flavor.",
    tags: ['Aroma', 'First Draw', 'Visual Identity'],
  },
  {
    phase: '02',
    title: 'The Binder',
    icon: 'texture',
    contribution: 25,
    color: '#a07840',
    zone: 'binder',
    body: 'Holding the filler together, the binder is chosen for elasticity and burn properties. A masterful binder ensures an even draw and consistent combustion from the first to the final third of the smoke.',
    tags: ['Burn', 'Structure', 'Combustion'],
  },
  {
    phase: '03',
    title: 'The Filler',
    icon: 'grass',
    contribution: 35,
    color: '#7a5830',
    zone: 'filler',
    body: 'The soul of the blend. Master blenders combine two to four leaf varieties — each from different regions and fermentation cycles — to create complexity, body, and the lingering finish that defines a great cigar.',
    tags: ['Complexity', 'Body', 'Finish'],
  },
]

export default function Art() {
  const navigate = useNavigate()
  const { addXP, addBadge, completeStep } = useGuestSession()

  const [mounted, setMounted]   = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [hovered, setHovered]   = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  function handleContinue() {
    if (accepted) return
    setAccepted(true)
    addXP(50)
    addBadge({ id: 'art-appreciation', name: 'Art Appreciation', icon: 'palette' })
    completeStep('art')
    setTimeout(() => navigate('/smokecraft/mentor'), 500)
  }

  const FILL1 = { fontVariationSettings: "'FILL' 1" }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden">

      {/* ── Cinematic Background ─────────────────────────────── */}
      <div className="fixed inset-0 -z-10">
        <img
          alt=""
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBktRXv3px18iAdmk-FIbB6ajfhPahwqk9W_JP8Z3CMm5d75I1D5sQYn3y5CtixAGzZo0bWs5yXhZQ8TGcBZxfdlOrRy-X2jzZpEocDLKB-z48LeV4PdnPkWAu1EF0aLxDcp6N-JXmverp_fSYWKdujWH1FrWoLUY1CgVrJguJJeILwvw4JN5SLy70oWxWGRHWFymEXJ3FzmzsY93qIxljsbG1ANTGrbqwoIcmIQ6eUZnCsPhFk08_Z55717Itp90HwmP1ssOO0o"
          className="w-full h-full object-cover" style={{ opacity: 0.42 }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(8,5,2,0.85) 0%, rgba(20,12,4,0.6) 50%, rgba(8,5,2,0.78) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 35%, rgba(212,175,55,0.09) 0%, transparent 65%)" }} />
      </div>

      {/* ── Top App Bar ──────────────────────────────────────── */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin h-20 bg-surface-container/70 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <button
            className="material-symbols-outlined text-primary text-[22px] hover:bg-primary/10 p-2 rounded-full transition-colors active:scale-95 duration-200"
            onClick={() => navigate('/smokecraft')}
            aria-label="Back"
          >arrow_back</button>
          <span className="font-headline-md text-[18px] font-bold text-primary tracking-tighter">CRAFTHUB 360</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-label-lg text-label-lg text-primary hidden md:block">Grand Lounge</span>
          <div className="w-9 h-9 rounded-full border border-primary/30 overflow-hidden">
            <img
              alt="Member"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCq4_EpkSpYVcHVlVxnKXJacUbdRmQWEovF-KvyMHM6dJqnGjPivNcRVqPojva00dcFw-6BVVfhI1gFLcaSclOfplLXr3i6MUVX4P-hkoIEfJTKgiHqRbMzmwdN_3t5yChLEGMio7Do167r-rCSqyVByUbYjQFGK9oISPUctIdJqwIGb-QKw2h3XuvSYjbpmyaRpt-JnoQzW41fw_DgeBRzjFoBukHh9bttmrZSUbJTEq5nRcpGZ410InFTORhNwgbrVX3N9_MH0Bo"
            />
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="pt-32 pb-24 px-margin max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">

          {/* ── Left Column: Editorial Content ─────────────────── */}
          <div className="lg:col-span-7 space-y-12">

            {/* Eyebrow + Headline */}
            <div
              className={`transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-8" style={{ background: '#e9c176' }} />
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-[0.25em]">The Craft</span>
              </div>
              <h1
                className="text-on-surface mb-6 leading-tight"
                style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 1.15, fontWeight: 600 }}
              >
                Where Science<br />
                <span className="text-primary italic">Meets Soul</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-xl">
                For over two centuries, master blenders have practiced an art that no machine can replicate. Three leaves. One vision. The architecture of every great cigar is built on a precise hierarchy of tobacco — each layer with a distinct role, a distinct terroir, a distinct voice.
              </p>
            </div>

            {/* Three Layer Cards */}
            <div className="space-y-5">
              {LAYERS.map((layer, i) => (
                <div
                  key={layer.phase}
                  className={`glass-panel rounded-xl overflow-hidden titanium-border cursor-default transition-all duration-700 ease-out hover:border-primary/30 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${160 + i * 140}ms` }}
                  onMouseEnter={() => setHovered(layer.zone)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="flex items-stretch">
                    {/* Phase accent bar */}
                    <div
                      className="w-1 flex-shrink-0 transition-all duration-300"
                      style={{ background: hovered === layer.zone ? '#e9c176' : 'rgba(233,193,118,0.25)' }}
                    />

                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                          {/* Phase badge */}
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-on-primary text-sm"
                            style={{ background: 'linear-gradient(135deg, #e9c176 0%, #c5a059 100%)', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.05em' }}
                          >
                            {layer.phase}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-[18px]">{layer.icon}</span>
                              <h3
                                className="text-on-surface"
                                style={{ fontFamily: '"Playfair Display", serif', fontSize: '22px', fontWeight: 500 }}
                              >
                                {layer.title}
                              </h3>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-label-sm text-label-sm text-primary/60 block text-[10px] uppercase tracking-wider">Flavor Impact</span>
                          <span className="font-bold text-primary" style={{ fontSize: '20px' }}>{layer.contribution}%</span>
                        </div>
                      </div>

                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-4">
                        {layer.body}
                      </p>

                      {/* Contribution bar */}
                      <div className="mb-4">
                        <div className="h-0.5 bg-surface-variant rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: mounted ? `${layer.contribution}%` : '0%',
                              background: 'linear-gradient(90deg, #c5a059, #e9c176)',
                              transitionDelay: `${300 + i * 140}ms`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {layer.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-full font-label-sm text-[11px] uppercase tracking-wider border border-outline-variant/30 text-on-surface-variant"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Area */}
            <div
              className={`transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: '640ms' }}
            >
              <div className="p-6 rounded-xl bg-primary/5 border border-primary/15 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <p className="font-label-lg text-label-lg text-primary mb-1">Ready to meet your Mentor?</p>
                  <p className="font-label-sm text-[12px] text-on-surface-variant">
                    Next: Choose the master blender who will guide your entire SmokeCraft journey.
                  </p>
                </div>
                <button
                  onClick={handleContinue}
                  disabled={accepted}
                  className="group relative flex-shrink-0 flex items-center gap-3 px-8 py-4 rounded-xl gold-foil overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(233,193,118,0.3)] active:scale-[0.98] disabled:opacity-60"
                >
                  <div className="absolute inset-0 bg-white/15 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                  <span className="relative font-label-lg text-label-lg text-on-primary font-bold uppercase tracking-wider">
                    {accepted ? 'Continuing…' : 'Select My Mentor'}
                  </span>
                  <span className="relative material-symbols-outlined text-on-primary text-[20px]">
                    {accepted ? 'check' : 'arrow_forward'}
                  </span>
                </button>
              </div>
              <p className="text-center mt-3 font-label-sm text-[11px] text-on-surface-variant/50">
                +50 XP · Art Appreciation Badge · Unlocks Mentor Selection
              </p>
            </div>
          </div>

          {/* ── Right Column: Anatomy Diagram ──────────────────── */}
          <div
            className={`lg:col-span-5 lg:sticky lg:top-28 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
            style={{ transitionDelay: '240ms' }}
          >
            <div className="glass-panel rounded-2xl overflow-hidden titanium-border" style={{ background: '#0b0804' }}>

              {/* ── Header ─────────────────────────────────────── */}
              <div className="pt-6 pb-2 text-center">
                <p className="font-label-sm text-[11px] uppercase tracking-[0.32em] text-primary">Cigar Anatomy</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="h-px w-12" style={{ background: 'linear-gradient(to right, transparent, rgba(233,193,118,0.5))' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  <div className="h-px w-12" style={{ background: 'linear-gradient(to left, transparent, rgba(233,193,118,0.5))' }} />
                </div>
              </div>

              {/* ── Cigar + Labels ─────────────────────────────── */}
              <div className="flex items-stretch justify-center px-6 pt-4 pb-2" style={{ gap: 0 }}>

                {/* Cigar SVG */}
                <div className="flex-shrink-0" style={{ width: 110 }}>
                  <svg viewBox="0 0 110 400" width="110" height="400" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#c8903a" />
                        <stop offset="40%" stopColor="#f0cf7a" />
                        <stop offset="100%" stopColor="#9a6820" />
                      </linearGradient>
                      <linearGradient id="wrapperGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#b87d2a" />
                        <stop offset="35%" stopColor="#e8c060" />
                        <stop offset="65%" stopColor="#d4a840" />
                        <stop offset="100%" stopColor="#8a5c18" />
                      </linearGradient>
                      <linearGradient id="binderGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#7a5018" />
                        <stop offset="35%" stopColor="#c08030" />
                        <stop offset="65%" stopColor="#a06820" />
                        <stop offset="100%" stopColor="#5a3810" />
                      </linearGradient>
                      <linearGradient id="fillerGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3a2008" />
                        <stop offset="35%" stopColor="#6a4018" />
                        <stop offset="65%" stopColor="#503010" />
                        <stop offset="100%" stopColor="#281408" />
                      </linearGradient>
                      <linearGradient id="shineLeft" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </linearGradient>
                      <linearGradient id="shineRight" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                        <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Cap — rounded top */}
                    <path d="M28,52 Q28,10 55,4 Q82,10 82,52 Z" fill="url(#capGrad)" />
                    <path d="M28,52 Q28,10 55,4 Q82,10 82,52 Z" fill="url(#shineLeft)" opacity="0.5" />

                    {/* Wrapper zone */}
                    <rect x="28" y="50" width="54" height="130" fill="url(#wrapperGrad)" />
                    <rect x="28" y="50" width="12" height="130" fill="url(#shineLeft)" />
                    <rect x="28" y="50" width="54" height="130" fill="url(#shineRight)" />
                    {/* Wrapper band ring */}
                    <rect x="28" y="155" width="54" height="8" fill="#2a1800" opacity="0.6" />
                    <rect x="28" y="156" width="54" height="2" fill="rgba(233,193,118,0.5)" />
                    <rect x="28" y="160" width="54" height="2" fill="rgba(233,193,118,0.3)" />

                    {/* Binder zone */}
                    <rect x="28" y="178" width="54" height="110" fill="url(#binderGrad)" />
                    <rect x="28" y="178" width="12" height="110" fill="url(#shineLeft)" />
                    <rect x="28" y="178" width="54" height="110" fill="url(#shineRight)" />
                    {/* Subtle seam */}
                    <rect x="28" y="178" width="54" height="1" fill="rgba(233,193,118,0.2)" />

                    {/* Filler zone */}
                    <rect x="28" y="288" width="54" height="90" fill="url(#fillerGrad)" />
                    <rect x="28" y="288" width="12" height="90" fill="url(#shineLeft)" />
                    <rect x="28" y="288" width="54" height="90" fill="url(#shineRight)" />
                    <rect x="28" y="288" width="54" height="1" fill="rgba(233,193,118,0.15)" />

                    {/* Foot */}
                    <rect x="28" y="378" width="54" height="6" fill="#1a0c04" />
                    <rect x="28" y="378" width="54" height="1" fill="rgba(233,193,118,0.35)" />

                    {/* Left highlight edge */}
                    <rect x="28" y="50" width="2" height="328" fill="rgba(255,255,255,0.1)" />
                    {/* Right shadow edge */}
                    <rect x="80" y="50" width="2" height="328" fill="rgba(0,0,0,0.3)" />

                    {/* Annotation dots + lines — Wrapper */}
                    <circle cx="82" cy="115" r="3.5" fill="#e9c176" filter="url(#glow)" />
                    <line x1="82" y1="115" x2="110" y2="115" stroke="rgba(233,193,118,0.55)" strokeWidth="1" />

                    {/* Annotation dots + lines — Binder */}
                    <circle cx="82" cy="233" r="3.5" fill="#c5a059" filter="url(#glow)" />
                    <line x1="82" y1="233" x2="110" y2="233" stroke="rgba(197,160,89,0.55)" strokeWidth="1" />

                    {/* Annotation dots + lines — Filler */}
                    <circle cx="82" cy="333" r="3.5" fill="#9a7030" filter="url(#glow)" />
                    <line x1="82" y1="333" x2="110" y2="333" stroke="rgba(154,112,48,0.55)" strokeWidth="1" />
                  </svg>
                </div>

                {/* Labels column */}
                <div className="flex flex-col" style={{ paddingTop: 58, gap: 0 }}>
                  {[
                    { zone: 'wrapper', label: 'Wrapper', pct: '40%', color: '#e9c176', top: 57 },
                    { zone: 'binder',  label: 'Binder',  pct: '25%', color: '#c5a059', top: 118 },
                    { zone: 'filler',  label: 'Filler',  pct: '35%', color: '#9a7030', top: 100 },
                  ].map(({ zone, label, pct, color, top }) => (
                    <button
                      key={zone}
                      onMouseEnter={() => setHovered(zone)}
                      onMouseLeave={() => setHovered(null)}
                      onTouchStart={() => setHovered(zone)}
                      onTouchEnd={() => setHovered(null)}
                      className="flex flex-col justify-center pl-3 pr-4 rounded-lg transition-all duration-200 active:scale-95 text-left"
                      style={{
                        height: top,
                        background: hovered === zone ? 'rgba(233,193,118,0.07)' : 'transparent',
                      }}
                    >
                      <p style={{ fontFamily: '"Playfair Display", serif', fontSize: 16, fontWeight: hovered === zone ? 600 : 400, color: hovered === zone ? '#f7ead4' : '#d4c4a0', lineHeight: 1.2 }}>
                        {label}
                      </p>
                      <p className="text-[12px] font-bold uppercase tracking-wider mt-0.5" style={{ color }}>
                        {pct}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hint */}
              <p className="text-center text-[10px] text-on-surface-variant/30 italic px-6 pb-4">
                Tap each zone to explore its role
              </p>

              {/* ── Stats Row ──────────────────────────────────── */}
              <div className="border-t mx-0 grid grid-cols-3 text-center" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                {[
                  { stat: '2–4',  label: 'Leaf\nVarieties' },
                  { stat: '200+', label: 'Days\nAged'      },
                  { stat: '1',    label: 'Master\nBlender' },
                ].map(({ stat, label }, i) => (
                  <div key={stat} className="py-5" style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                    <p style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#e9c176' }}>{stat}</p>
                    <p className="text-[10px] uppercase tracking-wider mt-1 whitespace-pre-line leading-relaxed text-on-surface-variant/50">{label}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
