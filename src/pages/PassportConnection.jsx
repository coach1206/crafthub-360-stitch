import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGuestSession } from '../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../constants/session.js'
import {
  parsePassportEntryParams,
  getVenueDisplayName,
  getEntrySourceLabel,
} from '../utils/passportEntry.js'
import PassportBottomNav from '../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings: "'FILL' 1" }
const TOTAL_STAMPS = 15
const RING_R = 44
const RING_CIRC = Math.round(2 * Math.PI * RING_R)

const HOW_STEPS = [
  { icon: 'qr_code_scanner', title: 'Scan In',           body: 'Scan a QR code at the venue or event to activate your Passport session.' },
  { icon: 'badge',           title: 'Build Your Passport', body: 'Complete your profile, earn stamps, and build your verified identity.' },
  { icon: 'people',          title: 'Meet People',        body: 'Discover members, request intros, and build real relationships.' },
  { icon: 'workspace_premium', title: 'Earn & Unlock',   body: 'Collect stamps, unlock VIP access, and rise through the tiers.' },
]

const NEXT_ACTIONS = [
  { icon: 'person_add',     label: 'Complete Profile',    sub: 'Improve your match quality',    to: '/passport/profile',     color: '#1e3a5f', accent: '#4a9eff' },
  { icon: 'qr_code_scanner', label: 'Scan to Connect',   sub: 'Link with someone nearby',       to: '/passport/scan',        color: '#1a2d1a', accent: '#4caf50' },
  { icon: 'contacts',       label: 'Explore Directory',   sub: 'Find people that match you',    to: '/passport/directory',   color: '#0d2818', accent: '#66bb6a' },
  { icon: 'hub',            label: 'View Matches',        sub: 'See who fits your goals',        to: '/passport/connections', color: '#2d0d1a', accent: '#ce93d8' },
  { icon: 'event',          label: 'Join an Event',       sub: 'RSVP to upcoming experiences',  to: '/passport/events',      color: '#1a1000', accent: '#ffb74d' },
  { icon: 'stars',          label: 'Explore Benefits',    sub: 'See what your tier unlocks',     to: '/passport/benefits',    color: '#0d0d0d', accent: '#e9c176' },
]

const SECTION_GRID = [
  { icon: 'menu_book',    label: 'Digital Stamps',  sub: 'Track your craft journey',    to: '/passport/stamps',      bg: '#f5e8c8', textDark: true,  accent: '#8b4513' },
  { icon: 'contacts',     label: 'Directory',        sub: 'Discover members',           to: '/passport/directory',   bg: '#0d2818', textDark: false, accent: '#66bb6a' },
  { icon: 'hub',          label: 'Connections',      sub: 'Your network',               to: '/passport/connections', bg: '#2d0d1a', textDark: false, accent: '#ce93d8' },
  { icon: 'event',        label: 'Events',           sub: 'Upcoming experiences',       to: '/passport/events',      bg: '#1a1000', textDark: false, accent: '#ffb74d' },
  { icon: 'stars',        label: 'Benefits',         sub: 'What your tier unlocks',     to: '/passport/benefits',    bg: '#0d0d0d', textDark: false, accent: '#e9c176' },
  { icon: 'person',       label: 'My Profile',       sub: 'Your passport identity',     to: '/passport/profile',     bg: '#1a1208', textDark: false, accent: '#e9c176' },
]

export default function PassportConnection() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session, startPassportEntry, refreshLastActive } = useGuestSession()
  const [mounted, setMounted] = useState(false)
  const entryInitRef = useRef(false)

  useEffect(() => {
    if (entryInitRef.current) return
    entryInitRef.current = true
    const params = parsePassportEntryParams(searchParams)
    if (params.venueId || params.deviceId || params.entrySource) {
      startPassportEntry(params)
    }
    refreshLastActive()
    setTimeout(() => setMounted(true), 80)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stamps      = session.smokecraftStamps ?? []
  const xp          = session.xp ?? 0
  const rank        = getRankFromXP(xp)
  const pct         = Math.min(100, Math.round((stamps.length / TOTAL_STAMPS) * 100))
  const offset      = RING_CIRC * (1 - pct / 100)
  const displayName = session.profile?.firstName
    ? `${session.profile.firstName} ${session.profile.lastName || ''}`.trim()
    : 'Grand Member'
  const venueLabel  = getVenueDisplayName(session.venueId)
  const initials    = `${session.profile?.firstName?.[0] || 'G'}${session.profile?.lastName?.[0] || 'M'}`
  const profilePhoto = session.profile?.photo

  return (
    <div className="min-h-screen text-on-surface font-body-md overflow-x-hidden pb-24" style={{ background: 'linear-gradient(160deg, #050e1a 0%, #0a1525 40%, #080604 100%)' }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ background: 'rgba(30,60,120,0.25)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px]" style={{ background: 'rgba(233,193,118,0.06)' }} />
      </div>

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-5 backdrop-blur-xl border-b" style={{ height: 72, background: 'rgba(5,14,26,0.85)', borderColor: 'rgba(74,158,255,0.15)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="material-symbols-outlined text-primary p-2 rounded-full active:bg-primary/10 transition-colors" style={{ minWidth: 44, minHeight: 44 }}>arrow_back</button>
          <div>
            <p className="font-bold text-[15px] leading-none" style={{ color: '#e9c176', fontFamily: '"Playfair Display", serif' }}>360 Passport Connection</p>
            <p className="text-[10px] uppercase tracking-[0.25em] mt-0.5" style={{ color: 'rgba(74,158,255,0.7)' }}>by Profound Innovations LLC</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#e9c176' }}>{xp.toLocaleString()} XP</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{rank.name} Tier</p>
          </div>
          <button onClick={() => navigate('/passport/profile')} className="rounded-full border overflow-hidden active:scale-95 transition-transform flex-shrink-0" style={{ width: 44, height: 44, borderColor: 'rgba(74,158,255,0.35)' }}>
            {profilePhoto
              ? <img className="w-full h-full object-cover" src={profilePhoto} alt="Profile" />
              : <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8f)', color: '#7bb8ff' }}>{initials}</div>
            }
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-6 space-y-8">

        {/* ── Hero Passport Card ─────────────────────────────── */}
        <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

          {/* What is this */}
          <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(74,158,255,0.08)', border: '1px solid rgba(74,158,255,0.18)' }}>
            <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(74,158,255,0.7)' }}>What this is</p>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>360 Passport Connection is your luxury digital identity — collect stamps, meet people, earn VIP access, and build verified relationships at every event.</p>
          </div>

          {/* Passport booklet visual */}
          <div
            className="relative rounded-2xl overflow-hidden p-6"
            style={{ background: 'linear-gradient(135deg, #0d1829 0%, #162340 50%, #0d1829 100%)', border: '1px solid rgba(74,158,255,0.25)', boxShadow: '0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(74,158,255,0.1)' }}
          >
            {/* Embossed texture overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(74,158,255,0.1) 2px, rgba(74,158,255,0.1) 3px)' }} />

            <div className="relative flex items-center gap-5">
              {/* Passport cover thumbnail */}
              <div className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center relative overflow-hidden" style={{ width: 80, height: 112, background: 'linear-gradient(145deg, #162340, #0d1829)', border: '2px solid rgba(74,158,255,0.3)', boxShadow: '4px 4px 16px rgba(0,0,0,0.5)' }}>
                <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(74,158,255,0.04) 4px, rgba(74,158,255,0.04) 8px)' }} />
                <span className="material-symbols-outlined relative z-10" style={{ fontSize: 28, color: '#e9c176', ...FILL1 }}>menu_book</span>
                <p className="relative z-10 text-[8px] uppercase tracking-wider text-center mt-1 px-1 leading-tight" style={{ color: 'rgba(233,193,118,0.7)' }}>360 Passport</p>
                <div className="absolute bottom-2 left-2 right-2 h-px" style={{ background: 'rgba(233,193,118,0.3)' }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: 'rgba(74,158,255,0.6)' }}>Member Identity</p>
                <h1 className="font-bold text-xl leading-tight mb-1" style={{ fontFamily: '"Playfair Display", serif', color: '#e9c176' }}>{displayName}</h1>
                <p className="text-[12px] uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>{rank.name} Tier · {venueLabel}</p>

                <div className="flex items-center gap-4">
                  {/* XP + ring */}
                  <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
                    <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="40" cy="40" r={RING_R} fill="transparent" stroke="rgba(74,158,255,0.1)" strokeWidth="5" />
                      <circle cx="40" cy="40" r={RING_R} fill="transparent" stroke="#4a9eff" strokeWidth="5"
                        strokeDasharray={RING_CIRC} strokeDashoffset={offset} strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-bold text-[15px] leading-none" style={{ color: '#4a9eff' }}>{pct}%</span>
                      <span className="text-[8px] uppercase tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Complete</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-[22px] font-bold leading-none" style={{ color: '#e9c176', fontFamily: '"Playfair Display", serif' }}>{stamps.length}</p>
                      <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Stamps Earned</p>
                    </div>
                    <div>
                      <p className="text-[16px] font-bold leading-none" style={{ color: '#7bb8ff' }}>{xp.toLocaleString()}</p>
                      <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Total XP</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session status bar */}
            <div className="mt-4 pt-4 flex items-center gap-2 flex-wrap" style={{ borderTop: '1px solid rgba(74,158,255,0.1)' }}>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.3)' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4caf50', boxShadow: '0 0 6px #4caf50' }} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: '#4caf50' }}>Session Active</span>
              </div>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Powered by NOVEE OS · CraftHub 360</span>
            </div>
          </div>
        </section>

        {/* ── How It Works ───────────────────────────────────── */}
        <section className={`transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: 'rgba(74,158,255,0.2)' }} />
            <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'rgba(74,158,255,0.6)' }}>How It Works</p>
            <div className="h-px flex-1" style={{ background: 'rgba(74,158,255,0.2)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {HOW_STEPS.map((step, i) => (
              <div key={step.title} className="rounded-xl p-4" style={{ background: 'rgba(74,158,255,0.05)', border: '1px solid rgba(74,158,255,0.12)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(74,158,255,0.15)' }}>
                    <span className="text-[10px] font-bold" style={{ color: '#4a9eff' }}>{i + 1}</span>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#4a9eff' }}>{step.icon}</span>
                </div>
                <p className="font-bold text-[13px] mb-1" style={{ color: '#e9c176' }}>{step.title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Start Here / Next Actions ──────────────────────── */}
        <section className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'rgba(233,193,118,0.5)' }}>Start Here · Next Best Actions</p>
          <div className="space-y-2">
            {NEXT_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate(action.to) }}
                className="w-full flex items-center gap-4 rounded-xl px-4 transition-all duration-200 active:scale-[0.98] text-left"
                style={{ minHeight: 72, background: action.color, border: `1px solid ${action.accent}30` }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${action.accent}20` }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: action.accent }}>{action.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[15px]" style={{ color: '#f0e6d0' }}>{action.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{action.sub}</p>
                </div>
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 20, color: action.accent }}>arrow_forward_ios</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Section Quick-Access Grid ──────────────────────── */}
        <section className={`transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} pb-4`}>
          <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Passport Sections</p>
          <div className="grid grid-cols-3 gap-3">
            {SECTION_GRID.map(sec => (
              <button
                key={sec.label}
                onClick={() => navigate(sec.to)}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate(sec.to) }}
                className="rounded-xl p-4 flex flex-col items-center text-center transition-all duration-200 active:scale-95"
                style={{ minHeight: 96, background: sec.bg, border: `1px solid ${sec.accent}30` }}
              >
                <span className="material-symbols-outlined mb-2" style={{ fontSize: 26, color: sec.textDark ? sec.accent : sec.accent, ...FILL1 }}>{sec.icon}</span>
                <p className="font-bold text-[12px] leading-tight" style={{ color: sec.textDark ? '#3a2000' : '#f0e6d0' }}>{sec.label}</p>
                <p className="text-[9px] mt-0.5 leading-tight" style={{ color: sec.textDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)' }}>{sec.sub}</p>
              </button>
            ))}
          </div>
        </section>

      </main>

      <PassportBottomNav active="hub" />
    </div>
  )
}
