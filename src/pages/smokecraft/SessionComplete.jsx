import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'
import { triggerHaptic } from '../../utils/haptics.js'
import StaffHandoffButton from '../../components/staffhandoff/StaffHandoffButton.jsx'

// APPROVED SMOKECRAFT VISUAL RULE:
// No stock-photo fallback URLs, no CSS-drawn graphics, no cartoon/placeholder art.
// If a real image is missing, render "Image pending" only.
function SessionCompleteImage({ src, alt, className, style, portrait }) {
  const [failed, setFailed] = useState(!src)
  if (!failed && src) {
    return (
      <img
        className={className}
        style={style}
        alt={alt}
        src={src}
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <div
      className={className}
      style={{
        ...style,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(10,6,3,0.85)', border: '1px solid rgba(233,193,118,0.24)',
        color: 'rgba(233,193,118,0.5)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
      }}
    >
      {portrait ? 'Portrait pending' : 'Image pending'}
    </div>
  )
}

const STAMPS = [
  { icon: 'workspace_premium', label: 'Mentor',      earned: true },
  { icon: 'restaurant_menu',   label: 'Taste',       earned: true },
  { icon: 'nature_people',     label: 'Seed & Soil', earned: true },
  { icon: 'liquor',            label: 'Pairing',     earned: true },
  { icon: 'diamond',           label: 'Master Blend', earned: true, highlight: true },
]

const TASTE_TAGS = ['Dark Cocoa', 'Cedar Smoke', 'Leather', 'Toasted Almond']

export default function SessionComplete() {
  const navigate = useNavigate()
  const { session, addXP, completeStep, awardStamp, completeSmokeCraftSession, syncPos3Activity, syncEATActivity } = useGuestSession()
  const [summarySent, setSummarySent] = useState(false)

  useEffect(() => {
    const alreadyDone = session.completedSteps.includes('session-complete')
    // Legacy XP / step / stamp (runs once)
    if (!alreadyDone) {
      completeStep('session-complete')
      addXP(XP_AWARDS.SESSION_1_COMPLETE)
      awardStamp('journey-complete', 'session-complete')
      triggerHaptic('success')
    }
    // Phase 6: rich data wiring (idempotent — safe to call on every mount)
    completeSmokeCraftSession({ tasteProfile: TASTE_TAGS })
    syncPos3Activity()
    syncEATActivity()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const FILL1 = { fontVariationSettings: "'FILL' 1" }
  const memberName = session.profile?.firstName
    ? `${session.profile.firstName} ${session.profile.lastName}`.trim()
    : 'Julian Sterling'

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      {/* Staff handoff to POS 3 — this is the customer's session-complete handoff point */}
      <StaffHandoffButton />

      {/* Cinematic Background */}
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <SessionCompleteImage
          alt=""
          className="absolute inset-0 grayscale opacity-20"
          src={null}
          style={{ fontSize: 11 }}
        />
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/assets/smokecraft/cropped/final-third-bg.jpg')" }} />
        <div className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-primary/10 rounded-full animated-smoke" />
        <div
          className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-secondary/10 rounded-full animated-smoke"
          style={{ animationDelay: '-5s' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(0deg, rgba(19,19,20,0.9) 0%, rgba(19,19,20,0.2) 50%, rgba(19,19,20,0.9) 100%)' }}
        />
      </div>

      {/* Top Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md">
        <div className="flex items-center gap-4">
          <button
            className="material-symbols-outlined text-primary p-2 hover:bg-surface-variant/50 transition-colors duration-300 rounded-full"
            style={{ minWidth: 48, minHeight: 48 }}
            onClick={() => navigate('/smokecraft/management-sync')}
            aria-label="Back"
          >arrow_back</button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-label-lg text-label-lg text-primary tracking-widest uppercase">Grand Lounge</span>
          <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center overflow-hidden">
            <SessionCompleteImage
              alt="Member Portrait"
              className="w-full h-full object-cover"
              src={null}
              style={{ fontSize: 6 }}
              portrait
            />
          </div>
        </div>
      </header>

      <main className="relative pt-32 pb-40 px-gutter max-w-[1440px] mx-auto">
        {/* Hero Section */}
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(201,168,76,0.28)', marginBottom: 36, boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
          <img src="/assets/smokecraft-reference/approved/smokecraft-session-complete.png" alt="SmokeCraft Session Complete" style={{ display: 'block', width: '100%', minHeight: 260, maxHeight: 420, objectFit: 'cover', objectPosition: 'center top' }} />
        </div>
        <section className="mb-16 text-center">
          <h2 className="font-display-lg text-display-lg text-primary mb-4">Journey Concluded</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            {memberName}, your session summary is finalized. Your passport has been updated with the expertise of the Master Blend.
          </p>
        </section>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: The Passport Booklet */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-8">
            <div className="passport-texture rounded-xl p-10 gold-foil-inner shadow-2xl relative min-h-[600px] flex flex-col justify-between">
              <div className="absolute top-8 right-8 flex flex-col items-end">
                <span className="font-label-sm text-label-sm text-primary/60">SESSION NO.</span>
                <span className="font-headline-md text-headline-md text-primary">SH-091224</span>
              </div>
              <div className="mt-8">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-label-lg text-label-lg text-primary tracking-tighter">MEMBER PASSPORT</span>
                  <div className="h-px flex-1 bg-primary/20" />
                </div>
                <h3 className="font-display-lg text-display-lg text-on-surface mb-8">Summary Recipient: {memberName}</h3>
                <div className="grid grid-cols-2 gap-y-12 gap-x-8">
                  {/* Selected Mentors */}
                  <div>
                    <h4 className="font-label-lg text-label-lg text-primary mb-2 uppercase">Selected Mentors</h4>
                    <div className="flex -space-x-4">
                      {[null, null].map((src, i) => (
                        <div key={i} className="w-12 h-12 rounded-full border-2 border-primary-container overflow-hidden bg-surface shadow-lg">
                          <SessionCompleteImage alt={`Mentor ${i + 1}`} className="w-full h-full object-cover" src={src} style={{ fontSize: 5 }} portrait />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Seed & Soil Origins */}
                  <div>
                    <h4 className="font-label-lg text-label-lg text-primary mb-2 uppercase">Seed & Soil Origins</h4>
                    <p className="font-headline-md text-headline-md text-on-surface">Vuelta Abajo, Pinar del Río</p>
                  </div>
                  {/* Taste Profile Highlights */}
                  <div className="col-span-2">
                    <h4 className="font-label-lg text-label-lg text-primary mb-2 uppercase">Taste Profile Highlights</h4>
                    <div className="flex flex-wrap gap-3">
                      {TASTE_TAGS.map(tag => (
                        <span key={tag} className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full font-label-lg text-label-lg text-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Points Section */}
              <div className="mt-16 flex items-center justify-between border-t border-primary/20 pt-8">
                <div>
                  <span className="font-label-lg text-label-lg text-primary/60 block mb-1">ACCUMULATED REWARD</span>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-4xl" style={FILL1}>stars</span>
                    <span className="font-display-lg text-display-lg text-primary tracking-tighter">
                      {session.xp || 2450} <span className="font-headline-md text-headline-md">CREDITS</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">PASSPORT TIER</span>
                  <span className="font-headline-md text-headline-md text-secondary uppercase tracking-widest">{session.rank || 'Platinum'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recommendation & Stamps */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
            {/* Recommended Cigar Card */}
            <div className="glass-panel rounded-xl overflow-hidden amber-glow">
              <div className="relative h-64">
                <SessionCompleteImage
                  alt="Recommended Cigar"
                  className="w-full h-full object-cover"
                  src={null}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="font-label-sm text-label-sm text-primary mb-1 uppercase tracking-widest">Master Selection</span>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">Reserva Real No. 2</h3>
                </div>
              </div>
              <div className="p-6 bg-surface-container-low">
                <div className="flex items-start gap-4 mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl">wine_bar</span>
                  <div>
                    <h4 className="font-label-lg text-label-lg text-on-surface mb-1">Recommended Pairing</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant italic">21-Year Single Malt Islay Scotch, served neat.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Earned Stamps Grid */}
            <div className="glass-panel rounded-xl p-8">
              <h4 className="font-label-lg text-label-lg text-primary mb-6 uppercase tracking-widest border-b border-outline-variant/30 pb-4">
                Earned Seals of Craft
              </h4>
              <div className="grid grid-cols-3 gap-6">
                {STAMPS.map(({ icon, label, highlight }) => (
                  <div key={label} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${highlight ? 'border-2 border-primary border-double shadow-lg shadow-primary/20' : 'border-2 border-dashed border-primary/40'}`}>
                      <span className={`material-symbols-outlined text-primary ${highlight ? 'text-4xl' : 'text-3xl'}`} style={FILL1}>{icon}</span>
                    </div>
                    <span className={`font-label-sm text-label-sm text-center ${highlight ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-16 flex flex-wrap justify-center gap-6">
          <button
            onClick={() => setSummarySent(true)}
            disabled={summarySent}
            className={`px-10 py-5 font-headline-md text-headline-md rounded-lg shadow-xl transition-all flex items-center gap-4 gold-foil-inner ${summarySent ? 'bg-surface-container text-on-surface-variant opacity-60 cursor-default' : 'bg-primary text-on-primary hover:scale-105 active:scale-95'}`}
          >
            <span className="material-symbols-outlined">{summarySent ? 'check_circle' : 'send'}</span>
            {summarySent ? 'Summary Sent' : 'Send Summary'}
          </button>
          <button
            onClick={() => navigate('/smokecraft/passport-stamp')}
            className="px-10 py-5 border-2 border-primary/50 text-primary font-headline-md text-headline-md rounded-lg hover:bg-primary/10 active:scale-95 transition-all flex items-center gap-4"
          >
            <span className="material-symbols-outlined">menu_book</span>
            Passport Ceremony
          </button>
          <button
            onClick={() => navigate('/crafthub')}
            className="px-10 py-5 text-on-surface-variant font-label-lg text-label-lg hover:text-primary transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to CraftHub
          </button>
        </div>
      </main>

      {/* Bottom Navigation Bar (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-24 bg-surface-container-low/90 backdrop-blur-2xl border-t border-outline-variant/20 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] md:hidden">
        {[
          { icon: 'explore',      label: 'Explore',   active: false, to: '/'        },
          { icon: 'inventory_2',  label: 'Inventory', active: false, locked: true   },
          { icon: 'menu_book',    label: 'Passport',  active: true,  to: '/passport', fill: true },
          { icon: 'auto_awesome', label: 'Assistant', active: false, locked: true   },
        ].map(({ icon, label, active, fill, to, locked }) => (
          <button
            key={label}
            onClick={() => { if (!locked && to) navigate(to) }}
            className={`flex flex-col items-center justify-center transition-colors active:scale-95 ${
              locked
                ? 'text-on-surface-variant/30 cursor-not-allowed opacity-40'
                : active
                  ? 'text-primary bg-primary-container/20 rounded-full px-6 py-2 scale-90 duration-300'
                  : 'text-on-surface-variant hover:text-primary'
            }`}
            style={{ minHeight: 56 }}
          >
            <span className="material-symbols-outlined" style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}>{icon}</span>
            <span className="font-label-sm text-label-sm">{locked ? 'Soon' : label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
