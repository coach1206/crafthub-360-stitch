import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../../constants/session.js'

// APPROVED SMOKECRAFT VISUAL RULE: no stock-photo fallback URLs. If a real image is missing, render "Portrait pending" only.
function GoldenBoxImage({ src, alt, className, style }) {
  const [failed, setFailed] = useState(!src)
  if (!failed && src) {
    return (
      <img className={className} style={style} alt={alt} src={src} onError={() => setFailed(true)} />
    )
  }
  return (
    <div className={className} style={{
      ...style,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,6,3,0.85)', border: '1px solid rgba(233,193,118,0.24)',
      color: 'rgba(233,193,118,0.5)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
    }}>
      Portrait pending
    </div>
  )
}

const TIERS = [
  {
    id:       'novice',
    label:    'Introductory Box',
    rank:     'Novice',
    xpRange:  '0–199 XP',
    minXP:    0,
    icon:     'inventory_2',
    badge:    'Classic Selection',
    contents: [
      'One curated Connecticut Shade Robusto',
      'Origin card & illustrated tasting guide',
      'Welcome letter from the Master Blender',
      'Cedar spill & gold cutter',
    ],
    description: "Your first curated experience — a single, flawless Robusto chosen to introduce your palate to the art of premium tobacco.",
  },
  {
    id:       'enthusiast',
    label:    'Discovery Box',
    rank:     'Enthusiast',
    xpRange:  '200–499 XP',
    minXP:    200,
    icon:     'inventory_2',
    badge:    'Curated Discovery',
    contents: [
      'Two cigars: one mild, one medium-bodied',
      'Regional origin map (Dominican & Nicaraguan)',
      'Flavor DNA primer card',
      'Personalized tasting journal — leather-bound',
    ],
    description: "A curated pair across two flavor profiles — designed to map the range of your palate and document what you discover.",
  },
  {
    id:       'connoisseur',
    label:    "Blender's Selection",
    rank:     'Connoisseur',
    xpRange:  '500–899 XP',
    minXP:    500,
    icon:     'workspace_premium',
    badge:    "Blender's Reserve",
    contents: [
      'Three hand-selected vitolas from the Master Reserve',
      'Master Blender handwritten tasting notes',
      'Cutter, cedar spill & matches — engraved case',
      'Private Lounge Reservation (45 minutes)',
    ],
    description: "Three vitolas. Three stories. A private reservation to smoke them with intention, guided by notes written by the blender himself.",
  },
  {
    id:       'aficionado',
    label:    'Grand Reserve',
    rank:     'Aficionado',
    xpRange:  '900+ XP',
    minXP:    900,
    icon:     'diamond',
    badge:    'Grand Reserve Prestige',
    contents: [
      'Five aged Grand Reserve cigars — hand-selected',
      'Personal Master Blender session (90 minutes)',
      'Engraved humidor key — lounge access credential',
      'Inaugural Passport Certificate — framed',
      'Complimentary spirit pairing for your session',
    ],
    description: "The pinnacle of the SmokeCraft journey. Five aged Grand Reserve cigars, an engraved key, a private session, and a framed Passport Certificate to mark your achievement.",
  },
]

function TierCard({ tier, isUnlocked, isActive, onSelect, selected }) {
  const FILL1      = { fontVariationSettings: "'FILL' 1" }
  const isSelected = selected === tier.id

  const RANK_COLOR = {
    Novice:      '#9a8f80',
    Enthusiast:  '#c8a060',
    Connoisseur: '#ffb95a',
    Aficionado:  '#e9c176',
  }
  const color = RANK_COLOR[tier.rank]

  return (
    <div
      onClick={() => isUnlocked && onSelect(tier.id)}
      className={`
        rounded-2xl transition-all duration-300 overflow-hidden
        ${isUnlocked ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
        ${isActive ? 'ring-2' : isSelected ? 'ring-1' : ''}
      `}
      style={{
        background:  isActive
          ? `linear-gradient(135deg, rgba(233,193,118,0.12) 0%, rgba(233,193,118,0.04) 100%)`
          : 'rgba(31,31,32,0.6)',
        border:      isActive ? `1px solid ${color}50` : '1px solid rgba(255,255,255,0.06)',
        ringColor:   isActive ? color : undefined,
      }}
    >
      {/* Tier Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: isActive ? `${color}20` : 'rgba(255,255,255,0.05)' }}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ color: isActive ? color : '#9a8f80', fontVariationSettings: "'FILL' 1" }}>
              {tier.icon}
            </span>
          </div>
          <div>
            <p className="font-label-sm text-[10px] uppercase tracking-[0.2em]" style={{ color: isActive ? color : '#9a8f80' }}>
              {tier.rank}
            </p>
            <p className="text-on-surface" style={{ fontFamily: '"Playfair Display", serif', fontSize: '17px', fontWeight: 500 }}>
              {tier.label}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span
            className="font-label-sm text-[11px] px-2.5 py-1 rounded-full"
            style={{
              background: `${color}15`,
              border:     `1px solid ${color}25`,
              color,
            }}
          >
            {tier.xpRange}
          </span>
        </div>
      </div>

      {/* Tier Body — expanded when active or selected */}
      {(isActive || isSelected) && (
        <div className="p-5 space-y-4">
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed italic" style={{ fontFamily: '"Playfair Display", serif', fontSize: '14px' }}>
            "{tier.description}"
          </p>
          <div className="space-y-2.5">
            {tier.contents.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[15px] flex-shrink-0 mt-0.5" style={{ color, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-label-sm text-[13px] text-on-surface leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
          {isActive && (
            <div
              className="mt-2 px-4 py-2 rounded-lg flex items-center gap-2"
              style={{ background: `${color}12`, border: `1px solid ${color}25` }}
            >
              <span className="material-symbols-outlined text-[15px]" style={{ color, fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="font-label-sm text-[11px] uppercase tracking-wider" style={{ color }}>Your tier — ready to claim</span>
            </div>
          )}
        </div>
      )}

      {/* Locked indicator */}
      {!isUnlocked && (
        <div className="px-5 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40">lock</span>
          <span className="font-label-sm text-[11px] text-on-surface-variant/40">Requires {tier.xpRange}</span>
        </div>
      )}
    </div>
  )
}

export default function GoldenBoxStatus() {
  const navigate = useNavigate()
  const { session, addXP, addBadge, awardStamp, updateGoldenBoxProgress, completeStep } = useGuestSession()

  const [mounted,   setMounted]   = useState(false)
  const [selected,  setSelected]  = useState(null)
  const [lidOpen,   setLidOpen]   = useState(false)
  const [claimed,   setClaimed]   = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 80)
    const t2 = setTimeout(() => setLidOpen(true),  600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const rank     = getRankFromXP(session.xp)
  const guestXP  = session.xp
  const currentTier = useMemo(() => {
    const eligible = TIERS.filter(t => guestXP >= t.minXP)
    return eligible[eligible.length - 1] || TIERS[0]
  }, [guestXP])

  const RANK_COLOR = {
    Novice:      '#9a8f80',
    Enthusiast:  '#c8a060',
    Connoisseur: '#ffb95a',
    Aficionado:  '#e9c176',
  }
  const tierColor = RANK_COLOR[currentTier.rank]

  function handleClaim() {
    if (claimed) return
    setClaimed(true)
    addXP(50)
    addBadge({ id: `golden-box-${currentTier.id}`, name: currentTier.badge, icon: currentTier.icon })
    awardStamp('golden-box', 'golden-box-status')
    updateGoldenBoxProgress({ tier: currentTier.id, claimed: true, badge: currentTier.badge })
    completeStep('golden-box-status')
    setTimeout(() => navigate('/smokecraft/passport-stamp'), 600)
  }

  const FILL1 = { fontVariationSettings: "'FILL' 1" }
  const firstName = session.profile?.firstName || 'Guest'

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden">

      {/* Atmospheric glow tuned to tier color */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 65% 50% at 50% 25%, ${RANK_COLOR[currentTier.rank]}18 0%, transparent 65%)` }}
      />

      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="material-symbols-outlined text-primary p-2 hover:bg-surface-variant/50 transition-colors rounded-full active:scale-95">arrow_back</button>
          <span className="font-headline-md text-[18px] font-bold text-primary tracking-tighter">CRAFTHUB 360</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="font-label-lg text-label-lg text-primary leading-none">{firstName}</p>
            <p className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">{rank.name} · {guestXP} XP</p>
          </div>
          <div className="w-9 h-9 rounded-full border border-primary/30 overflow-hidden">
            <GoldenBoxImage alt="Member" className="w-full h-full object-cover" src={null} />
          </div>
        </div>
      </header>

      <main className="pt-28 pb-28 px-margin max-w-[800px] mx-auto">

        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(201,168,76,0.28)', marginBottom: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
          <img src="/assets/smokecraft-reference/approved/smokecraft-golden-box-status.png" alt="Golden Box Status" style={{ display: 'block', width: '100%', minHeight: 260, maxHeight: 420, objectFit: 'cover', objectPosition: 'center top' }} />
        </div>

        {/* ── Cinematic Open Box ───────────────────────────────── */}
        <div
          className={`flex justify-center mb-12 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="relative" style={{ filter: `drop-shadow(0 0 60px ${tierColor}25)` }}>
            {/* Lid — animates open */}
            <div
              className="relative w-56 transition-all duration-700 ease-out"
              style={{
                height:              '28px',
                background:          'linear-gradient(180deg, #5c3d2e 0%, #3d2b1f 100%)',
                border:              '1px solid rgba(233,193,118,0.5)',
                borderBottom:        'none',
                transformOrigin:     'bottom center',
                transform:           lidOpen ? 'rotateX(-65deg) translateY(-8px)' : 'rotateX(0deg)',
                borderRadius:        '2px 2px 0 0',
              }}
            >
              {/* Hinge */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full"
                style={{ background: 'linear-gradient(90deg, #c5a059, #e9c176, #c5a059)', boxShadow: '0 0 8px rgba(233,193,118,0.5)' }} />
              <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-primary/80" />
              <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-primary/80" />
            </div>

            {/* Box Body — open, with golden glow inside */}
            <div
              className="relative w-56 flex items-center justify-center overflow-hidden"
              style={{
                height:     '136px',
                background: 'linear-gradient(160deg, #4a2e1e 0%, #2e1c0f 60%, #3d2b1f 100%)',
                border:     '1px solid rgba(233,193,118,0.5)',
                borderTop:  'none',
                borderRadius: '0 0 4px 4px',
              }}
            >
              {/* Inner glow when open */}
              <div
                className="absolute inset-0 transition-opacity duration-700"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${tierColor}25 0%, transparent 70%)`,
                  opacity:     lidOpen ? 1 : 0,
                }}
              />

              {/* Corner brackets */}
              {['top-2 left-2 border-t border-l', 'top-2 right-2 border-t border-r', 'bottom-2 left-2 border-b border-l', 'bottom-2 right-2 border-b border-r'].map((cls, i) => (
                <div key={i} className={`absolute w-3.5 h-3.5 ${cls} border-primary/70`} />
              ))}

              {/* Tier badge inside box */}
              <div
                className={`relative flex flex-col items-center gap-1 transition-all duration-500 ${lidOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: '400ms' }}
              >
                <span className="material-symbols-outlined text-[32px]" style={{ color: tierColor, fontVariationSettings: "'FILL' 1" }}>
                  {currentTier.icon}
                </span>
                <span className="font-label-sm text-[11px] uppercase tracking-[0.2em]" style={{ color: tierColor }}>
                  {currentTier.badge}
                </span>
              </div>
            </div>

            {/* Glow base */}
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-44 h-4"
              style={{ background: `radial-gradient(ellipse, ${tierColor}30 0%, transparent 70%)`, filter: 'blur(6px)' }}
            />
          </div>
        </div>

        {/* ── Headline ─────────────────────────────────────────── */}
        <div
          className={`text-center mb-12 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '200ms' }}
        >
          <p className="font-label-sm text-[11px] uppercase tracking-[0.3em] mb-3" style={{ color: tierColor }}>
            Your Journey, Your Reward
          </p>
          <h1
            className="text-on-surface mb-4"
            style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 600, lineHeight: 1.2 }}
          >
            The <span style={{ color: tierColor }}>{currentTier.label}</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-md mx-auto">
            Based on your <strong className="text-on-surface">{guestXP} XP</strong> earned across this SmokeCraft session, your Golden Box has been sealed at the <strong style={{ color: tierColor }}>{currentTier.rank}</strong> tier.
          </p>
        </div>

        {/* ── Tier Cards ───────────────────────────────────────── */}
        <div
          className={`space-y-3 mb-12 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '320ms' }}
        >
          {TIERS.map(tier => (
            <TierCard
              key={tier.id}
              tier={tier}
              isUnlocked={guestXP >= tier.minXP}
              isActive={tier.id === currentTier.id}
              selected={selected}
              onSelect={setSelected}
            />
          ))}
        </div>

        {/* ── Next Tier Nudge ──────────────────────────────────── */}
        {currentTier.id !== 'aficionado' && (() => {
          const nextIdx  = TIERS.findIndex(t => t.id === currentTier.id) + 1
          const nextTier = TIERS[nextIdx]
          const needed   = nextTier ? nextTier.minXP - guestXP : 0
          if (!nextTier || needed <= 0) return null
          return (
            <div
              className={`glass-panel rounded-2xl p-5 titanium-border mb-10 flex items-center gap-4 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '480ms' }}
            >
              <span className="material-symbols-outlined text-primary text-[24px]" style={FILL1}>trending_up</span>
              <p className="font-body-md text-body-md text-on-surface-variant flex-1">
                Earn <strong className="text-primary">{needed} more XP</strong> to unlock the{' '}
                <strong className="text-on-surface">{nextTier.label}</strong> on your next visit.
              </p>
            </div>
          )
        })()}

        {/* ── Claim CTA ────────────────────────────────────────── */}
        <div
          className={`flex flex-col items-center gap-3 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '560ms' }}
        >
          <button
            onClick={handleClaim}
            disabled={claimed}
            className="group relative w-full py-5 rounded-xl overflow-hidden transition-all duration-300 active:scale-[0.98] disabled:opacity-60"
            style={{
              background: `linear-gradient(135deg, ${tierColor} 0%, #c5a059 100%)`,
              boxShadow:  claimed ? 'none' : `0 0 50px ${tierColor}30`,
            }}
          >
            <div className="absolute inset-0 bg-white/15 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            <div className="relative flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-on-primary" style={FILL1}>
                {claimed ? 'check_circle' : 'inventory_2'}
              </span>
              <span className="font-headline-md text-headline-md text-on-primary font-bold tracking-tight">
                {claimed ? 'Box Claimed — Proceeding…' : `Claim the ${currentTier.label}`}
              </span>
            </div>
          </button>
          <p className="font-label-sm text-[11px] text-on-surface-variant/50">
            +50 XP · {currentTier.badge} Badge · Leaf Recognition Stamp · Unlocks Passport Stamp
          </p>
        </div>

      </main>
    </div>
  )
}
