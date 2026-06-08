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
            <div className="glass-panel rounded-2xl overflow-hidden titanium-border">

              {/* ── Photo + Annotation Row ─────────────────────── */}
              <div className="relative flex items-stretch" style={{ minHeight: 320 }}>
                {/* Real cigar photo — CSS bg so it loads reliably */}
                <div
                  className="relative flex-shrink-0"
                  style={{
                    width: '42%',
                    minHeight: 320,
                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBktRXv3px18iAdmk-FIbB6ajfhPahwqk9W_JP8Z3CMm5d75I1D5sQYn3y5CtixAGzZo0bWs5yXhZQ8TGcBZxfdlOrRy-X2jzZpEocDLKB-z48LeV4PdnPkWAu1EF0aLxDcp6N-JXmverp_fSYWKdujWH1FrWoLUY1CgVrJguJJeILwvw4JN5SLy70oWxWGRHWFymEXJ3FzmzsY93qIxljsbG1ANTGrbqwoIcmIQ6eUZnCsPhFk08_Z55717Itp90HwmP1ssOO0o')",
                    backgroundSize: 'cover',
                    backgroundPosition: '62% center',
                  }}
                >
                  {/* gold tint overlay */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10) 0%, transparent 55%, rgba(0,0,0,0.45) 100%)' }} />
                  {/* Label caption */}
                  <div className="absolute top-0 left-0 right-0 p-4">
                    <p className="font-label-sm text-[10px] text-primary uppercase tracking-[0.25em] text-center">Cigar Anatomy</p>
                  </div>
                </div>

                {/* Annotation table */}
                <div className="flex-1 flex flex-col justify-center p-5 gap-1">
                  {[
                    { zone: 'wrapper', label: 'Wrapper', pct: '40%', color: '#e9c176', top: '22%' },
                    { zone: 'binder',  label: 'Binder',  pct: '25%', color: '#c5a059', top: '50%' },
                    { zone: 'filler',  label: 'Filler',  pct: '35%', color: '#9a7030', top: '75%' },
                  ].map(({ zone, label, pct, color }) => (
                    <button
                      key={zone}
                      onMouseEnter={() => setHovered(zone)}
                      onMouseLeave={() => setHovered(null)}
                      onTouchStart={() => setHovered(zone)}
                      onTouchEnd={() => setHovered(null)}
                      className="flex items-center gap-3 rounded-xl px-3 transition-all duration-200 active:scale-[0.97] text-left"
                      style={{
                        minHeight: 72,
                        background: hovered === zone ? 'rgba(233,193,118,0.08)' : 'transparent',
                        border: hovered === zone ? '1px solid rgba(233,193,118,0.25)' : '1px solid transparent',
                      }}
                    >
                      {/* Connector dot + line */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div
                          className="h-px transition-all duration-200"
                          style={{ width: hovered === zone ? 18 : 10, background: hovered === zone ? color : 'rgba(233,193,118,0.3)' }}
                        />
                        <div
                          className="rounded-full flex-shrink-0 transition-all duration-200"
                          style={{ width: 8, height: 8, background: color, boxShadow: hovered === zone ? `0 0 8px ${color}` : 'none' }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="transition-colors duration-200 leading-tight"
                          style={{
                            fontFamily: '"Playfair Display", serif',
                            fontSize: 16,
                            fontWeight: hovered === zone ? 600 : 400,
                            color: hovered === zone ? '#f7ead4' : '#c8b898',
                          }}
                        >
                          {label}
                        </p>
                        <p className="text-[11px] uppercase tracking-widest mt-0.5" style={{ color }}>
                          {pct}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Stats Table ────────────────────────────────── */}
              <div className="border-t border-white/8">
                <table className="w-full text-center" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Leaf Varieties', 'Days Aged', 'Master Blender'].map(h => (
                        <th key={h} className="py-3 px-2 font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant/50"
                          style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {['2–4', '200+', '1'].map((val, i) => (
                        <td key={val} className="py-4 px-2"
                          style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                          <p
                            className="text-primary font-bold"
                            style={{ fontFamily: '"Playfair Display", serif', fontSize: 22 }}
                          >
                            {val}
                          </p>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
