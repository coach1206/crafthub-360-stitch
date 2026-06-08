import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const PHASES = [
  { label: 'Mentor',      icon: 'person'         },
  { label: 'Origins',     icon: 'travel_explore' },
  { label: 'Cultivation', icon: 'nature_people'  },
  { label: 'Blending',    icon: 'science'        },
  { label: 'Identity',    icon: 'diamond'        },
]

const CONTENTS = [
  { icon: 'inventory_2',       label: 'Personalized Vitola Profile',  desc: 'A curated cigar profile built from your flavor DNA and blend choices.'    },
  { icon: 'approval',          label: 'Journey Stamp Collection',     desc: 'Every stamp earned across your SmokeCraft sessions, archived in your Passport.' },
  { icon: 'id_card',           label: 'Cigar Identity Card',          desc: 'A shareable credential revealing your archetype — Diplomat, Scholar, Adventurer, or Señor.' },
  { icon: 'workspace_premium', label: 'Exclusive Lounge Privileges',  desc: 'Priority access, premium humidor reservations, and private sommelier sessions.' },
]

export default function GoldenBox() {
  const navigate = useNavigate()
  const { addXP, addBadge, completeStep } = useGuestSession()

  const [revealed, setRevealed]         = useState(false)
  const [contentsOpen, setContentsOpen] = useState(false)
  const [accepted, setAccepted]         = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 120)
    return () => clearTimeout(t)
  }, [])

  function handleAccept() {
    if (accepted) return
    setAccepted(true)
    triggerHaptic('success')
    addXP(25)
    addBadge({ id: 'golden-box-invitation', name: 'Golden Invitation', icon: 'inventory_2' })
    completeStep('golden-box')
    setTimeout(() => navigate('/smokecraft/art'), 600)
  }

  const FILL1 = { fontVariationSettings: "'FILL' 1" }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md overflow-hidden flex flex-col items-center justify-center relative">

      {/* ── Atmospheric Background ───────────────────────────── */}
      <div className="fixed inset-0 -z-10">
        <img
          alt=""
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBT8AoImWr7lkCUxh9oOvIhM7b9b1fE2tITl6a5C_gfeMTGWefb35buqhuPqsauy_GTNlO4wSr37hsuXVYszrJhVTbZqQ2mJZmqhCpbLbNhe_FXGWeN1lPEg7BLtr6KhMkn-yhinhDFNbZVHcxBGy-rZdYt2urnOdiHftli_wiT2csl_hbghgmProYwvxPXkJzd4QXGnSiw-N4FPcHyOPBwEXc3UlaffLpoLrQNPdVfQ4btSLLyOU35m80_dKCv9SzYk_LKHIOM66U"
          className="w-full h-full object-cover grayscale opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* ── Amber Spotlight ──────────────────────────────────── */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 65% at 50% 42%, rgba(233,193,118,0.13) 0%, transparent 70%)' }}
      />

      {/* ── Ambient Smoke Wisps ──────────────────────────────── */}
      <div
        className="fixed top-0 left-1/4 w-[600px] h-[600px] -z-10 pointer-events-none animated-smoke"
        style={{ background: 'radial-gradient(circle, rgba(233,193,118,0.06) 0%, transparent 70%)' }}
      />
      <div
        className="fixed bottom-0 right-1/4 w-[500px] h-[500px] -z-10 pointer-events-none animated-smoke"
        style={{ background: 'radial-gradient(circle, rgba(197,160,89,0.05) 0%, transparent 70%)', animationDelay: '-7s' }}
      />

      {/* ── Minimal Header ───────────────────────────────────── */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin h-20">
        <div className="flex items-center gap-3">
          <button
            className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-primary/10 active:bg-primary/20 transition-colors duration-300"
            style={{ minWidth: 48, minHeight: 48 }}
            onClick={() => navigate('/smokecraft/enroll')}
            aria-label="Back to Enroll"
          >arrow_back</button>
          <span className="material-symbols-outlined text-primary text-[22px]" style={FILL1}>shield_person</span>
          <span className="font-headline-md text-[18px] font-bold text-primary tracking-tighter">CRAFTHUB 360</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-label-lg text-label-lg text-primary leading-none">Julian Sterling</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.15em] mt-0.5">SmokeCraft Session</p>
          </div>
          <div className="w-9 h-9 rounded-full border border-primary/30 overflow-hidden">
            <img
              alt="Member"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCq4_EpkSpYVcHVlVxnKXJacUbdRmQWEovF-KvyMHM6dJqnGjPivNcRVqPojva00dcFw-6BVVfhI1gFLcaSclOfplLXr3i6MUVX4P-hkoIEfJTKgiHqRbMzmwdN_3t5yChLEGMio7Do167r-rCSqyVByUbYjQFGK9oISPUctIdJqwIGb-QKw2h3XuvSYjbpmyaRpt-JnoQzW41fw_DgeBRzjFoBukHh9bttmrZSUbJTEq5nRcpGZ410InFTORhNwgbrVX3N9_MH0Bo"
            />
          </div>
        </div>
      </header>

      {/* ── Main Stage ───────────────────────────────────────── */}
      <main className="w-full max-w-2xl mx-auto px-gutter flex flex-col items-center text-center gap-10 py-32">

        {/* Box Illustration */}
        <div
          className={`transition-all duration-1000 ease-out ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '0ms' }}
        >
          <div className="relative flex flex-col items-center" style={{ filter: 'drop-shadow(0 0 60px rgba(233,193,118,0.18))' }}>
            {/* Box Lid */}
            <div
              className="relative w-52 rounded-t-sm"
              style={{
                height: '28px',
                background: 'linear-gradient(180deg, #5c3d2e 0%, #3d2b1f 100%)',
                border: '1px solid rgba(233,193,118,0.6)',
                borderBottom: 'none',
              }}
            >
              {/* Hinge center */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full"
                style={{ background: 'linear-gradient(90deg,#c5a059,#e9c176,#c5a059)', boxShadow: '0 0 8px rgba(233,193,118,0.5)' }} />
              {/* Left corner bracket */}
              <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-primary/80" />
              {/* Right corner bracket */}
              <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-primary/80" />
            </div>

            {/* Box Body */}
            <div
              className="relative w-52 flex items-center justify-center"
              style={{
                height: '136px',
                background: 'linear-gradient(160deg, #4a2e1e 0%, #2e1c0f 60%, #3d2b1f 100%)',
                border: '1px solid rgba(233,193,118,0.5)',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
              }}
            >
              {/* Corner brackets */}
              {[
                'top-2 left-2 border-t border-l',
                'top-2 right-2 border-t border-r',
                'bottom-2 left-2 border-b border-l',
                'bottom-2 right-2 border-b border-r',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-3.5 h-3.5 ${cls} border-primary/70`} />
              ))}

              {/* Decorative horizontal band */}
              <div
                className="absolute inset-x-4 top-1/3"
                style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(233,193,118,0.4), transparent)' }}
              />

              {/* Keyhole */}
              <div className="flex flex-col items-center" style={{ gap: '0px' }}>
                <div
                  className="w-5 h-5 rounded-full animate-gold-pulse"
                  style={{ border: '1.5px solid rgba(233,193,118,0.8)', background: '#131314', boxShadow: '0 0 12px rgba(233,193,118,0.3)' }}
                />
                <div
                  className="w-2.5"
                  style={{
                    height: '14px',
                    background: '#131314',
                    border: '1.5px solid rgba(233,193,118,0.8)',
                    borderTop: 'none',
                    borderRadius: '0 0 3px 3px',
                    marginTop: '-1px',
                    boxShadow: '0 4px 8px rgba(233,193,118,0.2)',
                  }}
                />
              </div>

              {/* Side wood-grain lines */}
              {[20, 40, 60, 80].map(pct => (
                <div
                  key={pct}
                  className="absolute left-4 right-4 pointer-events-none"
                  style={{ top: `${pct}%`, height: '1px', background: 'rgba(255,255,255,0.03)' }}
                />
              ))}

              {/* Subtle inner glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(233,193,118,0.08) 0%, transparent 60%)', borderRadius: '0 0 4px 4px' }}
              />
            </div>

            {/* Glow base */}
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-4 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(233,193,118,0.25) 0%, transparent 70%)', filter: 'blur(6px)' }}
            />
          </div>
        </div>

        {/* Headline Block */}
        <div
          className={`space-y-4 transition-all duration-1000 ease-out ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '200ms' }}
        >
          <p className="font-label-lg text-label-lg text-primary/70 uppercase tracking-[0.25em]">A Promise of Craft</p>
          <h1 className="font-headline-xl text-headline-xl text-on-surface" style={{ fontFamily: '"Playfair Display", serif' }}>
            Your Golden Box Awaits
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Inside is a reward curated entirely around you — your palate, your story, your craft. Complete the SmokeCraft journey to earn the right to open it.
          </p>
        </div>

        {/* 5-Phase Lock Tracker */}
        <div
          className={`w-full transition-all duration-1000 ease-out ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '380ms' }}
        >
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-[0.2em] mb-4">Five Phases to Unlock</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {PHASES.map(({ label, icon }) => (
              <div key={label} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full border border-outline-variant/40 bg-surface-container-low flex items-center justify-center transition-colors group-hover:border-primary/30">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant/40">{icon}</span>
                </div>
                <div className="w-4 h-4 rounded-full border border-outline-variant/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[10px] text-on-surface-variant/30">lock</span>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant/50 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(233,193,118,0.2), transparent)' }} />
        </div>

        {/* What's Inside Accordion */}
        <div
          className={`w-full transition-all duration-1000 ease-out ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '520ms' }}
        >
          <button
            onClick={() => setContentsOpen(o => !o)}
            className="flex items-center gap-2 mx-auto text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm uppercase tracking-[0.15em]"
          >
            <span className="material-symbols-outlined text-[16px]">{contentsOpen ? 'expand_less' : 'expand_more'}</span>
            {"What's inside?"}
          </button>
          <div
            className="overflow-hidden transition-all duration-500 ease-in-out"
            style={{ maxHeight: contentsOpen ? '360px' : '0px', opacity: contentsOpen ? 1 : 0 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-left">
              {CONTENTS.map(({ icon, label, desc }) => (
                <div key={label} className="glass-panel p-4 rounded-xl flex items-start gap-3 titanium-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-[18px]" style={FILL1}>{icon}</span>
                  </div>
                  <div>
                    <p className="font-label-lg text-label-lg text-primary mb-0.5">{label}</p>
                    <p className="font-label-sm text-[11px] text-on-surface-variant leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          className={`w-full space-y-4 transition-all duration-1000 ease-out ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '640ms' }}
        >
          <button
            onClick={handleAccept}
            disabled={accepted}
            className="w-full group relative py-5 px-8 rounded-xl gold-foil overflow-hidden transition-all duration-300 hover:shadow-[0_0_50px_rgba(233,193,118,0.35)] active:scale-[0.98] disabled:opacity-60"
          >
            <div className="absolute inset-0 bg-white/15 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            <div className="relative flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-on-primary" style={FILL1}>
                {accepted ? 'check_circle' : 'inventory_2'}
              </span>
              <span className="font-headline-md text-headline-md text-on-primary font-bold tracking-tight">
                {accepted ? 'Challenge Accepted' : 'Accept the Challenge'}
              </span>
            </div>
          </button>
          <p className="font-label-sm text-[11px] text-on-surface-variant/50">
            +25 XP · Golden Invitation Badge · Unlocks the SmokeCraft Journey
          </p>
        </div>

      </main>
    </div>
  )
}
