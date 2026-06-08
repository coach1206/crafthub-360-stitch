import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { STAMP_CATALOG } from '../../data/passportCatalog.js'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const STAMP_COLORS = {
  'seed-soil':         { ink: '#1a5c2a', bg: '#e8f5e9', ring: '#4caf50',  label: 'Heritage'    },
  'master-blend':      { ink: '#7b1fa2', bg: '#f3e5f5', ring: '#ce93d8',  label: 'Craft'       },
  'taste-profile':     { ink: '#0d47a1', bg: '#e3f2fd', ring: '#4a9eff',  label: 'Palate'      },
  'pairing-specialist':{ ink: '#b71c1c', bg: '#ffebee', ring: '#ef5350',  label: 'Pairing'     },
  'journey-complete':  { ink: '#e65100', bg: '#fff3e0', ring: '#ffb74d',  label: 'Journey'     },
  'passport-stamp':    { ink: '#1a237e', bg: '#e8eaf6', ring: '#7986cb',  label: 'Passport'    },
  'leaf-recognition':  { ink: '#1b5e20', bg: '#e8f5e9', ring: '#66bb6a',  label: 'Botany'      },
  'golden-box':        { ink: '#7a5c00', bg: '#fffde7', ring: '#e9c176',  label: 'VIP'         },
}

const ALL_STAMP_TYPES = [
  { type: 'Event',       icon: 'event',            color: '#ef5350', desc: 'Earned by attending verified events'        },
  { type: 'Connection',  icon: 'people',           color: '#4a9eff', desc: 'Awarded when you make verified connections' },
  { type: 'Craft',       icon: 'workspace_premium',color: '#ce93d8', desc: 'For completing craft education sessions'    },
  { type: 'VIP',         icon: 'stars',            color: '#e9c176', desc: 'Exclusive tier achievements'                },
  { type: 'Achievement', icon: 'emoji_events',     color: '#ffb74d', desc: 'Milestone and challenge completions'        },
  { type: 'Verified',    icon: 'verified',         color: '#4caf50', desc: 'Identity and profile verification'          },
  { type: 'Legacy',      icon: 'history_edu',      color: '#66bb6a', desc: 'Long-term member and loyalty stamps'        },
]

function StampCard({ stamp, earned, color }) {
  const [flipped, setFlipped] = useState(false)
  const c = color || { ink: '#8b6914', bg: '#f5e8c8', ring: '#c5a059', label: 'Craft' }

  return (
    <button
      onClick={() => setFlipped(f => !f)}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
      onTouchEnd={e => e.currentTarget.style.transform = ''}
      className="rounded-2xl overflow-hidden transition-all duration-300 active:scale-95 w-full text-left relative"
      style={{
        background: earned ? c.bg : '#1a1208',
        border: `2px solid ${earned ? c.ring : 'rgba(255,255,255,0.08)'}`,
        opacity: earned ? 1 : 0.45,
        minHeight: 160,
        boxShadow: earned ? `0 0 20px ${c.ring}20` : 'none',
      }}
    >
      {/* Stamp outer ring decoration */}
      {earned && (
        <div className="absolute inset-2 rounded-xl pointer-events-none" style={{ border: `1px dashed ${c.ring}50` }} />
      )}

      <div className="p-4 flex flex-col items-center text-center gap-2">
        {/* Main icon */}
        <div className="w-14 h-14 rounded-full flex items-center justify-center relative"
          style={{ background: earned ? `${c.ring}20` : 'rgba(255,255,255,0.04)', border: `2px ${earned ? 'solid' : 'dashed'} ${c.ring}60` }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: earned ? c.ink : 'rgba(255,255,255,0.2)', ...(earned ? FILL1 : {}) }}>
            {stamp.icon}
          </span>
        </div>

        <div>
          <p className="font-bold text-[13px] leading-tight" style={{ color: earned ? c.ink : 'rgba(255,255,255,0.3)', fontFamily: '"Playfair Display", serif' }}>
            {stamp.name}
          </p>
          <p className="text-[9px] uppercase tracking-wider mt-1" style={{ color: earned ? `${c.ring}` : 'rgba(255,255,255,0.2)' }}>
            {earned ? c.label : 'Locked'}
          </p>
        </div>

        {earned && !flipped && (
          <div className="text-[9px] uppercase tracking-wider" style={{ color: `${c.ring}80` }}>
            SmokeCraft 360 · Certified
          </div>
        )}

        {earned && flipped && (
          <p className="text-[10px] leading-relaxed text-center" style={{ color: c.ink }}>
            {stamp.desc}
          </p>
        )}

        {earned && (
          <div className="absolute top-2 right-2">
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: c.ring, ...FILL1 }}>verified</span>
          </div>
        )}

        {!earned && (
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.15)' }}>lock</span>
        )}
      </div>

      {/* Bottom border stamp line */}
      {earned && <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, ${c.ring}, transparent)` }} />}
    </button>
  )
}

export default function PassportStamps() {
  const navigate    = useNavigate()
  const { session } = useGuestSession()
  const [tab, setTab] = useState('my')

  const earnedIds   = new Set((session.smokecraftStamps ?? []).map(s => s.id))
  const totalEarned = earnedIds.size
  const pct         = Math.min(100, Math.round((totalEarned / STAMP_CATALOG.length) * 100))
  const displayName = session.profile?.firstName
    ? `${session.profile.firstName} ${session.profile.lastName || ''}`.trim()
    : 'Grand Member'

  return (
    <div className="min-h-screen font-body-md pb-28 text-on-surface overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #1a1208 0%, #0f0a04 100%)' }}>

      {/* Parchment texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]"
        style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/natural-paper.png)' }} />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-5 backdrop-blur-xl border-b"
        style={{ height: 72, background: 'rgba(15,10,4,0.9)', borderColor: 'rgba(233,193,118,0.15)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/passport')} className="material-symbols-outlined p-2 rounded-full active:bg-primary/10 transition-colors"
            style={{ color: '#e9c176', minWidth: 44, minHeight: 44 }}>arrow_back</button>
          <div>
            <p className="font-bold text-[15px] leading-none" style={{ color: '#e9c176', fontFamily: '"Playfair Display", serif' }}>Digital Stamps</p>
            <p className="text-[10px] uppercase tracking-[0.25em] mt-0.5" style={{ color: 'rgba(233,193,118,0.4)' }}>{totalEarned} of {STAMP_CATALOG.length} earned</p>
          </div>
        </div>
        <button onClick={() => navigate('/smokecraft')}
          className="flex items-center gap-2 px-4 rounded-full active:scale-95 transition-all"
          style={{ height: 44, background: 'rgba(233,193,118,0.12)', border: '1px solid rgba(233,193,118,0.25)', color: '#e9c176' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          <span className="text-[12px] font-bold uppercase tracking-wider">Earn More</span>
        </button>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* ── What are stamps ─────────────────────────────────── */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(233,193,118,0.06)', border: '1px solid rgba(233,193,118,0.15)' }}>
          <p className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(233,193,118,0.5)' }}>What are stamps?</p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Stamps are verified digital seals you collect through craft experiences, connections, and events. Each stamp is cryptographically authenticated — a permanent record of your journey.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { icon: 'verified', label: 'Why it matters', desc: 'Proven activity unlocks VIP access and tier upgrades' },
              { icon: 'lock_open', label: 'What stamps unlock', desc: 'Priority reservations, event invites, matching priority' },
              { icon: 'trending_up', label: 'How to earn', desc: 'Complete sessions, attend events, make connections' },
            ].map(item => (
              <div key={item.label} className="rounded-lg p-3 text-center" style={{ background: 'rgba(233,193,118,0.05)', border: '1px solid rgba(233,193,118,0.1)' }}>
                <span className="material-symbols-outlined mb-1" style={{ fontSize: 18, color: '#e9c176' }}>{item.icon}</span>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#e9c176' }}>{item.label}</p>
                <p className="text-[9px] leading-snug" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Progress bar ─────────────────────────────────────── */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(26,18,8,0.8)', border: '1px solid rgba(233,193,118,0.12)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#f0e6d0' }}>{displayName}</span>
            <span className="text-[12px] font-bold" style={{ color: '#e9c176' }}>{totalEarned} / {STAMP_CATALOG.length}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #c5a059, #e9c176, #c5a059)' }} />
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {pct === 100 ? '🎉 Diamond status unlocked!' : `${STAMP_CATALOG.length - totalEarned} more stamp${STAMP_CATALOG.length - totalEarned !== 1 ? 's' : ''} to Diamond status`}
          </p>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className="flex gap-2">
          {[{ id: 'my', label: 'My Stamps' }, { id: 'all', label: 'All Stamp Types' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onTouchEnd={e => { e.currentTarget.style.transform = ''; setTab(t.id) }}
              className="flex-1 rounded-xl font-bold text-[12px] uppercase tracking-wider transition-all duration-200 active:scale-95"
              style={{
                height: 48,
                background: tab === t.id ? 'linear-gradient(135deg, #e9c176, #c5a059)' : 'rgba(233,193,118,0.07)',
                color: tab === t.id ? '#0a0805' : 'rgba(255,255,255,0.5)',
                border: tab === t.id ? 'none' : '1px solid rgba(233,193,118,0.15)',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── My Stamps grid ────────────────────────────────────── */}
        {tab === 'my' && (
          <div className="grid grid-cols-2 gap-4">
            {STAMP_CATALOG.map(stamp => (
              <StampCard
                key={stamp.id}
                stamp={stamp}
                earned={earnedIds.has(stamp.id)}
                color={STAMP_COLORS[stamp.id]}
              />
            ))}
          </div>
        )}

        {/* ── All Stamp Types guide ─────────────────────────────── */}
        {tab === 'all' && (
          <div className="space-y-3">
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              360 Passport stamps are organized into 7 categories. Each type has a unique color and ink style.
            </p>
            {ALL_STAMP_TYPES.map(type => (
              <div key={type.type} className="rounded-xl flex items-center gap-4 px-4"
                style={{ background: `${type.color}10`, border: `1px solid ${type.color}30`, minHeight: 72 }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${type.color}20`, border: `2px solid ${type.color}60` }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: type.color, ...FILL1 }}>{type.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-[13px]" style={{ color: '#f0e6d0' }}>{type.type} Stamp</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{type.desc}</p>
                </div>
                <div className="ml-auto flex-shrink-0 w-4 h-4 rounded-full" style={{ background: type.color }} />
              </div>
            ))}
          </div>
        )}

        {/* ── Passport booklet visual ────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#2a1800', border: '1px solid rgba(197,160,89,0.25)' }}>
          <div className="flex">
            {/* Left page */}
            <div className="flex-1 p-5" style={{ background: '#fdfaf3', borderRight: '2px solid rgba(0,0,0,0.1)' }}>
              <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color: 'rgba(60,45,40,0.5)' }}>Member Records · Page 36</p>
              {STAMP_CATALOG.slice(0, 4).map(stamp => {
                const earned = earnedIds.has(stamp.id)
                const c = STAMP_COLORS[stamp.id] || { ink: '#8b6914', ring: '#c5a059' }
                return (
                  <div key={stamp.id} className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ border: `2px ${earned ? 'solid' : 'dashed'} ${c.ring}`, opacity: earned ? 1 : 0.3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: earned ? c.ink : 'rgba(60,45,40,0.3)', ...(earned ? FILL1 : {}) }}>{stamp.icon}</span>
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: earned ? c.ink : 'rgba(60,45,40,0.3)' }}>{stamp.name}</span>
                  </div>
                )
              })}
            </div>
            {/* Right page */}
            <div className="flex-1 p-5" style={{ background: '#fdfaf3' }}>
              <p className="text-[9px] uppercase tracking-widest mb-3 text-right" style={{ color: 'rgba(60,45,40,0.5)' }}>Entry Log · Vol. VII</p>
              {STAMP_CATALOG.slice(4).map(stamp => {
                const earned = earnedIds.has(stamp.id)
                const c = STAMP_COLORS[stamp.id] || { ink: '#8b6914', ring: '#c5a059' }
                return (
                  <div key={stamp.id} className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ border: `2px ${earned ? 'solid' : 'dashed'} ${c.ring}`, opacity: earned ? 1 : 0.3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: earned ? c.ink : 'rgba(60,45,40,0.3)', ...(earned ? FILL1 : {}) }}>{stamp.icon}</span>
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: earned ? c.ink : 'rgba(60,45,40,0.3)' }}>{stamp.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </main>

      <PassportBottomNav active="stamps" />
    </div>
  )
}
