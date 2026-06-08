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

function InkStamp({ color, icon, title, type, date, venue, locked, size = 66 }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center"
        style={{
          width:size, height:size, borderRadius:'50%',
          border:`3px solid ${locked ? 'rgba(100,80,50,0.2)' : color}`,
          boxShadow: locked ? 'none' : `0 0 0 2px ${color}35, 0 0 16px ${color}25`,
          background: locked ? 'rgba(100,80,50,0.04)' : `${color}0c`,
          opacity: locked ? 0.4 : 1,
        }}>
        <div className="absolute rounded-full" style={{ inset:7, border:`1px solid ${locked ? 'rgba(100,80,50,0.15)' : color+'50'}` }} />
        <span className="material-symbols-outlined" style={{ fontSize:size*0.37, color: locked ? 'rgba(100,80,50,0.3)' : color, ...FILL1 }}>
          {locked ? 'lock' : icon}
        </span>
        {!locked && (
          <div className="absolute" style={{ bottom:3, right:3, width:17, height:17, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize:10, color:'#fff', ...FILL1 }}>check</span>
          </div>
        )}
      </div>
      <p className="text-center font-bold text-[11px] leading-tight" style={{ color: locked ? 'rgba(100,80,50,0.35)' : '#3d2510' }}>{title}</p>
      <p className="text-center text-[8.5px] uppercase tracking-wider" style={{ color: locked ? 'rgba(100,80,50,0.22)' : `${color}90` }}>{type}</p>
      {!locked && date && <p className="text-[8px] text-center" style={{ color:'rgba(80,50,20,0.5)' }}>{date}</p>}
      {locked && <p className="text-[8px] text-center" style={{ color:'rgba(100,80,50,0.25)' }}>Locked</p>}
    </div>
  )
}

const CATS = [
  { id:'events', label:'Event Stamps', color:'#1a6abf', bg:'#eef4ff', icon:'event', earned:3, total:6,
    desc:'Attend passport-enabled events to collect these stamps.',
    stamps:[
      { title:'Grand Opening Night', type:'Event Stamp', date:'Jun 8, 2026',  locked:false },
      { title:'Capital & Culture',   type:'Event Stamp', date:'Jun 22, 2026', locked:false },
      { title:'Cigar & Cognac Night',type:'Event Stamp', date:'Jun 14, 2026', locked:false },
      { title:'VIP Collector Dinner',type:'Event Stamp', date:'—',            locked:true  },
      { title:'Private Tasting',     type:'Event Stamp', date:'—',            locked:true  },
      { title:'Legacy Gala',         type:'Event Stamp', date:'—',            locked:true  },
    ],
  },
  { id:'connections', label:'Connection Stamps', color:'#7b1fa2', bg:'#f8eeff', icon:'hub', earned:2, total:5,
    desc:'Verify passport-to-passport links to earn these.',
    stamps:[
      { title:'First Connection',  type:'Connection', date:'Jun 6, 2026', locked:false },
      { title:'Social Connector',  type:'Achievement',date:'Jun 7, 2026', locked:false },
      { title:'Network Builder',   type:'Connection', date:'—',           locked:true  },
      { title:'Inner Circle',      type:'VIP Connect',date:'—',           locked:true  },
      { title:'Trusted Network',   type:'Milestone',  date:'—',           locked:true  },
    ],
  },
  { id:'craft', label:'Craft Stamps', color:'#8d5524', bg:'#fdf3e7', icon:'local_bar', earned:2, total:5,
    desc:'Complete tastings, masterclasses, and craft experiences.',
    stamps:[
      { title:'Cigar Tasting',    type:'Craft Stamp',  date:'Jun 5, 2026', locked:false },
      { title:'Whiskey Society',  type:'Craft Stamp',  date:'Jun 3, 2026', locked:false },
      { title:'Cognac Masterclass',type:'Craft Stamp', date:'—',           locked:true  },
      { title:'Legacy Tasting',   type:'VIP Craft',    date:'—',           locked:true  },
      { title:'Grand Reserve',    type:'Milestone',    date:'—',           locked:true  },
    ],
  },
  { id:'vip', label:'VIP Stamps', color:'#b8860b', bg:'#fdfaee', icon:'workspace_premium', earned:2, total:4,
    desc:'Earned through elite access, invitations, and milestones.',
    stamps:[
      { title:"Founder's Circle", type:'VIP Stamp',   date:'Jun 4, 2026', locked:false },
      { title:'360 Member',       type:'Verified VIP',date:'Jun 1, 2026', locked:false },
      { title:'Platinum Access',  type:'VIP Stamp',   date:'—',           locked:true  },
      { title:'Legacy Builder',   type:'Milestone',   date:'—',           locked:true  },
    ],
  },
  { id:'profile', label:'Profile Stamps', color:'#1a5c2a', bg:'#edf7ee', icon:'verified', earned:2, total:4,
    desc:'Identity and profile verification milestones.',
    stamps:[
      { title:'Verified Profile', type:'Identity',   date:'Jun 2, 2026', locked:false },
      { title:'Photo Verified',   type:'Identity',   date:'Jun 2, 2026', locked:false },
      { title:'Industry Verified',type:'Profile',    date:'—',           locked:true  },
      { title:'Legacy Verified',  type:'Milestone',  date:'—',           locked:true  },
    ],
  },
]

const EARN_MORE = [
  { icon:'event',              label:'Attend Events',      to:'/passport/events'      },
  { icon:'qr_code_scanner',    label:'Scan to Connect',    to:'/passport/scan'        },
  { icon:'badge',              label:'Complete Profile',   to:'/passport/profile'     },
  { icon:'local_bar',          label:'Join Craft Sessions',to:'/passport/events'      },
  { icon:'workspace_premium',  label:'Unlock VIP Access',  to:'/passport/benefits'    },
]

export default function PassportStamps() {
  const navigate = useNavigate()
  const { session } = useGuestSession()
  const xp = session.xp ?? 0
  const rank = getRankFromXP(xp)
  const earned = CATS.reduce((n, c) => n + c.earned, 0)
  const total  = CATS.reduce((n, c) => n + c.total,  0)

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden"
      style={{ background:'linear-gradient(160deg,#0c0904,#100c07,#080605)' }}>

      {/* Warm paper ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background:'radial-gradient(ellipse 70% 50% at 50% 20%, rgba(160,100,20,0.07) 0%, transparent 70%)' }} />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 border-b backdrop-blur-2xl"
        style={{ height:68, background:'rgba(10,7,4,0.96)', borderColor:'rgba(197,160,89,0.2)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/passport')}
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
          <span className="font-bold text-[12px]" style={{ color:'#c5a059' }}>{earned}</span>
          <span className="text-[10px]" style={{ color:'rgba(197,160,89,0.45)' }}>/ {total}</span>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-5">

        {/* ── Passport page hero object ── */}
        <section>
          <div className="rounded-2xl overflow-hidden relative"
            style={{ background:'linear-gradient(155deg,#fdf8ec,#f0e5ca,#faf3e2)', border:'2px solid rgba(160,115,55,0.4)', boxShadow:'0 12px 48px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(120,80,30,0.055) 20px,rgba(120,80,30,0.055) 21px)' }} />
            {/* Aged border */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ border:'1px solid rgba(140,95,40,0.2)', margin:6 }} />
            <div className="p-5 relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-black text-[20px] leading-tight" style={{ color:'#2d1a08', fontFamily:'"Playfair Display",serif' }}>Your Stamp Collection</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] mt-0.5" style={{ color:'rgba(80,45,10,0.5)' }}>Verified proof of your journey</p>
                  <p className="text-[11px] mt-2 leading-relaxed" style={{ color:'rgba(60,35,10,0.55)', maxWidth:270 }}>
                    Stamps prove your journey and unlock exclusive experiences, connections, and rewards.
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ml-3"
                  style={{ background:'radial-gradient(circle,#8b1414,#6b0f0f)', border:'2px solid rgba(139,20,20,0.5)', boxShadow:'0 4px 16px rgba(139,20,20,0.45)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:24, color:'rgba(255,200,200,0.9)', ...FILL1 }}>verified</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-1 rounded-full overflow-hidden" style={{ height:7, background:'rgba(80,45,10,0.12)' }}>
                  <div className="h-full rounded-full" style={{ width:`${Math.round((earned/total)*100)}%`, background:'linear-gradient(90deg,#8b5a14,#c5a059)' }} />
                </div>
                <p className="text-[11px] font-bold" style={{ color:'rgba(80,45,10,0.65)' }}>{earned}/{total}</p>
              </div>
              <p className="text-[10px]" style={{ color:'rgba(80,45,10,0.45)' }}>{Math.round((earned/total)*100)}% of your stamps collected · {rank.name} tier</p>
            </div>
          </div>
        </section>

        {/* ── Stamp category pages ── */}
        {CATS.map(cat => (
          <section key={cat.id}>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background:`${cat.color}18`, border:`1.5px solid ${cat.color}55` }}>
                <span className="material-symbols-outlined" style={{ fontSize:14, color:cat.color, ...FILL1 }}>{cat.icon}</span>
              </div>
              <p className="font-bold text-[14px]" style={{ color:'#f0e6d0' }}>{cat.label}</p>
              <div className="ml-auto px-2.5 py-0.5 rounded-full"
                style={{ background:`${cat.color}15`, border:`1px solid ${cat.color}40` }}>
                <span className="text-[10px] font-bold" style={{ color:cat.color }}>{cat.earned}/{cat.total}</span>
              </div>
            </div>
            {/* Aged paper stamp page */}
            <div className="rounded-2xl overflow-hidden relative p-5"
              style={{ background:`linear-gradient(155deg,${cat.bg},${cat.bg}ee)`, border:`1.5px solid ${cat.color}35`, boxShadow:`0 6px 28px rgba(0,0,0,0.55)` }}>
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(100,70,30,0.05) 20px,rgba(100,70,30,0.05) 21px)' }} />
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ border:`1px solid ${cat.color}20`, margin:5 }} />
              <p className="text-[9px] uppercase tracking-[0.25em] text-center mb-4" style={{ color:`${cat.color}70` }}>{cat.desc}</p>
              <div className="relative grid grid-cols-3 gap-y-5 gap-x-2">
                {cat.stamps.map((s, i) => (
                  <InkStamp key={i} color={cat.color} icon={cat.icon}
                    title={s.title} type={s.type} date={s.date} locked={s.locked} size={62} />
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* ── How to Earn More ── */}
        <section className="pb-2">
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'linear-gradient(160deg,#1a1208,#120e07)', border:'1px solid rgba(197,160,89,0.2)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
            <div className="px-4 py-4" style={{ borderBottom:'1px solid rgba(197,160,89,0.1)' }}>
              <p className="font-bold text-[16px]" style={{ ...GOLD, fontFamily:'"Playfair Display",serif' }}>Earn More Stamps</p>
              <p className="text-[10px] mt-0.5" style={{ color:'rgba(255,255,255,0.3)' }}>Five ways to grow your collection</p>
            </div>
            <div className="p-3 space-y-1">
              {EARN_MORE.map(e => (
                <button key={e.label} onClick={() => navigate(e.to)}
                  onTouchStart={x => x.currentTarget.style.background='rgba(197,160,89,0.07)'}
                  onTouchEnd={x => { x.currentTarget.style.background='transparent'; navigate(e.to) }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 active:opacity-80 transition-all"
                  style={{ height:56, background:'transparent', textAlign:'left' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background:'rgba(197,160,89,0.08)', border:'1px solid rgba(197,160,89,0.18)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:18, color:'#c5a059', ...FILL1 }}>{e.icon}</span>
                  </div>
                  <p className="font-bold text-[13px]" style={{ color:'#f0e6d0' }}>{e.label}</p>
                  <span className="ml-auto material-symbols-outlined" style={{ fontSize:16, color:'rgba(197,160,89,0.3)' }}>chevron_right</span>
                </button>
              ))}
            </div>
            <div className="px-4 pb-4">
              <button onClick={() => navigate('/passport/scan')}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
                onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport/scan') }}
                className="w-full flex items-center justify-center gap-3 rounded-xl font-bold text-[13px] uppercase tracking-wider active:scale-97 transition-all"
                style={{ height:68, background:'linear-gradient(135deg,#e9c176,#c5a059)', color:'#0a0805', boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize:20, ...FILL1 }}>qr_code_scanner</span>
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
