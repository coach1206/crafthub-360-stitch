import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../../constants/session.js'
import { STAMP_CATALOG } from '../../data/passportCatalog.js'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const PROFILE_FIELDS = [
  { icon: 'work',          label: 'Profession',   key: 'profession',  placeholder: 'e.g. Entrepreneur, Executive…' },
  { icon: 'location_on',   label: 'City',         key: 'city',        placeholder: 'e.g. Atlanta, GA'             },
  { icon: 'interests',     label: 'Interests',    key: 'interests',   placeholder: 'e.g. Cigars, Bourbon, Art…'   },
  { icon: 'lightbulb',     label: 'Looking For',  key: 'lookingFor',  placeholder: 'e.g. Investors, Collaborators' },
  { icon: 'emoji_objects', label: 'Offering',     key: 'offering',    placeholder: 'e.g. Mentorship, Introductions' },
]

export default function PassportProfile() {
  const navigate = useNavigate()
  const { session } = useGuestSession()
  const [shared, setShared] = useState(false)

  const stamps   = session.smokecraftStamps ?? []
  const xp       = session.xp ?? 0
  const rank     = getRankFromXP(xp)

  const displayName  = session.profile?.firstName
    ? `${session.profile.firstName} ${session.profile.lastName || ''}`.trim()
    : 'Grand Member'
  const initials     = `${session.profile?.firstName?.[0] || 'G'}${session.profile?.lastName?.[0] || 'M'}`
  const profilePhoto = session.profile?.photo
  const memberSince  = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const TIER_COLORS = {
    Novice: '#c5a059', Bronze: '#cd7f32', Silver: '#c0c0c0', Gold: '#e9c176', Diamond: '#4fc3f7',
  }
  const tierColor = TIER_COLORS[rank.name] || '#e9c176'

  return (
    <div className="min-h-screen font-body-md pb-28 text-on-surface overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #0a0805 0%, #1a1208 40%, #0a0805 100%)' }}>

      {/* Leather texture overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/leather.png)' }} />

      {/* Gold ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px]" style={{ background: 'rgba(233,193,118,0.07)' }} />
      </div>

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-5 backdrop-blur-xl border-b"
        style={{ height: 72, background: 'rgba(10,8,5,0.9)', borderColor: 'rgba(233,193,118,0.15)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/passport')} className="material-symbols-outlined p-2 rounded-full active:bg-primary/10 transition-colors"
            style={{ color: '#e9c176', minWidth: 44, minHeight: 44 }}>arrow_back</button>
          <div>
            <p className="font-bold text-[15px] leading-none" style={{ color: '#e9c176', fontFamily: '"Playfair Display", serif' }}>Identity Page</p>
            <p className="text-[10px] uppercase tracking-[0.25em] mt-0.5" style={{ color: 'rgba(233,193,118,0.4)' }}>360 Passport Connection</p>
          </div>
        </div>
        <button onClick={() => { setShared(true); setTimeout(() => setShared(false), 2500) }}
          className="flex items-center gap-2 px-4 rounded-full active:scale-95 transition-all"
          style={{ height: 44, background: shared ? 'rgba(76,175,80,0.2)' : 'rgba(233,193,118,0.12)', border: `1px solid ${shared ? 'rgba(76,175,80,0.4)' : 'rgba(233,193,118,0.3)'}`, color: shared ? '#4caf50' : '#e9c176' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{shared ? 'check' : 'share'}</span>
          <span className="text-[12px] font-bold uppercase tracking-wider">{shared ? 'Shared!' : 'Share'}</span>
        </button>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* ── What this page does ─────────────────────────────── */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(233,193,118,0.06)', border: '1px solid rgba(233,193,118,0.15)' }}>
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(233,193,118,0.5)' }}>How your profile helps you</p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            A complete profile improves your match quality, helps others find you in the Directory, and unlocks higher-tier connection recommendations.
          </p>
        </div>

        {/* ── Passport Identity Card ─────────────────────────── */}
        <div className="rounded-2xl overflow-hidden relative"
          style={{ background: 'linear-gradient(145deg, #1a1208, #2a1c10)', border: '1px solid rgba(233,193,118,0.25)', boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }}>

          {/* Gold foil header strip */}
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${tierColor}, #c5a059, ${tierColor})` }} />

          <div className="p-6">
            {/* ID page header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[9px] uppercase tracking-[0.35em]" style={{ color: 'rgba(233,193,118,0.4)' }}>United States of Craft</p>
                <p className="text-[9px] uppercase tracking-[0.35em]" style={{ color: 'rgba(233,193,118,0.4)' }}>360 Passport Connection</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: 'rgba(233,193,118,0.4)' }}>Member Since</p>
                <p className="text-[10px] font-bold" style={{ color: tierColor }}>{memberSince}</p>
              </div>
            </div>

            {/* Portrait + identity */}
            <div className="flex gap-5 mb-6">
              <div className="flex-shrink-0">
                <div className="rounded-xl overflow-hidden" style={{ width: 96, height: 120, border: `2px solid ${tierColor}40` }}>
                  {profilePhoto
                    ? <img src={profilePhoto} alt={displayName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(233,193,118,0.15), rgba(197,160,89,0.05))', fontFamily: '"Playfair Display", serif', fontSize: 36, color: '#e9c176', fontWeight: 700 }}>
                        {initials}
                      </div>
                  }
                </div>
                <div className="mt-2 rounded px-2 py-1 text-center" style={{ background: `${tierColor}20`, border: `1px solid ${tierColor}40` }}>
                  <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: tierColor }}>{rank.name}</p>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-2xl leading-tight mb-1" style={{ fontFamily: '"Playfair Display", serif', color: '#f0e6d0' }}>{displayName}</h1>
                <p className="text-[11px] uppercase tracking-wider mb-3" style={{ color: 'rgba(233,193,118,0.5)' }}>{session.profile?.profession || 'Member · Grand Lounge'}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {[rank.name, session.profile?.city || 'The Grand Lounge', 'SmokeCraft 360'].map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider"
                      style={{ background: 'rgba(233,193,118,0.08)', border: '1px solid rgba(233,193,118,0.18)', color: 'rgba(255,255,255,0.55)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4" style={{ borderTop: '1px solid rgba(233,193,118,0.1)', paddingTop: 16 }}>
              {[
                { val: xp.toLocaleString(), label: 'Total XP' },
                { val: stamps.length,       label: 'Stamps'   },
                { val: rank.name,           label: 'Tier'     },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <p className="font-bold text-lg leading-none" style={{ color: tierColor, fontFamily: '"Playfair Display", serif' }}>{val}</p>
                  <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Machine-readable strip */}
            <div className="rounded px-3 py-2 mt-2" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(233,193,118,0.08)' }}>
              <p className="text-[9px] tracking-[0.15em] font-mono" style={{ color: 'rgba(233,193,118,0.25)' }}>
                PP-360-{session.profile?.firstName?.toUpperCase() || 'GRAND'}&lt;&lt;MEMBER&lt;&lt;{rank.name?.toUpperCase()}&lt;&lt;NOVEE-OS
              </p>
            </div>
          </div>
        </div>

        {/* ── Profile Fields ─────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(26,18,8,0.8)', border: '1px solid rgba(233,193,118,0.15)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(233,193,118,0.08)' }}>
            <p className="font-bold text-[14px]" style={{ color: '#e9c176', fontFamily: '"Playfair Display", serif' }}>Your Passport Details</p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Tap any field to update your information</p>
          </div>
          <div className="divide-y" style={{ '--tw-divide-color': 'rgba(233,193,118,0.06)' }}>
            {PROFILE_FIELDS.map(field => {
              const val = session.profile?.[field.key]
              return (
                <div key={field.key} className="flex items-center gap-4 px-5 active:bg-white/5 transition-colors" style={{ minHeight: 64 }}>
                  <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 20, color: 'rgba(233,193,118,0.5)' }}>{field.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{field.label}</p>
                    <p className="text-[14px] mt-0.5 truncate" style={{ color: val ? '#f0e6d0' : 'rgba(255,255,255,0.2)' }}>
                      {val || field.placeholder}
                    </p>
                  </div>
                  <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18, color: 'rgba(233,193,118,0.25)' }}>edit</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Earned Seals ───────────────────────────────────── */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'rgba(233,193,118,0.4)' }}>Earned Stamps · Seals of Craft</p>
          {stamps.length > 0
            ? (
              <div className="grid grid-cols-2 gap-3">
                {stamps.map(stamp => {
                  const meta = STAMP_CATALOG.find(c => c.id === stamp.id) || stamp
                  return (
                    <div key={stamp.id} className="rounded-xl p-4 flex items-center gap-3"
                      style={{ background: 'rgba(233,193,118,0.06)', border: '1px solid rgba(233,193,118,0.18)' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(233,193,118,0.12)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#e9c176', ...FILL1 }}>{meta.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[13px] truncate" style={{ color: '#f0e6d0' }}>{meta.name}</p>
                        <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'rgba(233,193,118,0.5)' }}>Verified</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
            : (
              <div className="rounded-xl p-8 flex flex-col items-center text-center"
                style={{ background: 'rgba(233,193,118,0.03)', border: '1px dashed rgba(233,193,118,0.1)' }}>
                <span className="material-symbols-outlined mb-3" style={{ fontSize: 40, color: 'rgba(233,193,118,0.2)' }}>workspace_premium</span>
                <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No stamps yet — complete SmokeCraft to earn your first seal.</p>
                <button onClick={() => navigate('/smokecraft')}
                  className="mt-4 px-6 rounded-full active:scale-95 transition-all font-bold text-[12px] uppercase tracking-wider"
                  style={{ height: 48, background: 'rgba(233,193,118,0.1)', border: '1px solid rgba(233,193,118,0.25)', color: '#e9c176' }}>
                  Begin SmokeCraft
                </button>
              </div>
            )
          }
        </div>

        {/* ── QR Share ───────────────────────────────────────── */}
        <div className="rounded-2xl p-5 flex items-center gap-5"
          style={{ background: 'rgba(26,18,8,0.8)', border: '1px solid rgba(233,193,118,0.2)' }}>
          <div className="flex-shrink-0 rounded-xl p-3 bg-white" style={{ width: 72, height: 72 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#0a0805', ...FILL1 }}>qr_code_2</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-[14px]" style={{ color: '#e9c176' }}>Public Profile QR</p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Let others scan to view your profile and request a connection.</p>
          </div>
          <button onClick={() => { setShared(true); setTimeout(() => setShared(false), 2500) }}
            className="flex-shrink-0 flex items-center gap-2 rounded-xl active:scale-95 transition-all px-4"
            style={{ height: 64, background: 'linear-gradient(135deg, #e9c176, #c5a059)', color: '#0a0805', fontWeight: 700 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{shared ? 'check' : 'share'}</span>
            <span className="text-[12px] uppercase tracking-wider">{shared ? 'Done' : 'Share'}</span>
          </button>
        </div>

      </main>

      <PassportBottomNav active="profile" />
    </div>
  )
}
