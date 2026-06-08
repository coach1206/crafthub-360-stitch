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

const TIERS = [
  { name:'Novice',  xp:0,    color:'#c5a059', desc:'Entry passport'       },
  { name:'Bronze',  xp:100,  color:'#cd7f32', desc:'Active member'        },
  { name:'Silver',  xp:300,  color:'#c0c0c0', desc:'Verified networker'   },
  { name:'Gold',    xp:600,  color:'#e9c176', desc:'Community leader'     },
  { name:'Diamond', xp:1200, color:'#4fc3f7', desc:'Elite passport'       },
]

const BENEFITS = [
  {
    id:'club360', icon:'workspace_premium', title:'The 360 Club', sub:'Priority access to all events',
    tier:'Gold', xpReq:600, color:'#e9c176',
    desc:'Gain priority entry to every 360 Passport event, reserved seating, and advance notice of private experiences.',
    how:'Reach Gold tier (600 XP) to unlock. XP is earned by attending events, making verified connections, and completing craft experiences.',
    unlocked:false,
  },
  {
    id:'partner', icon:'percent', title:'Partner Discounts', sub:'Curated savings on premium products',
    tier:'Bronze', xpReq:100, color:'#cd7f32',
    desc:'Exclusive discounts from our partner brands across spirits, cigars, apparel, hospitality, and lifestyle.',
    how:'Reach Bronze tier (100 XP) to activate. Show your passport QR at checkout.',
    unlocked:false,
  },
  {
    id:'drops', icon:'local_offer', title:'Exclusive Drops', sub:'Members-only product access',
    tier:'Silver', xpReq:300, color:'#c0c0c0',
    desc:'First access to limited product releases, curated collaborations, and exclusive brand drops before they go public.',
    how:'Reach Silver tier (300 XP) and check the Drops section in your Benefits page.',
    unlocked:false,
  },
  {
    id:'concierge', icon:'support_agent', title:'Concierge Access', sub:'On-demand member services',
    tier:'Gold', xpReq:600, color:'#e9c176',
    desc:'Personal concierge for reservations, introductions, event logistics, and private access requests.',
    how:'Reach Gold tier. Submit requests via the Concierge button on your hub.',
    unlocked:false,
  },
  {
    id:'lounge', icon:'meeting_room', title:'Private Lounge Access', sub:'Exclusive member spaces',
    tier:'Silver', xpReq:300, color:'#c0c0c0',
    desc:'Unlock access to private lounge areas and VIP spaces at select 360 venues. Scan your passport at the door.',
    how:'Reach Silver tier and present your QR passport at designated private entrances.',
    unlocked:false,
  },
  {
    id:'priority', icon:'calendar_add_on', title:'Priority Reservations', sub:'Skip the waitlist at partner venues',
    tier:'Bronze', xpReq:100, color:'#cd7f32',
    desc:'Priority reservation windows at partner restaurants, lounges, and private dining experiences.',
    how:'Reach Bronze tier. Use the Reserve button from any Event or Venue card.',
    unlocked:false,
  },
  {
    id:'intros', icon:'record_voice_over', title:'Curated Introductions', sub:'Vetted connections from the 360 team',
    tier:'Gold', xpReq:600, color:'#e9c176',
    desc:'Receive personally curated connection requests from the 360 team based on your goals, expertise, and event history.',
    how:'Reach Gold tier. The team reviews your profile and sends curated introductions monthly.',
    unlocked:false,
  },
  {
    id:'scan', icon:'qr_code_scanner', title:'Scan & Connect Verified', sub:'Green verified badge on your passport',
    tier:'Novice', xpReq:0, color:'#66bb6a',
    desc:'Complete your first scan-to-connect to earn the Verified badge on your passport QR card.',
    how:'Scan any member\'s passport QR using the Scan tab. Verification is instant.',
    unlocked:true,
  },
]

function BenefitCard({ b, currentXP }) {
  const [open, setOpen] = useState(false)
  const isUnlocked = currentXP >= b.xpReq
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background:`linear-gradient(155deg,${isUnlocked ? '#0d0d0d' : '#080808'},${isUnlocked ? '#141414' : '#0a0a0a'})`,
        border:`1.5px solid ${isUnlocked ? b.color+'50' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: isUnlocked ? `0 6px 24px ${b.color}15` : '0 4px 16px rgba(0,0,0,0.5)',
        opacity: isUnlocked ? 1 : 0.65,
      }}>
      {isUnlocked && <div className="h-0.5" style={{ background:`linear-gradient(90deg,transparent,${b.color}80,transparent)` }} />}
      <button
        onClick={() => setOpen(o => !o)}
        onTouchStart={e => e.currentTarget.style.opacity='0.8'}
        onTouchEnd={e => { e.currentTarget.style.opacity=''; setOpen(o => !o) }}
        className="w-full flex items-center gap-4 px-4 active:opacity-80 transition-opacity"
        style={{ minHeight:72 }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background:`${b.color}12`, border:`1.5px solid ${isUnlocked ? b.color+'55' : 'rgba(255,255,255,0.1)'}` }}>
          <span className="material-symbols-outlined" style={{ fontSize:22, color: isUnlocked ? b.color : 'rgba(255,255,255,0.2)', ...FILL1 }}>{isUnlocked ? b.icon : 'lock'}</span>
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <p className="font-bold text-[15px] leading-tight" style={{ color: isUnlocked ? '#f5ead0' : 'rgba(255,255,255,0.3)', fontFamily:'"Playfair Display",serif' }}>{b.title}</p>
            {isUnlocked && (
              <div className="w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background:b.color }}>
                <span className="material-symbols-outlined" style={{ fontSize:10, color:'#0a0805', ...FILL1 }}>check</span>
              </div>
            )}
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: isUnlocked ? `${b.color}70` : 'rgba(255,255,255,0.2)' }}>{isUnlocked ? b.sub : `Unlocks at ${b.tier} tier · ${b.xpReq} XP`}</p>
        </div>
        <span className="material-symbols-outlined flex-shrink-0 transition-transform duration-300"
          style={{ fontSize:18, color:`${b.color}40`, transform: open ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="h-px" style={{ background:`${b.color}15` }} />
          <p className="text-[12px] leading-relaxed" style={{ color:'rgba(255,255,255,0.5)' }}>{b.desc}</p>
          <div className="rounded-xl p-3" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color:'rgba(255,255,255,0.25)' }}>How to unlock</p>
            <p className="text-[11px] leading-relaxed" style={{ color:'rgba(255,255,255,0.4)' }}>{b.how}</p>
          </div>
          {isUnlocked ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background:`${b.color}12`, border:`1px solid ${b.color}35` }}>
              <span className="material-symbols-outlined" style={{ fontSize:16, color:b.color, ...FILL1 }}>check_circle</span>
              <span className="font-bold text-[12px]" style={{ color:b.color }}>Unlocked · Active</span>
            </div>
          ) : (
            <div className="rounded-xl p-3" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] font-bold" style={{ color:'rgba(255,255,255,0.3)' }}>Your XP: {currentXP}</span>
                <span className="text-[10px]" style={{ color:'rgba(255,255,255,0.2)' }}>Need: {b.xpReq} XP</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height:5, background:'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full" style={{ width:`${Math.min(100, Math.round((currentXP/b.xpReq)*100))}%`, background:`linear-gradient(90deg,${b.color}50,${b.color})` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PassportBenefits() {
  const navigate = useNavigate()
  const { session } = useGuestSession()
  const xp   = session.xp ?? 0
  const rank = getRankFromXP(xp)
  const tc   = { Novice:'#c5a059', Bronze:'#cd7f32', Silver:'#c0c0c0', Gold:'#e9c176', Diamond:'#4fc3f7' }[rank.name] || '#e9c176'
  const unlocked = BENEFITS.filter(b => xp >= b.xpReq).length

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden"
      style={{ background:'linear-gradient(160deg,#060406,#080608,#050306)' }}>

      {/* Deep plum ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background:'radial-gradient(ellipse 65% 40% at 50% 0%, rgba(60,10,80,0.22) 0%, transparent 65%)' }} />
        <div className="absolute inset-0" style={{ background:'repeating-linear-gradient(135deg,rgba(255,255,255,0.005) 0,rgba(255,255,255,0.005) 1px,transparent 0,transparent 6px)' }} />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 border-b backdrop-blur-2xl"
        style={{ height:68, background:'rgba(5,3,6,0.97)', borderColor:'rgba(233,193,118,0.18)' }}>
        <button onClick={() => navigate('/passport')}
          className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform flex-shrink-0"
          style={{ background:'rgba(233,193,118,0.08)', border:'1px solid rgba(233,193,118,0.2)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:20, color:'#c5a059' }}>arrow_back</span>
        </button>
        <div className="flex-1">
          <p className="font-bold text-[16px] leading-none" style={{ ...GOLD, fontFamily:'"Playfair Display",serif' }}>Benefits</p>
          <p className="text-[9px] uppercase tracking-[0.25em] mt-0.5" style={{ color:'rgba(233,193,118,0.35)' }}>Member privileges & rewards</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background:'rgba(233,193,118,0.08)', border:'1px solid rgba(233,193,118,0.22)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:13, color:'#c5a059', ...FILL1 }}>lock_open</span>
          <span className="font-bold text-[11px]" style={{ color:'#c5a059' }}>{unlocked}/{BENEFITS.length}</span>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-5">

        {/* ── Vault cover ── */}
        <section>
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'linear-gradient(155deg,#100810,#14091a,#0c0610)', border:'2px solid rgba(233,193,118,0.25)', boxShadow:'0 10px 40px rgba(0,0,0,0.75)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background:'repeating-linear-gradient(135deg,rgba(255,255,255,0.005) 0,rgba(255,255,255,0.005) 1px,transparent 0,transparent 6px)' }} />
            <div className="h-1.5" style={{ background:'linear-gradient(90deg,#3c1060,#c5a059,#e9c176,#c5a059,#3c1060)' }} />
            <div className="p-5 relative flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:'rgba(233,193,118,0.08)', border:'1.5px solid rgba(233,193,118,0.3)', boxShadow:'0 4px 12px rgba(0,0,0,0.5)' }}>
                <span className="material-symbols-outlined" style={{ fontSize:28, color:'#e9c176', ...FILL1 }}>stars</span>
              </div>
              <div>
                <p className="font-bold text-[20px] leading-none mb-1.5" style={{ ...GOLD, fontFamily:'"Playfair Display",serif' }}>Member Benefits</p>
                <p className="text-[11px] leading-relaxed" style={{ color:'rgba(233,193,118,0.4)' }}>
                  Benefits are unlocked through real participation. The more you attend, connect, and earn stamps, the more access you receive.
                </p>
                <div className="flex gap-4 mt-3">
                  <div>
                    <p className="font-black text-[18px] leading-none" style={{ color:tc, fontFamily:'"Playfair Display",serif' }}>{unlocked}</p>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color:`${tc}50` }}>Unlocked</p>
                  </div>
                  <div>
                    <p className="font-black text-[18px] leading-none" style={{ color:'rgba(255,255,255,0.3)', fontFamily:'"Playfair Display",serif' }}>{BENEFITS.length - unlocked}</p>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color:'rgba(255,255,255,0.2)' }}>Locked</p>
                  </div>
                  <div>
                    <p className="font-black text-[18px] leading-none" style={{ color:'#e9c176', fontFamily:'"Playfair Display",serif' }}>{xp}</p>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color:'rgba(233,193,118,0.4)' }}>Current XP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tier ladder ── */}
        <section>
          <p className="text-[9px] uppercase tracking-[0.3em] mb-3 px-1" style={{ color:'rgba(255,255,255,0.2)' }}>Tier Ladder · Earn XP to Advance</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
            {TIERS.map((t, i) => {
              const isCurrent = rank.name === t.name
              const isDone = xp >= t.xp
              return (
                <div key={t.name} className="flex-shrink-0 rounded-xl flex flex-col items-center gap-1.5 py-3 px-4"
                  style={{
                    background: isCurrent ? `${t.color}18` : 'rgba(255,255,255,0.03)',
                    border: isCurrent ? `1.5px solid ${t.color}55` : '1px solid rgba(255,255,255,0.07)',
                    minWidth:80,
                    boxShadow: isCurrent ? `0 0 16px ${t.color}20` : 'none',
                  }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: isDone ? `${t.color}20` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${isDone ? t.color+'60' : 'rgba(255,255,255,0.1)'}` }}>
                    <span className="material-symbols-outlined" style={{ fontSize:16, color: isDone ? t.color : 'rgba(255,255,255,0.2)', ...FILL1 }}>{isDone ? 'star' : 'lock'}</span>
                  </div>
                  <p className="font-bold text-[11px]" style={{ color: isCurrent ? t.color : isDone ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>{t.name}</p>
                  <p className="text-[8.5px] text-center" style={{ color:'rgba(255,255,255,0.2)' }}>{t.xp} XP</p>
                  {isCurrent && <div className="w-1.5 h-1.5 rounded-full" style={{ background:t.color }} />}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Benefit vault cards ── */}
        <section className="space-y-3 pb-2">
          <p className="text-[9px] uppercase tracking-[0.3em] px-1" style={{ color:'rgba(255,255,255,0.2)' }}>Your Reward Vault</p>
          {BENEFITS.map(b => <BenefitCard key={b.id} b={b} currentXP={xp} />)}
        </section>

        {/* ── CTA ── */}
        <section className="pb-2">
          <button onClick={() => navigate('/passport/scan')}
            onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
            onTouchEnd={e => { e.currentTarget.style.transform=''; navigate('/passport/scan') }}
            className="w-full flex items-center justify-center gap-3 rounded-xl font-bold text-[13px] uppercase tracking-wider active:scale-97 transition-all"
            style={{ height:68, background:'linear-gradient(135deg,#e9c176,#c5a059)', color:'#0a0805', boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            <span className="material-symbols-outlined" style={{ fontSize:20, ...FILL1 }}>qr_code_scanner</span>
            Earn XP · Attend Events · Scan to Connect
          </button>
        </section>

      </main>
      <PassportBottomNav active="benefits" />
    </div>
  )
}
