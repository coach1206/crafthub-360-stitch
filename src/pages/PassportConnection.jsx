import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGuestSession } from '../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../constants/session.js'
import {
  parsePassportEntryParams,
  getVenueDisplayName,
  getEntrySourceLabel,
} from '../utils/passportEntry.js'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const TOTAL_STAMPS = 15
const RING_R = 56
const RING_CIRC = Math.round(2 * Math.PI * RING_R)

const STAMP_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCiPi_TIOFEfvgZSxUsCess2N9TlBAjCwLjuoAk_9hLbxzFRjXa39iwPd6bVTRg3HLVFhwLiDYPuOv5W9vak0mAYyRcg3MFmLBnzQV-mJJG3ADIUdtg0gm_bnqzQKDBpGCfU6_9pU5DL2Kup',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDcj9TELem3h8ECWE4_CL8RYK8-zAk21jLR3VtM1XplKYt6ZR33EXmgoktKzg7Prdn3szqk43DAgElFa_i53qG8pnKZax7zKnnlDp-ieFmVTVh0KXOsdPqtlmclZvtfG6kpMB6NaNHWuQek4pRjGj2SqwrWhiGOuNKm8IrImx3C8_2tGvo-4BvwLMf28XVWuaqyqd7vi9mSMrwslgk07HPdRoXvAvTVeV2SVE-fj-0RRktyRPBtOennDWK5yoY7NoTOhqHs_we4-FE',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCkFsx-srl59Hp0iT1IkjJvju5YMrEj3iD3Ku922Qmi3Yli5yMPgHK2pl5K-gb_Ex8kka98pk4BP8LnVool8lxfyVS6L72aXwK49Q_rHJ7LCy-uK9z9rElFOBLZawQUB9-uDcHRLNcVd9HKm77Y8gMnXvD2JqXqyBHMoCoEDoSQQ4DjAr-yim7H0',
]

function NavTab({ icon, label, active, locked, onClick }) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      className={`flex flex-col items-center gap-1 transition-all ${
        locked
          ? 'cursor-not-allowed opacity-35 text-on-surface-variant/40'
          : active
            ? 'text-primary scale-110 active:scale-90'
            : 'text-on-surface-variant/60 hover:text-primary/80 active:scale-90'
      }`}
      style={{ minHeight: 56 }}
    >
      <span className="material-symbols-outlined" style={active ? FILL1 : undefined}>{icon}</span>
      <span className="font-label-sm text-label-sm">{locked ? 'Soon' : label}</span>
    </button>
  )
}

export default function PassportConnection() {
  const navigate = useNavigate()
  const [searchParams]  = useSearchParams()
  const { session, startPassportEntry, refreshLastActive } = useGuestSession()
  const bgRef            = useRef(null)
  const entryInitRef     = useRef(false)

  // ── Capture QR / kiosk entry params on mount (or when URL params change) ──
  useEffect(() => {
    if (entryInitRef.current) return
    entryInitRef.current = true
    const params = parsePassportEntryParams(searchParams)
    if (params.venueId || params.deviceId || params.entrySource) {
      startPassportEntry(params)
    }
    refreshLastActive()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stamps    = session.smokecraftStamps ?? []
  const xp        = session.xp ?? 0
  const rank      = getRankFromXP(xp)
  const pct       = Math.min(100, Math.round((stamps.length / TOTAL_STAMPS) * 100))
  const offset    = RING_CIRC * (1 - pct / 100)

  const displayName = session.profile?.firstName
    ? `${session.profile.firstName} ${session.profile.lastName || ''}`.trim()
    : 'Grand Member'

  const venueLabel       = getVenueDisplayName(session.venueId)
  const entryLabel       = getEntrySourceLabel(session.entrySource)
  const profileStatusTxt = session.profileComplete ? 'Complete' : 'Needs Info'

  useEffect(() => {
    function handleMove(e) {
      if (!bgRef.current) return
      const x = (window.innerWidth  / 2 - e.pageX) / 100
      const y = (window.innerHeight / 2 - e.pageY) / 100
      bgRef.current.style.transform = `translate(${x}px, ${y}px) scale(1.1)`
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  const profilePhoto = session.profile?.photo
  const initials = `${session.profile?.firstName?.[0] || 'G'}${session.profile?.lastName?.[0] || 'M'}`

  return (
    <div className="bg-background text-on-surface font-body-md h-screen overflow-hidden select-none">

      {/* Parallax background */}
      <div className="fixed inset-0 z-0 scale-110 overflow-hidden">
        <div
          ref={bgRef}
          className="w-full h-full"
          style={{ transition: 'transform 0.1s ease-out' }}
        >
          <img
            alt="Lounge Interior"
            className="w-full h-full object-cover"
            style={{ opacity: 0.55, filter: 'brightness(0.5)' }}
            src="https://lh3.googleusercontent.com/aida/AP1WRLtj5JwkrPxrixCHOG-zYc0I132qSqfPBoOMSk6vfHero4WAiBipQc-lZT7hXU1GpL6px8LH9kYjGodZhH3N8nj4PPbYOxr9GAZPkrO0051iTZg7S8ugdj8Jjhb1Nk1ypTQVWHqE6FAxbE10qnVi4vZsWlx-ERtDmWU97juw1txqVGwGBCCyPBZ0d56Ipsq-2AoFCMCvEkr3KBKpxovN6AFO6VxoRAIzzw3xk5lxCphgeEU6xTGCqGzLaag"
          />
        </div>
      </div>

      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-xl border-b border-primary/10 shadow-sm flex justify-between items-center px-card-padding" style={{ height: 80 }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="material-symbols-outlined text-primary p-2 hover:bg-primary/10 transition-colors rounded-full active:scale-95 flex-shrink-0">arrow_back</button>
          <div className="w-12 h-12 rounded-full border border-primary/30 p-0.5 overflow-hidden flex-shrink-0">
            {profilePhoto
              ? <img className="w-full h-full object-cover rounded-full" src={profilePhoto} alt="Profile" />
              : (
                <div className="w-full h-full rounded-full flex items-center justify-center text-on-primary font-bold"
                  style={{ background: 'linear-gradient(135deg, #e9c176, #c5a059)', fontSize: 16 }}>
                  {initials}
                </div>
              )
            }
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-primary tracking-tighter leading-none">The Lounge</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-[0.2em]">Passport Hub</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="block font-label-sm text-label-sm text-primary uppercase">{xp.toLocaleString()} XP</span>
            <span className="block font-label-sm text-label-sm text-on-surface-variant">{rank.name} Tier</span>
          </div>
          <button
            className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:opacity-80 transition-opacity active:scale-95 duration-300"
            style={{ minWidth: 48, minHeight: 48 }}
            onClick={() => navigate('/passport/profile')}
          >
            <span className="material-symbols-outlined">manage_accounts</span>
          </button>
        </div>
      </header>

      {/* Main scroll canvas */}
      <main
        className="relative z-10 pt-28 pb-24 px-12 h-full flex flex-col max-w-[1440px] mx-auto overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >

        {/* Welcome Hero */}
        <section className="mb-10" style={{ animation: 'fadeUp 0.8s ease both' }}>
          <h1 className="font-display-lg text-primary leading-tight mb-2" style={{ fontSize: 'clamp(32px, 5vw, 64px)', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            Welcome back, {displayName}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-5">
            Your journey through the world&apos;s finest collections continues. Explore your digital portfolio and upcoming artisan events.
          </p>

          {/* Session Identity Status — subtle, premium */}
          <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary/70" style={{ fontSize: 13 }}>location_on</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant/60 uppercase tracking-widest" style={{ fontSize: 11 }}>
                {venueLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary/70" style={{ fontSize: 13 }}>qr_code_scanner</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant/60 uppercase tracking-widest" style={{ fontSize: 11 }}>
                Entry: {entryLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block rounded-full"
                style={{ width: 6, height: 6, background: '#e9c176', boxShadow: '0 0 6px rgba(233,193,118,0.7)', flexShrink: 0 }}
              />
              <span className="font-label-sm text-label-sm text-primary/70 uppercase tracking-widest" style={{ fontSize: 11 }}>
                Passport Session Active
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 13, color: session.profileComplete ? '#e9c176' : 'rgba(255,255,255,0.25)' }}
              >
                {session.profileComplete ? 'check_circle' : 'pending'}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant/60 uppercase tracking-widest" style={{ fontSize: 11 }}>
                Profile: {profileStatusTxt}
              </span>
            </div>
          </div>
        </section>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-8 mb-12 flex-grow">

          {/* Passport Progress Panel */}
          <div
            className="col-span-12 md:col-span-5 rounded-xl p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            style={{
              background: 'rgba(14,9,3,0.55)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(212,175,55,0.22)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.07)',
              height: 400,
              transition: 'border-color 0.5s',
            }}
            onClick={() => navigate('/passport/stamps')}
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl transition-colors pointer-events-none"
              style={{ background: 'rgba(233,193,118,0.06)' }} />
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="material-symbols-outlined text-primary text-4xl" style={FILL1}>menu_book</span>
                <span className="font-label-lg text-label-lg text-primary bg-primary/10 px-4 py-1 rounded-full">Season 01</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Passport Progress</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8">
                {stamps.length > 0
                  ? `You've collected ${stamps.length} artisanal seal${stamps.length !== 1 ? 's' : ''} this season.${stamps.length < TOTAL_STAMPS ? ` ${TOTAL_STAMPS - stamps.length} more to reach Diamond status.` : ' Diamond status unlocked!'}`
                  : 'Complete SmokeCraft sessions to earn artisanal seals and unlock Diamond status.'
                }
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="font-display-lg text-primary leading-none" style={{ fontSize: 52 }}>{stamps.length}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-2">Stamps Earned</span>
                </div>
                <div className="relative" style={{ width: 128, height: 128 }}>
                  <svg className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="64" cy="64" r={RING_R} fill="transparent" stroke="rgba(233,193,118,0.12)" strokeWidth="4" />
                    <circle
                      cx="64" cy="64" r={RING_R}
                      fill="transparent"
                      stroke="#e9c176"
                      strokeWidth="4"
                      strokeDasharray={RING_CIRC}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-headline-md text-headline-md text-primary">{pct}%</span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/passport/stamps') }}
                className="w-full flex items-center justify-center gap-3 text-on-primary font-label-lg text-label-lg uppercase tracking-[0.2em] rounded-lg active:scale-95 transition-all"
                style={{
                  height: 72,
                  background: 'linear-gradient(135deg, #e9c176, #c5a059)',
                  boxShadow: '0 4px 20px rgba(233,193,118,0.3)',
                }}
              >
                View All Stamps
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Nav Tiles 2×2 */}
          <div className="col-span-12 md:col-span-7 grid grid-cols-2 gap-8" style={{ height: 400 }}>
            {[
              { icon: 'person',     title: 'My Profile',        sub: 'Preferences & Tastes',  to: '/passport/profile', locked: false },
              { icon: 'qr_code_2',  title: 'Digital Stamps',    sub: 'Verification Center',   to: '/passport/stamps',  locked: false },
              { icon: 'storefront', title: 'Artisan Directory',  sub: 'Exclusive Partners',    to: null,                locked: true  },
              { icon: 'hub',        title: 'Connections',        sub: 'Member Network',        to: null,                locked: true  },
            ].map(({ icon, title, sub, to, locked }) => (
              <div
                key={title}
                className={`rounded-xl p-8 flex flex-col justify-between transition-all ${locked ? 'cursor-not-allowed opacity-50' : 'group active:scale-95 cursor-pointer'}`}
                style={{
                  background: 'rgba(14,9,3,0.52)',
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  border: '1px solid rgba(212,175,55,0.18)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(212,175,55,0.06)',
                }}
                onClick={() => { if (!locked && to) navigate(to) }}
              >
                <div className="flex justify-between items-start">
                  <span className={`material-symbols-outlined text-3xl transition-transform ${locked ? 'text-on-surface-variant/40' : 'text-primary group-hover:scale-110'}`}>{icon}</span>
                  {locked && <span className="material-symbols-outlined text-on-surface-variant/30" style={{ fontSize: 16 }}>lock</span>}
                </div>
                <div>
                  <h3 className={`font-headline-md text-headline-md ${locked ? 'text-on-surface/40' : 'text-on-surface'}`}>{title}</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{locked ? 'Coming Soon' : sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Achievements Scroller */}
        <section className="mb-24">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-lg text-headline-lg text-on-surface">Recent Achievements</h3>
            <button
              className="text-primary font-label-lg text-label-lg flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={() => navigate('/passport/stamps')}
            >
              Full History <span className="material-symbols-outlined">history</span>
            </button>
          </div>
          <div
            className="flex gap-8 pb-8 px-2 -mx-2"
            style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {stamps.length > 0
              ? stamps.map((stamp, i) => (
                <div
                  key={stamp.id}
                  className="rounded-xl overflow-hidden group cursor-pointer transition-all"
                  style={{
                    minWidth: 380,
                    background: 'rgba(19,19,20,0.4)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(233,193,118,0.12)',
                  }}
                  onClick={() => navigate('/passport/stamps')}
                >
                  <div className="relative overflow-hidden" style={{ height: 192 }}>
                    <img
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      src={STAMP_IMAGES[i % STAMP_IMAGES.length]}
                      alt={stamp.name}
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #131314, transparent)' }} />
                    <div className="absolute bottom-4 left-6">
                      <span
                        className="font-label-sm text-label-sm text-primary uppercase tracking-[0.2em] px-3 py-1 rounded"
                        style={{ background: 'rgba(19,19,20,0.8)', backdropFilter: 'blur(4px)' }}
                      >
                        {new Date(stamp.earnedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-headline-md text-headline-md text-on-surface mb-2">{stamp.name}</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant">SmokeCraft 360 seal authenticated and recorded.</p>
                  </div>
                </div>
              ))
              : (
                [
                  { title: 'Master Blend Challenge', sub: 'Authenticated at the Havana Room. Achievement unlocked.', when: 'Complete SmokeCraft' },
                  { title: 'Seed & Soil',             sub: 'Origins heritage tour completed. Exclusive badge awarded.',  when: 'Complete Origins' },
                  { title: "The Alchemist's Pour",    sub: 'Mixology masterclass participation. Signature cocktail verified.', when: 'Complete Pairing' },
                ].map((c, i) => (
                  <div
                    key={c.title}
                    className="rounded-xl overflow-hidden group cursor-pointer transition-all"
                    style={{ minWidth: 380, background: 'rgba(19,19,20,0.4)', backdropFilter: 'blur(24px)', border: '1px solid rgba(233,193,118,0.08)', opacity: 0.6 }}
                    onClick={() => navigate('/smokecraft')}
                  >
                    <div className="relative overflow-hidden" style={{ height: 192 }}>
                      <img className="w-full h-full object-cover" style={{ filter: 'grayscale(0.6)' }} src={STAMP_IMAGES[i]} alt={c.title} />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #131314, transparent)' }} />
                      <div className="absolute bottom-4 left-6">
                        <span className="font-label-sm text-label-sm text-primary uppercase tracking-[0.2em] px-3 py-1 rounded"
                          style={{ background: 'rgba(19,19,20,0.8)' }}>{c.when}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="font-headline-md text-headline-md text-on-surface mb-2">{c.title}</h4>
                      <p className="font-body-md text-body-md text-on-surface-variant">{c.sub}</p>
                    </div>
                  </div>
                ))
              )
            }
          </div>
        </section>
      </main>

      {/* AI Concierge FAB */}
      <div className="fixed z-[60]" style={{ bottom: 96, right: 32 }}>
        <button
          className="flex items-center justify-center text-on-primary shadow-2xl hover:scale-110 active:scale-90 transition-transform group relative rounded-full"
          style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, #e9c176, #c5a059)',
            boxShadow: '0 4px 20px rgba(233,193,118,0.3)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 30 }}>smart_toy</span>
          <div
            className="absolute right-full mr-4 border border-primary/20 px-4 py-2 rounded-lg font-label-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ background: 'rgba(19,19,20,0.8)', backdropFilter: 'blur(8px)', color: '#e9c176', fontSize: 12 }}
          >
            AI Concierge Available
          </div>
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 w-full z-50 backdrop-blur-2xl border-t border-primary/20 shadow-[0_-4px_24px_rgba(233,193,118,0.1)] rounded-t-xl flex justify-around items-center px-8"
        style={{ background: 'rgba(14,14,15,0.8)', height: 80, paddingBottom: 16 }}
      >
        <NavTab icon="dashboard"                      label="Hub"      active onClick={() => navigate('/passport')} />
        <NavTab icon="menu_book"                      label="Passport" onClick={() => navigate('/passport/stamps')} />
        <NavTab icon="temp_preferences_custom"        label="Artisans" locked onClick={() => {}} />
        <NavTab icon="settings_accessibility"         label="Settings" onClick={() => navigate('/passport/profile')} />
      </nav>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
