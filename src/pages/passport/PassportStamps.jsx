import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../../constants/session.js'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings:"'FILL' 1" }
const GOLD = {
  background:'linear-gradient(135deg,#8b6914 0%,#e9c176 40%,#f5d98a 55%,#c5a059 75%,#8b6914 100%)',
  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
}

/* ── Passport Medallion Stamp ─────────────────────────────── */
function PassportMedallion({ catId, idx, title, date, locked, size = 74 }) {
  const uid  = `pm-${catId}-${idx}`
  const cx   = size / 2
  const cy   = size / 2
  const rOuter = cx - 3
  const rArc   = cx - 11   /* radius for the curved text path */

  /* SVG arc path: semicircle on bottom half */
  const arcD = [
    `M ${cx - rArc},${cy}`,
    `a ${rArc},${rArc} 0 0,0 ${rArc * 2},0`,
  ].join(' ')

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>

      {/* Medallion disc */}
      <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>

        {/* SVG base — gold ring + navy fill + curved text */}
        <svg width={size} height={size} style={{ position:'absolute', inset:0, overflow:'visible' }}>
          <defs>
            <linearGradient id={`g-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#6b5010" />
              <stop offset="35%"  stopColor="#e9c176" />
              <stop offset="65%"  stopColor="#f5d98a" />
              <stop offset="100%" stopColor="#c5a059" />
            </linearGradient>
            <path id={`arc-${uid}`} d={arcD} />
          </defs>

          {/* Outer gold ring */}
          <circle cx={cx} cy={cy} r={rOuter}
            fill={locked ? '#1c1816' : '#0c1a3a'}
            stroke={locked ? 'rgba(100,80,50,0.3)' : `url(#g-${uid})`}
            strokeWidth={3} />

          {/* Inner ring */}
          <circle cx={cx} cy={cy} r={rOuter - 5}
            fill="none"
            stroke={locked ? 'rgba(100,80,50,0.12)' : 'rgba(197,160,89,0.35)'}
            strokeWidth={1} />

          {/* "360" label top-center */}
          {!locked && (
            <text x={cx} y={cy * 0.52} textAnchor="middle"
              fill="#e9c176" fontSize={size * 0.115}
              fontFamily="Playfair Display, serif" fontWeight="700"
              letterSpacing="1">
              360
            </text>
          )}

          {/* Curved text: "PASSPORT CONN." on bottom arc */}
          {!locked && (
            <text fontSize={size * 0.076} fill="rgba(197,160,89,0.62)"
              fontFamily="JetBrains Mono, monospace" letterSpacing="0.5">
              <textPath href={`#arc-${uid}`} startOffset="8%">PASSPORT CONN.</textPath>
            </text>
          )}
        </svg>

        {/* Globe / passport icon — overlay div so Material font works */}
        {!locked ? (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', paddingTop: size * 0.05 }}>
            <span className="material-symbols-outlined" style={{
              fontSize: size * 0.3, color:'#c5a059',
              ...FILL1,
              filter:'drop-shadow(0 0 6px rgba(197,160,89,0.55))',
            }}>public</span>
          </div>
        ) : (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span className="material-symbols-outlined" style={{
              fontSize: size * 0.3, color:'rgba(100,80,50,0.35)', ...FILL1,
            }}>lock</span>
          </div>
        )}

        {/* Teal check badge */}
        {!locked && (
          <div style={{
            position:'absolute', bottom:1, right:1,
            width: size * 0.27, height: size * 0.27, borderRadius:'50%',
            background:'linear-gradient(135deg,#26a69a,#00796b)',
            boxShadow:`0 2px 8px rgba(0,121,107,0.55), 0 0 0 2.5px #f5edd5`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <span className="material-symbols-outlined" style={{
              fontSize: size * 0.14, color:'#fff', ...FILL1,
            }}>check</span>
          </div>
        )}
      </div>

      {/* Label below */}
      {!locked ? (
        <div style={{ textAlign:'center' }}>
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:7, color:'rgba(60,35,10,0.38)', textTransform:'uppercase', letterSpacing:'0.18em', marginBottom:2 }}>View Details</p>
          <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:11, color:'#2d1a08', lineHeight:1.2 }}>{title}</p>
          {date && <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(60,35,10,0.4)', marginTop:1 }}>{date}</p>}
        </div>
      ) : (
        <div style={{ textAlign:'center' }}>
          <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:11, color:'rgba(60,35,10,0.28)', lineHeight:1.2 }}>{title}</p>
          <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(60,35,10,0.2)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:1 }}>Coming Soon</p>
        </div>
      )}
    </div>
  )
}

/* ── Wax Seal ──────────────────────────────────────────────── */
function WaxSeal({ size = 64 }) {
  const cx = size / 2
  const uid = 'wax-seal-main'
  const rText = cx - 9
  const arcD = `M ${cx - rText},${cx} a ${rText},${rText} 0 1,1 ${rText * 2},0`

  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ position:'absolute', inset:0 }}>
        <defs>
          <radialGradient id={`wax-${uid}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="#9b2020" />
            <stop offset="60%"  stopColor="#7a1414" />
            <stop offset="100%" stopColor="#5c0f0f" />
          </radialGradient>
          <path id={`wax-arc-${uid}`} d={arcD} />
        </defs>
        {/* Wax circle */}
        <circle cx={cx} cy={cx} r={cx - 2}
          fill={`url(#wax-${uid})`}
          stroke="rgba(139,20,20,0.6)" strokeWidth={2} />
        {/* Inner ring */}
        <circle cx={cx} cy={cx} r={cx - 8}
          fill="none" stroke="rgba(255,180,180,0.2)" strokeWidth={1} />
        {/* Curved text */}
        <text fontSize={size * 0.092} fill="rgba(255,210,210,0.65)"
          fontFamily="JetBrains Mono, monospace" letterSpacing="0.3">
          <textPath href={`#wax-arc-${uid}`} startOffset="2%">360 PASSPORT CONNECTION</textPath>
        </text>
      </svg>
      {/* Globe icon overlay */}
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', paddingBottom:4 }}>
        <span className="material-symbols-outlined" style={{
          fontSize: size * 0.32, color:'rgba(255,210,210,0.85)', ...FILL1,
        }}>public</span>
      </div>
    </div>
  )
}

/* ── Data ──────────────────────────────────────────────────── */
const CATS = [
  { id:'events', label:'Event Stamps', icon:'explore', earned:3, total:6,
    desc:'Attend passport-enabled events to collect these stamps.',
    stamps:[
      { title:'Grand Opening Night', date:'Jun 8, 2026',  locked:false },
      { title:'Capital & Culture',   date:'Jun 22, 2026', locked:false },
      { title:'Cigar & Cognac Night',date:'Jun 14, 2026', locked:false },
      { title:'VIP',                 date:null,           locked:true  },
      { title:'Private',             date:null,           locked:true  },
      { title:'Legacy Gala',         date:null,           locked:true  },
    ],
  },
  { id:'connections', label:'Connection Stamps', icon:'hub', earned:2, total:5,
    desc:'Verify passport-to-passport links to earn these.',
    stamps:[
      { title:'First Connection',  date:'Jun 6, 2026', locked:false },
      { title:'Social Connector',  date:'Jun 7, 2026', locked:false },
      { title:'Network Builder',   date:null,          locked:true  },
      { title:'Inner Circle',      date:null,          locked:true  },
      { title:'Trusted Network',   date:null,          locked:true  },
    ],
  },
  { id:'craft', label:'Craft Stamps', icon:'local_bar', earned:2, total:5,
    desc:'Complete tastings, masterclasses, and craft experiences.',
    stamps:[
      { title:'Cigar Tasting',    date:'Jun 5, 2026', locked:false },
      { title:'Whiskey Society',  date:'Jun 3, 2026', locked:false },
      { title:'Cognac Masterclass',date:null,         locked:true  },
      { title:'Legacy Tasting',   date:null,          locked:true  },
      { title:'Grand Reserve',    date:null,          locked:true  },
    ],
  },
  { id:'vip', label:'VIP Stamps', icon:'workspace_premium', earned:2, total:4,
    desc:'Earned through elite access, invitations, and milestones.',
    stamps:[
      { title:"Founder's Circle", date:'Jun 4, 2026', locked:false },
      { title:'360 Member',       date:'Jun 1, 2026', locked:false },
      { title:'Platinum Access',  date:null,          locked:true  },
      { title:'Legacy Builder',   date:null,          locked:true  },
    ],
  },
  { id:'profile', label:'Profile Stamps', icon:'verified', earned:2, total:4,
    desc:'Identity and profile verification milestones.',
    stamps:[
      { title:'Verified Profile', date:'Jun 2, 2026', locked:false },
      { title:'Photo Verified',   date:'Jun 2, 2026', locked:false },
      { title:'Industry Verified',date:null,          locked:true  },
      { title:'Legacy Verified',  date:null,          locked:true  },
    ],
  },
]

const EARN_MORE = [
  { icon:'event',             label:'Attend Events',       to:'/passport/events'   },
  { icon:'qr_code_scanner',   label:'Scan to Connect',     to:'/passport/scan'     },
  { icon:'badge',             label:'Complete Profile',    to:'/passport/profile'  },
  { icon:'local_bar',         label:'Join Craft Sessions', to:'/passport/events'   },
  { icon:'workspace_premium', label:'Unlock VIP Access',   to:'/passport/benefits' },
]

export default function PassportStamps() {
  const navigate = useNavigate()
  const { session } = useGuestSession()
  const xp    = session.xp ?? 0
  const rank  = getRankFromXP(xp)
  const earned = CATS.reduce((n, c) => n + c.earned, 0)
  const total  = CATS.reduce((n, c) => n + c.total,  0)
  const pct    = Math.round((earned / total) * 100)

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden"
      style={{ background:'linear-gradient(160deg,#0c0904,#100c07,#080605)' }}>

      {/* Ambient warm glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(140,90,15,0.1) 0%, transparent 65%)' }} />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 border-b backdrop-blur-2xl"
        style={{ height:68, background:'rgba(10,7,4,0.97)', borderColor:'rgba(197,160,89,0.18)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/passport')}
            onTouchStart={e => e.currentTarget.style.transform='scale(0.9)'}
            onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport') }}
            className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{ background:'rgba(197,160,89,0.08)', border:'1px solid rgba(197,160,89,0.2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize:20, color:'#c5a059' }}>arrow_back</span>
          </button>
          <div>
            <p className="font-bold text-[16px] leading-none" style={{ ...GOLD, fontFamily:'"Playfair Display",serif' }}>Digital Stamps</p>
            <p className="text-[9px] uppercase tracking-[0.25em] mt-0.5" style={{ color:'rgba(197,160,89,0.4)' }}>Your Journey · Your Legacy</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background:'rgba(197,160,89,0.1)', border:'1px solid rgba(197,160,89,0.25)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:13, color:'#c5a059', ...FILL1 }}>workspace_premium</span>
          <span className="font-bold text-[13px]" style={{ color:'#c5a059' }}>{earned}</span>
          <span className="text-[10px]" style={{ color:'rgba(197,160,89,0.4)' }}>/ {total}</span>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-6">

        {/* ═══ COLLECTION HEADER — parchment with wax seal ═════ */}
        <section>
          <div style={{
            borderRadius:20, overflow:'hidden', position:'relative',
            background:'linear-gradient(155deg,#fdf8ec,#f0e6cc,#faf3e2)',
            border:'2px solid rgba(160,115,55,0.38)',
            boxShadow:'0 14px 48px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.95)',
          }}>
            {/* Ruled lines */}
            <div style={{ position:'absolute', inset:0, pointerEvents:'none',
              backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(120,80,30,0.055) 20px,rgba(120,80,30,0.055) 21px)' }} />
            {/* Inner border */}
            <div style={{ position:'absolute', inset:6, borderRadius:14, border:'1px solid rgba(140,95,40,0.18)', pointerEvents:'none' }} />

            {/* Vertical side label */}
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:24, display:'flex', alignItems:'center', justifyContent:'center',
              background:'rgba(140,95,40,0.06)', borderRight:'1px solid rgba(140,95,40,0.15)' }}>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:7, fontWeight:700, color:'rgba(80,50,15,0.45)',
                textTransform:'uppercase', letterSpacing:'0.3em', writingMode:'vertical-rl', transform:'rotate(180deg)' }}>
                360 PASSPORT CONNECTION
              </p>
            </div>

            {/* Content */}
            <div style={{ padding:'20px 18px 18px 36px', position:'relative' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ flex:1, minWidth:0, marginRight:12 }}>
                  <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:900, fontSize:22, color:'#2d1a08', lineHeight:1.1, marginBottom:4 }}>
                    Your Stamp Collection
                  </p>
                  <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em', color:'#8b6914', marginBottom:10 }}>
                    Verified Proof of Your Journey
                  </p>
                  <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontSize:12, color:'rgba(60,35,10,0.55)', lineHeight:1.55 }}>
                    Stamps prove your journey and unlock exclusive experiences, connections, and rewards.
                  </p>
                </div>
                {/* Wax seal */}
                <WaxSeal size={68} />
              </div>

              {/* Progress bar */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <div style={{ flex:1, height:7, borderRadius:99, background:'rgba(80,45,10,0.1)', overflow:'hidden' }}>
                  <div style={{
                    height:'100%', width:`${pct}%`, borderRadius:99,
                    background:'linear-gradient(90deg,#8b5a14,#c5a059,#e9c176)',
                    boxShadow:'0 0 6px rgba(197,160,89,0.4)',
                    transition:'width 1s ease',
                  }} />
                </div>
                <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:11, fontWeight:700, color:'rgba(80,45,10,0.6)', flexShrink:0 }}>
                  {earned}/{total}
                </p>
              </div>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(80,45,10,0.42)' }}>
                {pct}% of your stamps collected · {rank.name} tier
              </p>
            </div>
          </div>
        </section>

        {/* ═══ STAMP CATEGORY PAGES ════════════════════════════ */}
        {CATS.map((cat, catIdx) => (
          <section key={cat.id}>

            {/* Category header row */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, padding:'0 2px' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(197,160,89,0.12)', border:'1.5px solid rgba(197,160,89,0.35)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span className="material-symbols-outlined" style={{ fontSize:16, color:'#c5a059', ...FILL1 }}>{cat.icon}</span>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:15, color:'#f0e6d0', lineHeight:1 }}>{cat.label}</p>
                <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(197,160,89,0.45)', textTransform:'uppercase', letterSpacing:'0.12em', marginTop:2 }}>{cat.desc}</p>
              </div>
              <div style={{ padding:'4px 10px', borderRadius:99, background:'rgba(197,160,89,0.12)', border:'1px solid rgba(197,160,89,0.35)', flexShrink:0 }}>
                <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:11, fontWeight:700, color:'#c5a059' }}>{cat.earned}/{cat.total}</span>
              </div>
            </div>

            {/* Parchment stamp page */}
            <div style={{
              borderRadius:18, overflow:'hidden', position:'relative',
              background:'linear-gradient(155deg,#fdf8ec,#f5ebd4,#faf3e2)',
              border:'1.5px solid rgba(160,115,55,0.3)',
              boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
            }}>
              {/* Ruled lines */}
              <div style={{ position:'absolute', inset:0, pointerEvents:'none',
                backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(100,70,30,0.05) 20px,rgba(100,70,30,0.05) 21px)' }} />
              {/* Inner border */}
              <div style={{ position:'absolute', inset:5, borderRadius:13, border:`1px solid rgba(140,95,40,0.18)`, pointerEvents:'none' }} />
              {/* Page number */}
              <div style={{ position:'absolute', top:10, right:14 }}>
                <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(80,50,15,0.35)', textTransform:'uppercase', letterSpacing:'0.2em' }}>PAGE {catIdx + 1}</span>
              </div>

              {/* Stamp grid */}
              <div style={{ padding:'24px 16px 16px', position:'relative' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'24px 8px', placeItems:'center' }}>
                  {cat.stamps.map((s, i) => (
                    <button
                      key={i}
                      onTouchStart={e => e.currentTarget.style.transform='scale(0.94)'}
                      onTouchEnd={e => e.currentTarget.style.transform=''}
                      onTouchCancel={e => e.currentTarget.style.transform=''}
                      onClick={() => !s.locked && navigate('/passport/events')}
                      style={{ background:'none', border:'none', cursor: s.locked ? 'default' : 'pointer', padding:0, transition:'transform 0.15s' }}
                    >
                      <PassportMedallion
                        catId={cat.id}
                        idx={i}
                        title={s.title}
                        date={s.date}
                        locked={s.locked}
                        size={74}
                      />
                    </button>
                  ))}
                </div>

                {/* Swipe hint */}
                <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:4, marginTop:16, paddingRight:4 }}>
                  <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(80,50,15,0.3)', textTransform:'uppercase', letterSpacing:'0.15em' }}>Swipe to Explore</span>
                  <span className="material-symbols-outlined" style={{ fontSize:12, color:'rgba(80,50,15,0.28)' }}>arrow_forward</span>
                </div>
              </div>

              {/* Page curl effect bottom-right */}
              <div style={{ position:'absolute', bottom:0, right:0, width:28, height:28, overflow:'hidden', pointerEvents:'none' }}>
                <div style={{
                  position:'absolute', bottom:-14, right:-14,
                  width:28, height:28, borderRadius:'50%',
                  background:'rgba(140,95,40,0.12)',
                  boxShadow:'inset 2px 2px 4px rgba(0,0,0,0.15)',
                }} />
              </div>
            </div>
          </section>
        ))}

        {/* ═══ EARN MORE STAMPS ════════════════════════════════ */}
        <section style={{ paddingBottom:8 }}>
          <div style={{
            borderRadius:20, overflow:'hidden',
            background:'linear-gradient(160deg,#1a1208,#120e07)',
            border:'1px solid rgba(197,160,89,0.18)',
            boxShadow:'0 4px 20px rgba(0,0,0,0.5)',
          }}>
            <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(197,160,89,0.1)' }}>
              <p style={{ fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:17, ...GOLD }}>Earn More Stamps</p>
              <p style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:3, textTransform:'uppercase', letterSpacing:'0.1em' }}>Five ways to grow your collection</p>
            </div>
            <div style={{ padding:'8px 10px' }}>
              {EARN_MORE.map(e => (
                <button key={e.label}
                  onClick={() => navigate(e.to)}
                  onTouchStart={x => x.currentTarget.style.background='rgba(197,160,89,0.07)'}
                  onTouchEnd={x => { x.currentTarget.style.background='transparent'; navigate(e.to) }}
                  onTouchCancel={x => x.currentTarget.style.background='transparent'}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:12, height:56, padding:'0 10px', borderRadius:14, background:'transparent', border:'none', cursor:'pointer', textAlign:'left', transition:'background 0.15s' }}>
                  <div style={{ width:38, height:38, borderRadius:12, background:'rgba(197,160,89,0.08)', border:'1px solid rgba(197,160,89,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize:18, color:'#c5a059', ...FILL1 }}>{e.icon}</span>
                  </div>
                  <p style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:13, color:'#f0e6d0', flex:1 }}>{e.label}</p>
                  <span className="material-symbols-outlined" style={{ fontSize:16, color:'rgba(197,160,89,0.28)' }}>chevron_right</span>
                </button>
              ))}
            </div>
            <div style={{ padding:'4px 16px 18px' }}>
              <button
                onClick={() => navigate('/passport/scan')}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
                onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport/scan') }}
                onTouchCancel={e => e.currentTarget.style.transform=''}
                style={{ width:'100%', height:68, display:'flex', alignItems:'center', justifyContent:'center', gap:12, borderRadius:18, border:'none', cursor:'pointer',
                  background:'linear-gradient(135deg,#e9c176,#c5a059)',
                  color:'#0a0805', boxShadow:'0 4px 20px rgba(233,193,118,0.3)',
                  fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:14, letterSpacing:'0.06em', textTransform:'uppercase',
                  transition:'transform 0.12s',
                }}>
                <span className="material-symbols-outlined" style={{ fontSize:22, ...FILL1 }}>qr_code_scanner</span>
                Scan to Earn Your Next Stamp
              </button>
            </div>
          </div>
        </section>

      </main>
      <PassportBottomNav active="stamps" />
    </div>
  )
}
