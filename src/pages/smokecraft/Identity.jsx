import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../../constants/session.js'

const ARCHETYPES = {
  diplomat: {
    key:        'diplomat',
    title:      'The Diplomat',
    icon:       'handshake',
    tagline:    'Smooth. Social. Precise.',
    quote:      "Every room is your stage. Every smoke, your opening act.",
    description: "You approach the humidor the way you approach a room — with intention and grace. Your palate prizes harmony over provocation, and your choices communicate more than words ever could. The Diplomat doesn't demand attention. They earn it.",
    vitola:     'Robusto',
    vitolaNotes: "Four to five inches. A balanced, confident format — commanding without excess.",
    traits:     ['Refined', 'Persuasive', 'Measured'],
    color:      '#e9c176',
    glowColor:  'rgba(233,193,118,0.18)',
    accent:     'rgba(233,193,118,0.15)',
  },
  scholar: {
    key:        'scholar',
    title:      'The Scholar',
    icon:       'menu_book',
    tagline:    'Analytical. Curious. Deep.',
    quote:      "You smoke to understand, not merely to enjoy.",
    description: "You remember terroir, fermentation cycles, and the name of the farm. Where others taste smoke, you read a biography — of soil, climate, and craft. The Scholar is not merely knowledgeable. They are devoted to mastery.",
    vitola:     'Churchill',
    vitolaNotes: "Seven inches of sustained contemplation — the scholar's format, built for long thoughts.",
    traits:     ['Methodical', 'Perceptive', 'Exacting'],
    color:      '#c5d8e8',
    glowColor:  'rgba(197,216,232,0.15)',
    accent:     'rgba(197,216,232,0.10)',
  },
  adventurer: {
    key:        'adventurer',
    title:      'The Adventurer',
    icon:       'explore',
    tagline:    'Bold. Fearless. Unconventional.',
    quote:      "Mild is a language you never learned.",
    description: "Nicaragua over Connecticut. Full over medium. Always. You gravitate toward intensity the way a compass points north — instinctively, without apology. The Adventurer doesn't seek the familiar. They seek the edge of the map.",
    vitola:     'Torpedo',
    vitolaNotes: "Tapered, aggressive, directional. A vitola that announces itself before you light it.",
    traits:     ['Fearless', 'Instinctive', 'Intense'],
    color:      '#ffb95a',
    glowColor:  'rgba(255,185,90,0.18)',
    accent:     'rgba(255,185,90,0.12)',
  },
  senor: {
    key:        'senor',
    title:      'The Señor',
    icon:       'hourglass_top',
    tagline:    'Traditional. Grounded. Timeless.',
    quote:      "Some men chase trends. You preserve them.",
    description: "Cuban seed. Classic vitola. No shortcuts. You are the keeper of tradition in a room full of experiments — and the room is richer for it. The Señor is not resistant to change. They simply know that some things were perfected long ago.",
    vitola:     'Corona',
    vitolaNotes: "The original form. Five and a half inches of unimpeachable heritage.",
    traits:     ['Principled', 'Patient', 'Authoritative'],
    color:      '#d4956a',
    glowColor:  'rgba(212,149,106,0.18)',
    accent:     'rgba(212,149,106,0.12)',
  },
}

function deriveArchetypeKey(session) {
  const scores  = { diplomat: 0, scholar: 0, adventurer: 0, senor: 0 }
  const badges  = (session.badges || []).map(b => b.id)
  const stamps  = (session.smokecraftStamps || []).map(s => s.id)
  const steps   = session.completedSteps || []

  if (badges.includes('leaf-scholar'))          scores.scholar    += 4
  if (badges.includes('botanist'))              scores.scholar    += 2
  if (stamps.includes('leaf-recognition'))      scores.scholar    += 2
  if (steps.includes('leaves'))                 scores.scholar    += 1
  if (session.xp >= 500)                        scores.scholar    += 1

  if (badges.includes('art-appreciation'))      scores.diplomat   += 3
  if (steps.includes('pairing'))                scores.diplomat   += 2
  if (steps.includes('blend'))                  scores.diplomat   += 1

  if (steps.includes('leaf-challenge'))         scores.adventurer += 2
  if (session.xp >= 700)                        scores.adventurer += 1
  if (steps.includes('cultivation'))            scores.adventurer += 1

  if (badges.includes('golden-box-invitation')) scores.senor      += 3
  if (steps.includes('origins'))                scores.senor      += 2
  if (steps.includes('mentor'))                 scores.senor      += 1

  const seed    = parseInt((session.sessionId || '42').slice(-2), 10)
  const keys    = ['diplomat', 'scholar', 'adventurer', 'senor']
  const maxVal  = Math.max(...keys.map(k => scores[k]))
  const winners = keys.filter(k => scores[k] === maxVal)
  return winners[seed % winners.length]
}

// Loading sequence dots
function LoadingDots() {
  const [count, setCount] = useState(1)
  useEffect(() => {
    const t = setInterval(() => setCount(c => (c % 3) + 1), 500)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="inline-block w-8 text-left">
      {'.'.repeat(count)}
    </span>
  )
}

export default function Identity() {
  const navigate = useNavigate()
  const { session, addXP, addBadge, completeStep } = useGuestSession()

  // 'loading' → 'reveal' → 'details'
  const [phase,    setPhase]    = useState('loading')
  const [accepted, setAccepted] = useState(false)

  const archetypeKey = useMemo(() => deriveArchetypeKey(session), [session])
  const archetype    = ARCHETYPES[archetypeKey]
  const rank         = getRankFromXP(session.xp)
  const firstName    = session.profile?.firstName || 'Guest'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'),  2600)
    const t2 = setTimeout(() => setPhase('details'), 3600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  function handleContinue() {
    if (accepted) return
    setAccepted(true)
    addXP(250)
    addBadge({ id: `identity-${archetypeKey}`, name: archetype.title, icon: archetype.icon })
    completeStep('identity')
    setTimeout(() => navigate('/smokecraft/leaderboard'), 500)
  }

  const FILL1 = { fontVariationSettings: "'FILL' 1" }

  /* ── LOADING PHASE ──────────────────────────────────────── */
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-10 relative overflow-hidden">
        <div className="fixed inset-0 -z-10" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(233,193,118,0.07) 0%, transparent 70%)' }} />

        {/* Animated smoke rings */}
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10 pointer-events-none"
            style={{
              width:  `${220 + i * 120}px`,
              height: `${220 + i * 120}px`,
              animation: `drift ${6 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}

        {/* Shield icon with pulse */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{ background: 'radial-gradient(circle, rgba(233,193,118,0.15) 0%, transparent 70%)', transform: 'scale(2)' }}
          />
          <div className="w-24 h-24 rounded-full border border-primary/30 bg-surface-container-low flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[44px]" style={FILL1}>shield_person</span>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-3">
          <p className="font-label-sm text-[11px] text-primary uppercase tracking-[0.3em]">SmokeCraft Identity Analysis</p>
          <p className="text-on-surface-variant" style={{ fontFamily: '"Playfair Display", serif', fontSize: '22px' }}>
            Reading your journey<LoadingDots />
          </p>
          <div className="flex gap-2 justify-center mt-4">
            {['Flavor DNA', 'Mentor Bond', 'Leaf Mastery', 'Terroir'].map((label, i) => (
              <div
                key={label}
                className="px-3 py-1 rounded-full border border-primary/20 font-label-sm text-[10px] text-on-surface-variant/60 uppercase tracking-wider animate-pulse"
                style={{ animationDelay: `${i * 0.4}s` }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── REVEAL PHASE ───────────────────────────────────────── */
  if (phase === 'reveal') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 relative overflow-hidden">
        <div
          className="fixed inset-0 -z-10"
          style={{ background: `radial-gradient(ellipse 65% 65% at 50% 50%, ${archetype.glowColor} 0%, transparent 65%)` }}
        />
        {/* Central reveal orb */}
        <div className="relative flex items-center justify-center" style={{ animation: 'slideIn 0.7s ease-out' }}>
          <div
            className="absolute rounded-full"
            style={{ width: '260px', height: '260px', background: `radial-gradient(circle, ${archetype.glowColor} 0%, transparent 70%)`, filter: 'blur(20px)' }}
          />
          <div
            className="w-40 h-40 rounded-full flex items-center justify-center border"
            style={{ background: `linear-gradient(135deg, ${archetype.accent} 0%, rgba(0,0,0,0.3) 100%)`, borderColor: `${archetype.color}40` }}
          >
            <span
              className="material-symbols-outlined text-[68px]"
              style={{ color: archetype.color, fontVariationSettings: "'FILL' 1" }}
            >
              {archetype.icon}
            </span>
          </div>
        </div>

        <div className="text-center space-y-3" style={{ animation: 'slideIn 0.7s ease-out 0.2s both' }}>
          <p className="font-label-sm text-[11px] uppercase tracking-[0.35em]" style={{ color: archetype.color }}>
            Your SmokeCraft Identity
          </p>
          <h1
            style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(38px, 7vw, 64px)', fontWeight: 600, color: archetype.color, lineHeight: 1.1 }}
          >
            {archetype.title}
          </h1>
          <p className="text-on-surface-variant font-body-lg text-body-lg italic">{archetype.tagline}</p>
        </div>
      </div>
    )
  }

  /* ── DETAILS PHASE ──────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden">

      {/* Atmospheric background */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 70% 55% at 50% 28%, ${archetype.glowColor} 0%, transparent 60%)` }}
      />
      <div className="fixed bottom-0 inset-x-0 h-64 -z-10 pointer-events-none" style={{ background: 'linear-gradient(to top, #131314 0%, transparent 100%)' }} />

      {/* Minimal header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin h-20 bg-surface-container/70 backdrop-blur-xl border-b border-outline-variant/15">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]" style={{ color: archetype.color, fontVariationSettings: "'FILL' 1" }}>shield_person</span>
          <span className="font-headline-md text-[18px] font-bold tracking-tighter" style={{ color: archetype.color }}>CRAFTHUB 360</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-label-lg text-label-lg leading-none" style={{ color: archetype.color }}>{firstName}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.15em] mt-0.5">Identity Ceremony</p>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden" style={{ border: `1px solid ${archetype.color}40` }}>
            <img alt="Member" className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCq4_EpkSpYVcHVlVxnKXJacUbdRmQWEovF-KvyMHM6dJqnGjPivNcRVqPojva00dcFw-6BVVfhI1gFLcaSclOfplLXr3i6MUVX4P-hkoIEfJTKgiHqRbMzmwdN_3t5yChLEGMio7Do167r-rCSqyVByUbYjQFGK9oISPUctIdJqwIGb-QKw2h3XuvSYjbpmyaRpt-JnoQzW41fw_DgeBRzjFoBukHh9bttmrZSUbJTEq5nRcpGZ410InFTORhNwgbrVX3N9_MH0Bo"
            />
          </div>
        </div>
      </header>

      <main className="pt-28 pb-24 px-margin max-w-[900px] mx-auto">

        {/* Hero Block */}
        <div className="text-center mb-16" style={{ animation: 'slideIn 0.6s ease-out' }}>

          {/* Icon orb */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <div
              className="absolute rounded-full pointer-events-none"
              style={{ width: '200px', height: '200px', background: `radial-gradient(circle, ${archetype.glowColor} 0%, transparent 70%)`, filter: 'blur(16px)' }}
            />
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${archetype.accent} 0%, rgba(19,19,20,0.8) 100%)`, border: `1px solid ${archetype.color}35` }}
            >
              <span className="material-symbols-outlined text-[52px]" style={{ color: archetype.color, fontVariationSettings: "'FILL' 1" }}>
                {archetype.icon}
              </span>
            </div>
          </div>

          {/* Rank callout (separate from identity) */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-8" style={{ background: archetype.color }} />
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-[0.25em]">
              {rank.name} · {session.xp} XP Earned
            </span>
            <div className="h-px w-8" style={{ background: archetype.color }} />
          </div>

          <p className="font-label-sm text-[12px] uppercase tracking-[0.3em] mb-3" style={{ color: archetype.color }}>
            Your SmokeCraft Identity
          </p>
          <h1
            className="mb-3"
            style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 600, color: archetype.color, lineHeight: 1.1 }}
          >
            {archetype.title}
          </h1>
          <p className="text-on-surface-variant font-body-lg text-body-lg italic mb-6">{archetype.tagline}</p>

          {/* Traits */}
          <div className="flex justify-center gap-3 flex-wrap">
            {archetype.traits.map(trait => (
              <span
                key={trait}
                className="px-4 py-1.5 rounded-full font-label-sm text-[12px] uppercase tracking-widest"
                style={{ background: archetype.accent, border: `1px solid ${archetype.color}30`, color: archetype.color }}
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Two-column details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-12">

          {/* Description Card */}
          <div
            className="rounded-2xl p-7 flex flex-col gap-5"
            style={{ background: `linear-gradient(135deg, ${archetype.accent} 0%, rgba(31,31,32,0.4) 100%)`, border: `1px solid ${archetype.color}20` }}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]" style={{ color: archetype.color, fontVariationSettings: "'FILL' 1" }}>person</span>
              <span className="font-label-sm text-[11px] uppercase tracking-[0.2em]" style={{ color: archetype.color }}>Profile</span>
            </div>
            <p
              className="text-on-surface leading-relaxed flex-1"
              style={{ fontFamily: '"Playfair Display", serif', fontSize: '16px', fontStyle: 'italic', lineHeight: 1.75 }}
            >
              "{archetype.description}"
            </p>
          </div>

          {/* Right column: Vitola + Quote */}
          <div className="flex flex-col gap-gutter">

            {/* Vitola Card */}
            <div
              className="rounded-2xl p-6 flex items-start gap-4"
              style={{ background: 'rgba(31,31,32,0.6)', border: `1px solid ${archetype.color}18` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: archetype.accent }}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ color: archetype.color }}>smoking_rooms</span>
              </div>
              <div>
                <p className="font-label-sm text-[11px] uppercase tracking-[0.2em] mb-1" style={{ color: archetype.color }}>Ideal Vitola</p>
                <p className="text-on-surface mb-2" style={{ fontFamily: '"Playfair Display", serif', fontSize: '22px', fontWeight: 500 }}>
                  {archetype.vitola}
                </p>
                <p className="font-label-sm text-[12px] text-on-surface-variant leading-relaxed">{archetype.vitolaNotes}</p>
              </div>
            </div>

            {/* Quote Card */}
            <div
              className="rounded-2xl p-6 flex-1 flex items-center"
              style={{ background: 'rgba(31,31,32,0.4)', border: `1px solid ${archetype.color}18` }}
            >
              <div>
                <span className="material-symbols-outlined text-[28px] mb-3 block" style={{ color: `${archetype.color}50` }}>format_quote</span>
                <p
                  className="text-on-surface"
                  style={{ fontFamily: '"Playfair Display", serif', fontSize: '18px', fontStyle: 'italic', lineHeight: 1.6 }}
                >
                  "{archetype.quote}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rank vs Identity callout */}
        <div
          className="rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-center gap-5 glass-panel titanium-border"
        >
          <div className="flex-1 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ color: rank.color, fontVariationSettings: "'FILL' 1" }}>{rank.icon}</span>
            </div>
            <div>
              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">Your Rank</p>
              <p className="font-label-lg text-label-lg text-on-surface">{rank.name} — {session.xp} XP</p>
              <p className="font-label-sm text-[11px] text-on-surface-variant/60 mt-0.5">Rank reflects your journey progress</p>
            </div>
          </div>
          <div className="w-px h-10 bg-outline-variant/30 hidden sm:block" />
          <div className="flex-1 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: archetype.accent }}>
              <span className="material-symbols-outlined text-[20px]" style={{ color: archetype.color, fontVariationSettings: "'FILL' 1" }}>{archetype.icon}</span>
            </div>
            <div>
              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">Your Identity</p>
              <p className="font-label-lg text-label-lg text-on-surface">{archetype.title}</p>
              <p className="font-label-sm text-[11px] text-on-surface-variant/60 mt-0.5">Identity reflects your personality</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleContinue}
            disabled={accepted}
            className="group relative w-full max-w-md py-5 rounded-xl overflow-hidden transition-all duration-300 active:scale-[0.98] disabled:opacity-60"
            style={{
              background:  `linear-gradient(135deg, ${archetype.color} 0%, #c5a059 100%)`,
              boxShadow:   accepted ? 'none' : `0 0 50px ${archetype.glowColor}`,
            }}
          >
            <div className="absolute inset-0 bg-white/15 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            <div className="relative flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-on-primary" style={FILL1}>
                {accepted ? 'check_circle' : 'leaderboard'}
              </span>
              <span className="font-headline-md text-headline-md text-on-primary font-bold tracking-tight">
                {accepted ? 'Identity Sealed' : 'See the Lounge Ranking'}
              </span>
            </div>
          </button>
          <p className="font-label-sm text-[11px] text-on-surface-variant/50">
            +250 XP · {archetype.title} Badge · Unlocks Leaderboard
          </p>
        </div>

      </main>
    </div>
  )
}
