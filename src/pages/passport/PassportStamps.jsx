import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { STAMP_CATALOG } from '../../data/passportCatalog.js'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const GOLD_TEXT = {
  background: 'linear-gradient(135deg, #e9c176 0%, #c5a059 50%, #775a19 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  filter: 'drop-shadow(0.5px 0.5px 0px rgba(0,0,0,0.2))',
}

const PARCHMENT = {
  backgroundColor: '#fdfaf3',
  backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")',
  boxShadow: 'inset 0 0 100px rgba(0,0,0,0.05)',
}

const SPINE = {
  background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.15) 100%)',
}

function StampRect({ stamp, earned }) {
  return (
    <div
      style={{
        border: `2px ${earned ? 'solid' : 'dashed'} rgba(197,160,89,${earned ? 0.45 : 0.18})`,
        borderRadius: 8,
        padding: '18px 22px',
        background: earned ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.01)',
        transform: `rotate(${stamp.rotation}deg)`,
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 6,
        cursor: earned ? 'default' : 'not-allowed',
        opacity: earned ? 1 : 0.38,
        transition: 'filter 0.3s, transform 0.5s',
      }}
      onMouseEnter={e => { if (earned) e.currentTarget.style.filter = 'brightness(1.1) drop-shadow(0 0 10px rgba(233,193,118,0.4))' }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 34, ...GOLD_TEXT, ...(earned ? FILL1 : {}) }}>
          {stamp.icon}
        </span>
        <div>
          <div className="font-headline-md" style={{ fontSize: 17, fontWeight: 700, ...GOLD_TEXT }}>{stamp.name}</div>
          <div className="font-label-sm" style={{ color: 'rgba(60,45,40,0.6)', fontSize: 11, marginTop: 2 }}>
            {earned ? 'SmokeCraft 360 — Certified' : 'Not Yet Earned'}
          </div>
        </div>
      </div>
      <div style={{
        borderTop: '1px solid rgba(197,160,89,0.3)',
        paddingTop: 6,
        textAlign: 'center',
        fontSize: 9,
        color: 'rgba(60,45,40,0.4)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}>
        {earned ? 'Authentic Seal' : '— Locked —'}
      </div>
      {earned && (
        <div style={{
          position: 'absolute', inset: -4,
          border: '1px solid rgba(197,160,89,0.15)',
          borderRadius: 10,
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}

function StampCircle({ stamp, earned }) {
  return (
    <div
      style={{
        border: `3px ${earned ? 'double' : 'dashed'} rgba(197,160,89,${earned ? 0.45 : 0.15})`,
        borderRadius: '50%',
        width: 160,
        height: 160,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        transform: `rotate(${stamp.rotation}deg)`,
        background: earned ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.01)',
        position: 'relative',
        cursor: earned ? 'default' : 'not-allowed',
        opacity: earned ? 1 : 0.35,
        transition: 'filter 0.3s, transform 0.7s',
        padding: 16,
      }}
      onMouseEnter={e => { if (earned) e.currentTarget.style.filter = 'brightness(1.1) drop-shadow(0 0 10px rgba(233,193,118,0.4))' }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 38, marginBottom: 4, ...GOLD_TEXT, ...(earned ? FILL1 : {}) }}>
        {stamp.icon}
      </span>
      <span className="font-display-lg" style={{ fontSize: 14, lineHeight: 1.2, ...GOLD_TEXT }}>{stamp.name}</span>
      {earned && (
        <div style={{ position: 'absolute', inset: 6, border: '1px solid rgba(197,160,89,0.18)', borderRadius: '50%', pointerEvents: 'none' }} />
      )}
    </div>
  )
}

export default function PassportStamps() {
  const navigate = useNavigate()
  const { session } = useGuestSession()

  const earnedIds   = new Set((session.smokecraftStamps ?? []).map(s => s.id))
  const totalEarned = earnedIds.size
  const pct         = Math.min(100, Math.round((totalEarned / STAMP_CATALOG.length) * 100))

  const displayName = session.profile?.firstName
    ? `${session.profile.firstName} ${session.profile.lastName || ''}`.trim()
    : 'Grand Member'

  const leftStamps  = STAMP_CATALOG.slice(0, 4)
  const rightStamps = STAMP_CATALOG.slice(4)

  return (
    <div
      className="bg-surface-dim text-on-surface font-body-md overflow-x-hidden selection:bg-primary/30"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >

      {/* Top App Bar */}
      <header
        className="fixed top-0 w-full z-50 flex justify-between items-center px-gutter bg-surface-dim/80 backdrop-blur-xl border-b border-primary/20 shadow-md"
        style={{ height: 80 }}
      >
        <div className="flex items-center gap-4">
          <button
            className="material-symbols-outlined text-primary p-2 hover:bg-primary/10 active:bg-primary/20 rounded-full transition-colors duration-300"
            style={{ minWidth: 48, minHeight: 48 }}
            onClick={() => navigate('/passport')}
          >arrow_back</button>
          <h1 className="font-display-lg text-primary uppercase tracking-widest" style={{ fontSize: 20 }}>The 360 Passport</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden md:block font-label-lg text-label-lg text-primary tracking-widest uppercase">Grand Lounge</span>
          <button
            onClick={() => navigate('/passport/profile')}
            className="w-12 h-12 rounded-full border border-primary/30 overflow-hidden bg-surface-variant shadow-lg active:scale-95 duration-200 flex items-center justify-center"
          >
            {session.profile?.photo
              ? <img className="w-full h-full object-cover" src={session.profile.photo} alt="Profile" />
              : <span className="material-symbols-outlined text-primary" style={{ fontSize: 22, ...FILL1 }}>person</span>
            }
          </button>
        </div>
      </header>

      <main className="pt-28 pb-40 px-gutter flex flex-col items-center justify-start gap-10" style={{ minHeight: '100vh' }}>

        {/* Stats Header */}
        <div className="w-full max-w-6xl flex justify-between items-center">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-1">Member Records</p>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">{displayName}</h2>
          </div>
          <div className="text-right">
            <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-1">{totalEarned} of {STAMP_CATALOG.length}</p>
            <p className="font-body-md text-body-md text-on-surface-variant">Seals Earned &mdash; {pct}% complete</p>
          </div>
        </div>

        {/* Passport Booklet — stacks vertically on mobile, side-by-side on sm+ */}
        <div
          className="relative w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-hidden"
          style={{
            background: '#2a1800',
            padding: 'clamp(8px, 2vw, 32px)',
            minHeight: 540,
          }}
        >
          {/* Left Page */}
          <div
            className="relative flex-1 p-6 sm:p-8 md:p-12 overflow-hidden border-b border-black/10 sm:border-b-0 sm:border-r rounded-t-lg sm:rounded-tl-lg sm:rounded-bl-lg sm:rounded-tr-none"
            style={PARCHMENT}
          >
            <div className="absolute inset-0 pointer-events-none" style={SPINE} />
            <div className="relative z-10 flex flex-col h-full gap-6 sm:gap-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-label-sm text-label-sm uppercase tracking-widest" style={{ color: 'rgba(60,45,40,0.55)' }}>Member Records</p>
                  <h3 className="font-headline-md italic" style={{ color: '#3c2d28', fontSize: 22 }}>Networking Journey</h3>
                </div>
                <div className="select-none hidden sm:block" style={{ color: 'rgba(60,45,40,0.13)', fontFamily: 'Playfair Display', fontSize: 17, transform: 'rotate(-12deg)' }}>PAGE 36</div>
              </div>

              <div className="flex flex-col gap-6 sm:gap-8 items-start">
                {leftStamps.map(stamp => (
                  <div key={stamp.id}>
                    {stamp.shape === 'circle'
                      ? <StampCircle stamp={stamp} earned={earnedIds.has(stamp.id)} />
                      : <StampRect   stamp={stamp} earned={earnedIds.has(stamp.id)} />
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Page */}
          <div
            className="relative flex-1 p-6 sm:p-8 md:p-12 overflow-hidden border-t border-white/20 sm:border-t-0 sm:border-l rounded-b-lg sm:rounded-tr-lg sm:rounded-br-lg sm:rounded-bl-none"
            style={PARCHMENT}
          >
            <div
              className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-3xl z-20 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.1) 100%)' }}
            />
            <div className="relative z-10 flex flex-col h-full gap-6 sm:gap-8">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="font-label-sm text-label-sm uppercase tracking-widest" style={{ color: 'rgba(60,45,40,0.55)' }}>Entry Log</p>
                  <p className="font-body-md" style={{ color: 'rgba(60,45,40,0.72)' }}>Vol. VII &mdash; Elite Circuits</p>
                </div>
              </div>

              <div className="flex flex-col gap-6 sm:gap-8 items-start">
                {rightStamps.map(stamp => (
                  <div key={stamp.id}>
                    {stamp.shape === 'circle'
                      ? <StampCircle stamp={stamp} earned={earnedIds.has(stamp.id)} />
                      : <StampRect   stamp={stamp} earned={earnedIds.has(stamp.id)} />
                    }
                  </div>
                ))}
              </div>

              <div className="mt-auto flex justify-end gap-2" style={{ color: 'rgba(60,45,40,0.16)' }}>
                <span className="material-symbols-outlined">verified_user</span>
                <span className="material-symbols-outlined">history_edu</span>
              </div>
            </div>
          </div>

          {/* Parchment overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay">
            <img
              className="w-full h-full object-cover"
              src="https://www.transparenttextures.com/patterns/natural-paper.png"
              alt=""
            />
          </div>
        </div>

        {/* Legend */}
        <div className="w-full max-w-6xl flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          <div className="flex items-center gap-3">
            <div style={{ width: 20, height: 20, border: '2px solid rgba(197,160,89,0.45)', borderRadius: 3, background: 'rgba(255,255,255,0.06)' }} />
            <span className="font-label-sm text-label-sm text-on-surface-variant">Earned Seal</span>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ width: 20, height: 20, border: '2px dashed rgba(197,160,89,0.18)', borderRadius: 3, opacity: 0.4 }} />
            <span className="font-label-sm text-label-sm text-on-surface-variant">Locked</span>
          </div>
          <button
            onClick={() => navigate('/smokecraft')}
            className="flex items-center gap-2 text-primary font-label-lg text-label-lg hover:opacity-80 active:opacity-60 transition-opacity"
            style={{ minHeight: 44 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
            Earn More in SmokeCraft
          </button>
        </div>
      </main>

      {/* FAB — back to SmokeCraft to earn more stamps */}
      <button
        className="fixed z-50 w-16 h-16 rounded-full text-on-primary flex items-center justify-center active:scale-95 transition-all duration-300 group overflow-hidden"
        style={{
          right: 64,
          bottom: 128,
          background: 'linear-gradient(135deg, #e9c176, #c5a059)',
          boxShadow: '0 0 20px rgba(233,193,118,0.5)',
        }}
        onClick={() => navigate('/smokecraft')}
      >
        <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform" style={FILL1}>add</span>
      </button>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 w-full z-50 flex justify-around items-center bg-surface-container-low/95 backdrop-blur-2xl border-t border-primary/30 shadow-[0_-4px_20px_rgba(233,193,118,0.15)] rounded-t-xl"
        style={{ height: 80, paddingBottom: 4 }}
      >
        {[
          { icon: 'explore',       label: 'Explore',   to: '/',        locked: false },
          { icon: 'inventory_2',   label: 'Inventory', to: null,       locked: true  },
          { icon: 'menu_book',     label: 'Passport',  to: '/passport', active: true  },
          { icon: 'support_agent', label: 'Assistant', to: null,       locked: true  },
        ].map(({ icon, label, to, active, locked }) => (
          <button
            key={label}
            onClick={() => { if (!locked && to) navigate(to) }}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-all duration-300 ${
              locked
                ? 'text-on-surface-variant/30 cursor-not-allowed opacity-40'
                : active
                  ? 'text-primary bg-primary-container/20 rounded-xl shadow-[0_0_15px_rgba(233,193,118,0.3)] -translate-y-1'
                  : 'text-on-surface-variant/70 opacity-60 hover:text-primary hover:opacity-100 active:scale-90'
            }`}
            style={{ minHeight: 56 }}
          >
            <span className="material-symbols-outlined" style={active ? FILL1 : undefined}>{icon}</span>
            <span className="font-label-sm text-label-sm mt-0.5">{locked ? 'Soon' : label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
