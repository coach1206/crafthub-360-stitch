import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGuestSession } from '../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../constants/session.js'
import { parsePassportEntryParams, getVenueDisplayName } from '../utils/passportEntry.js'
import PassportBottomNav from '../components/PassportBottomNav.jsx'
import craftImages from '../lib/craftImages.js'

const GOLD = {
  background: 'linear-gradient(135deg,#8b6914 0%,#e9c176 35%,#f5d98a 55%,#c5a059 75%,#8b6914 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}
const FILL1 = { fontVariationSettings: "'FILL' 1" }

const HOW_STEPS = [
  { n:'1', icon:'qr_code_scanner',  title:'Scan In',       body:'Enter a venue or event using your QR passport',           color:'#e9c176' },
  { n:'2', icon:'badge',            title:'Build Profile', body:'Share your story, interests, goals, and what matters',    color:'#ce93d8' },
  { n:'3', icon:'group',            title:'Meet People',   body:'Connect with verified members and better matches',        color:'#66bb6a' },
  { n:'4', icon:'workspace_premium',title:'Earn Stamps',   body:'Collect stamps, gain access, perks, and grow legacy',    color:'#ffb74d' },
]

const START_HERE = [
  { icon:'qr_code_scanner', label:'Scan to Connect',   sub:'Find events and venues nearby',    to:'/passport/scan',        color:'#e9c176', bg:'rgba(233,193,118,0.1)'  },
  { icon:'contacts',        label:'Explore Directory', sub:'Discover verified members',        to:'/passport/directory',   color:'#66bb6a', bg:'rgba(102,187,106,0.1)'  },
  { icon:'hub',             label:'View Matches',      sub:'See your top connections',         to:'/passport/connections', color:'#ce93d8', bg:'rgba(206,147,216,0.1)'  },
  { icon:'event',           label:'Join an Event',     sub:'RSVP & meet in person',            to:'/passport/events',      color:'#ffb74d', bg:'rgba(255,183,77,0.1)'   },
  { icon:'stars',           label:'Explore Benefits',  sub:'Unlock rewards & perks',           to:'/passport/benefits',    color:'#4a9eff', bg:'rgba(74,158,255,0.1)'   },
]

const SECTIONS = [
  {
    id:'directory',
    title:'Directory',
    sub:'Verified members, brands & more',
    to:'/passport/directory',
    color:'#66bb6a',
    img: craftImages.portraits.member1,
    overlay:'rgba(4,18,6,0.72)',
    border:'rgba(102,187,106,0.35)',
  },
  {
    id:'connections',
    title:'Connections',
    sub:'Your network & conversations',
    to:'/passport/connections',
    color:'#ce93d8',
    img: craftImages.portraits.mentor,
    overlay:'rgba(18,4,20,0.72)',
    border:'rgba(206,147,216,0.3)',
  },
  {
    id:'events',
    title:'Events',
    sub:'Curated experiences & invites',
    to:'/passport/events',
    color:'#ffb74d',
    img: craftImages.events.cigarcognac,
    overlay:'rgba(20,12,0,0.70)',
    border:'rgba(255,183,77,0.3)',
  },
  {
    id:'benefits',
    title:'Benefits',
    sub:'Access perks & privileges',
    to:'/passport/benefits',
    color:'#e9c176',
    img: craftImages.backgrounds.lounge,
    overlay:'rgba(8,6,2,0.80)',
    border:'rgba(233,193,118,0.25)',
  },
]

const STAMPS_PREVIEW = [
  { c:'#1a5c2a', icon:'event',              label:'Event',      rot:-5 },
  { c:'#7b1fa2', icon:'hub',               label:'Connect',    rot:4  },
  { c:'#0d47a1', icon:'verified',          label:'Verified',   rot:-3 },
  { c:'#b71c1c', icon:'local_bar',         label:'Craft',      rot:6  },
  { c:'#c5a059', icon:'workspace_premium', label:'VIP',        rot:-4 },
]

const EVENTS_LIST = [
  { mon:'JUN', day:'14', title:'Cigar & Cognac Collectors Night',  venue:'Grand Lounge · NYC', time:'7:00 PM', to:'/passport/events' },
  { mon:'JUN', day:'22', title:'Capital & Culture Private Dinner', venue:'Bottle House · NYC', time:'6:30 PM', to:'/passport/events' },
]

const ACTIVITY = [
  { icon:'event',              color:'#4a9eff', label:'Event Stamp',      sub:'Grand Opening',   when:'3d ago' },
  { icon:'hub',                color:'#ce93d8', label:'Connection',       sub:'Met Alicia Chen', when:'2d ago' },
  { icon:'verified',           color:'#66bb6a', label:'Verified',         sub:'Profile Check',   when:'3d ago' },
  { icon:'local_bar',          color:'#cd7f32', label:'Craft Stamp',      sub:'Cigar Tasting',   when:'4d ago' },
  { icon:'workspace_premium',  color:'#e9c176', label:'VIP Stamp',        sub:'Invite Only',     when:'5d ago' },
]

function NavBtn({ to, children, primary, style: extra, ...props }) {
  const navigate = useNavigate()
  return (
    <button
      {...props}
      onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.opacity = '0.9' }}
      onTouchEnd={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.opacity = ''; navigate(to) }}
      onTouchCancel={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.opacity = '' }}
      onClick={() => navigate(to)}
      style={{
        cursor: 'pointer', transition: 'transform 0.12s, opacity 0.12s',
        ...(primary ? {
          background: 'linear-gradient(135deg,#e9c176,#c5a059)',
          color: '#0a0805',
          boxShadow: '0 4px 24px rgba(233,193,118,0.35)',
          border: 'none',
        } : {}),
        ...extra,
      }}
    >
      {children}
    </button>
  )
}

export default function PassportConnection() {
  const navigate        = useNavigate()
  const [params]        = useSearchParams()
  const { session, startPassportEntry, refreshLastActive } = useGuestSession()
  const initRef         = useRef(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (initRef.current) return; initRef.current = true
    const p = parsePassportEntryParams(params)
    if (p.venueId || p.deviceId || p.entrySource) startPassportEntry(p)
    refreshLastActive()
    setTimeout(() => setMounted(true), 60)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const xp          = session.xp ?? 0
  const rank        = getRankFromXP(xp)
  const fname       = session.profile?.firstName
  const lname       = session.profile?.lastName
  const displayName = fname ? `${fname} ${lname || ''}`.trim() : 'Passport Member'
  const initials    = fname ? `${fname[0]}${lname?.[0] || ''}` : 'PM'
  const venue       = getVenueDisplayName(session.venueId)
  const TIER_C      = { Novice:'#c5a059', Bronze:'#cd7f32', Silver:'#c0c0c0', Gold:'#e9c176', Diamond:'#4fc3f7' }
  const tc          = TIER_C[rank.name] || '#e9c176'
  const nextXP      = rank.nextXP ?? 500
  const xpPct       = Math.min(100, Math.round((xp / nextXP) * 100))

  return (
    <div className="min-h-screen overflow-x-hidden pb-28"
      style={{ background:'linear-gradient(170deg,#060402,#0a0705,#050302)' }}>

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(140,80,15,0.12) 0%, transparent 70%)' }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(60,10,80,0.08) 0%, transparent 60%)' }} />
      </div>

      {/* ═══ HEADER ══════════════════════════════════════════ */}
      <header className="relative z-20 px-4 pt-5 pb-4"
        style={{ borderBottom:'1px solid rgba(233,193,118,0.12)' }}>
        <div className="flex items-center gap-3 mb-4">
          {/* Brand mark */}
          <div className="rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ width:44, height:44,
              background:'linear-gradient(145deg,#1c1005,#0d0803)',
              border:'1.5px solid rgba(233,193,118,0.35)',
              boxShadow:'0 2px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
            <span className="font-black text-[14px]" style={{ ...GOLD, fontFamily:'"Playfair Display",serif' }}>360</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[11px] uppercase tracking-[0.18em] leading-none" style={{ ...GOLD }}>360 Passport Connection</p>
            <p className="text-[8px] mt-0.5 uppercase tracking-[0.12em]" style={{ color:'rgba(233,193,118,0.35)' }}>by Profound Innovations LLC</p>
          </div>
          {/* Notification */}
          <NavBtn to="/passport/profile"
            className="w-10 h-10 rounded-full flex items-center justify-center relative active:scale-90 transition-transform"
            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(233,193,118,0.2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize:20, color:'rgba(233,193,118,0.7)', ...FILL1 }}>notifications</span>
            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background:'#e9c176', boxShadow:'0 0 6px #e9c176' }} />
          </NavBtn>
          {/* Settings / Profile */}
          <NavBtn to="/passport/profile"
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] active:scale-90 transition-transform flex-shrink-0"
            style={{ background:'linear-gradient(145deg,#1c1005,#0d0803)', border:`1.5px solid ${tc}55`, color:tc, fontFamily:'"Playfair Display",serif', boxShadow:`0 0 12px ${tc}25` }}>
            {initials}
          </NavBtn>
        </div>

        {/* Identity */}
        <div className="mb-3">
          <p className="text-[9px] uppercase tracking-[0.35em]" style={{ color:'rgba(233,193,118,0.4)' }}>Welcome back,</p>
          <h1 className="font-black leading-none mt-0.5"
            style={{ fontSize:28, fontFamily:'"Playfair Display",serif', color:'#f5ead0' }}>{displayName}</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <NavBtn to="/passport/profile"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full active:scale-95 transition-transform"
            style={{ background:`${tc}18`, border:`1px solid ${tc}40` }}>
            <span className="material-symbols-outlined" style={{ fontSize:11, color:tc, ...FILL1 }}>verified</span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color:tc }}>Verified Member</span>
          </NavBtn>
          <span className="font-bold text-[13px]" style={{ color:'#e9c176' }}>{xp.toLocaleString()} XP</span>
          {venue && (
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize:11, color:'rgba(255,255,255,0.3)', ...FILL1 }}>location_on</span>
              <span className="text-[10px]" style={{ color:'rgba(255,255,255,0.3)' }}>{venue}</span>
            </div>
          )}
        </div>

        {/* Venue + upcoming */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl px-3 py-2.5"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[8px] uppercase tracking-[0.22em] mb-0.5" style={{ color:'rgba(233,193,118,0.4)' }}>Active Venue</p>
            <p className="font-bold text-[11px]" style={{ color:'#f0e6d0' }}>Grand Lounge</p>
            <p className="text-[9px]" style={{ color:'rgba(255,255,255,0.28)' }}>New York, NY</p>
          </div>
          <div className="rounded-xl px-3 py-2.5"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[8px] uppercase tracking-[0.22em] mb-0.5" style={{ color:'rgba(233,193,118,0.4)' }}>Upcoming Event</p>
            <p className="font-bold text-[11px] leading-tight" style={{ color:'#f0e6d0' }}>Capital & Culture</p>
            <p className="text-[9px]" style={{ color:'rgba(255,255,255,0.28)' }}>Jun 22 · 7:00 PM</p>
          </div>
        </div>
      </header>

      <main className={`relative z-10 pt-5 space-y-6 max-w-2xl mx-auto transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0 translate-y-2'}`}>

        {/* ═══ PASSPORT HERO IMAGE ═════════════════════════════ */}
        <section className="px-4">
          <div className="rounded-2xl overflow-hidden relative"
            style={{ boxShadow:'0 20px 60px rgba(0,0,0,0.85), 0 4px 0 rgba(197,160,89,0.2)', border:'1.5px solid rgba(197,160,89,0.3)' }}>
            {/* Gold binding strip */}
            <div style={{ height:3, background:'linear-gradient(90deg,#4a3008,#e9c176,#c5a059,#f0d070,#e9c176,#4a3008)' }} />

            {/* Real passport photo */}
            <div style={{ position:'relative', height:260, overflow:'hidden' }}>
              <img
                src="/passport.jpg"
                alt="360 Passport Connection"
                style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 40%', display:'block' }}
                onError={e => { e.currentTarget.src = '/passport-hero2.png' }}
              />
              {/* Dark vignette overlay */}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(6,4,2,0.1) 0%, rgba(6,4,2,0.0) 30%, rgba(6,4,2,0.7) 75%, rgba(6,4,2,0.97) 100%)' }} />
              {/* Left edge shadow */}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(6,4,2,0.4) 0%, transparent 30%, transparent 70%, rgba(6,4,2,0.4) 100%)' }} />

              {/* Text overlay */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 20px 20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ flex:1, height:1, background:'rgba(197,160,89,0.35)' }} />
                  <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(197,160,89,0.6)' }}>VERIFIED DIGITAL PASSPORT</span>
                  <div style={{ flex:1, height:1, background:'rgba(197,160,89,0.35)' }} />
                </div>
                <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:26, lineHeight:1, color:'#f5ead0', letterSpacing:'-0.01em', marginBottom:3 }}>
                  360 PASSPORT
                </p>
                <p style={{ ...GOLD, fontFamily:'"JetBrains Mono",monospace', fontWeight:700, fontSize:11, letterSpacing:'0.22em', textTransform:'uppercase', WebkitTextFillColor:'transparent' }}>
                  CONNECTION
                </p>
                <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(255,255,255,0.38)', marginTop:6, lineHeight:1.5 }}>
                  Your digital passport for verified experiences,<br/>meaningful connections, and a legacy of craft.
                </p>
              </div>
            </div>

            {/* QR scan row */}
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
              background:'rgba(8,5,2,0.95)', borderTop:'1px solid rgba(197,160,89,0.18)' }}>
              <div style={{ width:48, height:48, borderRadius:10, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>
                <span className="material-symbols-outlined" style={{ fontSize:38, color:'#0a0805', ...FILL1 }}>qr_code_2</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:13, ...GOLD, lineHeight:1 }}>360 Passport Connection</p>
                <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(255,255,255,0.28)', marginTop:3, textTransform:'uppercase', letterSpacing:'0.12em' }}>Scan to Connect · Active Session</p>
              </div>
              <NavBtn to="/passport/scan"
                className="flex items-center justify-center rounded-xl font-bold text-[12px] uppercase tracking-wider active:scale-95 transition-all flex-shrink-0"
                primary
                style={{ height:44, paddingLeft:20, paddingRight:20 }}>
                Scan
              </NavBtn>
            </div>

            {/* Tagline footer */}
            <div style={{ padding:'10px 20px 14px', background:'rgba(6,4,2,0.9)', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1, height:1, background:'rgba(197,160,89,0.15)' }} />
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(197,160,89,0.5)', textAlign:'center' }}>
                Every stamp tells a story · Every connection builds legacy
              </p>
              <div style={{ flex:1, height:1, background:'rgba(197,160,89,0.15)' }} />
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ════════════════════════════════════ */}
        <section>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingLeft:16, paddingRight:16, marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:3, height:16, borderRadius:2, background:'linear-gradient(#e9c176,#c5a059)' }} />
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(233,193,118,0.7)' }}>How It Works</p>
            </div>
            <NavBtn to="/passport/how-it-works"
              style={{ background:'none', border:'none', fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(233,193,118,0.4)', letterSpacing:'0.1em', padding:'4px 0' }}>
              Full guide →
            </NavBtn>
          </div>

          <div style={{ display:'flex', gap:12, overflowX:'auto', paddingLeft:16, paddingRight:16, paddingBottom:4, scrollbarWidth:'none' }}>
            {HOW_STEPS.map((s, i) => (
              <div key={i} style={{ flexShrink:0, width:148, borderRadius:16, overflow:'hidden', position:'relative',
                background:'linear-gradient(155deg,rgba(20,14,4,0.95),rgba(14,10,3,0.98))',
                border:`1px solid ${s.color}28`, boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
                <div style={{ padding:'16px 14px 14px' }}>
                  {/* Step number + icon */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:`${s.color}15`, border:`1px solid ${s.color}45`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:11, fontWeight:700, color:s.color }}>{s.n}</span>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize:18, color:s.color, ...FILL1, filter:`drop-shadow(0 0 6px ${s.color}60)` }}>{s.icon}</span>
                  </div>
                  <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#f0e6d0', lineHeight:1.2, marginBottom:5 }}>{s.title}</p>
                  <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{s.body}</p>
                </div>
                {/* Bottom accent line */}
                <div style={{ height:2, background:`linear-gradient(90deg,transparent,${s.color}60,transparent)` }} />
              </div>
            ))}
          </div>
        </section>

        {/* ═══ START HERE — YOUR NEXT ACTIONS ══════════════════ */}
        <section>
          <div style={{ display:'flex', alignItems:'center', gap:8, paddingLeft:16, marginBottom:12 }}>
            <div style={{ width:3, height:16, borderRadius:2, background:'linear-gradient(#e9c176,#c5a059)' }} />
            <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(233,193,118,0.7)' }}>Start Here — Your Next Actions</p>
          </div>

          <div style={{ display:'flex', gap:10, overflowX:'auto', paddingLeft:16, paddingRight:16, paddingBottom:4, scrollbarWidth:'none' }}>
            {START_HERE.map(a => (
              <NavBtn key={a.label} to={a.to}
                className="flex-shrink-0 flex flex-col items-center justify-center gap-2 rounded-2xl active:scale-95 transition-all"
                style={{ width:108, height:100, background:a.bg, border:`1px solid ${a.color}30`, boxShadow:'0 4px 16px rgba(0,0,0,0.4)' }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`${a.color}18`, border:`1px solid ${a.color}40`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:22, color:a.color, ...FILL1 }}>{a.icon}</span>
                </div>
                <div style={{ textAlign:'center', paddingLeft:6, paddingRight:6 }}>
                  <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:10, color:'#f0e6d0', lineHeight:1.2 }}>{a.label}</p>
                  <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:7.5, color:`${a.color}80`, marginTop:2, lineHeight:1.3 }}>{a.sub}</p>
                </div>
              </NavBtn>
            ))}
          </div>
        </section>

        {/* ═══ PASSPORT SECTIONS — 4 image-backed cards ════════ */}
        <section className="px-4">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ width:3, height:16, borderRadius:2, background:'linear-gradient(#e9c176,#c5a059)' }} />
            <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(233,193,118,0.7)' }}>Passport Sections</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {SECTIONS.map(sec => (
              <NavBtn key={sec.id} to={sec.to}
                className="rounded-2xl overflow-hidden relative active:scale-95 transition-all text-left"
                style={{ height:140, display:'block', background:'rgba(10,8,4,0.9)', border:`1px solid ${sec.border}`, boxShadow:'0 6px 24px rgba(0,0,0,0.6)' }}>
                {/* Background image */}
                <img
                  src={sec.img}
                  alt={sec.title}
                  onError={e => { e.currentTarget.src = craftImages.fallbacks.lounge }}
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.55) saturate(0.6)' }}
                />
                {/* Overlay */}
                <div style={{ position:'absolute', inset:0, background:`linear-gradient(to bottom, ${sec.overlay} 0%, ${sec.overlay} 100%)` }} />
                {/* Content */}
                <div style={{ position:'absolute', inset:0, padding:'14px 12px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:`${sec.color}20`, border:`1px solid ${sec.color}45`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:17, color:sec.color, ...FILL1 }}>
                      {sec.id === 'directory' ? 'contacts' : sec.id === 'connections' ? 'hub' : sec.id === 'events' ? 'event' : 'stars'}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:14, color:'#f0e6d0', lineHeight:1.2 }}>{sec.title}</p>
                    <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:`${sec.color}90`, marginTop:2, lineHeight:1.4 }}>{sec.sub}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6 }}>
                      <div style={{ flex:1, height:1, background:`${sec.color}30` }} />
                      <span className="material-symbols-outlined" style={{ fontSize:12, color:`${sec.color}70` }}>arrow_forward</span>
                    </div>
                  </div>
                </div>
              </NavBtn>
            ))}
          </div>
        </section>

        {/* ═══ DIGITAL STAMP PREVIEW ═══════════════════════════ */}
        <section className="px-4">
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'linear-gradient(160deg,#fdf8ec,#f0e6cc,#faf3e2)', border:'2px solid rgba(150,110,50,0.3)', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
            <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(120,80,30,0.05) 18px,rgba(120,80,30,0.05) 19px)', borderRadius:16, pointerEvents:'none' }} />
            <div style={{ padding:'16px 18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:15, color:'#3d2510', textTransform:'uppercase', letterSpacing:'0.05em' }}>Digital Stamps</p>
                  <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(80,45,10,0.5)', textTransform:'uppercase', letterSpacing:'0.15em', marginTop:2 }}>Collect · Earn · Unlock</p>
                </div>
                <NavBtn to="/passport/stamps"
                  className="flex items-center gap-1.5 px-3 rounded-full active:scale-95 transition-all"
                  style={{ height:32, background:'rgba(60,35,10,0.08)', border:'1px solid rgba(60,35,10,0.2)' }}>
                  <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'#5c3a10', fontWeight:700 }}>View All</span>
                </NavBtn>
              </div>

              {/* Stamps in aged paper style */}
              <div style={{ display:'flex', gap:14, justifyContent:'space-around', marginBottom:12 }}>
                {STAMPS_PREVIEW.map((s, i) => (
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, transform:`rotate(${s.rot}deg)` }}>
                    <div style={{ width:48, height:48, borderRadius:'50%', border:`2.5px solid ${s.c}`, background:`${s.c}10`,
                      boxShadow:`0 0 0 2px ${s.c}30, inset 0 0 8px ${s.c}15`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                      <div style={{ position:'absolute', inset:5, borderRadius:'50%', border:`1px solid ${s.c}50` }} />
                      <span className="material-symbols-outlined" style={{ fontSize:18, color:s.c, ...FILL1, filter:`drop-shadow(0 0 3px ${s.c}50)` }}>{s.icon}</span>
                    </div>
                    <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:7, fontWeight:700, textTransform:'uppercase', color:s.c, letterSpacing:'0.08em' }}>{s.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <div style={{ flex:1, height:1, background:'rgba(100,70,30,0.2)' }} />
                <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:7, textTransform:'uppercase', letterSpacing:'0.25em', color:'rgba(80,50,20,0.4)' }}>authenticated</span>
                <div style={{ flex:1, height:1, background:'rgba(100,70,30,0.2)' }} />
              </div>

              <NavBtn to="/passport/stamps"
                className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-[12px] uppercase tracking-wider active:scale-97 transition-all"
                style={{ height:46, background:'rgba(60,35,10,0.1)', border:'1.5px solid rgba(80,50,20,0.3)', color:'#4a2e08' }}>
                <span className="material-symbols-outlined" style={{ fontSize:16, ...FILL1 }}>menu_book</span>
                View My Stamp Collection
              </NavBtn>
            </div>
          </div>
        </section>

        {/* ═══ UPCOMING EVENTS PREVIEW ═════════════════════════ */}
        <section className="px-4">
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'linear-gradient(155deg,#1a1000,#120c00)', border:'1px solid rgba(255,183,77,0.25)', boxShadow:'0 6px 24px rgba(0,0,0,0.5)' }}>
            <div style={{ padding:'14px 16px 0', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,183,77,0.1)', paddingBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span className="material-symbols-outlined" style={{ fontSize:16, color:'#ffb74d', ...FILL1 }}>event</span>
                <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:15, color:'#ffd580' }}>Upcoming Events</p>
              </div>
              <NavBtn to="/passport/events"
                style={{ background:'none', border:'none', fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(255,183,77,0.45)', letterSpacing:'0.1em' }}>
                See All →
              </NavBtn>
            </div>
            <div style={{ padding:'12px 16px 16px', display:'flex', flexDirection:'column', gap:10 }}>
              {EVENTS_LIST.map(e => (
                <NavBtn key={e.title} to={e.to}
                  className="flex items-center gap-3 rounded-xl active:scale-97 transition-all text-left w-full"
                  style={{ height:64, padding:'0 12px', background:'rgba(255,183,77,0.06)', border:'1px solid rgba(255,183,77,0.15)' }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:'rgba(255,183,77,0.12)', border:'1px solid rgba(255,183,77,0.28)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, fontWeight:700, color:'#ffa020', lineHeight:1, textTransform:'uppercase' }}>{e.mon}</span>
                    <span style={{ fontFamily:'"Playfair Display",serif', fontSize:16, fontWeight:900, color:'#ffb74d', lineHeight:1 }}>{e.day}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:12, color:'#ffd580', lineHeight:1.2 }}>{e.title}</p>
                    <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(255,183,77,0.4)', marginTop:2 }}>{e.venue} · {e.time}</p>
                  </div>
                  <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize:16, color:'rgba(255,183,77,0.35)' }}>chevron_right</span>
                </NavBtn>
              ))}
              <NavBtn to="/passport/events"
                className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-[11px] uppercase tracking-wider active:scale-97 transition-all"
                style={{ height:44, background:'rgba(255,183,77,0.08)', border:'1px solid rgba(255,183,77,0.25)', color:'#ffb74d' }}>
                <span className="material-symbols-outlined" style={{ fontSize:15, ...FILL1 }}>event_available</span>
                RSVP to All Upcoming Events
              </NavBtn>
            </div>
          </div>
        </section>

        {/* ═══ RECENT ACTIVITY ═════════════════════════════════ */}
        <section className="px-4">
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'linear-gradient(155deg,#0a0806,#0e0b07)', border:'1px solid rgba(233,193,118,0.14)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(233,193,118,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:14, ...GOLD }}>Recent Activity</p>
                <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.12em', marginTop:2 }}>Your latest stamps and milestones</p>
              </div>
              <NavBtn to="/passport/stamps"
                style={{ background:'none', border:'none', fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(233,193,118,0.4)', letterSpacing:'0.1em' }}>
                All →
              </NavBtn>
            </div>
            <div style={{ padding:'16px', overflowX:'auto', scrollbarWidth:'none' }}>
              <div style={{ display:'flex', gap:12, minWidth:'max-content' }}>
                {ACTIVITY.map((a, i) => (
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, width:68, position:'relative' }}>
                    {i < ACTIVITY.length - 1 && (
                      <div style={{ position:'absolute', top:24, left:'calc(50% + 18px)', width:20, height:1, background:`${a.color}20` }} />
                    )}
                    <div style={{ width:48, height:48, borderRadius:'50%', background:`${a.color}12`, border:`2px solid ${a.color}50`, boxShadow:`0 0 12px ${a.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize:20, color:a.color, ...FILL1 }}>{a.icon}</span>
                    </div>
                    <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, fontWeight:700, textAlign:'center', color:'#f0e6d0', lineHeight:1.2 }}>{a.label}</p>
                    <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:7.5, textAlign:'center', color:'rgba(255,255,255,0.28)', lineHeight:1.3 }}>{a.sub}</p>
                    <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:7.5, color:'rgba(255,255,255,0.18)' }}>{a.when}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PROFILE & XP ════════════════════════════════════ */}
        <section className="px-4">
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'linear-gradient(155deg,#08101a,#0d1525)', border:'1px solid rgba(100,150,255,0.2)', boxShadow:'0 6px 28px rgba(0,0,0,0.6)' }}>
            <div style={{ padding:'16px', display:'flex', alignItems:'center', gap:16 }}>
              <NavBtn to="/passport/profile"
                className="flex-shrink-0 active:scale-90 transition-transform"
                style={{ background:'none', border:'none', padding:0 }}>
                <div style={{ width:60, height:60, borderRadius:14, background:'linear-gradient(145deg,#1e3a5f,#0d2035)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:20, color:'#90caf9', border:'2px solid rgba(100,150,255,0.25)', boxShadow:'0 4px 16px rgba(0,0,0,0.5)', position:'relative' }}>
                  {initials}
                  <div style={{ position:'absolute', bottom:-4, right:-4, width:20, height:20, borderRadius:'50%', background:'linear-gradient(135deg,#e9c176,#c5a059)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.4)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:11, color:'#0a0805', ...FILL1 }}>verified</span>
                  </div>
                </div>
              </NavBtn>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:15, color:'#f0e6d0', lineHeight:1.2 }}>{displayName}</p>
                <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(144,202,249,0.5)', textTransform:'uppercase', letterSpacing:'0.12em', marginTop:2 }}>{rank.name} Member · {xp} XP</p>
                <div style={{ marginTop:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(233,193,118,0.45)' }}>{xp} / {nextXP} XP</span>
                    <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(233,193,118,0.3)' }}>{xpPct}% to next tier</span>
                  </div>
                  <div style={{ height:5, borderRadius:99, overflow:'hidden', background:'rgba(255,255,255,0.08)' }}>
                    <div style={{ height:'100%', width:`${xpPct}%`, borderRadius:99, background:'linear-gradient(90deg,#c5a059,#e9c176)', boxShadow:'0 0 6px rgba(233,193,118,0.4)' }} />
                  </div>
                </div>
              </div>
              <NavBtn to="/passport/profile"
                className="flex-shrink-0 rounded-xl font-bold text-[10px] uppercase tracking-wider active:scale-95 transition-all"
                style={{ height:50, paddingLeft:14, paddingRight:14, background:'rgba(100,150,255,0.08)', border:'1px solid rgba(100,150,255,0.2)', color:'#90caf9' }}>
                View<br/>Profile
              </NavBtn>
            </div>
          </div>
        </section>

      </main>

      <PassportBottomNav active="hub" />
    </div>
  )
}
