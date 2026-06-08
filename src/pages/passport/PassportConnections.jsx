import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'
import craftImages from '../../lib/craftImages.js'

const FILL1 = { fontVariationSettings:"'FILL' 1" }

const BEST_MATCHES = [
  { init:'DH', name:'David Harper',    role:'Founder @ North & Co.', city:'Austin, TX',      pct:94, bg:'#1a0829', portraitKey:'member3',
    why:'Shared goals in luxury hospitality & brand strategy', mutual:'Innovation, Travel', event:'Cigar & Cognac Night',
    line:'Loved your take on experiential brand. Would love to connect.', verified:true },
  { init:'SM', name:'Sophia Martinez', role:'Creative Director',      city:'Los Angeles, CA', pct:88, bg:'#1a0815', portraitKey:'member4',
    why:'Brand strategy and creative alignment across luxury events', mutual:'Design, Art', event:'Capital & Culture',
    line:"Your design portfolio is inspiring. Let's explore a collaboration.", verified:true },
  { init:'MR', name:'Michael Reynolds',role:'Entrepreneur',           city:'New York, NY',    pct:82, bg:'#0d1829', portraitKey:'member1',
    why:'Both focused on scaling premium member experiences', mutual:'Tech, Innovation', event:'Grand Opening Night',
    line:"Your SaaS angle on hospitality is exactly what I've been thinking about.", verified:false },
]
const MET = [
  { init:'AC', name:'Alicia Chen',  role:'Investor',       city:'San Francisco, CA', when:'Jun 7', event:'Capital & Culture Dinner',  bg:'#0d1a10', portraitKey:'member2' },
  { init:'PS', name:'Priya Shah',   role:'Marketing Lead', city:'New York, NY',      when:'Jun 6', event:'Cigar & Cognac Night',       bg:'#291008', portraitKey:'member5' },
  { init:'JC', name:'James Carter', role:'Founder',        city:'Miami, FL',         when:'Jun 5', event:'Grand Opening Night',        bg:'#081a10', portraitKey:'member6' },
]
const SUGGESTED = [
  { init:'EM', name:'Elena Marchetti', role:'Creative Director',  city:'Los Angeles, CA', why:'3 shared interests · 1 mutual connection', bg:'#1a0e29', portraitKey:'mentor'  },
  { init:'DK', name:'Daniel Kim',      role:'Product Strategist', city:'New York, NY',    why:'Same event attendance · Industry overlap',  bg:'#121808', portraitKey:'member7' },
]

function PortraitAvatar({ portraitKey, init, size = 56, borderColor = 'rgba(206,147,216,0.25)', bg = '#1a0829', verified = false }) {
  const [imgError, setImgError] = useState(false)
  const src = craftImages.portraits[portraitKey] || craftImages.fallbacks.mentor
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:12, overflow:'hidden', border:`2px solid ${borderColor}`, boxShadow:'0 4px 12px rgba(0,0,0,0.4)', position:'relative', background:bg }}>
        {!imgError ? (
          <img
            src={src}
            alt={init}
            onError={() => setImgError(true)}
            style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.75) saturate(0.6)' }}
          />
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"Playfair Display",serif', fontWeight:700, fontSize:size*0.32, color:'#e8c0f0' }}>{init}</div>
        )}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:16, background:'linear-gradient(transparent,rgba(0,0,0,0.55))' }} />
      </div>
      {verified && (
        <div style={{ position:'absolute', bottom:-2, right:-2, width:18, height:18, borderRadius:'50%', background:'rgba(206,147,216,0.9)', boxShadow:'0 2px 6px rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize:10, color:'#1a0820', ...FILL1 }}>check</span>
        </div>
      )}
    </div>
  )
}

function MatchCard({ m }) {
  const navigate = useNavigate()
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background:`linear-gradient(155deg,${m.bg},${m.bg}ee)`, border:'1px solid rgba(206,147,216,0.2)', boxShadow:'0 6px 28px rgba(0,0,0,0.6)' }}>
      <div className="h-1" style={{ background:`linear-gradient(90deg,transparent,rgba(206,147,216,${m.pct/100*0.8}),transparent)` }} />
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <PortraitAvatar portraitKey={m.portraitKey} init={m.init} size={56} borderColor="rgba(206,147,216,0.3)" bg={m.bg} verified={m.verified} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[16px] leading-tight" style={{ color:'#f0d4f5', fontFamily:'"Playfair Display",serif' }}>{m.name}</p>
            <p className="text-[11px] mt-0.5" style={{ color:'rgba(206,147,216,0.55)' }}>{m.role}</p>
            <p className="text-[10px]" style={{ color:'rgba(206,147,216,0.35)' }}>{m.city}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-black text-[24px] leading-none" style={{ color:'#ce93d8', fontFamily:'"Playfair Display",serif' }}>{m.pct}%</p>
            <p className="text-[8px] uppercase tracking-wider" style={{ color:'rgba(206,147,216,0.45)' }}>Match</p>
          </div>
        </div>

        <div className="rounded-xl px-3 py-2.5 mb-3" style={{ background:'rgba(206,147,216,0.07)', border:'1px solid rgba(206,147,216,0.15)' }}>
          <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color:'rgba(206,147,216,0.45)' }}>Why you match</p>
          <p className="text-[11px] leading-snug italic" style={{ color:'rgba(206,147,216,0.7)' }}>{m.why}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg px-3 py-2" style={{ background:'rgba(0,0,0,0.25)' }}>
            <p className="text-[8.5px] uppercase tracking-wider mb-0.5" style={{ color:'rgba(206,147,216,0.35)' }}>Shared Interests</p>
            <p className="text-[10px]" style={{ color:'rgba(206,147,216,0.6)' }}>{m.mutual}</p>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background:'rgba(0,0,0,0.25)' }}>
            <p className="text-[8.5px] uppercase tracking-wider mb-0.5" style={{ color:'rgba(206,147,216,0.35)' }}>Shared Event</p>
            <p className="text-[10px]" style={{ color:'rgba(206,147,216,0.6)' }}>{m.event}</p>
          </div>
        </div>

        <div className="rounded-xl px-3 py-2.5 mb-3" style={{ background:'rgba(206,147,216,0.05)', border:'1px solid rgba(206,147,216,0.1)' }}>
          <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color:'rgba(206,147,216,0.35)' }}>Suggested opening</p>
          <p className="text-[11px] italic leading-snug" style={{ color:'rgba(206,147,216,0.55)' }}>"{m.line}"</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label:'Connect',      icon:'hub',             primary:true  },
            { label:'Message',      icon:'chat_bubble',     primary:false },
            { label:'Scan to Link', icon:'qr_code_scanner', primary:false },
            { label:'Save',         icon:'bookmark',        primary:false },
          ].map(b => (
            <button key={b.label}
              onTouchStart={e => e.currentTarget.style.transform='scale(0.94)'}
              onTouchEnd={e => e.currentTarget.style.transform=''}
              className="flex items-center justify-center gap-2 rounded-xl font-bold text-[11px] active:scale-94 transition-all"
              style={{
                height:48,
                background: b.primary ? 'rgba(206,147,216,0.18)' : 'rgba(206,147,216,0.07)',
                border:`1px solid rgba(206,147,216,${b.primary ? 0.45 : 0.18})`,
                color:'#ce93d8',
              }}>
              <span className="material-symbols-outlined" style={{ fontSize:15, color:'#ce93d8', ...FILL1 }}>{b.icon}</span>
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PassportConnections() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('matches')

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden"
      style={{ background:'linear-gradient(160deg,#0e050c,#130610,#0a040a)' }}>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background:'radial-gradient(ellipse 70% 50% at 20% 0%, rgba(80,10,40,0.25) 0%, transparent 65%)' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 border-b backdrop-blur-2xl"
        style={{ height:68, background:'rgba(8,3,8,0.97)', borderColor:'rgba(206,147,216,0.18)' }}>
        <button onClick={() => navigate('/passport')}
          className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform flex-shrink-0"
          style={{ background:'rgba(206,147,216,0.08)', border:'1px solid rgba(206,147,216,0.2)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:20, color:'#ce93d8' }}>arrow_back</span>
        </button>
        <div className="flex-1">
          <p className="font-bold text-[16px] leading-none" style={{ color:'#e8c0f0', fontFamily:'"Playfair Display",serif' }}>Connections</p>
          <p className="text-[9px] uppercase tracking-[0.25em] mt-0.5" style={{ color:'rgba(206,147,216,0.35)' }}>Grow your trusted network</p>
        </div>
        <button onClick={() => navigate('/passport/scan')}
          className="flex items-center gap-2 px-3 rounded-full active:opacity-70 transition-opacity"
          style={{ height:40, background:'rgba(206,147,216,0.1)', border:'1px solid rgba(206,147,216,0.25)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:16, color:'#ce93d8', ...FILL1 }}>qr_code_scanner</span>
          <span className="text-[11px] font-bold" style={{ color:'#ce93d8' }}>Scan to Link</span>
        </button>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-4">

        {/* Cover with portrait strip */}
        <section>
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'linear-gradient(155deg,#1a0620,#22082c,#160518)', border:'2px solid rgba(206,147,216,0.28)', boxShadow:'0 10px 40px rgba(0,0,0,0.7)' }}>
            <div className="h-1" style={{ background:'linear-gradient(90deg,#4a0830,#ce93d8,#9c27b0,#ce93d8,#4a0830)' }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-[20px] leading-none mb-1" style={{ color:'#e8c0f0', fontFamily:'"Playfair Display",serif' }}>Connections</p>
                  <p className="text-[11px]" style={{ color:'rgba(206,147,216,0.45)' }}>Turns introductions into verified relationships.</p>
                  <div className="flex gap-5 mt-3">
                    {[{ v:'12', l:'Verified'}, { v:'94%', l:'Top Match'}, { v:'8/10', l:'Social Goal'}].map(s => (
                      <div key={s.l}>
                        <p className="font-black text-[16px] leading-none" style={{ color:'#ce93d8', fontFamily:'"Playfair Display",serif' }}>{s.v}</p>
                        <p className="text-[9px] uppercase tracking-wider" style={{ color:'rgba(206,147,216,0.4)' }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Connection portrait strip */}
              <div className="flex gap-2">
                {[...BEST_MATCHES, ...MET].slice(0,5).map((m, i) => (
                  <div key={m.name + i} style={{ flexShrink:0 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(206,147,216,0.3)', boxShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>
                      <img
                        src={craftImages.portraits[m.portraitKey] || craftImages.fallbacks.mentor}
                        alt={m.init}
                        onError={e => { e.currentTarget.style.display='none' }}
                        style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.7) saturate(0.6)' }}
                      />
                    </div>
                  </div>
                ))}
                <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(206,147,216,0.08)', border:'1px dashed rgba(206,147,216,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:'rgba(206,147,216,0.5)', fontWeight:700 }}>+7</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section>
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl p-1.5"
            style={{ background:'rgba(206,147,216,0.06)', border:'1px solid rgba(206,147,216,0.15)' }}>
            {[
              { id:'matches',   label:'Best Matches'    },
              { id:'met',       label:'People You Met'  },
              { id:'suggested', label:'Suggested'       },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="rounded-xl font-bold text-[11px] uppercase tracking-wider active:opacity-70 transition-all"
                style={{
                  height:44,
                  background: tab === t.id ? 'rgba(206,147,216,0.18)' : 'transparent',
                  border:     tab === t.id ? '1px solid rgba(206,147,216,0.4)' : 'none',
                  color:      tab === t.id ? '#ce93d8' : 'rgba(206,147,216,0.35)',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {tab === 'matches' && (
          <section className="space-y-4 pb-2">
            <p className="text-[10px] uppercase tracking-[0.3em] px-1" style={{ color:'rgba(206,147,216,0.3)' }}>Top Matches For You</p>
            {BEST_MATCHES.map(m => <MatchCard key={m.name} m={m} />)}
          </section>
        )}

        {tab === 'met' && (
          <section className="space-y-3 pb-2">
            <p className="text-[10px] uppercase tracking-[0.3em] px-1" style={{ color:'rgba(206,147,216,0.3)' }}>People You Met</p>
            {MET.map(m => (
              <div key={m.name} className="rounded-2xl overflow-hidden"
                style={{ background:`linear-gradient(155deg,${m.bg},${m.bg}ee)`, border:'1px solid rgba(206,147,216,0.18)', boxShadow:'0 5px 20px rgba(0,0,0,0.5)' }}>
                <div className="p-4 flex items-center gap-3">
                  <PortraitAvatar portraitKey={m.portraitKey} init={m.init} size={52} borderColor="rgba(206,147,216,0.22)" bg={m.bg} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] leading-tight" style={{ color:'#f0d4f5', fontFamily:'"Playfair Display",serif' }}>{m.name}</p>
                    <p className="text-[11px]" style={{ color:'rgba(206,147,216,0.5)' }}>{m.role} · {m.city}</p>
                    <p className="text-[10px] mt-0.5" style={{ color:'rgba(206,147,216,0.3)' }}>{m.event} · {m.when}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {['Message','View'].map(lbl => (
                      <button key={lbl}
                        onTouchStart={e => e.currentTarget.style.transform='scale(0.93)'}
                        onTouchEnd={e => e.currentTarget.style.transform=''}
                        className="px-3 rounded-lg font-bold text-[10px] active:scale-93 transition-all"
                        style={{ height:32, background:'rgba(206,147,216,0.1)', border:'1px solid rgba(206,147,216,0.25)', color:'#ce93d8' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === 'suggested' && (
          <section className="space-y-3 pb-2">
            <p className="text-[10px] uppercase tracking-[0.3em] px-1" style={{ color:'rgba(206,147,216,0.3)' }}>Suggested Introductions</p>
            {SUGGESTED.map(m => (
              <div key={m.name} className="rounded-2xl overflow-hidden"
                style={{ background:`linear-gradient(155deg,${m.bg},${m.bg}ee)`, border:'1px solid rgba(206,147,216,0.18)', boxShadow:'0 5px 20px rgba(0,0,0,0.5)' }}>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <PortraitAvatar portraitKey={m.portraitKey} init={m.init} size={52} borderColor="rgba(206,147,216,0.2)" bg={m.bg} />
                    <div className="flex-1">
                      <p className="font-bold text-[15px]" style={{ color:'#f0d4f5', fontFamily:'"Playfair Display",serif' }}>{m.name}</p>
                      <p className="text-[11px]" style={{ color:'rgba(206,147,216,0.5)' }}>{m.role} · {m.city}</p>
                      <p className="text-[10px] italic mt-0.5" style={{ color:'rgba(206,147,216,0.4)' }}>{m.why}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Connect','Request Intro','Save'].map(lbl => (
                      <button key={lbl}
                        onTouchStart={e => e.currentTarget.style.transform='scale(0.94)'}
                        onTouchEnd={e => e.currentTarget.style.transform=''}
                        className="rounded-xl font-bold text-[10px] uppercase tracking-wider active:scale-94 transition-all flex items-center justify-center"
                        style={{ height:44, background:'rgba(206,147,216,0.08)', border:'1px solid rgba(206,147,216,0.2)', color:'#ce93d8' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

      </main>
      <PassportBottomNav active="connections" />
    </div>
  )
}
