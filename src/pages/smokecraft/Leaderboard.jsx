import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../../constants/session.js'

const CURATED_MEMBERS = [
  { id: 'marco',    name: 'Marco Del Valle',   initials: 'MD', xp: 1580, hue: 210 },
  { id: 'seb',      name: 'Sebastian Harrow',  initials: 'SH', xp: 1440, hue: 160 },
  { id: 'vincent',  name: 'Vincent Ashworth',  initials: 'VA', xp: 1285, hue: 280 },
  { id: 'rafael',   name: 'Rafael Cienfuegos', initials: 'RC', xp: 1100, hue: 340 },
  { id: 'damian',   name: 'Damian Wren',       initials: 'DW', xp:  945, hue:  30 },
  { id: 'oliver',   name: 'Oliver Thane',      initials: 'OT', xp:  745, hue: 180 },
  { id: 'james',    name: 'James Whitmore',    initials: 'JW', xp:  445, hue:  90 },
  { id: 'carter',   name: 'Carter Ellwood',    initials: 'CE', xp:  285, hue: 240 },
  { id: 'thomas',   name: 'Thomas Brandt',     initials: 'TB', xp:  145, hue:  60 },
]

const RANK_COLORS = {
  Aficionado:  '#e9c176',
  Connoisseur: '#ffb95a',
  Enthusiast:  '#c8a060',
  Novice:      '#9a8f80',
}

function MemberAvatar({ initials, hue, size = 40, isGuest = false }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 select-none"
      style={{
        width:      size,
        height:     size,
        fontSize:   size * 0.34,
        background: isGuest
          ? 'linear-gradient(135deg, #e9c176 0%, #c5a059 100%)'
          : `hsl(${hue}, 30%, 28%)`,
        border:     isGuest
          ? '2px solid rgba(233,193,118,0.8)'
          : '1px solid rgba(255,255,255,0.08)',
        color:      isGuest ? '#131314' : `hsl(${hue}, 60%, 80%)`,
      }}
    >
      {initials}
    </div>
  )
}

function RankPill({ rankName }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full font-label-sm text-[10px] uppercase tracking-wider"
      style={{
        background: `${RANK_COLORS[rankName]}15`,
        border:     `1px solid ${RANK_COLORS[rankName]}30`,
        color:      RANK_COLORS[rankName],
      }}
    >
      {rankName}
    </span>
  )
}

function XPBar({ xp, maxXP }) {
  return (
    <div className="flex-1 h-1 rounded-full overflow-hidden bg-surface-variant">
      <div
        className="h-full rounded-full"
        style={{
          width:      `${Math.min(100, Math.round((xp / maxXP) * 100))}%`,
          background: 'linear-gradient(90deg, #c5a059, #e9c176)',
        }}
      />
    </div>
  )
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const { session, addXP, completeStep } = useGuestSession()

  const [mounted,  setMounted]  = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  const guestXP   = session.xp
  const guestRank = getRankFromXP(guestXP)
  const firstName = session.profile?.firstName || 'You'
  const lastName  = session.profile?.lastName  || ''
  const initials  = `${firstName.charAt(0)}${lastName.charAt(0) || firstName.charAt(1) || ''}`.toUpperCase() || 'ME'

  // Build the ranked list with the guest inserted at correct XP position
  const rankedList = useMemo(() => {
    const guest = { id: 'guest', name: firstName + (lastName ? ` ${lastName}` : ''), initials, xp: guestXP, isGuest: true, hue: 0 }
    const all   = [...CURATED_MEMBERS, guest].sort((a, b) => b.xp - a.xp)
    return all
  }, [guestXP, firstName, lastName, initials])

  const guestPosition = rankedList.findIndex(m => m.id === 'guest') + 1
  const maxXP         = rankedList[0]?.xp || 1

  const POSITION_LABELS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']

  function handleContinue() {
    if (accepted) return
    setAccepted(true)
    addXP(25)
    completeStep('leaderboard')
    setTimeout(() => navigate('/smokecraft/golden-box/status'), 400)
  }

  const FILL1 = { fontVariationSettings: "'FILL' 1" }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">

      {/* Ambient glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 20%, rgba(233,193,118,0.07) 0%, transparent 65%)' }} />

      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="material-symbols-outlined text-primary p-2 hover:bg-surface-variant/50 transition-colors rounded-full active:scale-95">arrow_back</button>
          <span className="font-headline-md text-[18px] font-bold text-primary tracking-tighter">CRAFTHUB 360</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-label-lg text-label-lg text-primary hidden md:block">Grand Lounge</span>
          <MemberAvatar initials={initials} hue={0} size={36} isGuest />
        </div>
      </header>

      <main className="pt-28 pb-24 px-margin max-w-[720px] mx-auto">

        {/* Header */}
        <div className={`mb-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-6 bg-primary/60" />
            <span className="font-label-sm text-label-sm text-primary/70 uppercase tracking-[0.25em]">Grand Lounge</span>
          </div>
          <h1
            className="text-on-surface mb-3"
            style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 600, lineHeight: 1.2 }}
          >
            Tonight's <span className="text-primary italic">Ranking</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            Ranked by SmokeCraft XP earned across all sessions. You enter the Grand Lounge as a ranked member of this cigar society.
          </p>
        </div>

        {/* Guest position callout */}
        <div
          className={`glass-panel rounded-2xl p-5 titanium-border mb-8 flex items-center gap-5 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '120ms' }}
        >
          <div className="w-14 h-14 rounded-xl gold-foil flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-on-primary" style={{ fontFamily: '"Playfair Display", serif', fontSize: '22px' }}>
              {guestPosition}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-label-sm text-[11px] text-primary/70 uppercase tracking-[0.2em] mb-0.5">Your Position</p>
            <p className="text-on-surface" style={{ fontFamily: '"Playfair Display", serif', fontSize: '20px' }}>
              {POSITION_LABELS[guestPosition] || `#${guestPosition}`} in the Grand Lounge
            </p>
          </div>
          <RankPill rankName={guestRank.name} />
        </div>

        {/* Leaderboard List */}
        <div className="space-y-2">
          {rankedList.map((member, i) => {
            const pos       = i + 1
            const mRank     = getRankFromXP(member.xp)
            const isGuest   = member.id === 'guest'
            const isPodium  = pos <= 3

            return (
              <div
                key={member.id}
                className={`
                  flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-700 ease-out
                  ${isGuest ? 'ring-1 ring-primary/40' : ''}
                  ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                `}
                style={{
                  transitionDelay: `${140 + i * 50}ms`,
                  background:      isGuest
                    ? 'linear-gradient(90deg, rgba(233,193,118,0.08) 0%, rgba(233,193,118,0.03) 100%)'
                    : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                }}
              >
                {/* Rank number */}
                <div className="w-8 text-center flex-shrink-0">
                  {isPodium ? (
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ color: pos === 1 ? '#e9c176' : pos === 2 ? '#c0c0c0' : '#cd7f32', fontVariationSettings: "'FILL' 1" }}
                    >
                      {pos === 1 ? 'workspace_premium' : 'military_tech'}
                    </span>
                  ) : (
                    <span className="font-label-sm text-[13px] text-on-surface-variant/50 font-bold">{pos}</span>
                  )}
                </div>

                {/* Avatar */}
                <MemberAvatar initials={member.initials} hue={member.hue} size={40} isGuest={isGuest} />

                {/* Name + XP bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`font-label-lg text-label-lg truncate ${isGuest ? 'text-primary' : 'text-on-surface'}`}
                      style={{ fontFamily: isGuest ? '"Playfair Display", serif' : undefined, fontWeight: isGuest ? 600 : 400 }}
                    >
                      {isGuest ? `${member.name} (You)` : member.name}
                    </span>
                    <RankPill rankName={mRank.name} />
                  </div>
                  <XPBar xp={member.xp} maxXP={maxXP} />
                </div>

                {/* XP score */}
                <div className="text-right flex-shrink-0 w-16">
                  <p className="font-bold" style={{ fontFamily: '"Playfair Display", serif', fontSize: '16px', color: isGuest ? '#e9c176' : '#e5e2e3' }}>
                    {member.xp.toLocaleString()}
                  </p>
                  <p className="font-label-sm text-[10px] text-on-surface-variant/50 uppercase tracking-wider">XP</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Rank legend */}
        <div
          className={`mt-8 glass-panel rounded-2xl p-5 titanium-border transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '700ms' }}
        >
          <p className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-4">Rank Scale</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'Novice',      range: '0–199 XP'   },
              { name: 'Enthusiast',  range: '200–499 XP' },
              { name: 'Connoisseur', range: '500–899 XP' },
              { name: 'Aficionado',  range: '900+ XP'    },
            ].map(({ name, range }) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: RANK_COLORS[name] }} />
                <div>
                  <p className="font-label-lg text-[12px] text-on-surface">{name}</p>
                  <p className="font-label-sm text-[10px] text-on-surface-variant/50">{range}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={`mt-10 flex flex-col items-center gap-3 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '800ms' }}>
          <button
            onClick={handleContinue}
            disabled={accepted}
            className="group relative w-full py-5 rounded-xl gold-foil overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(233,193,118,0.3)] active:scale-[0.98] disabled:opacity-60"
          >
            <div className="absolute inset-0 bg-white/15 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            <div className="relative flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-on-primary" style={FILL1}>
                {accepted ? 'check_circle' : 'inventory_2'}
              </span>
              <span className="font-headline-md text-headline-md text-on-primary font-bold tracking-tight">
                {accepted ? 'Proceeding…' : 'Claim Your Golden Box'}
              </span>
            </div>
          </button>
          <p className="font-label-sm text-[11px] text-on-surface-variant/50">+25 XP · Unlocks Golden Box Status</p>
        </div>

      </main>
    </div>
  )
}
