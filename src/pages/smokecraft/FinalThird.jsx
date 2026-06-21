import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const NOTES = ['Caramel','Char','Toast','Wood','Sweet','Bitter','Smoke','Mineral']
const FILL1 = { fontVariationSettings: "'FILL' 1" }

export default function FinalThird() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [selected, setSelected] = useState(new Set())
  const [rating, setRating] = useState(0)
  const [done, setDone] = useState(false)

  function toggleNote(n) { triggerHaptic('light'); setSelected(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s }) }

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('final-third')
    addXP(50)
    navigate('/smokecraft/scorecard')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage:"url('/assets/smokecraft/cropped/final-third-bg.png')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(0deg,rgba(19,19,20,0.95) 0%,rgba(19,19,20,0.6) 50%,rgba(19,19,20,0.95) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/second-third')} aria-label="Back">arrow_back</button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <div className="mb-6 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <span>Step 11 of 17</span>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:'64.7%' }} /></div>
          <span>Final Third</span>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-2" style={{ fontSize:'clamp(26px,4vw,40px)' }}>Final Third — Tasting</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8" style={{ maxWidth:560 }}>The finish. Note the final flavors and how the cigar concludes.</p>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Flavor Notes</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {NOTES.map(n => { const on = selected.has(n); return (
            <button key={n} onClick={() => toggleNote(n)} className="sc-tactile px-4 py-2 rounded-full border font-label-lg text-label-lg transition-all duration-200 active:scale-95"
              style={{ borderColor: on ? '#e9c176' : 'rgba(255,255,255,0.15)', background: on ? 'rgba(233,193,118,0.12)' : 'transparent', color: on ? '#e9c176' : 'rgba(255,255,255,0.6)' }}>
              {n}
            </button>
          )})}
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Overall Rating</p>
        <div className="flex gap-3 mb-12">
          {[1,2,3,4,5].map(v => (
            <button key={v} onClick={() => { triggerHaptic('light'); setRating(v) }}
              className="sc-tactile w-12 h-12 rounded-full border-2 font-label-lg text-label-lg transition-all duration-200 active:scale-90"
              style={{ borderColor: rating >= v ? '#e9c176' : 'rgba(255,255,255,0.2)', background: rating >= v ? 'rgba(233,193,118,0.15)' : 'transparent', color: rating >= v ? '#e9c176' : 'rgba(255,255,255,0.4)' }}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <button onClick={handleContinue}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Scorecard <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/smokecraft/second-third')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300"
            style={{ height:64,paddingInline:32 }}>
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
        </div>
      </main>
    </div>
  )
}
