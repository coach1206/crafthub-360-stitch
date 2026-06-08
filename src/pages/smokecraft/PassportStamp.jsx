import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const GOLD_TEXT = {
  background: 'linear-gradient(135deg, #e9c176 0%, #c5a059 50%, #775a19 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  filter: 'drop-shadow(0.5px 0.5px 0px rgba(0,0,0,0.2))',
}

const PARCHMENT = {
  backgroundColor: '#fdfaf3',
  backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")',
  boxShadow: 'inset 0 0 100px rgba(0,0,0,0.05)',
}

const SPINE = {
  background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.15) 100%)',
}

const ROTATIONS = [-3, 8, -5, 12, -2, 6, -8, 4]

function StampCard({ stamp, index, delay }) {
  return (
    <div style={{
      border: '2px solid rgba(197,160,89,0.4)',
      borderRadius: 8,
      padding: '18px 22px',
      background: 'rgba(255,255,255,0.06)',
      transform: `rotate(${ROTATIONS[index % ROTATIONS.length]}deg)`,
      position: 'relative',
      display: 'inline-flex',
      flexDirection: 'column',
      gap: 6,
      animation: `stampReveal 0.5s ease ${delay}s both`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 34, ...GOLD_TEXT, ...FILL1 }}>
          {stamp.icon}
        </span>
        <div>
          <div className="font-headline-md" style={{ fontSize: 17, fontWeight: 700, ...GOLD_TEXT }}>{stamp.name}</div>
          <div className="font-label-sm" style={{ color: 'rgba(60,45,40,0.6)', fontSize: 11, marginTop: 2 }}>
            SmokeCraft 360 — Session I
          </div>
        </div>
      </div>
      <div style={{
        borderTop: '1px solid rgba(197,160,89,0.3)',
        paddingTop: 7,
        textAlign: 'center',
        fontSize: 9,
        color: 'rgba(60,45,40,0.4)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}>Certified Seal</div>
      <div style={{
        position: 'absolute', inset: -4,
        border: '1px solid rgba(197,160,89,0.15)',
        borderRadius: 10,
        pointerEvents: 'none',
      }} />
    </div>
  )
}

function EmptySlot({ label }) {
  return (
    <div style={{
      border: '2px dashed rgba(197,160,89,0.2)',
      borderRadius: 8,
      padding: '28px 24px',
      textAlign: 'center',
    }}>
      <p className="font-label-sm" style={{ color: 'rgba(60,45,40,0.35)', fontSize: 11 }}>{label}</p>
    </div>
  )
}

export default function PassportStamp() {
  const navigate = useNavigate()
  const { session, addXP, completeStep, awardStamp, addBadge } = useGuestSession()
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (session.completedSteps.includes('passport-stamp')) return
    completeStep('passport-stamp')
    addXP(XP_AWARDS.PASSPORT_STAMP)
    awardStamp('passport-stamp', 'passport-stamp')
    addBadge({ id: 'passport-certified', label: 'Passport Certified', icon: 'menu_book' })
  }, [])

  const stamps = session.smokecraftStamps ?? []
  const left  = stamps.slice(0, 2)
  const right = stamps.slice(2)
  const displayName = session.profile?.firstName
    ? `${session.profile.firstName} ${session.profile.lastName || ''}`.trim()
    : 'Grand Member'

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden" style={{ minHeight: 'max(884px, 100dvh)' }}>
      <style>{`
        @keyframes stampReveal {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Cinematic backdrop */}
      <div className="fixed inset-0 -z-10">
        <img
          className="w-full h-full object-cover"
          style={{ opacity: 0.22, filter: 'brightness(0.6)' }}
          src="https://lh3.googleusercontent.com/aida/AP1WRLtj5JwkrPxrixCHOG-zYc0I132qSqfPBoOMSk6vfHero4WAiBipQc-lZT7hXU1GpL6px8LH9kYjGodZhH3N8nj4PPbYOxr9GAZPkrO0051iTZg7S8ugdj8Jjhb1Nk1ypTQVWHqE6FAxbE10qnVi4vZsWlx-ERtDmWU97juw1txqVGwGBCCyPBZ0d56Ipsq-2AoFCMCvEkr3KBKpxovN6AFO6VxoRAIzzw3xk5lxCphgeEU6xTGCqGzLaag"
          alt=""
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #131314 0%, rgba(19,19,20,0.88) 55%, rgba(19,19,20,0.55) 100%)' }} />
      </div>

      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-gutter bg-surface-dim/80 backdrop-blur-xl border-b border-primary/20 shadow-md" style={{ height: 80 }}>
        <div className="flex items-center gap-4">
          <button
            className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-primary/10 transition-colors duration-300"
            onClick={() => navigate('/smokecraft/session-complete')}
          >arrow_back</button>
          <h1 className="font-display-lg text-primary uppercase tracking-widest" style={{ fontSize: 20 }}>The 360 Passport</h1>
        </div>
        <span className="hidden md:block font-label-lg text-label-lg text-primary tracking-widest uppercase">Grand Lounge</span>
      </header>

      <main className="pt-32 pb-44 px-gutter max-w-[1440px] mx-auto">

        {/* Hero */}
        <section
          className="text-center mb-16"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
        >
          <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.3em] mb-4">SmokeCraft Journey Complete</p>
          <h2
            className="font-display-lg text-on-surface leading-tight mb-6"
            style={{ fontSize: 'clamp(34px,5.5vw,60px)', lineHeight: 1.1 }}
          >
            Your Passport Has<br />
            <em className="text-primary">Been Certified</em>
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mx-auto mb-8" style={{ maxWidth: 560 }}>
            {stamps.length} seal{stamps.length !== 1 ? 's' : ''} of craft earned, {displayName}.
            Your SmokeCraft achievements are permanently inscribed in your 360 Passport.
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-primary/30 bg-primary/5">
            <span className="material-symbols-outlined text-primary" style={{ ...FILL1, fontSize: 20 }}>stars</span>
            <span className="font-label-lg text-label-lg text-primary">+{XP_AWARDS.PASSPORT_STAMP} XP &mdash; PASSPORT CERTIFIED</span>
          </div>
        </section>

        {/* Passport Booklet */}
        <div
          className="relative max-w-5xl mx-auto rounded-2xl shadow-2xl flex overflow-hidden mb-16"
          style={{
            background: '#2a1800',
            padding: 'clamp(12px, 2vw, 32px)',
            minHeight: 380,
            opacity: revealed ? 1 : 0,
            transform: revealed
              ? 'perspective(1400px) rotateY(0deg)'
              : 'perspective(1400px) rotateY(-10deg)',
            transition: 'opacity 0.9s ease 0.15s, transform 0.9s ease 0.15s',
          }}
        >
          {/* Left Page */}
          <div className="relative flex-1 rounded-l-lg border-r border-black/10 p-8 overflow-hidden" style={PARCHMENT}>
            <div className="absolute inset-0 pointer-events-none" style={SPINE} />
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-label-sm uppercase tracking-widest" style={{ color: 'rgba(60,45,40,0.5)', fontSize: 11 }}>SmokeCraft 360</p>
                  <h3 className="font-headline-md italic" style={{ color: '#3c2d28', marginTop: 2, fontSize: 22 }}>Earned Seals of Craft</h3>
                </div>
                <div className="select-none" style={{ color: 'rgba(60,45,40,0.13)', fontFamily: 'Playfair Display', fontSize: 17, transform: 'rotate(-12deg)' }}>PAGE 01</div>
              </div>
              {left.length > 0
                ? left.map((s, i) => <StampCard key={s.id} stamp={s} index={i} delay={0.4 + i * 0.18} />)
                : <EmptySlot label="No seals earned yet" />
              }
            </div>
          </div>

          {/* Right Page */}
          <div className="relative flex-1 rounded-r-lg border-l border-white/40 p-8 overflow-hidden" style={PARCHMENT}>
            <div className="absolute bottom-0 right-0 w-20 h-20 rounded-tl-3xl z-20 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.1) 100%)' }}
            />
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="font-label-sm uppercase tracking-widest" style={{ color: 'rgba(60,45,40,0.5)', fontSize: 11 }}>Entry Log</p>
                  <p className="font-body-md" style={{ color: 'rgba(60,45,40,0.72)' }}>Vol. I &mdash; Elite Circuits</p>
                </div>
              </div>
              {right.length > 0
                ? right.map((s, i) => <StampCard key={s.id} stamp={s} index={i + 2} delay={0.58 + i * 0.18} />)
                : <EmptySlot label="More seals unlock in future sessions" />
              }
              <div className="mt-auto flex justify-end gap-2 pt-4" style={{ color: 'rgba(60,45,40,0.16)' }}>
                <span className="material-symbols-outlined">verified_user</span>
                <span className="material-symbols-outlined">history_edu</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div
          className="flex flex-wrap justify-center gap-6"
          style={{ opacity: revealed ? 1 : 0, transition: 'opacity 0.6s ease 0.6s' }}
        >
          <button
            onClick={() => navigate('/passport')}
            className="flex items-center gap-4 text-on-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300"
            style={{
              height: 72, paddingInline: 48,
              background: 'linear-gradient(135deg, #e9c176, #c5a059)',
              boxShadow: '0 4px 24px rgba(233,193,118,0.35)',
            }}
          >
            <span className="material-symbols-outlined" style={FILL1}>menu_book</span>
            Open My Passport
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-4 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300"
            style={{ height: 72, paddingInline: 48 }}
          >
            Return to CraftHub
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center bg-surface-container-low/95 backdrop-blur-2xl border-t border-primary/30 shadow-[0_-4px_20px_rgba(233,193,118,0.15)] rounded-t-xl" style={{ height: 80, paddingBottom: 4 }}>
        {[
          { icon: 'explore',       label: 'Explore',   to: '/',        locked: false },
          { icon: 'inventory_2',   label: 'Inventory', to: null,       locked: true  },
          { icon: 'menu_book',     label: 'Passport',  to: '/passport', active: true  },
          { icon: 'support_agent', label: 'Assistant', to: null,       locked: true  },
        ].map(({ icon, label, to, active, locked }) => (
          <button
            key={label}
            onClick={() => { if (!locked && to) navigate(to) }}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-all duration-300 ${
              locked
                ? 'text-on-surface-variant/30 cursor-not-allowed opacity-40'
                : active
                  ? 'text-primary bg-primary-container/20 rounded-xl shadow-[0_0_15px_rgba(233,193,118,0.3)] -translate-y-1'
                  : 'text-on-surface-variant/70 opacity-60 hover:text-primary hover:opacity-100 active:scale-90'
            }`}
            style={{ minHeight: 56 }}
          >
            <span className="material-symbols-outlined" style={active ? FILL1 : undefined}>{icon}</span>
            <span className="font-label-sm text-label-sm mt-0.5">{locked ? 'Soon' : label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
