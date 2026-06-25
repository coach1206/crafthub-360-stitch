import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const WRAPPERS = [
  { id: 'connecticut', label: 'Connecticut', desc: 'Mild, creamy, light tan — gentle entry point.' },
  { id: 'habano',      label: 'Habano',      desc: 'Spicy, peppery, medium-bodied with sharp edge.' },
  { id: 'maduro',      label: 'Maduro',      desc: 'Dark, sweet, fermented — rich and bold.' },
  { id: 'oscuro',      label: 'Oscuro',      desc: 'Near-black, intense, full-bodied powerhouse.' },
]

const STRENGTHS = ['Mild', 'Medium', 'Full']

export default function WrapperStrength() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [wrapper, setWrapper] = useState(null)
  const [strength, setStrength] = useState(null)
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('wrapper-strength')
    addXP(75)
    navigate('/smokecraft/seed-soil')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(0deg,rgba(19,19,20,0.96) 0%,rgba(19,19,20,0.72) 45%,rgba(19,19,20,0.96) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth: 48, minHeight: 48 }} onClick={() => navigate('/smokecraft/format')} aria-label="Back">arrow_back</button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360 — Visit 2</p>
        <h2 className="font-headline-md text-on-surface mb-2" style={{ fontSize: 'clamp(26px,4vw,40px)' }}>Wrapper &amp; Strength Education</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-10" style={{ maxWidth: 560 }}>The wrapper leaf shapes both flavor and visual character. Pick the wrapper and strength you'd reach for tonight.</p>

        <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Wrapper</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          {WRAPPERS.map(w => { const on = wrapper === w.id; return (
            <button key={w.id} type="button" onClick={() => { triggerHaptic('light'); setWrapper(w.id) }}
              className="sc-tactile text-left rounded-2xl border transition-all duration-300 active:scale-[0.98]"
              style={{ padding: 20, background: on ? 'rgba(233,193,118,0.08)' : 'rgba(255,255,255,0.03)', borderColor: on ? 'rgba(233,193,118,0.4)' : 'rgba(255,255,255,0.08)' }}>
              <p className="font-label-lg text-label-lg font-semibold" style={{ color: on ? '#e9c176' : undefined }}>{w.label}</p>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">{w.desc}</p>
            </button>
          )})}
        </div>

        <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Preferred Strength</p>
        <div className="flex flex-wrap gap-2 mb-12">
          {STRENGTHS.map(s => { const on = strength === s; return (
            <button key={s} type="button" onClick={() => { triggerHaptic('light'); setStrength(s) }}
              className="sc-tactile px-5 py-2.5 rounded-full border font-label-lg text-label-lg transition-all duration-300 active:scale-95"
              style={{
                borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)',
                background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                color: on ? '#e9c176' : 'rgba(255,255,255,0.6)',
              }}>
              {s}
            </button>
          )})}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleContinue}
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
