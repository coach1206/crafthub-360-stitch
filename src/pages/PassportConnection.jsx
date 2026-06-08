import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGuestSession } from '../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../constants/session.js'
import {
  parsePassportEntryParams,
  getVenueDisplayName,
} from '../utils/passportEntry.js'
import PassportBottomNav from '../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

/* ── Who's Here Now sample data ─────────────────────── */
const HERE_NOW = [
  { name: 'Marcus Yang',   role: 'Investor',          initials: 'MY', color: '#1e3a5f' },
  { name: 'Elena Rossi',   role: 'Brand Advisor',     initials: 'ER', color: '#2d0d1a' },
  { name: 'James Carter',  role: 'Entrepreneur',      initials: 'JC', color: '#0d2818' },
  { name: 'Priya Shah',    role: 'Marketing Lead',    initials: 'PS', color: '#3a1a00' },
  { name: 'Daniel Kim',    role: 'Product Strategist',initials: 'DK', color: '#1a1208' },
  { name: 'Isabella Moore',role: 'Designer',          initials: 'IM', color: '#1a0d1a' },
]

/* ── Recent activity stamps ──────────────────────────── */
const RECENT = [
  { label: 'SmokeCraft 360',       sub: 'Verified · Today',    icon: 'workspace_premium', color: '#c5a059' },
  { label: 'Cigar Culture Masterclass', sub: 'Yesterday',      icon: 'school',            color: '#cd7f32' },
  { label: 'Whiskey Society Tasting',   sub: '2 days ago',     icon: 'local_bar',         color: '#c0c0c0' },
  { label: "Founder's Circle",          sub: 'Invite Only · 3 days ago', icon: 'groups', color: '#e9c176' },
  { label: 'Legacy Builder',            sub: 'Milestone · 5 days ago', icon: 'history_edu', color: '#4fc3f7' },
]

/* ── Section grid ────────────────────────────────────── */
const SECTIONS = [
  {
    id: 'stamps',      icon: 'menu_book',       title: 'Digital Stamps',
    desc: 'Your achievements. Your legacy.',
    action: 'View My Stamps', to: '/passport/stamps',
    bg: '#2a1c0e', border: 'rgba(197,160,89,0.4)', accent: '#c5a059', textDark: false,
  },
  {
    id: 'directory',   icon: 'contacts',        title: 'Directory',
    desc: 'Discover verified members.',
    action: 'Browse All Members', to: '/passport/directory',
    bg: '#0a1f0e', border: 'rgba(102,187,106,0.35)', accent: '#66bb6a', textDark: false,
  },
  {
    id: 'connections', icon: 'hub',             title: 'Connections',
    desc: 'Grow your trusted network.',
    action: 'View All Connections', to: '/passport/connections',
    bg: '#200a14', border: 'rgba(206,147,216,0.3)', accent: '#ce93d8', textDark: false,
  },
  {
    id: 'events',      icon: 'event',           title: 'Events',
    desc: 'Upcoming experiences.',
    action: 'Browse All Events', to: '/passport/events',
    bg: '#1f1200', border: 'rgba(255,183,77,0.3)', accent: '#ffb74d', textDark: false,
  },
  {
    id: 'benefits',    icon: 'stars',           title: 'Benefits',
    desc: 'Member privileges & rewards.',
    action: 'View All Benefits', to: '/passport/benefits',
    bg: '#0d0d0d', border: 'rgba(233,193,118,0.25)', accent: '#e9c176', textDark: false,
  },
  {
    id: 'profile',     icon: 'person',          title: 'My Profile',
    desc: 'Your story. Your impact.',
    action: 'View Full Profile', to: '/passport/profile',
    bg: '#1a1208', border: 'rgba(197,160,89,0.3)', accent: '#c5a059', textDark: false,
  },
]

/* ── How It Works quick steps ──────────────────────── */
const HOW_QUICK = [
  { n: '1', icon: 'qr_code_scanner', label: 'Scan In',       body: 'Scan QR at a venue or event' },
  { n: '2', icon: 'badge',           label: 'Build Profile', body: 'Showcase your story and what matters' },
  { n: '3', icon: 'people',          label: 'Meet People',   body: 'Connect with verified members' },
  { n: '4', icon: 'workspace_premium', label: 'Earn Stamps', body: 'Collect stamps and build your legacy' },
]

export default function PassportConnection() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session, startPassportEntry, refreshLastActive } = useGuestSession()
  const entryInitRef = useRef(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (entryInitRef.current) return
    entryInitRef.current = true
    const params = parsePassportEntryParams(searchParams)
    if (params.venueId || params.deviceId || params.entrySource) startPassportEntry(params)
    refreshLastActive()
    setTimeout(() => setMounted(true), 60)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stamps      = session.smokecraftStamps ?? []
  const xp          = session.xp ?? 0
  const rank        = getRankFromXP(xp)
  const displayName = session.profile?.firstName
    ? `${session.profile.firstName} ${session.profile.lastName || ''}`.trim()
    : 'Grand Member'
  const venueLabel  = getVenueDisplayName(session.venueId)
  const initials    = `${session.profile?.firstName?.[0] || 'G'}${session.profile?.lastName?.[0] || 'M'}`

  const TIER_COLORS = { Novice: '#c5a059', Bronze: '#cd7f32', Silver: '#c0c0c0', Gold: '#e9c176', Diamond: '#4fc3f7' }
  const tierColor   = TIER_COLORS[rank.name] || '#e9c176'

  return (
    <div className="min-h-screen text-on-surface font-body-md overflow-x-hidden pb-28 relative">

      {/* ── HERO BACKGROUND using the passport lounge image ──── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/passport-hero.png"
          alt=""
          className="w-full h-full object-cover object-top"
          style={{ opacity: 0.18, filter: 'blur(3px) saturate(0.7)' }}
        />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(160deg, rgba(8,5,2,0.92) 0%, rgba(18,10,4,0.88) 30%, rgba(10,8,5,0.95) 70%, rgba(5,3,2,0.98) 100%)'
        }} />
        {/* warm amber glow center */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(180,100,20,0.12) 0%, transparent 70%)' }} />
      </div>

      {/* ── TOP BAR ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 px-5 backdrop-blur-2xl border-b"
        style={{ background: 'rgba(8,5,2,0.88)', borderColor: 'rgba(233,193,118,0.18)', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-3">
          {/* Globe icon */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(233,193,118,0.1)', border: '1px solid rgba(233,193,118,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#e9c176', ...FILL1 }}>public</span>
          </div>
          <div>
            <p className="font-bold text-[14px] leading-none uppercase tracking-wider" style={{ color: '#e9c176', letterSpacing: '0.12em' }}>360 Passport Connection</p>
            <p className="text-[9px] uppercase tracking-[0.2em] mt-0.5" style={{ color: 'rgba(233,193,118,0.4)' }}>by Profound Innovations LLC · Powered by NOVEE OS</p>
          </div>
        </div>
        <button onClick={() => navigate('/passport/profile')}
          className="rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
          style={{ width: 44, height: 44, background: 'linear-gradient(135deg, rgba(233,193,118,0.15), rgba(197,160,89,0.08))', border: `1.5px solid ${tierColor}50`, fontFamily: '"Playfair Display",serif', color: tierColor, fontWeight: 700, fontSize: 15 }}>
          {initials}
        </button>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-6">

        {/* ══ WELCOME HERO SECTION ════════════════════════════ */}
        <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          {/* Welcome text */}
          <div className="mb-5">
            <p className="text-[12px] uppercase tracking-[0.3em] mb-1" style={{ color: 'rgba(233,193,118,0.5)' }}>Welcome back,</p>
            <h1 className="font-bold leading-none mb-2" style={{ fontSize: 34, fontFamily: '"Playfair Display",serif', color: '#f0e6d0' }}>{displayName}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full"
                style={{ background: `${tierColor}18`, border: `1px solid ${tierColor}45` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12, color: tierColor, ...FILL1 }}>person</span>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: tierColor }}>{rank.name}</span>
              </div>
              <span className="font-bold text-[14px]" style={{ color: '#e9c176' }}>{xp.toLocaleString()} XP</span>
              <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>location_on</span>
                <span className="text-[11px]">{venueLabel}</span>
              </div>
            </div>
            <p className="text-[12px] mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 480 }}>
              Your digital passport to verified experiences, meaningful connections, and a legacy of craft.
            </p>
          </div>

          {/* ── PASSPORT BOOKLET VISUAL ──────────────────────── */}
          <div className="rounded-2xl overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #1a1005 0%, #251810 50%, #1a1005 100%)', border: '1px solid rgba(197,160,89,0.3)', boxShadow: '0 8px 48px rgba(0,0,0,0.8), inset 0 1px 0 rgba(233,193,118,0.08)' }}>

            {/* Gold top strip */}
            <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #8b6914, #e9c176, #c5a059, #e9c176, #8b6914)' }} />

            <div className="p-5 grid grid-cols-2 gap-4">

              {/* Left: Passport cover */}
              <div>
                <div className="rounded-xl overflow-hidden relative flex flex-col items-center justify-between p-5"
                  style={{ background: 'linear-gradient(145deg, #1c1408, #2e1e0c)', border: '2px solid rgba(197,160,89,0.4)', minHeight: 180, boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 6px 6px 20px rgba(0,0,0,0.6)' }}>
                  {/* leather texture hatching */}
                  <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e9c176 0, #e9c176 1px, transparent 0, transparent 50%)', backgroundSize: '4px 4px' }} />
                  {/* globe emboss */}
                  <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center mb-2"
                    style={{ background: 'rgba(233,193,118,0.08)', border: '1px solid rgba(233,193,118,0.25)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#c5a059', ...FILL1 }}>public</span>
                  </div>
                  <div className="relative z-10 text-center">
                    <p className="font-bold text-[13px] leading-tight tracking-widest" style={{ color: '#e9c176', fontFamily: '"Playfair Display",serif' }}>360</p>
                    <p className="font-bold text-[10px] leading-tight tracking-[0.2em] uppercase" style={{ color: '#e9c176' }}>PASSPORT</p>
                    <p className="font-bold text-[8px] leading-tight tracking-[0.15em] uppercase mt-0.5" style={{ color: 'rgba(197,160,89,0.6)' }}>CONNECTION</p>
                    <div className="w-8 h-px mx-auto my-2" style={{ background: 'rgba(197,160,89,0.4)' }} />
                    <p className="text-[7px] tracking-wider leading-tight" style={{ color: 'rgba(197,160,89,0.4)' }}>by Profound Innovations LLC</p>
                  </div>
                </div>
              </div>

              {/* Right: Open stamp pages */}
              <div className="rounded-xl overflow-hidden relative"
                style={{ background: '#fdfaf3', minHeight: 180, border: '1px solid rgba(180,140,80,0.3)' }}>
                {/* Page fold shadow */}
                <div className="absolute left-0 top-0 bottom-0 w-2"
                  style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.15), transparent)' }} />
                <div className="p-3">
                  <p className="text-[7px] uppercase tracking-[0.25em] text-center mb-2" style={{ color: 'rgba(60,40,20,0.4)' }}>YOUR JOURNEY</p>
                  <p className="text-[6px] tracking-wider text-center mb-3" style={{ color: 'rgba(60,40,20,0.3)' }}>Your Stamps. Your Story. Your Legacy.</p>
                  {/* Stamp grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { c: '#1a5c2a', label: 'Heritage' },
                      { c: '#7b1fa2', label: 'Craft'    },
                      { c: '#0d47a1', label: 'Palate'   },
                      { c: '#b71c1c', label: 'Pairing'  },
                      { c: '#e65100', label: 'Journey'  },
                      { c: '#1a237e', label: 'Passport' },
                    ].map((s, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ border: `2px solid ${s.c}`, background: `${s.c}10` }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: s.c, ...FILL1 }}>workspace_premium</span>
                        </div>
                        <span className="text-[7px] mt-0.5 font-bold uppercase tracking-wider" style={{ color: s.c }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                  {stamps.length > 0 && (
                    <p className="text-center text-[7px] mt-2" style={{ color: 'rgba(60,40,20,0.5)' }}>{stamps.length} verified stamps</p>
                  )}
                </div>
              </div>
            </div>

            {/* QR Credential row */}
            <div className="mx-5 mb-5 rounded-xl p-4 flex items-center gap-4"
              style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(233,193,118,0.18)' }}>
              <div className="bg-white rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ width: 52, height: 52 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#0a0805', ...FILL1 }}>qr_code_2</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[13px] leading-none" style={{ color: '#e9c176', fontFamily: '"Playfair Display",serif' }}>360 Passport Connection</p>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Scan to Connect · Active</p>
              </div>
              <button onClick={() => navigate('/passport/scan')}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate('/passport/scan') }}
                className="flex-shrink-0 rounded-xl px-4 active:scale-95 transition-all font-bold text-[11px] uppercase tracking-wider"
                style={{ height: 40, background: 'linear-gradient(135deg, #e9c176, #c5a059)', color: '#0a0805' }}>
                Scan
              </button>
            </div>
          </div>

          {/* Value tagline */}
          <p className="text-center text-[12px] mt-4 tracking-widest uppercase font-bold" style={{ color: 'rgba(233,193,118,0.4)' }}>
            Scan in · Meet people · Earn stamps · Unlock access
          </p>
        </section>

        {/* ══ PRIMARY ACTION BUTTONS ══════════════════════════ */}
        <section className={`transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Start Passport Session', icon: 'play_arrow',      to: '/passport/scan',         primary: true  },
              { label: 'Scan to Connect',         icon: 'qr_code_scanner', to: '/passport/scan',         primary: false },
              { label: 'How It Works',            icon: 'help',            to: '/passport/how-it-works', primary: false },
              { label: 'Explore Directory',       icon: 'contacts',        to: '/passport/directory',    primary: false },
            ].map(btn => (
              <button key={btn.label}
                onClick={() => navigate(btn.to)}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate(btn.to) }}
                className="flex items-center gap-3 rounded-xl px-4 active:scale-[0.97] transition-all font-bold text-[13px] text-left"
                style={{
                  minHeight: 64,
                  background: btn.primary ? 'linear-gradient(135deg, #e9c176, #c5a059)' : 'rgba(255,255,255,0.06)',
                  border: btn.primary ? 'none' : '1px solid rgba(233,193,118,0.18)',
                  color: btn.primary ? '#0a0805' : '#f0e6d0',
                  boxShadow: btn.primary ? '0 4px 24px rgba(233,193,118,0.3)' : 'none',
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, ...(btn.primary ? { color: '#0a0805' } : { color: '#e9c176' }), ...FILL1 }}>{btn.icon}</span>
                {btn.label}
              </button>
            ))}
          </div>
        </section>

        {/* ══ HOW IT WORKS — QUICK REFERENCE ════════════════ */}
        <section className={`transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(20,14,6,0.85)', border: '1px solid rgba(233,193,118,0.18)' }}>
            <div className="px-5 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(233,193,118,0.1)' }}>
              <div>
                <p className="font-bold text-[14px] leading-none" style={{ color: '#e9c176', fontFamily: '"Playfair Display",serif' }}>How It Works</p>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Your journey in four simple steps</p>
              </div>
              <button onClick={() => navigate('/passport/how-it-works')}
                onTouchStart={e => e.currentTarget.style.opacity = '0.7'}
                onTouchEnd={e => { e.currentTarget.style.opacity = ''; navigate('/passport/how-it-works') }}
                className="text-[11px] uppercase tracking-wider active:opacity-70 transition-opacity"
                style={{ color: 'rgba(233,193,118,0.6)' }}>
                Learn more →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-y"
              style={{ '--tw-divide-color': 'rgba(233,193,118,0.08)' }}>
              {HOW_QUICK.map((step) => (
                <div key={step.n} className="px-4 py-4 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(233,193,118,0.12)', border: '1px solid rgba(233,193,118,0.25)' }}>
                    <span className="text-[11px] font-bold" style={{ color: '#e9c176' }}>{step.n}</span>
                  </div>
                  <div>
                    <p className="font-bold text-[12px] leading-tight" style={{ color: '#f0e6d0' }}>{step.label}</p>
                    <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.4)' }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SECTION GRID ═══════════════════════════════════ */}
        <section className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Passport Sections</p>
          <div className="grid grid-cols-2 gap-3">
            {SECTIONS.map(sec => (
              <div key={sec.id} className="rounded-xl overflow-hidden"
                style={{ background: sec.bg, border: `1px solid ${sec.border}` }}>
                <div className="p-4 flex flex-col gap-2" style={{ minHeight: 140 }}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: sec.accent, ...FILL1 }}>{sec.icon}</span>
                    <p className="font-bold text-[14px] leading-tight" style={{ color: '#f0e6d0', fontFamily: '"Playfair Display",serif' }}>{sec.title}</p>
                  </div>
                  <p className="text-[11px] leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{sec.desc}</p>

                  {/* Sample mini-content */}
                  {sec.id === 'stamps' && (
                    <div className="flex gap-1.5">
                      {[...Array(Math.min(stamps.length || 0, 3))].map((_, i) => (
                        <div key={i} className="w-7 h-7 rounded-full border flex items-center justify-center"
                          style={{ borderColor: sec.accent + '60', background: sec.accent + '10' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12, color: sec.accent, ...FILL1 }}>workspace_premium</span>
                        </div>
                      ))}
                      {stamps.length === 0 && <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>No stamps yet</p>}
                    </div>
                  )}
                  {sec.id === 'directory' && (
                    <div className="flex gap-1.5">
                      {['MW', 'ER', 'JC'].map(init => (
                        <div key={init} className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold"
                          style={{ background: 'rgba(102,187,106,0.15)', color: '#66bb6a', border: '1px solid rgba(102,187,106,0.3)' }}>{init}</div>
                      ))}
                      <span className="text-[10px] self-center" style={{ color: 'rgba(255,255,255,0.3)' }}>+7 more</span>
                    </div>
                  )}

                  <button onClick={() => navigate(sec.to)}
                    onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
                    onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate(sec.to) }}
                    className="w-full text-center rounded-lg font-bold text-[11px] uppercase tracking-wider active:scale-[0.97] transition-all"
                    style={{ height: 40, background: `${sec.accent}18`, border: `1px solid ${sec.accent}45`, color: sec.accent }}>
                    {sec.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ WHO'S HERE NOW ══════════════════════════════════ */}
        <section className={`transition-all duration-700 delay-250 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(18,12,5,0.9)', border: '1px solid rgba(233,193,118,0.14)' }}>
            <div className="px-5 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(233,193,118,0.08)' }}>
              <div>
                <p className="font-bold text-[14px] leading-none" style={{ color: '#e9c176', fontFamily: '"Playfair Display",serif' }}>Who's Here Now</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Members currently active at {venueLabel}</p>
              </div>
              <button onClick={() => navigate('/passport/directory')}
                onTouchStart={e => e.currentTarget.style.opacity = '0.7'}
                onTouchEnd={e => { e.currentTarget.style.opacity = ''; navigate('/passport/directory') }}
                className="text-[11px] uppercase tracking-wider active:opacity-70 transition-opacity"
                style={{ color: 'rgba(233,193,118,0.6)' }}>
                View All (24) →
              </button>
            </div>
            <div className="px-5 py-4 flex gap-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {HERE_NOW.map(m => (
                <button key={m.name}
                  onClick={() => navigate('/passport/directory')}
                  onTouchStart={e => e.currentTarget.style.transform = 'scale(0.93)'}
                  onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate('/passport/directory') }}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform flex-shrink-0">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-[14px]"
                    style={{ background: `${m.color}cc`, color: '#f0e6d0', border: '2px solid rgba(233,193,118,0.2)', fontFamily: '"Playfair Display",serif' }}>
                    {m.initials}
                  </div>
                  <p className="text-[10px] text-center leading-tight" style={{ color: '#f0e6d0', maxWidth: 56 }}>{m.name.split(' ')[0]}</p>
                  <p className="text-[8px] text-center leading-tight" style={{ color: 'rgba(255,255,255,0.35)', maxWidth: 56 }}>{m.role}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ══ RECENT ACTIVITY ════════════════════════════════ */}
        <section className={`transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} pb-2`}>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(18,12,5,0.9)', border: '1px solid rgba(233,193,118,0.14)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(233,193,118,0.08)' }}>
              <p className="font-bold text-[14px] leading-none" style={{ color: '#e9c176', fontFamily: '"Playfair Display",serif' }}>Recent Activity</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Your latest stamps and milestones</p>
            </div>
            <div className="px-5 py-4 flex gap-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {RECENT.map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 80 }}>
                  {/* Timeline connector */}
                  <div className="relative flex items-center justify-center">
                    {i < RECENT.length - 1 && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2" style={{ width: 28, height: 1, background: `rgba(${item.color === '#e9c176' ? '233,193,118' : '255,255,255'},0.15)` }} />
                    )}
                    <div className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: `${item.color}18`, border: `2px solid ${item.color}50` }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22, color: item.color, ...FILL1 }}>{item.icon}</span>
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-center leading-tight" style={{ color: '#f0e6d0' }}>{item.label}</p>
                  <p className="text-[8px] text-center leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <PassportBottomNav active="hub" />
    </div>
  )
}
