import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings:"'FILL' 1" }
const GOLD = {
  background:'linear-gradient(135deg,#8b6914 0%,#e9c176 40%,#f5d98a 55%,#c5a059 75%,#8b6914 100%)',
  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
}

const BEST_MATCHES = [
  { init:'DH', name:'David Harper',    role:'Founder @ North & Co.', city:'Austin, TX',       pct:94, bg:'#1a0829', why:'Shared goals in luxury hospitality & brand strategy',    mutual:'Innovation, Travel',  event:'Cigar & Cognac Night', line:'Loved your take on experiential brand. Would love to connect.',   verified:true  },
  { init:'SM', name:'Sophia Martinez', role:'Creative Director',      city:'Los Angeles, CA',  pct:88, bg:'#1a0815', why:'Brand strategy and creative alignment across luxury events', mutual:'Design, Art',       event:'Capital & Culture',    line:'Your design portfolio is inspiring. Let\'s explore a collaboration.', verified:true },
  { init:'MR', name:'Michael Reynolds',role:'Entrepreneur',           city:'New York, NY',     pct:82, bg:'#0d1829', why:'Both focused on scaling premium member experiences',       mutual:'Tech, Innovation',   event:'Grand Opening Night',  line:'Your SaaS angle on hospitality is exactly what I\'ve been thinking about.', verified:false },
]
const MET = [
  { init:'AC', name:'Alicia Chen',     role:'Investor',        city:'San Francisco, CA', when:'Jun 7', event:'Capital & Culture Dinner',   bg:'#0d1a10' },
  { init:'PS', name:'Priya Shah',      role:'Marketing Lead',  city:'New York, NY',      when:'Jun 6', event:'Cigar & Cognac Night',        bg:'#291008' },
  { init:'JC', name:'James Carter',    role:'Founder',         city:'Miami, FL',         when:'Jun 5', event:'Grand Opening Night',         bg:'#081a10' },
]
const SUGGESTED = [
  { init:'EM', name:'Elena Marchetti', role:'Creative Director', city:'Los Angeles, CA', why:'3 shared interests · 1 mutual connection', bg:'#1a0e29' },
  { init:'DK', name:'Daniel Kim',      role:'Product Strategist',city:'New York, NY',    why:'Same event attendance · Industry overlap',  bg:'#121808' },
]

function MatchCard({ m }) {
  const navigate = useNavigate()
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background:`linear-gradient(155deg,${m.bg},${m.bg}ee)`, border:'1px solid rgba(206,147,216,0.2)', boxShadow:'0 6px 28px rgba(0,0,0,0.6)' }}>
      {/* Score bar */}
      <div className="h-1" style={{ background:`linear-gradient(90deg,transparent,rgba(206,147,216,${m.pct/100*0.8}),transparent)` }} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative w-14 h-14 rounded-xl flex items-center justify-center font-bold text-[18px] flex-shrink-0"
            style={{ background:`${m.bg}`, color:'#e8c0f0', border:'2px solid rgba(206,147,216,0.25)', fontFamily:'"Playfair Display",serif', boxShadow:'0 4px 12px rgba(0,0,0,0.4)' }}>
            {m.init}
            {m.verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background:'rgba(206,147,216,0.9)', boxShadow:'0 2px 6px rgba(0,0,0,0.4)' }}>
                <span className="material-symbols-outlined" style={{ fontSize:11, color:'#1a0820', ...FILL1 }}>check</span>
              </div>
            )}
          </div>
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

        {/* Why you match */}
        <div className="rounded-xl px-3 py-2.5 mb-3" style={{ background:'rgba(206,147,216,0.07)', border:'1px solid rgba(206,147,216,0.15)' }}>
          <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color:'rgba(206,147,216,0.45)' }}>Why you match</p>
          <p className="text-[11px] leading-snug italic" style={{ color:'rgba(206,147,216,0.7)' }}>{m.why}</p>
        </div>

        {/* Mutual + event */}
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

        {/* Opening line */}
        <div className="rounded-xl px-3 py-2.5 mb-3" style={{ background:'rgba(206,147,216,0.05)', border:'1px solid rgba(206,147,216,0.1)' }}>
          <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color:'rgba(206,147,216,0.35)' }}>Suggested opening</p>
          <p className="text-[11px] italic leading-snug" style={{ color:'rgba(206,147,216,0.55)' }}>"{m.line}"</p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label:'Connect',      icon:'hub',              primary:true  },
            { label:'Message',      icon:'chat_bubble',      primary:false },
            { label:'Scan to Link', icon:'qr_code_scanner',  primary:false },
            { label:'Save',         icon:'bookmark',         primary:false },
          ].map(b => (
            <button key={b.label}
              onTouchStart={e => e.currentTarget.style.transform='scale(0.94)'}
              onTouchEnd={e => e.currentTarget.style.transform=''}
              className="flex items-center justify-center gap-2 rounded-xl font-bold text-[11px] active:scale-94 transition-all"
              style={{
                height:48,
                background: b.primary ? 'rgba(206,147,216,0.18)' : 'rgba(206,147,216,0.07)',
                border: `1px solid rgba(206,147,216,${b.primary ? 0.45 : 0.18})`,
                color: '#ce93d8',
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

      {/* Burgundy ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background:'radial-gradient(ellipse 70% 50% at 20% 0%, rgba(80,10,40,0.25) 0%, transparent 65%)' }} />
        <div className="absolute inset-0" style={{ background:'repeating-linear-gradient(45deg,rgba(255,255,255,0.005) 0,rgba(255,255,255,0.005) 1px,transparent 0,transparent 6px)' }} />
      </div>

      {/* ── Header ── */}
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

        {/* ── Portfolio cover ── */}
        <section>
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'linear-gradient(155deg,#1a0620,#22082c,#160518)', border:'2px solid rgba(206,147,216,0.28)', boxShadow:'0 10px 40px rgba(0,0,0,0.7)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background:'repeating-linear-gradient(45deg,rgba(255,255,255,0.006) 0,rgba(255,255,255,0.006) 1px,transparent 0,transparent 5px)' }} />
            <div className="h-1" style={{ background:'linear-gradient(90deg,#4a0830,#ce93d8,#9c27b0,#ce93d8,#4a0830)' }} />
            <div className="p-5 relative flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:'rgba(206,147,216,0.1)', border:'1.5px solid rgba(206,147,216,0.3)', boxShadow:'0 4px 12px rgba(0,0,0,0.4)' }}>
                <span className="material-symbols-outlined" style={{ fontSize:28, color:'#ce93d8', ...FILL1 }}>hub</span>
              </div>
              <div>
                <p className="font-bold text-[20px] leading-none mb-1.5" style={{ color:'#e8c0f0', fontFamily:'"Playfair Display",serif' }}>Connections</p>
                <p className="text-[11px] leading-relaxed" style={{ color:'rgba(206,147,216,0.45)' }}>
                  Connections turns event introductions into verified relationships you can track, revisit, and grow over time.
                </p>
                <div className="flex gap-3 mt-3">
                  {[{ v:'12', l:'Verified'}, { v:'94%', l:'Top Match'}, { v:'8/10', l:'Social Goal'}].map(s => (
                    <div key={s.l}>
                      <p className="font-black text-[16px] leading-none" style={{ color:'#ce93d8', fontFamily:'"Playfair Display",serif' }}>{s.v}</p>
                      <p className="text-[9px] uppercase tracking-wider" style={{ color:'rgba(206,147,216,0.4)' }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tabs ── */}
        <section>
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl p-1.5"
            style={{ background:'rgba(206,147,216,0.06)', border:'1px solid rgba(206,147,216,0.15)' }}>
            {[
              { id:'matches', label:'Best Matches' },
              { id:'met',     label:'People You Met' },
              { id:'suggested', label:'Suggested' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="rounded-xl font-bold text-[11px] uppercase tracking-wider active:opacity-70 transition-all"
                style={{
                  height:44,
                  background: tab === t.id ? 'rgba(206,147,216,0.18)' : 'transparent',
                  border: tab === t.id ? '1px solid rgba(206,147,216,0.4)' : 'none',
                  color: tab === t.id ? '#ce93d8' : 'rgba(206,147,216,0.35)',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Content ── */}
        {tab === 'matches' && (
          <section className="space-y-4 pb-2">
            <p className="text-[10px] uppercase tracking-[0.3em] px-1" style={{ color:'rgba(206,147,216,0.3)' }}>Top Matches For You · See All Matches</p>
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
                  <div className="w-13 h-13 rounded-xl flex items-center justify-center font-bold text-[16px] flex-shrink-0"
                    style={{ width:52, height:52, background:`${m.bg}`, color:'#e8c0f0', border:'2px solid rgba(206,147,216,0.22)', fontFamily:'"Playfair Display",serif', boxShadow:'0 4px 10px rgba(0,0,0,0.4)' }}>
                    {m.init}
                  </div>
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
                    <div className="w-13 rounded-xl flex items-center justify-center font-bold text-[16px] flex-shrink-0"
                      style={{ width:52, height:52, background:`${m.bg}`, color:'#e8c0f0', border:'2px solid rgba(206,147,216,0.2)', fontFamily:'"Playfair Display",serif' }}>
                      {m.init}
                    </div>
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
