import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../../constants/session.js'
import { STAMP_CATALOG } from '../../data/passportCatalog.js'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const GOLD_FOIL_BORDER = {
  border: '1px solid transparent',
  background: 'linear-gradient(#1f1f20, #1f1f20) padding-box, linear-gradient(to right, #e9c176, #ffb95a) border-box',
}

const GLASS_PANEL = {
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  background: 'rgba(31,31,32,0.6)',
  border: '1px solid rgba(233,193,118,0.15)',
}

function SealCard({ stamp }) {
  const meta = STAMP_CATALOG.find(c => c.id === stamp.id) || { name: stamp.name, icon: stamp.icon, desc: 'Certified craft achievement.' }
  return (
    <div
      className="p-6 rounded-xl flex flex-col items-center text-center group backdrop-blur-xl"
      style={{
        ...GLASS_PANEL,
        ...GOLD_FOIL_BORDER,
        boxShadow: '0 0 20px rgba(233,193,118,0.08)',
        transition: 'all 0.3s ease',
        cursor: 'default',
      }}
    >
      <div
        className="w-20 h-20 mb-4 flex items-center justify-center rounded-full border border-primary/30 group-hover:bg-primary/20 transition-all"
        style={{ background: 'rgba(233,193,118,0.1)' }}
      >
        <span className="material-symbols-outlined text-primary" style={{ ...FILL1, fontSize: 40 }}>{meta.icon}</span>
      </div>
      <h3 className="font-headline-md text-primary mb-2" style={{ fontSize: 18 }}>{meta.name}</h3>
      <p className="font-label-sm text-label-sm text-on-surface-variant/70">{meta.desc}</p>
    </div>
  )
}

function EmptySealSlot() {
  return (
    <div
      className="p-6 rounded-xl flex flex-col items-center text-center"
      style={{ ...GLASS_PANEL, opacity: 0.4, minHeight: 200 }}
    >
      <div className="w-20 h-20 mb-4 flex items-center justify-center rounded-full border border-primary/10" style={{ background: 'rgba(233,193,118,0.04)' }}>
        <span className="material-symbols-outlined text-on-surface-variant/30" style={{ fontSize: 40 }}>lock</span>
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant/40">Seal Locked</p>
    </div>
  )
}

export default function PassportProfile() {
  const navigate = useNavigate()
  const { session } = useGuestSession()
  const [shared, setShared] = useState(false)

  const stamps = session.smokecraftStamps ?? []
  const xp     = session.xp ?? 0
  const rank   = getRankFromXP(xp)

  const displayName = session.profile?.firstName
    ? `${session.profile.firstName} ${session.profile.lastName || ''}`.trim()
    : 'Grand Member'

  const initials     = `${session.profile?.firstName?.[0] || 'G'}${session.profile?.lastName?.[0] || 'M'}`
  const profilePhoto = session.profile?.photo

  const interests = [
    session.profile?.city ? session.profile.city : 'Reserve Cigars',
    rank.name === 'Novice' ? 'Emerging Connoisseur' : rank.name,
    'SmokeCraft 360',
  ]

  function handleShare() {
    setShared(true)
    setTimeout(() => setShared(false), 2500)
  }

  const earnedSeals = stamps
  const emptySlots  = Math.max(0, 3 - earnedSeals.length)

  return (
    <div
      className="text-on-surface font-body-md min-h-screen pb-32"
      style={{
        background: 'radial-gradient(circle at center, #261900 0%, #131314 100%)',
        backgroundImage: 'linear-gradient(rgba(19,19,20,0.8), rgba(19,19,20,0.8)), url(https://www.transparenttextures.com/patterns/leather.png)',
      }}
    >

      {/* Top Navigation */}
      <nav
        className="fixed top-0 w-full z-50 flex justify-between items-center px-gutter py-4 bg-surface-dim/80 backdrop-blur-xl border-b border-primary/20 shadow-md"
        style={{ height: 72 }}
      >
        <div className="flex items-center gap-4">
          <button
            className="material-symbols-outlined text-primary hover:bg-primary/10 active:bg-primary/20 p-2 rounded-full transition-colors duration-300"
            style={{ minWidth: 48, minHeight: 48 }}
            onClick={() => navigate('/passport')}
          >arrow_back</button>
          <span className="font-display-lg text-primary uppercase tracking-widest" style={{ fontSize: 20, lineHeight: 1 }}>The 360 Passport</span>
        </div>
        <button
          className="font-label-lg text-label-lg text-primary px-6 py-3 border border-primary/30 rounded-full hover:bg-primary/10 active:bg-primary/20 transition-all duration-300"
          style={{ minHeight: 48 }}
          onClick={() => navigate('/passport')}
        >Grand Lounge</button>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto pt-32 px-gutter lg:px-margin">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">

          {/* Left Column: Profile Card */}
          <aside className="lg:col-span-4 lg:sticky" style={{ top: 128 }}>
            <div
              className="rounded-xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group"
              style={GLASS_PANEL}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              {/* Avatar */}
              <div className="relative mb-8" style={{ width: 192, height: 192 }}>
                <div className="absolute inset-0 rounded-full border-2 border-primary/30" style={{ animation: 'pulse 2.5s ease-in-out infinite' }} />
                {profilePhoto
                  ? <img src={profilePhoto} alt={displayName} className="w-full h-full object-cover rounded-full border-4 border-primary/10 p-1" />
                  : (
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center border-4 border-primary/10 p-1"
                      style={{ background: 'linear-gradient(135deg, rgba(233,193,118,0.2), rgba(197,160,89,0.08))', fontSize: 56, fontFamily: 'Playfair Display', color: '#e9c176', fontWeight: 700 }}
                    >{initials}</div>
                  )
                }
              </div>

              <h1 className="font-headline-xl text-primary mb-2" style={{ fontSize: 32, lineHeight: 1.2 }}>{displayName}</h1>
              <p className="font-label-lg text-label-lg uppercase tracking-[0.2em] mb-6" style={{ color: '#ffb95a' }}>
                {rank.name} Member
              </p>

              {/* Interest Tags */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {interests.map(tag => (
                  <span key={tag} className="px-4 py-1.5 rounded-full font-label-sm text-label-sm text-on-surface-variant/80" style={GLASS_PANEL}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="w-full space-y-4">
                <div className="flex justify-between items-center p-4 rounded-lg" style={GLASS_PANEL}>
                  <span className="font-label-lg text-label-lg text-on-surface-variant">Total XP</span>
                  <span className="font-headline-md text-primary" style={{ fontSize: 20 }}>{xp.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg" style={GLASS_PANEL}>
                  <span className="font-label-lg text-label-lg text-on-surface-variant">Passport Tier</span>
                  <span className="font-headline-md text-primary" style={{ fontSize: 20 }}>{rank.name}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg" style={GOLD_FOIL_BORDER}>
                  <span className="font-label-lg text-label-lg text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified</span>
                    SmokeCraft Verified
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                    {stamps.length} Seal{stamps.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column */}
          <section className="lg:col-span-8 space-y-gutter">

            {/* Legacy Narrative */}
            <div
              className="rounded-xl p-10 relative overflow-hidden"
              style={{
                ...GLASS_PANEL,
                backgroundImage: 'url(https://www.transparenttextures.com/patterns/leather.png)',
                backgroundBlendMode: 'soft-light',
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(233,193,118,0.05)' }} />
              <h2 className="font-headline-lg text-headline-lg text-primary mb-6 flex items-center gap-3" style={{ fontSize: 26 }}>
                <span className="material-symbols-outlined text-secondary">history_edu</span>
                The Legacy Narrative
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-6">
                {displayName} is a distinguished connoisseur of rare craft experiences, navigating the intersection of traditional artisanship and modern luxury through the 360 SmokeCraft curriculum.
              </p>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Bearing a {rank.name} tier ranking with {xp.toLocaleString()} XP earned across {stamps.length} certified seal{stamps.length !== 1 ? 's' : ''}, their passport represents a growing record of authentic craft mastery — from tobacco origins to pairing expertise and beyond.
              </p>
            </div>

            {/* Earned Seals of Craft */}
            <div className="space-y-6">
              <h2 className="font-headline-lg text-headline-lg text-primary flex items-center gap-3 px-2" style={{ fontSize: 26 }}>
                <span className="material-symbols-outlined text-secondary">verified_user</span>
                Earned Seals of Craft
              </h2>
              {stamps.length > 0
                ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {earnedSeals.map(s => <SealCard key={s.id} stamp={s} />)}
                    {Array.from({ length: emptySlots }).map((_, i) => <EmptySealSlot key={`empty-${i}`} />)}
                  </div>
                )
                : (
                  <div className="rounded-xl p-12 flex flex-col items-center text-center" style={GLASS_PANEL}>
                    <span className="material-symbols-outlined text-on-surface-variant/30 mb-4" style={{ fontSize: 48 }}>workspace_premium</span>
                    <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">No seals earned yet.</p>
                    <button
                      onClick={() => navigate('/smokecraft')}
                      className="flex items-center gap-2 text-primary font-label-lg text-label-lg border border-primary/30 px-8 rounded-full hover:bg-primary/10 active:bg-primary/20 transition-all"
                      style={{ minHeight: 56 }}
                    >
                      Begin SmokeCraft
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </div>
                )
              }
            </div>

            {/* QR / Share Footer */}
            <div
              className="flex flex-col md:flex-row items-center justify-between gap-6 py-12 px-8 rounded-xl"
              style={{ ...GLASS_PANEL, ...GOLD_FOIL_BORDER }}
            >
              <div className="flex items-center gap-6">
                <div className="bg-white p-2 rounded-lg shadow-inner flex-shrink-0">
                  <div
                    className="w-24 h-24 flex items-center justify-center rounded border-4 border-background overflow-hidden"
                    style={{ background: '#131314' }}
                  >
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 64, ...FILL1 }}>qr_code_2</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-headline-md text-primary" style={{ fontSize: 20 }}>Public Profile Access</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">Valid for 24 hours of guest access to your Curatorial Portfolio.</p>
                </div>
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-3 text-on-primary font-label-lg text-label-lg px-8 rounded-full hover:scale-105 active:scale-95 transition-all duration-300 flex-shrink-0"
                style={{
                  height: 72,
                  background: shared ? 'linear-gradient(135deg, #ffb95a, #c68315)' : 'linear-gradient(135deg, #e9c176, #c5a059)',
                  boxShadow: '0 4px 20px rgba(233,193,118,0.4)',
                  minWidth: 200,
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={FILL1}>{shared ? 'check_circle' : 'share'}</span>
                {shared ? 'Copied Link' : 'Share QR Passport'}
              </button>
            </div>

          </section>
        </div>
      </main>

      {/* Bottom Nav (mobile only) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-margin bg-surface-container-low/95 backdrop-blur-2xl border-t border-primary/30 shadow-[0_-4px_20px_rgba(233,193,118,0.15)] rounded-t-xl" style={{ height: 80 }}>
        {[
          { icon: 'explore',       label: 'Explore',   to: '/',        locked: false },
          { icon: 'inventory_2',   label: 'Inventory', to: null,       locked: true  },
          { icon: 'menu_book',     label: 'Passport',  to: '/passport', active: true  },
          { icon: 'support_agent', label: 'Assistant', to: null,       locked: true  },
        ].map(({ icon, label, to, active, locked }) => (
          <button
            key={label}
            onClick={() => { if (!locked && to) navigate(to) }}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-all ${
              locked
                ? 'cursor-not-allowed opacity-30'
                : active
                  ? 'text-primary bg-primary-container/20 rounded-xl shadow-[0_0_15px_rgba(233,193,118,0.3)] -translate-y-1'
                  : 'text-on-surface-variant/70 opacity-60 active:scale-90'
            }`}
            style={{ minHeight: 56 }}
          >
            <span className="material-symbols-outlined" style={{ ...(active ? FILL1 : {}), fontSize: 22 }}>{icon}</span>
            <span className="font-label-sm text-label-sm mt-1">{locked ? 'Soon' : label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
