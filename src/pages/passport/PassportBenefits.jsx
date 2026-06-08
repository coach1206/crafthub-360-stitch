import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../../constants/session.js'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const TIERS = [
  { name: 'Novice',  xp: 0,    color: '#c5a059', bg: '#1a1208' },
  { name: 'Bronze',  xp: 500,  color: '#cd7f32', bg: '#1a0e00' },
  { name: 'Silver',  xp: 1500, color: '#c0c0c0', bg: '#141414' },
  { name: 'Gold',    xp: 3000, color: '#e9c176', bg: '#1a1400' },
  { name: 'Diamond', xp: 6000, color: '#4fc3f7', bg: '#0d1a2a' },
]

const BENEFITS = [
  {
    id: 1,
    title: 'Priority Lounge Reservations',
    desc: 'Skip the queue. Gold tier members get first access to Grand Lounge reservations 72 hours before general release.',
    icon: 'table_restaurant',
    category: 'Access',
    tier: 'Gold',
    color: '#e9c176',
    detail: 'Available at all 360 Passport partner venues. Show your QR at the host stand.',
    locked: false,
  },
  {
    id: 2,
    title: 'Private Event Invitations',
    desc: 'Exclusive invites to invite-only member dinners, showcase tastings, and partner brand nights.',
    icon: 'mail',
    category: 'Events',
    tier: 'Silver',
    color: '#c0c0c0',
    detail: 'Delivered directly to your Passport notifications. RSVP within 48 hours to confirm your seat.',
    locked: false,
  },
  {
    id: 3,
    title: 'Complimentary First Pairing',
    desc: 'One complimentary curated cigar or spirit pairing on your first verified visit to any partner venue.',
    icon: 'local_bar',
    category: 'Hospitality',
    tier: 'Bronze',
    color: '#cd7f32',
    detail: 'Valid once per venue. Present your Passport QR to the staff member.',
    locked: false,
  },
  {
    id: 4,
    title: 'Verified Connection Badge',
    desc: 'Your profile displays a "Verified Member" badge in the Directory, increasing match quality and connection requests.',
    icon: 'verified',
    category: 'Identity',
    tier: 'Novice',
    color: '#4caf50',
    detail: 'Automatically applied when you earn your first 3 stamps.',
    locked: false,
  },
  {
    id: 5,
    title: 'Diamond Concierge Access',
    desc: 'Personal concierge service for venue reservations, event coordination, and curated member introductions.',
    icon: 'support_agent',
    category: 'VIP',
    tier: 'Diamond',
    color: '#4fc3f7',
    detail: 'Activate via direct message to your dedicated concierge. Response within 2 hours.',
    locked: true,
  },
  {
    id: 6,
    title: 'Partner Venue Network',
    desc: 'Access to 30+ premium cigar lounges, wine bars, and private dining rooms in the 360 Passport partner network.',
    icon: 'location_city',
    category: 'Access',
    tier: 'Silver',
    color: '#c0c0c0',
    detail: 'Network map available in the Benefits section. Show QR at any partner location.',
    locked: false,
  },
  {
    id: 7,
    title: 'Leaderboard Recognition',
    desc: 'Top 10 members on the leaderboard are featured in the monthly "Grand Circle" spotlight.',
    icon: 'emoji_events',
    category: 'Status',
    tier: 'Gold',
    color: '#e9c176',
    detail: 'Leaderboard resets monthly. XP earned through stamps, events, and verified connections.',
    locked: false,
  },
  {
    id: 8,
    title: 'Annual Passport Summit Ticket',
    desc: 'Complimentary attendance to the 360 Annual Passport Summit — the flagship member gathering of the year.',
    icon: 'celebration',
    category: 'Events',
    tier: 'Diamond',
    color: '#4fc3f7',
    detail: 'Includes full summit access, meals, craft sessions, and exclusive member networking. Value: $750.',
    locked: true,
  },
]

const TIER_COLORS = { Novice: '#c5a059', Bronze: '#cd7f32', Silver: '#c0c0c0', Gold: '#e9c176', Diamond: '#4fc3f7' }

function BenefitCard({ benefit }) {
  const [expanded, setExpanded] = useState(false)
  const tc = TIER_COLORS[benefit.tier] || '#e9c176'

  return (
    <button
      onClick={() => setExpanded(e => !e)}
      onTouchStart={x => x.currentTarget.style.transform = 'scale(0.99)'}
      onTouchEnd={x => x.currentTarget.style.transform = ''}
      className="w-full text-left rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.99]"
      style={{
        background: benefit.locked ? 'rgba(255,255,255,0.03)' : 'rgba(20,16,8,0.9)',
        border: `1px solid ${benefit.locked ? 'rgba(255,255,255,0.06)' : benefit.color + '30'}`,
        opacity: benefit.locked ? 0.5 : 1,
        boxShadow: benefit.locked ? 'none' : `0 2px 16px ${benefit.color}10`,
      }}>

      <div className="flex items-start gap-4 p-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: benefit.locked ? 'rgba(255,255,255,0.05)' : `${benefit.color}15`, border: `1px solid ${benefit.locked ? 'rgba(255,255,255,0.08)' : benefit.color + '30'}` }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: benefit.locked ? 'rgba(255,255,255,0.2)' : benefit.color, ...(benefit.locked ? {} : FILL1) }}>
            {benefit.locked ? 'lock' : benefit.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: `${tc}15`, color: tc, border: `1px solid ${tc}30` }}>
              {benefit.tier}
            </span>
            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
              {benefit.category}
            </span>
          </div>
          <p className="font-bold text-[14px] leading-tight mb-1" style={{ color: benefit.locked ? 'rgba(255,255,255,0.3)' : '#f0e6d0', fontFamily: '"Playfair Display", serif' }}>
            {benefit.title}
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{benefit.desc}</p>
        </div>
        <span className="material-symbols-outlined flex-shrink-0 mt-1 transition-transform duration-300"
          style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)', transform: expanded ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="rounded-xl p-3 ml-16" style={{ background: `${benefit.color}08`, border: `1px solid ${benefit.color}20` }}>
            <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: `${benefit.color}70` }}>How to use this benefit</p>
            <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{benefit.detail}</p>
          </div>
        </div>
      )}
    </button>
  )
}

export default function PassportBenefits() {
  const navigate   = useNavigate()
  const { session } = useGuestSession()
  const xp         = session.xp ?? 0
  const rank       = getRankFromXP(xp)
  const tierColor  = TIER_COLORS[rank.name] || '#e9c176'
  const currentTier = TIERS.find(t => t.name === rank.name) || TIERS[0]
  const nextTier    = TIERS[TIERS.findIndex(t => t.name === rank.name) + 1]
  const xpToNext    = nextTier ? nextTier.xp - xp : 0
  const [filter, setFilter] = useState('All')
  const categories = ['All', 'Access', 'Events', 'Hospitality', 'Identity', 'Status', 'VIP']
  const filtered   = filter === 'All' ? BENEFITS : BENEFITS.filter(b => b.category === filter)

  return (
    <div className="min-h-screen font-body-md pb-28 text-on-surface overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #0d0d0d 0%, #060606 100%)' }}>

      {/* Platinum ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 w-96 h-96 rounded-full blur-[150px]" style={{ background: `${tierColor}08` }} />
      </div>

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex flex-col px-5 backdrop-blur-xl border-b"
        style={{ background: 'rgba(6,6,6,0.95)', borderColor: 'rgba(233,193,118,0.18)' }}>
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/passport')} className="material-symbols-outlined p-2 rounded-full active:bg-white/10 transition-colors"
              style={{ color: '#e9c176', minWidth: 44, minHeight: 44 }}>arrow_back</button>
            <div>
              <p className="font-bold text-[15px] leading-none" style={{ color: '#e9c176', fontFamily: '"Playfair Display", serif' }}>Benefits</p>
              <p className="text-[10px] uppercase tracking-[0.25em] mt-0.5" style={{ color: 'rgba(233,193,118,0.4)' }}>Member Rewards & Access</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 rounded-full"
            style={{ height: 36, background: `${tierColor}15`, border: `1px solid ${tierColor}35` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: tierColor, ...FILL1 }}>stars</span>
            <span className="text-[11px] font-bold" style={{ color: tierColor }}>{rank.name} Tier</span>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.93)'}
              onTouchEnd={e => { e.currentTarget.style.transform = ''; setFilter(c) }}
              className="flex-shrink-0 rounded-full px-4 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
              style={{
                height: 34,
                background: filter === c ? '#e9c176' : 'rgba(233,193,118,0.08)',
                color: filter === c ? '#060606' : 'rgba(233,193,118,0.6)',
                border: `1px solid ${filter === c ? '#e9c176' : 'rgba(233,193,118,0.15)'}`,
              }}>
              {c}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-6">

        {/* ── Tier Status Card ─────────────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: `${currentTier.bg}`, border: `1px solid ${tierColor}30` }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: `${tierColor}60` }}>Your Current Tier</p>
              <p className="font-bold text-3xl mt-1" style={{ color: tierColor, fontFamily: '"Playfair Display", serif' }}>{rank.name}</p>
              <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{xp.toLocaleString()} XP earned</p>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: `${tierColor}15`, border: `2px solid ${tierColor}40` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 30, color: tierColor, ...FILL1 }}>stars</span>
              </div>
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div>
              <div className="flex justify-between text-[11px] mb-2">
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Progress to {nextTier.name}</span>
                <span style={{ color: tierColor }}>{xpToNext.toLocaleString()} XP needed</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full"
                  style={{ width: `${Math.round((xp / nextTier.xp) * 100)}%`, background: `linear-gradient(90deg, ${tierColor}, ${TIER_COLORS[nextTier.name]})` }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Tier Ladder ─────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(16,12,4,0.9)', border: '1px solid rgba(233,193,118,0.1)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(233,193,118,0.08)' }}>
            <p className="font-bold text-[13px]" style={{ color: '#e9c176' }}>Tier Progression</p>
          </div>
          <div className="flex items-stretch">
            {TIERS.map((tier, i) => {
              const isCurrentTier = tier.name === rank.name
              const isPastTier    = TIERS.findIndex(t => t.name === rank.name) > i
              return (
                <div key={tier.name} className="flex-1 p-3 text-center relative"
                  style={{ borderRight: i < TIERS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    background: isCurrentTier ? `${tier.color}10` : 'transparent' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1.5"
                    style={{ background: (isPastTier || isCurrentTier) ? `${tier.color}20` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${(isPastTier || isCurrentTier) ? tier.color : 'rgba(255,255,255,0.08)'}` }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: (isPastTier || isCurrentTier) ? tier.color : 'rgba(255,255,255,0.15)', ...((isPastTier || isCurrentTier) ? FILL1 : {}) }}>
                      {isPastTier ? 'check' : 'stars'}
                    </span>
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isCurrentTier ? tier.color : 'rgba(255,255,255,0.25)' }}>{tier.name}</p>
                  <p className="text-[8px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{tier.xp >= 1000 ? `${tier.xp / 1000}k` : tier.xp} XP</p>
                  {isCurrentTier && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)` }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Benefits explanation ─────────────────────────────── */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(233,193,118,0.06)', border: '1px solid rgba(233,193,118,0.12)' }}>
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(233,193,118,0.5)' }}>How benefits work</p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Benefits unlock automatically as you earn XP and advance tiers. Tap any benefit to see how to use it. Locked benefits show what you're working toward.
          </p>
        </div>

        {/* ── Benefits list ────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map(b => <BenefitCard key={b.id} benefit={b} />)}
        </div>

        {/* ── Earn more CTA ─────────────────────────────────────── */}
        <button onClick={() => navigate('/smokecraft')}
          onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate('/smokecraft') }}
          className="w-full flex items-center gap-4 px-6 rounded-2xl active:scale-[0.98] transition-all"
          style={{ background: 'linear-gradient(135deg, #1a1400, #2a2000)', border: '1px solid rgba(233,193,118,0.25)', minHeight: 80 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#e9c176', ...FILL1 }}>workspace_premium</span>
          <div className="text-left">
            <p className="font-bold text-[15px]" style={{ color: '#f0e6d0' }}>Earn More XP · Advance Your Tier</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Complete SmokeCraft sessions to earn stamps and XP</p>
          </div>
          <span className="material-symbols-outlined ml-auto" style={{ fontSize: 20, color: 'rgba(233,193,118,0.4)' }}>arrow_forward_ios</span>
        </button>

      </main>

      <PassportBottomNav active="benefits" />
    </div>
  )
}
