import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const MEMORIES = ['Cedar box', 'Fresh-cut grass', 'Dark roast coffee', 'Brown sugar', 'Old leather', 'Dried fig']

export default function FlavorMemory() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [selected, setSelected] = useState(new Set())
  const [done, setDone] = useState(false)

  function toggle(m) { triggerHaptic('light'); setSelected(prev => { const s = new Set(prev); s.has(m) ? s.delete(m) : s.add(m); return s }) }

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('flavor-memory')
    addXP(75)
    navigate('/smokecraft/final-third')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 z-0 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/assets/smokecraft/cropped/flavor-memory-bg.jpg')", opacity: 0.85 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(0deg,rgba(19,19,20,0.68) 0%,rgba(19,19,20,0.42) 45%,rgba(19,19,20,0.75) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth: 48, minHeight: 48 }} onClick={() => navigate('/smokecraft/second-third')} aria-label="Back">arrow_back</button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360 — Visit 5</p>
        <h2 className="font-headline-md text-on-surface mb-2" style={{ fontSize: 'clamp(26px,4vw,40px)' }}>Flavor Memory Session</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-10" style={{ maxWidth: 560 }}>Which memories does this cigar's evolving flavor bring to mind? Select any that resonate.</p>

        <div className="flex flex-wrap gap-2 mb-12">
          {MEMORIES.map(m => { const on = selected.has(m); return (
            <button key={m} type="button" onClick={() => toggle(m)} className="sc-tactile px-4 py-2 rounded-full border font-label-lg text-label-lg transition-all duration-300 active:scale-95"
              style={{
                borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)',
                background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                color: on ? '#e9c176' : 'rgba(255,255,255,0.6)',
              }}>
              {m}
            </button>
          )})}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleContinue}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height: 64, paddingInline: 40, background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314', boxShadow: '0 4px 20px rgba(233,193,118,0.3)' }}>
            Final Third <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/smokecraft/second-third')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height: 64, paddingInline: 32 }}>
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
        </div>
      </main>
    </div>
  )
}
