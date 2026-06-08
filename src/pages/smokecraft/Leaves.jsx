import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'

const VARIETIES = [
  {
    id: 'habano-colorado',
    name: 'Habano Colorado',
    region: 'CUBA',
    strength: 4, aroma: 5, body: 4,
    notes: ['Red Pepper', 'Cedar', 'Earth'],
    tasting: "A Havana classic. Silky texture with a pronounced spice bloom on the mid-palate, finishing with red pepper and mature cedar — the signature of Cuba's finest volcanic growing regions.",
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMxHg5VUIQz2opEFUOvAZaHkGnvXKQ9yDFdsq3RUowHT7ozQeGhkOj4CtmRKiM64Y--LZWrD2SfEqNVNEH5IZUbCwfEJYQpQwwcdMQAeOyCUeYQg-zVwzE-DvSbMRj8Cw_DUs1wIH-vZ_9HgSCJd4UG2wAR0buIJt-vZYQA8hg9avSf8LT23EFKEFs-MFFo7yLtpvTd-wvvXzkeo0sNBrWfsPNQiHid4U8fxXVVtkjV2jsMDW_0AsjU-Q3UH0N9nSdOOHzqSQuD9U',
  },
  {
    id: 'corojo-rosado',
    name: 'Corojo Rosado',
    region: 'CUBA',
    strength: 3, aroma: 4, body: 3,
    notes: ['Floral', 'Sweet', 'Cream'],
    tasting: "Corojo's most celebrated expression. A silky sweet opening evolves into delicate floral notes — prized by master blenders for its ability to soften a bold filler without masking its complexity.",
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxTg65Wt9uZIkpBqyy4dP-yfpAOzZbz2z5ZkV13oVaJ2SAkBidZBFP7grSXlnvgp0rzviZQ5z2QkEdoI5kL1JIAKOIeQwpBh6JQcEGoYgi9hWq5KktjPbu0JFnOgOPJQVxxQ5dzEyYiC6zZsnAzdfCzfC2_n70T7Il7VU5QitXotLyl-tyuOyPD8qOjumx5OXXmnAYMXRe-yumHpuykGEynj_dpEkroC7aiLKuXGRVBObPXsvZ5CI4Og0tcI5Qts4m648an1iWXHk',
  },
  {
    id: 'criollo-98',
    name: "Criollo '98",
    region: 'NICARAGUA',
    strength: 5, aroma: 4, body: 5,
    notes: ['Black Pepper', 'Cocoa', 'Leather'],
    tasting: "Born from the volcanic soils of Estelí. A powerhouse leaf with an assertive pepper profile and deep cocoa undertones that intensify through the final third — not for the timid palate.",
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-wFKd36V8Kte15q8k8B-07-DyWINrytg3jtB6nOkc55ovBl4NALS6YptCCnVeaf3H0BiZaFZyCPhdpRz6cJuFHWafpHgA0bqZij04ksDjTgbbT5XRZzsSojqvCQVT5O8jsyto4qMMBNy06XdXMxckzv0jbOT8tWEt9Nt1Z6g8UILoCRPg0EX6hSOgzhvRWrHCdvSBENZGQ1W5nkASD5aX019MPiabFOQUvieuxQyNse6-qHGoiBrr39deuAFKC3uxypdFhGZN_8U',
  },
  {
    id: 'connecticut-shade',
    name: 'Connecticut Shade',
    region: 'USA',
    strength: 1, aroma: 3, body: 2,
    notes: ['Cream', 'Vanilla', 'Hay'],
    tasting: "Grown under gauze canopies in the Connecticut River Valley. The mildest of wrappers — buttery and light with a natural sweetness that welcomes first-time smokers and calms the most complex fillers.",
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZfnH-MsSB9L3fIvUmuB2jydCCAwvaAMEPJRNZecV6PKAJjHl8HulsTrHI7spXAr_AUXO1qSOOPo_DW4VdixxR-ayV4PnjVm2xiPhwWoFuWAF5PXCEsSlxekHHk-9vi2U4TZZT_qBdTVZ_-asuKsewgotaUAHMpqQqbSTlWGbxa8cyI7OPGMqVK5UT3jPVfaKM9X6uqMaQVfu-wFOCMZ_jY166IMOq2LWncgNMBJG-6FojwRTZejpcpIJ7mK8e1pi_2SjsjN9CTYo',
  },
  {
    id: 'sumatra-maduro',
    name: 'Sumatra Maduro',
    region: 'INDONESIA',
    strength: 4, aroma: 3, body: 4,
    notes: ['Dark Chocolate', 'Coffee', 'Earth'],
    tasting: "Double-fermented to achieve its characteristic dark oily surface. Indonesian Sumatra delivers a rich cocoa sweetness with an earthy undertone — beloved by blenders for its smooth combustion and lingering finish.",
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBktRXv3px18iAdmk-FIbB6ajfhPahwqk9W_JP8Z3CMm5d75I1D5sQYn3y5CtixAGzZo0bWs5yXhZQ8TGcBZxfdlOrRy-X2jzZpEocDLKB-z48LeV4PdnPkWAu1EF0aLxDcp6N-JXmverp_fSYWKdujWH1FrWoLUY1CgVrJguJJeILwvw4JN5SLy70oWxWGRHWFymEXJ3FzmzsY93qIxljsbG1ANTGrbqwoIcmIQ6eUZnCsPhFk08_Z55717Itp90HwmP1ssOO0o',
  },
  {
    id: 'broadleaf-maduro',
    name: 'Broadleaf Maduro',
    region: 'USA',
    strength: 3, aroma: 4, body: 4,
    notes: ['Molasses', 'Dried Fruit', 'Oak'],
    tasting: "Pennsylvania's most prized export. The natural sweetness of Broadleaf Maduro comes entirely from a slow controlled fermentation — no additives. Deep molasses and dried cherry evolve into a long oaken finish.",
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7N47zDRsd9xrna2FHDxZmmuHa9zMDEUx9pMH9OCchjzHa3TdmwiSK8rUNWCu3tQGc-DAewn13cJY0epAJPIuDmMkZDOxrSVbOlyqVToXKvvjL6eG_DDV4N_NgC9R-umyF3Ju6St0MmAbi63vwiC983oWNNS-xjiFcTNM2U0WpVcTXm-UZIbkyIPsqPC1U2cXP_tBIdctZFXNXkmSZml4JE2zbuDf4hyFSqmaSAAOlPQFZcXaAVWIcu0KFWBuNqFEsHk7jQouxUVY',
  },
]

function DotBar({ value, max = 5 }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: i < value ? '#e9c176' : 'rgba(255,255,255,0.1)' }}
        />
      ))}
    </div>
  )
}

function LeafCard({ leaf, index, mounted }) {
  const [flipped, setFlipped] = useState(false)
  const FILL1 = { fontVariationSettings: "'FILL' 1" }

  return (
    <div
      className={`transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${index * 90}ms`, perspective: '1000px', height: '420px' }}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* ── Front Face ── */}
        <div
          className="absolute inset-0 glass-card rounded-2xl overflow-hidden flex flex-col"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Image */}
          <div className="relative h-44 flex-shrink-0 overflow-hidden">
            <img
              src={leaf.img}
              alt={leaf.name}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high/90 to-transparent" />
            <div className="absolute top-3 left-3">
              <span className="gold-foil-border bg-background/80 px-2.5 py-1 rounded-full font-label-sm text-[10px] text-primary uppercase tracking-[0.2em]">
                {leaf.region}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-on-surface mb-3" style={{ fontFamily: '"Playfair Display", serif', fontSize: '18px', fontWeight: 500 }}>
                {leaf.name}
              </h3>
              <div className="space-y-2 mb-4">
                {[['Strength', leaf.strength], ['Aroma', leaf.aroma], ['Body', leaf.body]].map(([lbl, val]) => (
                  <div key={lbl} className="flex items-center justify-between">
                    <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider w-16">{lbl}</span>
                    <DotBar value={val} />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {leaf.notes.map(n => (
                  <span key={n} className="px-2.5 py-1 rounded-full font-label-sm text-[10px] text-on-surface-variant border border-outline-variant/30 uppercase tracking-wider">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setFlipped(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-colors font-label-sm text-[12px] uppercase tracking-widest"
            >
              <span>Study Back</span>
              <span className="material-symbols-outlined text-[14px]">flip</span>
            </button>
          </div>
        </div>

        {/* ── Back Face ── */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(160deg, #2e1c10 0%, #1a1008 100%)',
            border: '1px solid rgba(233,193,118,0.3)',
          }}
        >
          {/* Exam Material Badge */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-primary/10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[16px]" style={FILL1}>workspace_premium</span>
              <span className="font-label-sm text-[10px] text-primary uppercase tracking-[0.2em]">Exam Material</span>
            </div>
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">{leaf.region}</span>
          </div>

          {/* Tasting Note */}
          <div className="flex-1 p-5 flex flex-col justify-center">
            <p className="font-label-sm text-[11px] text-primary uppercase tracking-widest mb-3">
              Master Sommelier's Note
            </p>
            <h3 className="text-primary mb-4" style={{ fontFamily: '"Playfair Display", serif', fontSize: '17px', fontWeight: 500 }}>
              {leaf.name}
            </h3>
            <p
              className="text-on-surface-variant leading-relaxed"
              style={{ fontFamily: '"Playfair Display", serif', fontSize: '14px', fontStyle: 'italic', lineHeight: 1.7 }}
            >
              "{leaf.tasting}"
            </p>
          </div>

          {/* Leaf glow decoration */}
          <div
            className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 100% 100%, rgba(233,193,118,0.07) 0%, transparent 70%)' }}
          />

          <div className="px-5 pb-5">
            <button
              onClick={() => setFlipped(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-colors font-label-sm text-[12px] uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-[14px]">flip_to_front</span>
              <span>Flip Back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Leaves() {
  const navigate  = useNavigate()
  const { addXP, completeStep } = useGuestSession()

  const [mounted,  setMounted]  = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  function handleReady() {
    if (accepted) return
    setAccepted(true)
    addXP(75)
    completeStep('leaves')
    setTimeout(() => navigate('/smokecraft/leaf-challenge'), 400)
  }

  const FILL1 = { fontVariationSettings: "'FILL' 1" }

  return (
    <div
      className="min-h-screen bg-background text-on-surface font-body-md pb-24"
      style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-linen.png')" }}
    >
      {/* Ambient Spotlight */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(233,193,118,0.09) 0%, transparent 65%)' }}
      />

      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="material-symbols-outlined text-primary cursor-pointer p-2 hover:bg-surface-variant/50 rounded-full transition-colors active:scale-95">arrow_back</button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight" style={{ fontSize: '18px' }}>
            CraftHub 360
          </h1>
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

      <main className="pt-28 pb-8 px-gutter max-w-[1440px] mx-auto">

        {/* Progress */}
        <div
          className={`mb-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-[0.2em]">Step 6 of 12</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant italic">Leaf Education</span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < 6 ? 'bg-primary' : 'bg-surface-variant'}`} />
            ))}
          </div>
        </div>

        {/* Headline */}
        <div
          className={`mb-12 max-w-2xl transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '80ms' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-6 bg-primary/60" />
            <span className="font-label-sm text-label-sm text-primary/70 uppercase tracking-[0.25em]">The Study Session</span>
          </div>
          <h2
            className="text-on-surface mb-4"
            style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 600, lineHeight: 1.2 }}
          >
            Know Your <span className="text-primary italic">Leaves</span>
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            Master blenders identify tobacco by sight, texture, and origin before a single leaf is rolled. Study these six varieties — flip each card to unlock the Master Sommelier's tasting note. The recognition challenge follows.
          </p>
        </div>

        {/* Leaf Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter mb-14">
          {VARIETIES.map((leaf, i) => (
            <LeafCard key={leaf.id} leaf={leaf} index={i} mounted={mounted} />
          ))}
        </div>

        {/* Bottom Alert / CTA */}
        <div
          className={`transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '600ms' }}
        >
          <div className="glass-panel rounded-2xl p-8 titanium-border flex flex-col md:flex-row items-center gap-8">
            {/* Icon */}
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[28px]" style={FILL1}>quiz</span>
            </div>

            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-primary mb-1" style={{ fontFamily: '"Playfair Display", serif', fontSize: '20px' }}>
                Ready for the Challenge?
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Flip each card to review the full profile before you proceed. The recognition challenge will test your ability to identify each variety by sight alone — 5 rounds, no retakes.
              </p>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <button
                onClick={handleReady}
                disabled={accepted}
                className="group relative flex items-center gap-3 px-8 py-4 rounded-xl gold-foil overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(233,193,118,0.3)] active:scale-[0.98] disabled:opacity-60 whitespace-nowrap"
              >
                <div className="absolute inset-0 bg-white/15 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                <span className="material-symbols-outlined relative text-on-primary text-[18px]" style={FILL1}>
                  {accepted ? 'check_circle' : 'eco'}
                </span>
                <span className="relative font-label-lg text-label-lg text-on-primary font-bold uppercase tracking-wider">
                  {accepted ? 'Entering Challenge…' : "I'm Ready"}
                </span>
              </button>
              <p className="font-label-sm text-[11px] text-on-surface-variant/50">+75 XP · Unlocks Leaf Challenge</p>
            </div>
          </div>

          {/* Study hint */}
          <p className="text-center mt-4 font-label-sm text-[11px] text-on-surface-variant/40 italic">
            Scroll back up to study any card — or continue when you feel confident.
          </p>
        </div>

      </main>
    </div>
  )
}
