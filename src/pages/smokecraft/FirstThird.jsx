import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const NOTES = ['Cedar','Cream','Pepper','Grass','Earth','Floral','Leather','Nuts']
const FILL1 = { fontVariationSettings: "'FILL' 1" }

function tastingXP(notesCount, hasDrawRating) {
  if (notesCount === 0 && !hasDrawRating) return 5
  if (notesCount >= 3 && hasDrawRating) return 50
  if (notesCount >= 1 && notesCount <= 2 && hasDrawRating) return 35
  if (notesCount === 0 && hasDrawRating) return 20
  if (notesCount > 0 && !hasDrawRating) return 20
  return 5
}

export default function FirstThird() {
  const navigate = useNavigate()
  const { completeStep, addXP, setFirstThirdTasting } = useGuestSession()
  const [selected, setSelected] = useState(new Set())
  const [rating, setRating] = useState(0)
  const [done, setDone] = useState(false)

  function toggleNote(n) { triggerHaptic('light'); setSelected(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s }) }

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    const notesSelected = NOTES.filter(n => selected.has(n))
    const notesCount = notesSelected.length
    const hasDrawRating = rating > 0
    setFirstThirdTasting({
      notesSelected,
      notesCount,
      drawRating: hasDrawRating ? rating : null,
      hasDrawRating,
    })
    completeStep('first-third')
    addXP(tastingXP(notesCount, hasDrawRating))
    navigate('/smokecraft/second-third')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage:"url('/assets/smokecraft/cropped/flavor-dna-bg.jpg')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(0deg,rgba(19,19,20,0.95) 0%,rgba(19,19,20,0.6) 50%,rgba(19,19,20,0.95) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/cut-toast-light')} aria-label="Back">arrow_back</button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <div className="mb-6 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <span>Step 9 of 17</span>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:'52.9%' }} /></div>
          <span>First Third</span>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-2" style={{ fontSize:'clamp(26px,4vw,40px)' }}>First Third — Tasting</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8" style={{ maxWidth:560 }}>Note what you taste and smell in the opening third of the cigar.</p>
        <div
          className="rounded-3xl border border-primary/15 backdrop-blur-xl mb-12"
          style={{
            padding: 24,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Flavor Notes</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {NOTES.map(n => { const on = selected.has(n); return (
              <button key={n} type="button" onClick={() => toggleNote(n)}
                className="sc-tactile px-4 py-2 rounded-full border font-label-lg text-label-lg transition-all duration-300 active:scale-95"
                style={{
                  borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)',
                  background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                  color: on ? '#e9c176' : 'rgba(255,255,255,0.6)',
                  boxShadow: on ? '0 0 0 1px rgba(233,193,118,0.25), 0 8px 28px rgba(233,193,118,0.18)' : 'none',
                }}>
                {n}
              </button>
            )})}
          </div>
          <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Draw Rating</p>
          <div className="flex gap-3">
            {[1,2,3,4,5].map(v => (
              <button key={v} type="button" onClick={() => { triggerHaptic('light'); setRating(v) }}
                className="sc-tactile w-12 h-12 rounded-full border-2 font-label-lg text-label-lg transition-all duration-300 active:scale-90"
                style={{
                  borderColor: rating >= v ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.2)',
                  background: rating >= v ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                  color: rating >= v ? '#e9c176' : 'rgba(255,255,255,0.4)',
                  boxShadow: rating >= v ? '0 0 0 1px rgba(233,193,118,0.25), 0 8px 28px rgba(233,193,118,0.18)' : 'none',
                }}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleContinue}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Second Third <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/smokecraft/cut-toast-light')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height:64,paddingInline:32 }}>
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
        </div>
      </main>
    </div>
  )
}
