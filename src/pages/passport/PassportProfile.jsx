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

const PROFILE_SECTIONS = [
  { label:'Profession',  icon:'work',          field:'profession',  placeholder:'Your role or title'           },
  { label:'Company',     icon:'business',      field:'company',     placeholder:'Your company or practice'     },
  { label:'Industry',    icon:'domain',        field:'industry',    placeholder:'e.g. Hospitality, Tech, Finance' },
  { label:'City',        icon:'location_on',   field:'city',        placeholder:'Your home city'               },
]
const GOAL_SECTIONS = [
  { label:'Goals',       icon:'flag',          field:'goals',       placeholder:'What you are working toward'  },
  { label:'Interests',   icon:'interests',     field:'interests',   placeholder:'Topics, industries, hobbies'  },
  { label:'Expertise',   icon:'psychology',    field:'expertise',   placeholder:'What you can teach or offer'  },
  { label:'Looking For', icon:'search',        field:'lookingFor',  placeholder:'What you want to find or build' },
  { label:'Offering',    icon:'handshake',     field:'offering',    placeholder:'What you bring to others'     },
]

const TIER_COLORS = { Novice:'#c5a059', Bronze:'#cd7f32', Silver:'#c0c0c0', Gold:'#e9c176', Diamond:'#4fc3f7' }
const TIER_NEXT = { Novice:100, Bronze:300, Silver:600, Gold:1200, Diamond:9999 }

export default function PassportProfile() {
  const navigate = useNavigate()
  const { session } = useGuestSession()
  const xp    = session.xp ?? 0
  const rank  = getRankFromXP(xp)
  const fname = session.profile?.firstName || ''
  const lname = session.profile?.lastName  || ''
  const displayName = `${fname} ${lname}`.trim() || 'Passport Member'
  const initials    = fname ? `${fname[0]}${lname?.[0] || ''}` : 'PM'
  const tc   = TIER_COLORS[rank.name] || '#e9c176'
  const nextXP = TIER_NEXT[rank.name] || 300
  const pct  = Math.min(100, Math.round((xp / nextXP) * 100))

  const [editing, setEditing] = useState(false)
  const stamps  = session.smokecraftStamps?.length ?? 11
  const conns   = 12
  const events  = 5

  const STATS = [
    { icon:'workspace_premium', val:stamps,  label:'Stamps Earned'      },
    { icon:'hub',               val:conns,   label:'Connections Verified' },
    { icon:'event',             val:events,  label:'Events Attended'    },
    { icon:'stars',             val:`${pct}%`, label:'Profile Complete'  },
  ]

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden"
      style={{ background:'linear-gradient(165deg,#03060e,#060c18,#03050c)' }}>

      {/* Navy passport ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background:'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(20,40,100,0.2) 0%, transparent 65%)' }} />
        <div className="absolute inset-0" style={{ background:'repeating-linear-gradient(135deg,rgba(255,255,255,0.006) 0,rgba(255,255,255,0.006) 1px,transparent 0,transparent 6px)' }} />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 border-b backdrop-blur-2xl"
        style={{ height:68, background:'rgba(3,5,12,0.97)', borderColor:'rgba(100,150,255,0.18)' }}>
        <button onClick={() => navigate('/passport')}
          className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform flex-shrink-0"
          style={{ background:'rgba(100,150,255,0.08)', border:'1px solid rgba(100,150,255,0.2)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:20, color:'#90caf9' }}>arrow_back</span>
        </button>
        <div className="flex-1">
          <p className="font-bold text-[16px] leading-none" style={{ color:'#b0d0ff', fontFamily:'"Playfair Display",serif' }}>My Profile</p>
          <p className="text-[9px] uppercase tracking-[0.25em] mt-0.5" style={{ color:'rgba(144,202,249,0.35)' }}>Passport Identity</p>
        </div>
        <button onClick={() => setEditing(!editing)}
          className="flex items-center gap-2 px-3 rounded-full active:opacity-70 transition-opacity"
          style={{ height:40, background: editing ? 'rgba(233,193,118,0.15)' : 'rgba(100,150,255,0.1)', border: `1px solid ${editing ? 'rgba(233,193,118,0.4)' : 'rgba(100,150,255,0.25)'}` }}>
          <span className="material-symbols-outlined" style={{ fontSize:16, color: editing ? '#e9c176' : '#90caf9', ...FILL1 }}>{editing ? 'check' : 'edit'}</span>
          <span className="text-[11px] font-bold" style={{ color: editing ? '#e9c176' : '#90caf9' }}>{editing ? 'Done' : 'Edit'}</span>
        </button>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-5">

        {/* ── Passport identity spread ── */}
        <section>
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'linear-gradient(155deg,#06101e,#0a1628,#060e1c)', border:'2px solid rgba(100,150,255,0.25)', boxShadow:'0 12px 48px rgba(0,0,0,0.75)' }}>
            {/* Leather grain */}
            <div className="absolute inset-0 pointer-events-none" style={{ background:'repeating-linear-gradient(135deg,rgba(255,255,255,0.006) 0,rgba(255,255,255,0.006) 1px,transparent 0,transparent 6px)' }} />
            {/* Top gold strip */}
            <div className="h-1.5" style={{ background:'linear-gradient(90deg,#1a2850,#4a7eff,#90caf9,#4a7eff,#1a2850)' }} />
            <div className="p-5 relative">
              {/* Identity row */}
              <div className="flex items-start gap-4 mb-5">
                {/* Portrait */}
                <div className="relative flex-shrink-0">
                  <div className="rounded-xl flex items-center justify-center font-black"
                    style={{ width:72, height:90, background:'linear-gradient(145deg,#1e3a5f,#0d2035)', color:'#90caf9', fontFamily:'"Playfair Display",serif', fontSize:26, border:'2px solid rgba(100,150,255,0.3)', boxShadow:'0 6px 20px rgba(0,0,0,0.5)' }}>
                    {initials}
                  </div>
                  {/* Verified seal */}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background:'linear-gradient(135deg,#e9c176,#c5a059)', border:'2px solid rgba(3,5,12,0.9)', boxShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:15, color:'#0a0805', ...FILL1 }}>verified</span>
                  </div>
                </div>

                {/* Identity details */}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[22px] leading-tight" style={{ color:'#d0e8ff', fontFamily:'"Playfair Display",serif' }}>{displayName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{ background:`${tc}18`, border:`1px solid ${tc}45` }}>
                      <span className="material-symbols-outlined" style={{ fontSize:11, color:tc, ...FILL1 }}>star</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color:tc }}>{rank.name}</span>
                    </div>
                    <span className="font-bold text-[13px]" style={{ color:'#e9c176' }}>{xp} XP</span>
                  </div>
                  <p className="text-[11px] mt-2" style={{ color:'rgba(144,202,249,0.45)' }}>Member since June 2026 · 360 Passport</p>
                  {/* XP progress */}
                  <div className="mt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px]" style={{ color:`${tc}80` }}>{xp} XP</span>
                      <span className="text-[9px]" style={{ color:`${tc}50` }}>{nextXP} XP next tier</span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height:5, background:'rgba(255,255,255,0.07)' }}>
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${tc}80,${tc})` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Passport number + issue date ── */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label:'Passport No.', val:'PC-2026-001' },
                  { label:'Issued',       val:'Jun 1, 2026' },
                  { label:'Status',       val:'Active'      },
                ].map(f => (
                  <div key={f.label} className="rounded-lg px-2.5 py-2" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(100,150,255,0.12)' }}>
                    <p className="text-[8.5px] uppercase tracking-wider" style={{ color:'rgba(144,202,249,0.3)' }}>{f.label}</p>
                    <p className="font-bold text-[11px] mt-0.5" style={{ color:'#d0e8ff' }}>{f.val}</p>
                  </div>
                ))}
              </div>

              {/* ── Gold wax seal strip ── */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background:'rgba(100,150,255,0.1)' }} />
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background:'radial-gradient(circle,#c5a059,#8b6914)', border:'2px solid rgba(197,160,89,0.4)', boxShadow:'0 2px 8px rgba(197,160,89,0.3)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:16, color:'rgba(255,245,200,0.9)', ...FILL1 }}>public</span>
                </div>
                <div className="flex-1 h-px" style={{ background:'rgba(100,150,255,0.1)' }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats row ── */}
        <section>
          <div className="grid grid-cols-4 gap-2">
            {STATS.map(s => (
              <div key={s.label} className="rounded-xl flex flex-col items-center justify-center gap-1 py-3"
                style={{ background:'rgba(100,150,255,0.06)', border:'1px solid rgba(100,150,255,0.14)', boxShadow:'0 3px 12px rgba(0,0,0,0.4)' }}>
                <span className="material-symbols-outlined" style={{ fontSize:18, color:'#90caf9', ...FILL1 }}>{s.icon}</span>
                <p className="font-black text-[16px] leading-none" style={{ color:'#d0e8ff', fontFamily:'"Playfair Display",serif' }}>{s.val}</p>
                <p className="text-[7.5px] uppercase tracking-wider text-center leading-tight" style={{ color:'rgba(144,202,249,0.4)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Identity fields ── */}
        <section>
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'linear-gradient(155deg,#06101e,#0a1628)', border:'1px solid rgba(100,150,255,0.18)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
            <div className="px-4 py-3.5" style={{ borderBottom:'1px solid rgba(100,150,255,0.1)' }}>
              <p className="font-bold text-[15px]" style={{ color:'#b0d0ff', fontFamily:'"Playfair Display",serif' }}>Identity Details</p>
              <p className="text-[10px] mt-0.5" style={{ color:'rgba(144,202,249,0.35)' }}>Your profile powers your matches. Complete every field.</p>
            </div>
            <div className="p-4 space-y-3">
              {PROFILE_SECTIONS.map(f => (
                <div key={f.field} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background:'rgba(100,150,255,0.08)', border:'1px solid rgba(100,150,255,0.18)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:16, color:'#90caf9', ...FILL1 }}>{f.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color:'rgba(144,202,249,0.35)' }}>{f.label}</p>
                    {editing ? (
                      <input className="w-full bg-transparent outline-none text-[13px] font-bold border-b pb-0.5"
                        style={{ color:'#d0e8ff', borderColor:'rgba(100,150,255,0.3)', caretColor:'#90caf9' }}
                        placeholder={f.placeholder}
                        defaultValue={session.profile?.[f.field] || ''} />
                    ) : (
                      <p className="text-[13px] font-bold" style={{ color: session.profile?.[f.field] ? '#d0e8ff' : 'rgba(144,202,249,0.25)' }}>
                        {session.profile?.[f.field] || f.placeholder}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Goals & interests ── */}
        <section>
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'linear-gradient(155deg,#06101e,#0a1628)', border:'1px solid rgba(100,150,255,0.18)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
            <div className="px-4 py-3.5" style={{ borderBottom:'1px solid rgba(100,150,255,0.1)' }}>
              <p className="font-bold text-[15px]" style={{ color:'#b0d0ff', fontFamily:'"Playfair Display",serif' }}>Goals & Interests</p>
              <p className="text-[10px] mt-0.5" style={{ color:'rgba(144,202,249,0.35)' }}>Powers your Directory results and connection matches.</p>
            </div>
            <div className="p-4 space-y-3">
              {GOAL_SECTIONS.map(f => (
                <div key={f.field}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined" style={{ fontSize:14, color:'rgba(144,202,249,0.5)', ...FILL1 }}>{f.icon}</span>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color:'rgba(144,202,249,0.35)' }}>{f.label}</p>
                  </div>
                  {editing ? (
                    <textarea rows={2} className="w-full bg-transparent outline-none text-[12px] rounded-lg px-3 py-2 resize-none"
                      style={{ background:'rgba(100,150,255,0.06)', border:'1px solid rgba(100,150,255,0.2)', color:'#d0e8ff', caretColor:'#90caf9' }}
                      placeholder={f.placeholder}
                      defaultValue={session.profile?.[f.field] || ''} />
                  ) : (
                    <div className="rounded-lg px-3 py-2.5" style={{ background:'rgba(100,150,255,0.04)', border:'1px solid rgba(100,150,255,0.1)' }}>
                      <p className="text-[12px]" style={{ color: session.profile?.[f.field] ? '#c0d8f8' : 'rgba(144,202,249,0.2)' }}>
                        {session.profile?.[f.field] || f.placeholder}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Action buttons ── */}
        <section className="pb-2 space-y-2.5">
          {[
            { label:'View Public Passport', icon:'open_in_new',      primary:false },
            { label:'Share My QR',          icon:'qr_code_2',        primary:false },
            { label:'Scan to Connect',       icon:'qr_code_scanner',  primary:true  },
          ].map(b => (
            <button key={b.label} onClick={() => b.primary && navigate('/passport/scan')}
              onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
              onTouchEnd={e => { e.currentTarget.style.transform=''; b.primary && navigate('/passport/scan') }}
              className="w-full flex items-center justify-center gap-3 rounded-xl font-bold text-[13px] uppercase tracking-wider active:scale-97 transition-all"
              style={{
                height:64,
                background: b.primary ? 'linear-gradient(135deg,#e9c176,#c5a059)' : 'rgba(100,150,255,0.07)',
                border: b.primary ? 'none' : '1px solid rgba(100,150,255,0.2)',
                color: b.primary ? '#0a0805' : '#90caf9',
                boxShadow: b.primary ? '0 4px 20px rgba(233,193,118,0.3)' : 'none',
              }}>
              <span className="material-symbols-outlined" style={{ fontSize:20, ...FILL1 }}>{b.icon}</span>
              {b.label}
            </button>
          ))}
        </section>

      </main>
      <PassportBottomNav active="profile" />
    </div>
  )
}
