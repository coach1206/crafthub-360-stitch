import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const MATCHES = [
  { id: 1,  name: 'Marcus Webb',     role: 'Venture Partner',   company: 'Apex Capital',     city: 'Atlanta',   score: 94, tags: ['Investing', 'FinTech'], reason: 'Both in hospitality tech · Founder Summit mutual', initials: 'MW', color: '#1e3a5f', accentColor: '#4a9eff' },
  { id: 2,  name: 'Dante Cruz',      role: 'Master Blender',    company: 'Cruz Tobacco Co.', city: 'Havana',    score: 91, tags: ['Tobacco', 'Craft'],     reason: 'SmokeCraft expertise · Grand Lounge mutual',       initials: 'DC', color: '#3a1a00', accentColor: '#ffb74d' },
  { id: 3,  name: 'Soleil Fontaine', role: 'Creative Director', company: 'Noir Studio',      city: 'Miami',     score: 87, tags: ['Design', 'Luxury'],     reason: 'Luxury brand alignment · Creative goals match',    initials: 'SF', color: '#2d0d1a', accentColor: '#ce93d8' },
]

const MET_PEOPLE = [
  { id: 4, name: 'Kwame Asante',    role: 'Brand Strategist',  event: 'SmokeCraft Event',  date: 'Jun 6', initials: 'KA', color: '#1a0d1a' },
  { id: 5, name: 'Tariq Hassan',    role: 'Event Producer',    event: 'Grand Lounge',      date: 'Jun 5', initials: 'TH', color: '#1a1000' },
  { id: 6, name: 'James Okafor',    role: 'Founder & CEO',     event: 'SmokeCraft Event',  date: 'Jun 4', initials: 'JO', color: '#0d2818' },
]

const TABLES = [
  { id: 1, name: 'Founders Table',    members: 4, topic: 'Hospitality Tech & Scaling',   icon: 'table_bar',    color: '#1e3a5f' },
  { id: 2, name: 'Craft Circle',      members: 6, topic: 'Premium Tobacco & Spirits',    icon: 'workspaces',   color: '#3a1a00' },
  { id: 3, name: 'Investor Lounge',   members: 3, topic: 'Consumer Brand Dealflow',      icon: 'attach_money', color: '#0d2818' },
]

function MatchCard({ match, onAction }) {
  const [status, setStatus] = useState(null)
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: `${match.color}cc`, border: `1px solid ${match.accentColor}30`, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>

      <div className="p-4">
        {/* Compatibility score */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[14px] flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#f0e6d0', fontFamily: '"Playfair Display", serif' }}>
              {match.initials}
            </div>
            <div>
              <p className="font-bold text-[15px] leading-tight" style={{ color: '#f0e6d0', fontFamily: '"Playfair Display", serif' }}>{match.name}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{match.role} · {match.company}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="rounded-lg px-2 py-1" style={{ background: `${match.accentColor}20`, border: `1px solid ${match.accentColor}40` }}>
              <p className="text-[14px] font-bold leading-none" style={{ color: match.accentColor }}>{match.score}%</p>
              <p className="text-[8px] uppercase tracking-wider mt-0.5" style={{ color: `${match.accentColor}80` }}>Match</p>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {match.tags.map(t => (
            <span key={t} className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{t}</span>
          ))}
          <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>{match.city}</span>
        </div>

        {/* Why they match */}
        <div className="rounded-lg px-3 py-2 mb-3" style={{ background: 'rgba(0,0,0,0.25)' }}>
          <span className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Why you match · </span>
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{match.reason}</span>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: 'people',         label: 'Connect',  action: 'connect' },
            { icon: 'qr_code_scanner',label: 'Scan',     action: 'scan'    },
            { icon: 'chat',           label: 'Message',  action: 'message' },
            { icon: 'person',         label: 'Profile',  action: 'profile' },
          ].map(btn => {
            const isActive = status === btn.action
            return (
              <button key={btn.action}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.9)'}
                onTouchEnd={e => { e.currentTarget.style.transform = ''; setStatus(btn.action); onAction(match, btn.action) }}
                onClick={() => { setStatus(btn.action); onAction(match, btn.action) }}
                className="rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-90"
                style={{
                  height: 56,
                  background: isActive ? `${match.accentColor}20` : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${isActive ? match.accentColor + '50' : 'rgba(255,255,255,0.1)'}`,
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: 17, color: isActive ? match.accentColor : 'rgba(255,255,255,0.6)' }}>{btn.icon}</span>
                <span className="text-[8px] uppercase tracking-wider" style={{ color: isActive ? match.accentColor : 'rgba(255,255,255,0.4)' }}>{btn.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function PassportConnections() {
  const navigate   = useNavigate()
  const [toast, setToast] = useState(null)

  function handleAction(member, action) {
    const msgs = {
      connect: `Connection request sent to ${member.name}`,
      scan:    `Opening scanner to link with ${member.name}`,
      message: `Message drafted for ${member.name}`,
      profile: `Viewing ${member.name}'s full profile`,
    }
    setToast(msgs[action])
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="min-h-screen font-body-md pb-28 text-on-surface overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #1a0a12 0%, #0d0608 100%)' }}>

      {/* Burgundy ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full blur-[100px]" style={{ background: 'rgba(100,20,50,0.2)' }} />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 z-[100] rounded-xl px-5 py-3 text-[13px] font-bold shadow-2xl"
          style={{ transform: 'translateX(-50%)', background: 'rgba(80,20,50,0.95)', color: '#ce93d8', border: '1px solid rgba(206,147,216,0.4)', backdropFilter: 'blur(12px)' }}>
          {toast}
        </div>
      )}

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-5 backdrop-blur-xl border-b"
        style={{ height: 72, background: 'rgba(13,6,8,0.9)', borderColor: 'rgba(206,147,216,0.2)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/passport')} className="material-symbols-outlined p-2 rounded-full active:bg-white/10 transition-colors"
            style={{ color: '#ce93d8', minWidth: 44, minHeight: 44 }}>arrow_back</button>
          <div>
            <p className="font-bold text-[15px] leading-none" style={{ color: '#ce93d8', fontFamily: '"Playfair Display", serif' }}>Connections</p>
            <p className="text-[10px] uppercase tracking-[0.25em] mt-0.5" style={{ color: 'rgba(206,147,216,0.5)' }}>Your relationship engine</p>
          </div>
        </div>
        <button onClick={() => navigate('/passport/scan')}
          className="flex items-center gap-2 px-4 rounded-full active:scale-95 transition-all"
          style={{ height: 44, background: 'rgba(206,147,216,0.12)', border: '1px solid rgba(206,147,216,0.3)', color: '#ce93d8' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>qr_code_scanner</span>
          <span className="text-[12px] font-bold uppercase tracking-wider">Scan to Link</span>
        </button>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-6">

        {/* ── What this does ─────────────────────────────────── */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(206,147,216,0.07)', border: '1px solid rgba(206,147,216,0.15)' }}>
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(206,147,216,0.5)' }}>What this does</p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Turn event moments into verified relationships, saved contacts, and future opportunities. Connect, message, and build your private network here.
          </p>
        </div>

        {/* ── Best Matches ─────────────────────────────────── */}
        <section>
          <p className="text-[11px] uppercase tracking-[0.3em] mb-3" style={{ color: 'rgba(206,147,216,0.5)' }}>Best Matches For You</p>
          <div className="space-y-4">
            {MATCHES.map(m => <MatchCard key={m.id} match={m} onAction={handleAction} />)}
          </div>
        </section>

        {/* ── People You Met ────────────────────────────────── */}
        <section>
          <p className="text-[11px] uppercase tracking-[0.3em] mb-3" style={{ color: 'rgba(206,147,216,0.5)' }}>People You Met</p>
          <div className="space-y-2">
            {MET_PEOPLE.map(p => (
              <div key={p.id} className="rounded-xl flex items-center gap-4 px-4"
                style={{ background: `${p.color}cc`, border: '1px solid rgba(255,255,255,0.1)', minHeight: 72 }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#f0e6d0' }}>{p.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px]" style={{ color: '#f0e6d0' }}>{p.name}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{p.role} · {p.event}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px]" style={{ color: 'rgba(206,147,216,0.5)' }}>{p.date}</span>
                  <button onTouchStart={e => e.currentTarget.style.transform = 'scale(0.9)'} onTouchEnd={e => { e.currentTarget.style.transform = ''; handleAction(p, 'connect') }}
                    onClick={() => handleAction(p, 'connect')}
                    className="block mt-1 px-3 rounded-full active:scale-90 transition-all text-[10px] font-bold uppercase tracking-wider"
                    style={{ height: 28, background: 'rgba(206,147,216,0.15)', border: '1px solid rgba(206,147,216,0.3)', color: '#ce93d8' }}>
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Suggested Tables / Circles ─────────────────────── */}
        <section>
          <p className="text-[11px] uppercase tracking-[0.3em] mb-3" style={{ color: 'rgba(206,147,216,0.5)' }}>Suggested Tables & Circles</p>
          <div className="space-y-2">
            {TABLES.map(table => (
              <button key={table.id}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onTouchEnd={e => { e.currentTarget.style.transform = ''; handleAction(table, 'connect') }}
                onClick={() => handleAction(table, 'connect')}
                className="w-full rounded-xl flex items-center gap-4 px-4 text-left active:scale-[0.98] transition-all"
                style={{ background: `${table.color}cc`, border: '1px solid rgba(206,147,216,0.15)', minHeight: 72 }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#ce93d8' }}>{table.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px]" style={{ color: '#f0e6d0' }}>{table.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{table.topic}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[14px] font-bold" style={{ color: '#ce93d8' }}>{table.members}</p>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Members</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Scan CTA ─────────────────────────────────────── */}
        <button onClick={() => navigate('/passport/scan')}
          onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate('/passport/scan') }}
          className="w-full rounded-2xl flex items-center gap-5 px-6 active:scale-[0.98] transition-all"
          style={{ background: 'rgba(206,147,216,0.1)', border: '2px solid rgba(206,147,216,0.25)', minHeight: 80 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#ce93d8', ...FILL1 }}>qr_code_scanner</span>
          <div className="text-left">
            <p className="font-bold text-[15px]" style={{ color: '#f0e6d0' }}>Scan to Verify a Connection</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Earn a verified connection stamp instantly</p>
          </div>
          <span className="material-symbols-outlined ml-auto" style={{ fontSize: 20, color: 'rgba(206,147,216,0.5)' }}>arrow_forward_ios</span>
        </button>

      </main>

      <PassportBottomNav active="connections" />
    </div>
  )
}
