import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getVisitProgress } from '../../constants/session.js'

// Ring gauge = diameter in 64ths of an inch. This page is a sub-step of
// Session 5 (Shape, Size & Burn Time) — it does NOT call completeStep() and
// is gated by the same VisitLockGuard stepId ("format") as the Format page,
// so it never advances the 24-session progression on its own.
const GAUGE_SCALE = [
  { gauge: 30, label: 'Slim',     example: 'Panetela' },
  { gauge: 38, label: 'Slender',  example: 'Lancero' },
  { gauge: 42, label: 'Classic',  example: 'Corona' },
  { gauge: 48, label: 'Standard', example: 'Perfecto' },
  { gauge: 50, label: 'Medium',   example: 'Robusto / Toro' },
  { gauge: 52, label: 'Wide',     example: 'Torpedo / Belicoso' },
  { gauge: 60, label: 'Extra Wide', example: 'Gordo' },
]

const MAX_GAUGE = 64

export default function CigarGaugeGuide() {
  const navigate = useNavigate()
  const { session } = useGuestSession()
  const stepProgress = getVisitProgress(session.completedSteps)

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 z-0 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/assets/smokecraft/cigars/robusto.jpg')", opacity: 0.35 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(0deg,rgba(19,19,20,0.82) 0%,rgba(19,19,20,0.62) 45%,rgba(19,19,20,0.88) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth: 48, minHeight: 48 }} onClick={() => navigate('/smokecraft/format')} aria-label="Back">arrow_back</button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">
          Round {stepProgress.round} of 3 &middot; Visit {stepProgress.visit} of {stepProgress.totalVisits} &middot; Session {stepProgress.session} of {stepProgress.totalSessions} &middot; Cigar Gauge Guide
        </p>
        <h2 className="font-headline-md text-on-surface mb-2" style={{ fontSize: 'clamp(26px,4vw,40px)' }}>Cigar Gauge Guide</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-10" style={{ maxWidth: 560 }}>
          Ring gauge measures a cigar's diameter in 64ths of an inch — the thicker the ring gauge, the cooler and slower the burn. Use this scale alongside the Format Guide to compare shapes at a glance.
        </p>

        <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Ring Gauge Scale</p>
        <div className="grid gap-3 mb-10">
          {GAUGE_SCALE.map((row) => (
            <div key={row.gauge} className="sc-tactile rounded-2xl border" style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-4">
                <div
                  aria-hidden="true"
                  style={{
                    width: Math.round((row.gauge / MAX_GAUGE) * 64),
                    height: Math.round((row.gauge / MAX_GAUGE) * 64),
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#e9c176,#c5a059)',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p className="font-label-lg text-label-lg font-semibold" style={{ color: '#e9c176' }}>{row.gauge} Ring Gauge &middot; {row.label}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">{row.example}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => navigate('/smokecraft/wrapper-strength')}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height: 64, paddingInline: 40, background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314', boxShadow: '0 4px 20px rgba(233,193,118,0.3)' }}>
            Continue <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/smokecraft/format')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height: 64, paddingInline: 32 }}>
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
        </div>
      </main>
    </div>
  )
}
