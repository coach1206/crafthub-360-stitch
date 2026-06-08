import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGuestSession } from '../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../constants/session.js'
import { parsePassportEntryParams, getVenueDisplayName } from '../utils/passportEntry.js'
import PassportBottomNav from '../components/PassportBottomNav.jsx'

/* ──────────── Gold foil text style ──────────── */
const GOLD = {
  background: 'linear-gradient(135deg,#8b6914 0%,#e9c176 35%,#f5d98a 55%,#c5a059 75%,#8b6914 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}
const FILL1 = { fontVariationSettings: "'FILL' 1" }

/* ──────────── Leather texture style ──────────── */
const leather = (base = '#1c1005') => ({
  background: `linear-gradient(160deg,${base}ee 0%,${base} 40%,${base}dd 100%)`,
  backgroundImage: `linear-gradient(160deg,${base}ee 0%,${base} 40%,${base}dd 100%), repeating-linear-gradient(45deg,rgba(255,255,255,0.012) 0,rgba(255,255,255,0.012) 1px,transparent 0,transparent 50%)`,
  backgroundSize: 'cover, 4px 4px',
})

/* ──────────── Ink Stamp component ──────────── */
function InkStamp({ color, icon, label, rotation = 0, size = 54 }) {
  return (
    <div className="flex flex-col items-center gap-0.5" style={{ transform: `rotate(${rotation}deg)` }}>
      <div className="flex items-center justify-center relative" style={{
        width: size, height: size, borderRadius: '50%',
        border: `2px solid ${color}`,
        boxShadow: `0 0 0 1px ${color}50, 0 0 0 4px ${color}10, inset 0 0 0 2px ${color}20`,
        background: `${color}08`,
      }}>
        <div className="absolute inset-0 rounded-full" style={{ border: `1px solid ${color}35`, margin: 4 }} />
        <span className="material-symbols-outlined" style={{ fontSize: size * 0.38, color, ...FILL1 }}>{icon}</span>
      </div>
      <span className="text-center font-bold uppercase tracking-wider leading-tight"
        style={{ fontSize: 7, color, maxWidth: size, textAlign: 'center' }}>{label}</span>
    </div>
  )
}

/* ──────────── Sample data ──────────── */
const STAMPS_PREVIEW = [
  { c: '#1a5c2a', icon: 'event',              label: 'Event Stamp',      rot: -8  },
  { c: '#7b1fa2', icon: 'hub',                label: 'Connection',       rot: 5   },
  { c: '#0d47a1', icon: 'verified',           label: 'Verified',         rot: -4  },
  { c: '#b71c1c', icon: 'local_bar',          label: 'Craft Stamp',      rot: 7   },
  { c: '#c5a059', icon: 'workspace_premium',  label: 'VIP Stamp',        rot: -6  },
]
const DIR_MEMBERS = [
  { init: 'MR', name: 'Michael Reynolds', role: 'Entrepreneur',    city: 'New York, NY',     bg: '#0d1829', tags: ['Innovation', 'Leadership'] },
  { init: 'AC', name: 'Alicia Chen',      role: 'Investor',        city: 'San Francisco, CA', bg: '#0d1a10', tags: ['Venture Capital', 'Art']  },
]
const CONN_MATCHES = [
  { init: 'DH', name: 'David Harper',    role: 'Founder @ North & Co.', city: 'Austin, TX',      pct: 94, tags: ['Innovation', 'Travel'],  bg: '#1a0a12', events: '2 Mutual Events'       },
  { init: 'SM', name: 'Sophia Martinez', role: 'Creative Director',      city: 'Los Angeles, CA', pct: 88, tags: ['Design', 'Art'],        bg: '#1f0a0f', events: '2 Mutual Connections'  },
]
const EVENTS_LIST = [
  { mon: 'JUN', day: '14', title: 'Cigar & Cognac Collectors Night',  venue: 'Grand Lounge · NYC', time: '7:00 PM' },
  { mon: 'JUN', day: '22', title: 'Capital & Culture Private Dinner', venue: 'Bottle House · NYC', time: '6:30 PM' },
]
const BENEFITS_LIST = [
  { icon: 'stars',         label: 'The 360 Club',       sub: 'Priority Access'    },
  { icon: 'percent',       label: 'Partner Discounts',  sub: 'Curated Savings'    },
  { icon: 'local_offer',   label: 'Exclusive Drops',    sub: 'Members Only'       },
  { icon: 'support_agent', label: 'Concierge Access',   sub: 'On Demand'          },
]
const HERE_NOW = [
  { init: 'MY', name: 'Marcus Yang',    role: 'Investor',           bg: '#1e3a5f' },
  { init: 'ER', name: 'Elena Rossi',    role: 'Brand Advisor',      bg: '#3b1028' },
  { init: 'JC', name: 'James Carter',   role: 'Entrepreneur',       bg: '#0d2818' },
  { init: 'PS', name: 'Priya Shah',     role: 'Marketing Lead',     bg: '#3a1a00' },
  { init: 'DK', name: 'Daniel Kim',     role: 'Product Strategist', bg: '#1a1208' },
  { init: 'IM', name: 'Isabella Moore', role: 'Designer',           bg: '#21102c' },
]
const ACTIVITY = [
  { icon: 'event',              color: '#4a9eff', label: 'Event Stamp',      sub: 'Grand Opening',  when: '3d ago' },
  { icon: 'hub',                color: '#ce93d8', label: 'Connection Stamp', sub: 'Met Alicia Chen', when: '2d ago' },
  { icon: 'verified',           color: '#66bb6a', label: 'Verified Stamp',   sub: 'Profile Verified',when: '3d ago' },
  { icon: 'local_bar',          color: '#cd7f32', label: 'Craft Stamp',      sub: 'Cigar Tasting',  when: '4d ago' },
  { icon: 'workspace_premium',  color: '#e9c176', label: 'VIP Stamp',        sub: 'Invite Only',    when: '5d ago' },
]
const HOW_STEPS = [
  { n: '1', icon: 'qr_code_scanner', title: 'Scan In',       body: 'Enter a venue or event using your QR passport' },
  { n: '2', icon: 'badge',           title: 'Build Profile', body: 'Share your story, interests, goals, and what matters' },
  { n: '3', icon: 'people',          title: 'Meet People',   body: 'Connect with verified members and better matches' },
  { n: '4', icon: 'workspace_premium', title: 'Earn Stamps', body: 'Collect stamps, gain access, perks, and grow your legacy' },
]
const START_HERE = [
  { icon: 'qr_code_scanner', label: 'Scan to Connect',   sub: 'Enter a venue or event', to: '/passport/scan'        },
  { icon: 'contacts',        label: 'Explore Directory', sub: 'Discover verified members', to: '/passport/directory' },
  { icon: 'hub',             label: 'View Matches',      sub: 'See your top connections', to: '/passport/connections'},
  { icon: 'event',           label: 'Join an Event',     sub: 'RSVP & meet in person',   to: '/passport/events'      },
  { icon: 'stars',           label: 'Explore Benefits',  sub: 'Rewards, access & perks', to: '/passport/benefits'    },
]

export default function PassportConnection() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const { session, startPassportEntry, refreshLastActive } = useGuestSession()
  const initRef        = useRef(false)
  const [on, setOn]    = useState(false)

  useEffect(() => {
    if (initRef.current) return; initRef.current = true
    const p = parsePassportEntryParams(params)
    if (p.venueId || p.deviceId || p.entrySource) startPassportEntry(p)
    refreshLastActive()
    setTimeout(() => setOn(true), 80)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const xp    = session.xp ?? 0
  const rank  = getRankFromXP(xp)
  const fname = session.profile?.firstName
  const lname = session.profile?.lastName
  const displayName = fname ? `${fname} ${lname || ''}`.trim() : 'John M Collins'
  const initials    = `${fname?.[0] || 'J'}${lname?.[0] || 'C'}`
  const venue = getVenueDisplayName(session.venueId)
  const TIER_C = { Novice:'#c5a059', Bronze:'#cd7f32', Silver:'#c0c0c0', Gold:'#e9c176', Diamond:'#4fc3f7' }
  const tc = TIER_C[rank.name] || '#e9c176'
  const nextXP = rank.nextXP ?? 500
  const pct = Math.min(100, Math.round((xp / nextXP) * 100))

  return (
    <div className="min-h-screen overflow-x-hidden pb-28" style={{ background: '#06040200' }}>

      {/* ═══ CINEMATIC BG ═══════════════════════════════════ */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="/passport-hero2.png" alt="" className="w-full h-full object-cover object-top"
          style={{ opacity: 0.28, filter: 'blur(2px) saturate(0.65)' }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(170deg,rgba(6,4,2,0.88) 0%,rgba(12,8,3,0.85) 35%,rgba(8,5,2,0.92) 70%,rgba(4,3,1,0.97) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(140,80,15,0.1) 0%, transparent 70%)' }} />
      </div>

      {/* ═══ TOP HEADER ZONE ════════════════════════════════ */}
      <header className="relative z-20 px-4 pt-4 pb-3 border-b"
        style={{ borderColor: 'rgba(233,193,118,0.15)' }}>
        {/* Brand bar */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ width:40,height:40,...leather('#1c1005'), border:'1.5px solid rgba(233,193,118,0.4)', boxShadow:'0 2px 12px rgba(0,0,0,0.5)' }}>
            <span className="font-black text-[13px]" style={{ ...GOLD, fontFamily:'"Playfair Display",serif' }}>360</span>
          </div>
          <div>
            <p className="font-bold text-[12px] uppercase tracking-[0.18em] leading-none" style={{ ...GOLD }}>360 Passport Connection</p>
            <p className="text-[8.5px] leading-tight mt-0.5 uppercase tracking-[0.15em]" style={{ color:'rgba(233,193,118,0.4)' }}>by Profound Innovations LLC · Powered by NOVEE OS</p>
          </div>
          <button onClick={() => navigate('/passport/profile')}
            className="ml-auto w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] active:scale-90 transition-transform"
            style={{ ...leather('#1a1005'), border:`1.5px solid ${tc}60`, color:tc, fontFamily:'"Playfair Display",serif', boxShadow:`0 0 12px ${tc}25` }}>
            {initials}
          </button>
        </div>

        {/* User identity */}
        <div className="mb-2">
          <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color:'rgba(233,193,118,0.45)' }}>Welcome back,</p>
          <h1 className="font-black leading-none mt-0.5" style={{ fontSize:30, fontFamily:'"Playfair Display",serif', color:'#f5ead0' }}>{displayName}</h1>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap mb-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background:`${tc}18`, border:`1px solid ${tc}40` }}>
            <span className="material-symbols-outlined" style={{ fontSize:11, color:tc, ...FILL1 }}>star</span>
            <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color:tc }}>{rank.name}</span>
          </div>
          <span className="font-bold text-[13px]" style={{ color:'#e9c176' }}>{xp.toLocaleString()} XP</span>
          <div className="flex items-center gap-1" style={{ color:'rgba(255,255,255,0.3)' }}>
            <span className="material-symbols-outlined" style={{ fontSize:11, ...FILL1 }}>location_on</span>
            <span className="text-[10px]">{venue}</span>
          </div>
        </div>

        {/* Venue + upcoming event row */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="rounded-lg px-3 py-2" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[8px] uppercase tracking-[0.25em] mb-0.5" style={{ color:'rgba(233,193,118,0.4)' }}>Active Venue</p>
            <p className="font-bold text-[11px]" style={{ color:'#f0e6d0' }}>Grand Lounge</p>
            <p className="text-[9px]" style={{ color:'rgba(255,255,255,0.3)' }}>New York, NY</p>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[8px] uppercase tracking-[0.25em] mb-0.5" style={{ color:'rgba(233,193,118,0.4)' }}>Upcoming Event</p>
            <p className="font-bold text-[11px] leading-tight" style={{ color:'#f0e6d0' }}>Capital & Culture</p>
            <p className="text-[9px]" style={{ color:'rgba(255,255,255,0.3)' }}>Jun 22 · 7:00 PM</p>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color:'rgba(255,255,255,0.4)' }}>
          Your digital passport for verified experiences, meaningful connections, and a legacy of craft.
        </p>
      </header>

      <main className="relative z-10 px-4 pt-5 space-y-5 max-w-2xl mx-auto">

        {/* ═══ PASSPORT BOOKLET OBJECT ══════════════════════ */}
        <section className={`transition-all duration-700 ${on ? 'opacity-100' : 'opacity-0 translate-y-3'}`}>
          {/* Passport spread — leather cover + open pages */}
          <div className="rounded-2xl overflow-hidden relative"
            style={{ boxShadow:'0 16px 56px rgba(0,0,0,0.85), 0 4px 0 rgba(197,160,89,0.15)', border:'1px solid rgba(197,160,89,0.25)' }}>

            {/* Gold binding strip */}
            <div className="h-1.5" style={{ background:'linear-gradient(90deg,#5c4010,#e9c176,#c5a059,#f0d070,#e9c176,#5c4010)' }} />

            <div className="grid grid-cols-2">
              {/* LEFT: Leather passport cover */}
              <div className="relative flex flex-col items-center justify-between p-5"
                style={{ minHeight:200, ...leather('#1c1005'), borderRight:'2px solid rgba(197,160,89,0.3)', boxShadow:'inset 4px 0 12px rgba(0,0,0,0.4)' }}>
                {/* Leather grain overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ background:'repeating-linear-gradient(135deg,rgba(255,255,255,0.008) 0,rgba(255,255,255,0.008) 1px,transparent 0,transparent 6px)' }} />
                {/* Globe emboss */}
                <div className="relative w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background:'rgba(233,193,118,0.06)', border:'2px solid rgba(233,193,118,0.22)', boxShadow:'inset 0 2px 4px rgba(0,0,0,0.5), 0 0 12px rgba(233,193,118,0.08)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:28, color:'#c5a059', ...FILL1 }}>public</span>
                </div>
                {/* Cover text */}
                <div className="text-center space-y-0.5">
                  <p className="font-black text-[20px] tracking-[0.15em]" style={{ ...GOLD, fontFamily:'"Playfair Display",serif', lineHeight:1 }}>360</p>
                  <p className="font-bold text-[11px] tracking-[0.22em] uppercase" style={{ ...GOLD }}>PASSPORT</p>
                  <p className="font-bold text-[9px] tracking-[0.18em] uppercase" style={{ color:'rgba(197,160,89,0.55)' }}>CONNECTION</p>
                  <div className="w-10 h-px mx-auto my-1.5" style={{ background:'rgba(197,160,89,0.35)' }} />
                  <p className="text-[7px] tracking-wider" style={{ color:'rgba(197,160,89,0.38)' }}>by Profound Innovations LLC</p>
                </div>
                {/* Bottom code */}
                <div className="text-center">
                  <p className="text-[6px] font-mono tracking-[0.3em]" style={{ color:'rgba(197,160,89,0.25)' }}>PC-2026-001</p>
                </div>
              </div>

              {/* RIGHT: Open stamp page */}
              <div className="relative" style={{ background:'linear-gradient(160deg,#fdf8ec,#f5edd5,#faf3e2)', minHeight:200 }}>
                {/* Page fold shadow */}
                <div className="absolute left-0 top-0 bottom-0 w-3" style={{ background:'linear-gradient(90deg,rgba(0,0,0,0.18),transparent)', pointerEvents:'none' }} />
                {/* Aged paper lines */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 15px,rgba(140,100,40,0.06) 15px,rgba(140,100,40,0.06) 16px)' }} />
                <div className="p-3 relative">
                  <p className="text-[7px] uppercase tracking-[0.3em] text-center mb-0.5 font-bold" style={{ color:'rgba(60,35,10,0.4)' }}>YOUR JOURNEY</p>
                  <p className="text-[6.5px] uppercase tracking-wider text-center mb-3" style={{ color:'rgba(60,35,10,0.28)' }}>You stamp. You connect. You legacy.</p>
                  {/* Stamp grid */}
                  <div className="grid grid-cols-3 gap-y-2.5 gap-x-1 place-items-center">
                    {STAMPS_PREVIEW.map((s, i) => (
                      <InkStamp key={i} color={s.c} icon={s.icon} label={s.label} rotation={s.rot} size={44} />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    <div className="flex-1 h-px" style={{ background:'rgba(100,70,30,0.2)' }} />
                    <span className="text-[7px] uppercase tracking-[0.2em]" style={{ color:'rgba(80,50,20,0.4)' }}>authenticated</span>
                    <div className="flex-1 h-px" style={{ background:'rgba(100,70,30,0.2)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* QR credential row */}
            <div className="flex items-center gap-3 px-4 py-3.5"
              style={{ background:'rgba(8,5,2,0.92)', borderTop:'1px solid rgba(197,160,89,0.2)' }}>
              <div className="bg-white rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ width:46, height:46, boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>
                <span className="material-symbols-outlined" style={{ fontSize:36, color:'#0a0805', ...FILL1 }}>qr_code_2</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[13px] leading-none" style={{ ...GOLD, fontFamily:'"Playfair Display",serif' }}>360 Passport Connection</p>
                <p className="text-[9px] mt-0.5 uppercase tracking-wider" style={{ color:'rgba(255,255,255,0.3)' }}>Scan to Connect · Active Session</p>
              </div>
              <button onClick={() => navigate('/passport/scan')}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.93)'}
                onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport/scan') }}
                className="rounded-xl font-bold text-[11px] uppercase tracking-wider active:scale-93 transition-all flex-shrink-0"
                style={{ height:42, paddingLeft:16, paddingRight:16, background:'linear-gradient(135deg,#e9c176,#c5a059)', color:'#0a0805', boxShadow:'0 2px 12px rgba(233,193,118,0.35)' }}>
                Scan
              </button>
            </div>
          </div>

          {/* Tagline under passport */}
          <div className="text-center mt-3 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background:'rgba(233,193,118,0.12)' }} />
            <p className="text-[9px] uppercase tracking-[0.3em] font-bold" style={{ ...GOLD }}>Every stamp tells a story. Every connection builds legacy.</p>
            <div className="flex-1 h-px" style={{ background:'rgba(233,193,118,0.12)' }} />
          </div>
        </section>

        {/* ═══ PRIMARY ACTIONS ═══════════════════════════════ */}
        <section className="grid grid-cols-2 gap-2.5">
          <button onClick={() => navigate('/passport/scan')}
            onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
            onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport/scan') }}
            className="col-span-2 flex items-center justify-center gap-3 rounded-xl font-bold text-[14px] uppercase tracking-wider active:scale-96 transition-all"
            style={{ height:72, background:'linear-gradient(135deg,#e9c176,#c5a059)', color:'#0a0805', boxShadow:'0 4px 24px rgba(233,193,118,0.35), 0 2px 0 rgba(100,60,10,0.5)' }}>
            <span className="material-symbols-outlined" style={{ fontSize:22, ...FILL1 }}>qr_code_scanner</span>
            Start Passport Session
          </button>
          {[
            { label:'How It Works',    icon:'help',     to:'/passport/how-it-works' },
            { label:'Explore Directory', icon:'contacts', to:'/passport/directory'  },
          ].map(b => (
            <button key={b.label} onClick={() => navigate(b.to)}
              onTouchStart={e => e.currentTarget.style.transform='scale(0.95)'}
              onTouchEnd={e => { e.currentTarget.style.transform=''; navigate(b.to) }}
              className="flex items-center justify-center gap-2.5 rounded-xl font-bold text-[12px] active:scale-95 transition-all"
              style={{ height:60, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(233,193,118,0.2)', color:'#f0e0c0', boxShadow:'0 2px 12px rgba(0,0,0,0.3)' }}>
              <span className="material-symbols-outlined" style={{ fontSize:18, color:'#e9c176', ...FILL1 }}>{b.icon}</span>
              {b.label}
            </button>
          ))}
        </section>

        {/* ═══ HOW IT WORKS + START HERE ════════════════════ */}
        <section className="space-y-3">
          {/* How It Works */}
          <div className="rounded-2xl overflow-hidden"
            style={{ ...leather('#0e0a05'), border:'1px solid rgba(233,193,118,0.18)', boxShadow:'0 4px 24px rgba(0,0,0,0.5)' }}>
            <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom:'1px solid rgba(233,193,118,0.1)' }}>
              <div>
                <p className="font-bold text-[15px]" style={{ ...GOLD, fontFamily:'"Playfair Display",serif' }}>How It Works</p>
                <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color:'rgba(255,255,255,0.3)' }}>Your journey in four simple steps</p>
              </div>
              <button onClick={() => navigate('/passport/how-it-works')}
                onTouchStart={e => e.currentTarget.style.opacity='0.6'}
                onTouchEnd={e => { e.currentTarget.style.opacity=''; navigate('/passport/how-it-works') }}
                className="text-[10px] uppercase tracking-wider active:opacity-60" style={{ color:'rgba(233,193,118,0.5)' }}>
                Full guide →
              </button>
            </div>
            <div className="grid grid-cols-2 p-1">
              {HOW_STEPS.map(s => (
                <div key={s.n} className="px-3 py-3 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background:'rgba(233,193,118,0.1)', border:'1px solid rgba(233,193,118,0.3)' }}>
                    <span className="text-[11px] font-black" style={{ ...GOLD }}>{s.n}</span>
                  </div>
                  <div>
                    <p className="font-bold text-[12px] leading-tight" style={{ color:'#f0e6d0' }}>{s.title}</p>
                    <p className="text-[9.5px] leading-snug mt-0.5" style={{ color:'rgba(255,255,255,0.38)' }}>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Here */}
          <div className="rounded-2xl overflow-hidden"
            style={{ ...leather('#0f0c07'), border:'1px solid rgba(233,193,118,0.15)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom:'1px solid rgba(233,193,118,0.1)' }}>
              <div className="w-1 h-4 rounded-full" style={{ background:'linear-gradient(#e9c176,#c5a059)' }} />
              <p className="font-bold text-[13px] uppercase tracking-wider" style={{ ...GOLD }}>Start Here — Your Next Actions</p>
            </div>
            <div className="p-2 grid grid-cols-1 gap-1.5">
              {START_HERE.map(a => (
                <button key={a.label} onClick={() => navigate(a.to)}
                  onTouchStart={e => e.currentTarget.style.background='rgba(233,193,118,0.08)'}
                  onTouchEnd={e => { e.currentTarget.style.background='transparent'; navigate(a.to) }}
                  className="flex items-center gap-3 rounded-xl px-3 active:opacity-80 transition-all text-left"
                  style={{ height:56, background:'transparent' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background:'rgba(233,193,118,0.1)', border:'1px solid rgba(233,193,118,0.2)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:18, color:'#e9c176', ...FILL1 }}>{a.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[13px] leading-tight" style={{ color:'#f0e6d0' }}>{a.label}</p>
                    <p className="text-[10px]" style={{ color:'rgba(255,255,255,0.35)' }}>{a.sub}</p>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize:16, color:'rgba(233,193,118,0.3)' }}>chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SIX SECTION CARDS ════════════════════════════ */}
        <section>
          <p className="text-[9px] uppercase tracking-[0.35em] mb-3 px-1" style={{ color:'rgba(255,255,255,0.2)' }}>Passport Sections</p>
          <div className="grid grid-cols-2 gap-3">

            {/* ── 1. DIGITAL STAMPS (aged paper) ── */}
            <div className="col-span-2 rounded-2xl overflow-hidden"
              style={{ background:'linear-gradient(160deg,#fdf8ec,#f0e6cc,#faf3e2)', border:'2px solid rgba(150,110,50,0.35)', boxShadow:'0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
              {/* Paper texture lines */}
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(120,80,30,0.05) 18px,rgba(120,80,30,0.05) 19px)' }} />
              <div className="p-4 relative">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-black text-[15px] uppercase tracking-wider" style={{ color:'#3d2510', fontFamily:'"Playfair Display",serif' }}>Digital Stamps</p>
                    <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color:'rgba(80,45,10,0.55)' }}>Collect. Earn. Unlock.</p>
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background:'rgba(60,35,10,0.08)', border:'1px solid rgba(60,35,10,0.2)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:15, color:'#5c3a10', ...FILL1 }}>menu_book</span>
                  </div>
                </div>
                <div className="flex gap-3 justify-around mb-3">
                  {STAMPS_PREVIEW.map((s, i) => (
                    <InkStamp key={i} color={s.c} icon={s.icon} label={s.label} rotation={s.rot} size={46} />
                  ))}
                </div>
                <p className="text-[10px] text-center mb-3" style={{ color:'rgba(60,35,10,0.5)' }}>
                  Stamps prove your journey and unlock exclusive experiences.
                </p>
                <button onClick={() => navigate('/passport/stamps')}
                  onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
                  onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport/stamps') }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-[12px] uppercase tracking-wider active:scale-97 transition-all"
                  style={{ height:48, background:'rgba(60,35,10,0.1)', border:'1.5px solid rgba(80,50,20,0.35)', color:'#4a2e08' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:16, ...FILL1 }}>menu_book</span>
                  View My Stamps
                </button>
              </div>
            </div>

            {/* ── 2. DIRECTORY (forest green leather) ── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ ...leather('#061a08'), border:'1px solid rgba(102,187,106,0.3)', boxShadow:'0 6px 28px rgba(0,0,0,0.6)' }}>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined" style={{ fontSize:16, color:'#66bb6a', ...FILL1 }}>contacts</span>
                  <p className="font-bold text-[13px]" style={{ color:'#a8e6ac', fontFamily:'"Playfair Display",serif' }}>Directory</p>
                </div>
                <p className="text-[9px] uppercase tracking-wider mb-3" style={{ color:'rgba(168,230,172,0.4)' }}>Discover verified members.</p>
                {/* Member mini-cards */}
                {DIR_MEMBERS.map(m => (
                  <div key={m.name} className="rounded-lg flex items-center gap-2 px-2 py-2 mb-2"
                    style={{ background:'rgba(102,187,106,0.08)', border:'1px solid rgba(102,187,106,0.15)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                      style={{ background:`${m.bg}`, color:'#a8e6ac', border:'1px solid rgba(102,187,106,0.25)' }}>{m.init}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[10px] leading-tight truncate" style={{ color:'#d4f0d6' }}>{m.name}</p>
                      <p className="text-[8.5px] leading-tight truncate" style={{ color:'rgba(168,230,172,0.45)' }}>{m.role}</p>
                    </div>
                  </div>
                ))}
                <button onClick={() => navigate('/passport/directory')}
                  onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
                  onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport/directory') }}
                  className="w-full rounded-lg font-bold text-[10px] uppercase tracking-wider active:scale-96 transition-all"
                  style={{ height:40, background:'rgba(102,187,106,0.12)', border:'1px solid rgba(102,187,106,0.3)', color:'#66bb6a' }}>
                  Browse All Members →
                </button>
              </div>
            </div>

            {/* ── 3. CONNECTIONS (burgundy) ── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ ...leather('#1a0610'), border:'1px solid rgba(206,147,216,0.25)', boxShadow:'0 6px 28px rgba(0,0,0,0.6)' }}>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined" style={{ fontSize:16, color:'#ce93d8', ...FILL1 }}>hub</span>
                  <p className="font-bold text-[13px]" style={{ color:'#e8b4ef', fontFamily:'"Playfair Display",serif' }}>Connections</p>
                </div>
                <p className="text-[9px] uppercase tracking-wider mb-3" style={{ color:'rgba(206,147,216,0.38)' }}>Grow your network.</p>
                <p className="text-[9px] mb-2" style={{ color:'rgba(206,147,216,0.5)' }}>Top Matches For You</p>
                {CONN_MATCHES.map(m => (
                  <div key={m.name} className="rounded-lg flex items-center gap-2 px-2 py-2 mb-2"
                    style={{ background:'rgba(206,147,216,0.07)', border:'1px solid rgba(206,147,216,0.13)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                      style={{ background:`${m.bg}`, color:'#e8b4ef' }}>{m.init}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[10px] leading-tight truncate" style={{ color:'#f0d4f5' }}>{m.name}</p>
                      <p className="text-[8.5px] truncate" style={{ color:'rgba(206,147,216,0.4)' }}>{m.role}</p>
                    </div>
                    <span className="font-black text-[11px] flex-shrink-0" style={{ color:'#ce93d8' }}>{m.pct}%</span>
                  </div>
                ))}
                <button onClick={() => navigate('/passport/connections')}
                  onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
                  onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport/connections') }}
                  className="w-full rounded-lg font-bold text-[10px] uppercase tracking-wider active:scale-96 transition-all"
                  style={{ height:40, background:'rgba(206,147,216,0.1)', border:'1px solid rgba(206,147,216,0.25)', color:'#ce93d8' }}>
                  View All Connections →
                </button>
              </div>
            </div>

            {/* ── 4. EVENTS (amber invitation) ── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ ...leather('#1a1000'), border:'1px solid rgba(255,183,77,0.25)', boxShadow:'0 6px 28px rgba(0,0,0,0.6)' }}>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined" style={{ fontSize:16, color:'#ffb74d', ...FILL1 }}>event</span>
                  <p className="font-bold text-[13px]" style={{ color:'#ffd580', fontFamily:'"Playfair Display",serif' }}>Events</p>
                </div>
                <p className="text-[9px] uppercase tracking-wider mb-3" style={{ color:'rgba(255,183,77,0.35)' }}>Upcoming Experiences</p>
                {EVENTS_LIST.map(e => (
                  <div key={e.title} className="flex items-start gap-2 mb-2.5">
                    <div className="rounded-lg flex-shrink-0 flex flex-col items-center justify-center"
                      style={{ width:32, height:32, background:'rgba(255,183,77,0.12)', border:'1px solid rgba(255,183,77,0.25)' }}>
                      <span className="text-[8px] font-bold uppercase" style={{ color:'#ffa020', lineHeight:1 }}>{e.mon}</span>
                      <span className="text-[13px] font-black" style={{ color:'#ffb74d', lineHeight:1 }}>{e.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[10px] leading-tight" style={{ color:'#ffd580' }}>{e.title}</p>
                      <p className="text-[8.5px]" style={{ color:'rgba(255,183,77,0.4)' }}>{e.venue} · {e.time}</p>
                    </div>
                  </div>
                ))}
                <button onClick={() => navigate('/passport/events')}
                  onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
                  onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport/events') }}
                  className="w-full rounded-lg font-bold text-[10px] uppercase tracking-wider active:scale-96 transition-all"
                  style={{ height:40, background:'rgba(255,183,77,0.1)', border:'1px solid rgba(255,183,77,0.25)', color:'#ffb74d' }}>
                  Browse All Events →
                </button>
              </div>
            </div>

            {/* ── 5. BENEFITS (black platinum) ── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ ...leather('#080808'), border:'1px solid rgba(233,193,118,0.22)', boxShadow:'0 6px 28px rgba(0,0,0,0.7)' }}>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined" style={{ fontSize:16, color:'#e9c176', ...FILL1 }}>stars</span>
                  <p className="font-bold text-[13px]" style={{ ...GOLD, fontFamily:'"Playfair Display",serif' }}>Benefits</p>
                </div>
                <p className="text-[9px] uppercase tracking-wider mb-3" style={{ color:'rgba(233,193,118,0.35)' }}>Member Privileges & Rewards</p>
                <div className="space-y-2 mb-3">
                  {BENEFITS_LIST.map(b => (
                    <div key={b.label} className="flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize:12, color:'#e9c176', ...FILL1 }}>{b.icon}</span>
                      <div>
                        <span className="text-[10px] font-bold" style={{ color:'#f0e0c0' }}>{b.label}</span>
                        <span className="text-[9px] ml-1.5" style={{ color:'rgba(233,193,118,0.4)' }}>{b.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/passport/benefits')}
                  onTouchStart={e => e.currentTarget.style.transform='scale(0.96)'}
                  onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport/benefits') }}
                  className="w-full rounded-lg font-bold text-[10px] uppercase tracking-wider active:scale-96 transition-all"
                  style={{ height:40, background:'rgba(233,193,118,0.08)', border:'1px solid rgba(233,193,118,0.2)', color:'#e9c176' }}>
                  View All Benefits →
                </button>
              </div>
            </div>

            {/* ── 6. MY PROFILE (navy passport identity) ── */}
            <div className="col-span-2 rounded-2xl overflow-hidden"
              style={{ ...leather('#08101a'), border:'1px solid rgba(100,150,255,0.2)', boxShadow:'0 6px 28px rgba(0,0,0,0.6)' }}>
              <div className="p-4 flex items-center gap-4">
                {/* Portrait */}
                <div className="flex-shrink-0 relative">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-[20px]"
                    style={{ background:'linear-gradient(145deg,#1e3a5f,#0d2035)', color:'#90caf9', fontFamily:'"Playfair Display",serif', border:'2px solid rgba(100,150,255,0.25)', boxShadow:'0 4px 16px rgba(0,0,0,0.5)' }}>
                    {initials}
                  </div>
                  {/* Verified seal */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background:'linear-gradient(135deg,#e9c176,#c5a059)', boxShadow:'0 2px 6px rgba(0,0,0,0.4)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:12, color:'#0a0805', ...FILL1 }}>verified</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[16px] leading-tight" style={{ color:'#f0e6d0', fontFamily:'"Playfair Display",serif' }}>{displayName}</p>
                  <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color:'rgba(144,202,249,0.5)' }}>{rank.name} Member</p>
                  {/* XP bar */}
                  <div className="mt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px]" style={{ color:'rgba(233,193,118,0.5)' }}>{xp} XP</span>
                      <span className="text-[9px]" style={{ color:'rgba(233,193,118,0.3)' }}>{nextXP} XP to next tier</span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height:5, background:'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background:'linear-gradient(90deg,#c5a059,#e9c176)' }} />
                    </div>
                  </div>
                </div>
                <button onClick={() => navigate('/passport/profile')}
                  onTouchStart={e => e.currentTarget.style.transform='scale(0.93)'}
                  onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport/profile') }}
                  className="flex-shrink-0 rounded-xl font-bold text-[10px] uppercase tracking-wider active:scale-93 transition-all"
                  style={{ height:48, paddingLeft:12, paddingRight:12, background:'rgba(100,150,255,0.08)', border:'1px solid rgba(100,150,255,0.2)', color:'#90caf9' }}>
                  View Full<br/>Profile
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ RECENT ACTIVITY ══════════════════════════════ */}
        <section>
          <div className="rounded-2xl overflow-hidden"
            style={{ ...leather('#0a0806'), border:'1px solid rgba(233,193,118,0.14)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
            <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom:'1px solid rgba(233,193,118,0.08)' }}>
              <div>
                <p className="font-bold text-[14px]" style={{ ...GOLD, fontFamily:'"Playfair Display",serif' }}>Recent Activity</p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color:'rgba(255,255,255,0.25)' }}>Your latest stamps and milestones</p>
              </div>
            </div>
            <div className="px-4 py-4 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
              <div className="flex gap-3 min-w-max">
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 relative" style={{ width:68 }}>
                    {i < ACTIVITY.length - 1 && (
                      <div className="absolute top-6 left-[calc(50%+18px)] h-px" style={{ width:24, background:`${a.color}25` }} />
                    )}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background:`${a.color}12`, border:`2px solid ${a.color}55`, boxShadow:`0 0 12px ${a.color}20` }}>
                      <span className="material-symbols-outlined" style={{ fontSize:20, color:a.color, ...FILL1 }}>{a.icon}</span>
                    </div>
                    <p className="text-[9px] font-bold text-center leading-tight" style={{ color:'#f0e6d0' }}>{a.label}</p>
                    <p className="text-[8px] text-center leading-tight" style={{ color:'rgba(255,255,255,0.3)' }}>{a.sub}</p>
                    <p className="text-[8px]" style={{ color:'rgba(255,255,255,0.2)' }}>{a.when}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PROGRESS & REWARDS ═══════════════════════════ */}
        <section>
          <div className="rounded-2xl overflow-hidden"
            style={{ ...leather('#0f0c07'), border:'1px solid rgba(233,193,118,0.16)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
            <div className="px-4 py-3" style={{ borderBottom:'1px solid rgba(233,193,118,0.08)' }}>
              <p className="font-bold text-[14px]" style={{ ...GOLD, fontFamily:'"Playfair Display",serif' }}>Progress & Rewards</p>
            </div>
            <div className="px-4 py-4 grid grid-cols-2 gap-4">
              {/* XP + tier */}
              <div>
                <div className="w-14 h-14 rounded-full flex flex-col items-center justify-center mb-2"
                  style={{ background:`${tc}12`, border:`2px solid ${tc}45`, boxShadow:`0 0 16px ${tc}18` }}>
                  <span className="font-black text-[14px]" style={{ color:tc, fontFamily:'"Playfair Display",serif' }}>{rank.name[0]}</span>
                </div>
                <p className="font-bold text-[13px]" style={{ color:tc }}>{rank.name}</p>
                <p className="font-black text-[20px] leading-none" style={{ color:'#f0e6d0', fontFamily:'"Playfair Display",serif' }}>{xp}</p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color:'rgba(255,255,255,0.3)' }}>XP to next tier</p>
                <div className="mt-2 rounded-full overflow-hidden" style={{ height:6, background:'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${tc}80,${tc})` }} />
                </div>
                <p className="text-[9px] mt-1" style={{ color:'rgba(255,255,255,0.2)' }}>{pct}% · {nextXP} XP goal</p>
              </div>
              {/* Unlocks + achievement */}
              <div className="space-y-3">
                <div className="rounded-xl p-3" style={{ background:'rgba(233,193,118,0.06)', border:'1px solid rgba(233,193,118,0.15)' }}>
                  <p className="text-[8px] uppercase tracking-[0.2em]" style={{ color:'rgba(233,193,118,0.4)' }}>Next Unlock</p>
                  <p className="font-bold text-[12px] mt-0.5" style={{ color:'#f0e6d0' }}>360 Club Access</p>
                  <p className="text-[9px]" style={{ color:'rgba(255,255,255,0.3)' }}>At {nextXP} XP</p>
                </div>
                <div className="rounded-xl p-3" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-[8px] uppercase tracking-[0.2em]" style={{ color:'rgba(255,255,255,0.3)' }}>Achievement</p>
                  <p className="font-bold text-[11px] mt-0.5" style={{ color:'#f0e6d0' }}>Social Connector</p>
                  <p className="text-[9px] mt-0.5" style={{ color:'rgba(255,255,255,0.3)' }}>Create 10 meaningful connections</p>
                  <div className="mt-1.5 rounded-full overflow-hidden" style={{ height:4, background:'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width:'80%', background:'linear-gradient(90deg,#66bb6a80,#66bb6a)' }} />
                  </div>
                  <p className="text-[8px] mt-0.5" style={{ color:'rgba(255,255,255,0.25)' }}>8 / 10</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ WHO'S HERE NOW ════════════════════════════════ */}
        <section className="pb-2">
          <div className="rounded-2xl overflow-hidden"
            style={{ ...leather('#0a0806'), border:'1px solid rgba(233,193,118,0.14)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
            <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom:'1px solid rgba(233,193,118,0.08)' }}>
              <div>
                <p className="font-bold text-[14px]" style={{ ...GOLD, fontFamily:'"Playfair Display",serif' }}>Who&apos;s Here Now</p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color:'rgba(255,255,255,0.25)' }}>Members currently active at Grand Lounge</p>
              </div>
              <button onClick={() => navigate('/passport/directory')}
                onTouchStart={e => e.currentTarget.style.opacity='0.6'}
                onTouchEnd={e => { e.currentTarget.style.opacity=''; navigate('/passport/directory') }}
                className="text-[10px] uppercase tracking-wider active:opacity-60" style={{ color:'rgba(233,193,118,0.5)' }}>
                View All (324) →
              </button>
            </div>
            <div className="px-4 py-4 flex gap-4 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
              {HERE_NOW.map(m => (
                <button key={m.name} onClick={() => navigate('/passport/directory')}
                  onTouchStart={e => e.currentTarget.style.transform='scale(0.9)'}
                  onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport/directory') }}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-90 transition-transform"
                  style={{ width:60 }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-[14px]"
                    style={{ background:`${m.bg}`, color:'#f0e6d0', border:'2px solid rgba(233,193,118,0.15)', fontFamily:'"Playfair Display",serif', boxShadow:'0 4px 12px rgba(0,0,0,0.5)' }}>
                    {m.init}
                  </div>
                  <p className="text-[9px] font-bold text-center leading-tight" style={{ color:'#f0e6d0' }}>{m.name.split(' ')[0]}</p>
                  <p className="text-[8px] text-center leading-tight" style={{ color:'rgba(255,255,255,0.3)', maxWidth:56 }}>{m.role}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

      </main>
      <PassportBottomNav active="hub" />
    </div>
  )
}
