import { useNavigate } from 'react-router-dom'
import { getVisitForStepId, TOTAL_VISITS } from '../../constants/session.js'

/**
 * Shown by VisitLockGuard when the requested session's visit isn't unlocked
 * yet (or an earlier session in the same visit is still incomplete).
 */
export default function LockedVisit({ stepId }) {
  const navigate = useNavigate()
  const info = getVisitForStepId(stepId)
  const visitNumber = info?.visit || 1
  const visitTitle = info?.visitTitle || 'Next Visit'

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(0deg,rgba(19,19,20,0.97) 0%,rgba(19,19,20,0.75) 50%,rgba(19,19,20,0.97) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[720px] mx-auto flex flex-col items-center text-center">
        <div
          className="rounded-full flex items-center justify-center mb-8"
          style={{
            width: 96, height: 96,
            background: 'linear-gradient(135deg, rgba(233,193,118,0.18), rgba(233,193,118,0.05))',
            border: '1px solid rgba(233,193,118,0.35)',
          }}
        >
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 44 }}>lock</span>
        </div>

        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">
          Visit {visitNumber} of {TOTAL_VISITS}
        </p>
        <h2 className="font-headline-md text-on-surface mb-4" style={{ fontSize: 'clamp(26px,4vw,40px)' }}>
          {visitTitle} is locked
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-12" style={{ maxWidth: 480 }}>
          This part of your SmokeCraft journey unlocks on your next visit. Return on your next visit to unlock
          {' '}<span className="text-primary">{visitTitle}</span>.
        </p>

        <button
          onClick={() => navigate('/smokecraft')}
          className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300"
          style={{ height: 64, paddingInline: 40, background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314', boxShadow: '0 4px 20px rgba(233,193,118,0.3)' }}
        >
          Return to SmokeCraft <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </main>
    </div>
  )
}
