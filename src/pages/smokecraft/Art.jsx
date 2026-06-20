import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'

const GOLD = '#e9c176'
const TEXT = '#f5ead7'

const LAYERS = [
  {
    phase: '01',
    title: 'The Wrapper',
    icon: 'eco',
    contribution: 40,
    color: '#e9c176',
    zone: 'wrapper',
    body: "The outermost leaf defines the cigar's first impression. Grown in carefully controlled shade or under direct sun, it must be flawless - supple, oily, and uniform in color. It contributes up to 40% of the total flavor.",
    tags: ['Aroma', 'First Draw', 'Visual Identity'],
  },
  {
    phase: '02',
    title: 'The Binder',
    icon: 'grain',
    contribution: 25,
    color: '#c5a059',
    zone: 'binder',
    body: 'Holding the filler together, the binder is chosen for elasticity and burn properties. A masterful binder ensures an even draw and consistent combustion from the first to the final third of the smoke.',
    tags: ['Burn', 'Structure', 'Combustion'],
  },
  {
    phase: '03',
    title: 'The Filler',
    icon: 'grass',
    contribution: 35,
    color: '#a5773a',
    zone: 'filler',
    body: 'The soul of the blend. Master blenders combine two to four leaf varieties - each from different regions and fermentation cycles - to create complexity, body, and the lingering finish that defines a great cigar.',
    tags: ['Complexity', 'Body', 'Finish'],
  },
]

// APPROVED SMOKECRAFT VISUAL RULE:
// No CSS-drawn cigar graphics, no fake cigar illustrations.
// If a real photo is missing, render "Image pending" only.

function CigarVisual({ active }) {
  const rows = [
    { zone: 'wrapper', label: 'Wrapper', pct: '40%', color: '#e9c176' },
    { zone: 'binder', label: 'Binder', pct: '25%', color: '#c5a059' },
    { zone: 'filler', label: 'Filler', pct: '35%', color: '#a5773a' },
  ]

  return (
    <div className="relative min-h-[315px] overflow-hidden flex flex-col">
      <div
        className="mx-6 mt-6 flex flex-1 items-center justify-center overflow-hidden rounded-xl"
        style={{ border: '1px solid rgba(233,193,118,0.24)', minHeight: 140 }}
      >
        <img
          src="/cigar-anatomy.png"
          alt="Cigar anatomy — wrapper, binder, and filler layers"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="px-6 pb-5 pt-4 space-y-1">
        {rows.map(row => {
          const hot = active === row.zone
          return (
            <button
              key={row.zone}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-all active:scale-[0.98]"
              style={{ minHeight: 56, background: hot ? 'rgba(233,193,118,0.08)' : 'transparent' }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: row.color, boxShadow: `0 0 ${hot ? 16 : 8}px ${row.color}` }} />
              <span>
                <span className="block font-serif text-[17px]" style={{ color: hot ? TEXT : '#d8c8a5' }}>{row.label}</span>
                <span className="block text-[12px] font-bold tracking-wider" style={{ color: row.color }}>{row.pct}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Art() {
  const navigate = useNavigate()
  const { addXP, addBadge, completeStep } = useGuestSession()

  const [mounted, setMounted] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [activeLayer, setActiveLayer] = useState('wrapper')
  const [activeTag, setActiveTag] = useState(null)

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

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050302] text-[#f5ead7] font-body-md">
      <style>{`
        .craft-art-panel {
          background: linear-gradient(135deg, rgba(16,12,8,0.88), rgba(7,5,3,0.82));
          border: 1px solid rgba(233,193,118,0.22);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 42px rgba(0,0,0,0.34);
          backdrop-filter: blur(16px);
        }
        .craft-art-card:active { transform: scale(0.99); }
        .craft-art-hero { grid-column: 1; grid-row: 1; }
        .craft-art-cards { grid-column: 1; grid-row: 2; }
        .craft-art-right { grid-column: 2; grid-row: 1 / span 2; }
        @media (max-width: 1023px) {
          .craft-art-grid { grid-template-columns: 1fr !important; }
          .craft-art-hero { grid-column: 1; grid-row: auto; order: 1; }
          .craft-art-right { grid-column: 1; grid-row: auto; order: 2; }
          .craft-art-cards { grid-column: 1; grid-row: auto; order: 3; }
        }
      `}</style>

      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050302]">
        <img
          alt=""
          src="/smokecraft-hero.png"
          className="h-full w-full object-cover"
          style={{ filter: 'brightness(0.38) saturate(1.15) contrast(1.12)' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(5,3,2,0.94),rgba(5,3,2,0.68) 42%,rgba(5,3,2,0.84)), radial-gradient(circle at 75% 42%,rgba(233,193,118,0.18),transparent 34%)' }} />
        <div className="absolute -left-24 top-16 h-[78vh] w-[36vw] opacity-55 blur-xl" style={{ background: 'radial-gradient(ellipse,rgba(233,193,118,0.14),transparent 62%)' }} />
        <div className="absolute left-0 bottom-0 h-[42vh] w-[42vw] opacity-25" style={{ backgroundImage: 'url(/cigar-anatomy.png)', backgroundSize: 'cover', backgroundPosition: 'left bottom', maskImage: 'linear-gradient(90deg, black, transparent)' }} />
        <div className="absolute inset-0 opacity-28" style={{ background: 'radial-gradient(ellipse at 8% 35%,rgba(255,255,255,0.13),transparent 26%), radial-gradient(ellipse at 94% 48%,rgba(255,255,255,0.1),transparent 26%)', filter: 'blur(20px)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, transparent 52%, rgba(0,0,0,0.72) 100%)' }} />
      </div>

      <header className="fixed left-0 top-0 z-50 flex h-[58px] w-full items-center justify-between border-b border-[#e9c17633] bg-[#080502d9] px-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3">
          <button
            className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-full text-[22px] text-[#e9c176] transition-colors active:scale-95"
            onClick={() => navigate('/smokecraft')}
            aria-label="Back to SmokeCraft"
          >arrow_back</button>
          <span className="font-serif text-[18px] font-bold tracking-wide text-[#e9c176]">CRAFTHUB 360</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/grand-lounge-ranking')}
            className="min-h-11 rounded-full border border-[#e9c17655] px-4 text-[12px] font-bold tracking-[0.18em] text-[#e9c176] transition-colors active:scale-95"
          >
            Grand Lounge
          </button>
          <button
            onClick={() => navigate('/passport')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e9c17688] bg-[#211507] text-sm font-bold text-[#e9c176] shadow-[0_0_18px_rgba(233,193,118,0.2)]"
            aria-label="Member passport"
          >
            JC
          </button>
        </div>
      </header>

      <main className="mx-auto min-h-screen max-w-[1280px] px-5 pb-12 pt-[88px] sm:px-8">
        <div className="craft-art-grid grid grid-cols-[1.08fr_0.92fr] gap-9 xl:gap-12">
          <section className={`craft-art-hero transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
            <div className="mb-8 max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-9 bg-[#e9c17699]" />
                <span className="text-[12px] font-bold uppercase tracking-[0.32em] text-[#e9c176]">The Craft</span>
                <span className="h-px w-9 bg-[#e9c17655]" />
              </div>
              <h1 className="font-serif text-[clamp(40px,6vw,72px)] font-semibold leading-[0.98] text-[#f7efe2]">
                Where Science<br />
                <span className="italic text-[#e9c176]">Meets Soul</span>
              </h1>
              <div className="my-5 flex items-center gap-3 text-[#e9c176]">
                <span className="h-px w-28 bg-[#e9c17688]" />
                <span className="material-symbols-outlined text-[18px]">spa</span>
              </div>
              <p className="max-w-[620px] text-[15px] leading-7 text-[#c8b896]">
                For over two centuries, master blenders have practiced an art that no machine can replicate. Three leaves. One vision. The architecture of every great cigar is built on a precise hierarchy of tobacco - each layer with a distinct role, a distinct terroir, a distinct voice.
              </p>
            </div>
          </section>

          <aside className={`craft-art-right space-y-6 transition-all duration-700 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0'}`}>
            <section className="craft-art-panel overflow-hidden rounded-2xl">
              <div className="border-b border-[#e9c17622] px-6 pb-3 pt-5 text-center">
                <p className="text-[12px] font-bold uppercase tracking-[0.34em] text-[#e9c176]">Cigar Anatomy</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#e9c17688]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e9c176]" />
                  <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#e9c17688]" />
                </div>
              </div>
              <CigarVisual active={activeLayer} />
              <div className="grid grid-cols-3 border-t border-[#e9c17622]">
                {[
                  { icon: 'eco', stat: '2-4', label: 'Leaf Varieties' },
                  { icon: 'schedule', stat: '200+', label: 'Days Aged' },
                  { icon: 'person', stat: '1', label: 'Master Blender' },
                ].map((item, i) => (
                  <div key={item.label} className="px-3 py-4 text-center" style={{ borderRight: i < 2 ? '1px solid rgba(233,193,118,0.16)' : 'none' }}>
                    <span className="material-symbols-outlined text-[22px] text-[#e9c176]">{item.icon}</span>
                    <p className="font-serif text-[25px] font-bold leading-none text-[#e9c176]">{item.stat}</p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#c8b89699]">{item.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="craft-art-panel relative min-h-[245px] overflow-hidden rounded-2xl p-6">
              <img
                alt=""
                src="/smokecraft-hero.png"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: 'brightness(0.5) saturate(1.16)', opacity: 0.62 }}
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(8,5,2,0.92),rgba(8,5,2,0.58),rgba(8,5,2,0.28)), radial-gradient(circle at 78% 54%,rgba(233,193,118,0.2),transparent 32%)' }} />
              <div className="relative z-10 max-w-[350px]">
                <span className="material-symbols-outlined mb-4 text-[38px] text-[#e9c176]">workspace_premium</span>
                <h2 className="font-serif text-[30px] leading-none text-[#f5ead7]">Ready to meet your Mentor?</h2>
                <div className="my-4 h-px w-32 bg-gradient-to-r from-[#e9c176] to-transparent" />
                <p className="mb-6 max-w-[260px] text-[13px] leading-5 text-[#d7c6a8]">
                  Next: Choose the master blender who will guide your entire SmokeCraft journey.
                </p>
                <button
                  onClick={handleContinue}
                  disabled={accepted}
                  className="group flex min-h-14 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#f0d184] to-[#c2933f] px-7 text-[12px] font-black uppercase tracking-[0.18em] text-[#201300] shadow-[0_0_30px_rgba(233,193,118,0.28)] transition-transform active:scale-[0.98] disabled:opacity-70"
                >
                  {accepted ? 'Continuing...' : 'Select My Mentor'}
                  <span className="material-symbols-outlined text-[20px]">{accepted ? 'check' : 'arrow_forward'}</span>
                </button>
              </div>
            </section>
          </aside>

          <section className={`craft-art-cards transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
            <div className="space-y-4">
              {LAYERS.map((layer, i) => {
                const isActive = activeLayer === layer.zone
                return (
                  <button
                    key={layer.phase}
                    type="button"
                    onClick={() => setActiveLayer(layer.zone)}
                    onMouseEnter={() => setActiveLayer(layer.zone)}
                    className="craft-art-card craft-art-panel group w-full overflow-hidden rounded-xl text-left transition-all duration-300"
                    style={{
                      minHeight: 122,
                      borderColor: isActive ? 'rgba(233,193,118,0.55)' : 'rgba(233,193,118,0.22)',
                      boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 34px rgba(233,193,118,0.18)' : undefined,
                      transitionDelay: `${i * 80}ms`,
                    }}
                  >
                    <div className="flex">
                      <div className="w-2 shrink-0" style={{ background: isActive ? 'linear-gradient(#f3d58b,#b88b37)' : 'rgba(233,193,118,0.22)' }} />
                      <div className="flex-1 p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#f0d184] to-[#bd903c] text-sm font-black tracking-wider text-[#201300]">
                              {layer.phase}
                            </span>
                            <div className="min-w-0">
                              <div className="mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[19px] text-[#e9c176]">{layer.icon}</span>
                                <h2 className="font-serif text-[24px] leading-none text-[#f5ead7]">{layer.title}</h2>
                              </div>
                              <p className="max-w-[620px] text-[13px] leading-5 text-[#c8b896]">{layer.body}</p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-[#e9c17699]">Flavor Impact</span>
                            <span className="font-serif text-[27px] font-bold text-[#e9c176]">{layer.contribution}%</span>
                          </div>
                        </div>
                        <div className="mt-4 h-px overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#b88b37] to-[#f0d184] transition-all duration-700"
                            style={{ width: mounted ? `${layer.contribution}%` : 0, boxShadow: `0 0 16px ${layer.color}` }}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {layer.tags.map(tag => {
                            const tagKey = `${layer.phase}-${tag}`
                            const tagActive = activeTag === tagKey
                            return (
                              <span
                                key={tag}
                                onPointerDown={(e) => {
                                  e.preventDefault()
                                  setActiveTag(tagActive ? null : tagKey)
                                }}
                                className="rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors"
                                style={{
                                  minHeight: 34,
                                  borderColor: tagActive ? 'rgba(233,193,118,0.72)' : 'rgba(233,193,118,0.22)',
                                  background: tagActive ? 'rgba(233,193,118,0.16)' : 'rgba(0,0,0,0.12)',
                                  color: tagActive ? GOLD : 'rgba(245,234,215,0.54)',
                                }}
                              >
                                {tag}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <div className="mt-7 flex items-center justify-center gap-4 text-center text-[12px] text-[#c8b896]">
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#e9c17688]" />
          <span>+50 XP</span>
          <span>Art Appreciation Badge</span>
          <span>Unlocks Mentor Selection</span>
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#e9c17688]" />
        </div>
      </main>
    </div>
  )
}
