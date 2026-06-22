import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { getMentorGuidance } from '../../utils/smokecraftMentorTips.js'

const NOTES = ['Leather','Dark Cocoa','Coffee','Spice','Nuts','Cedar','Dried Fruit','Tobacco']

const FLAVOR_DEVELOPMENT = ['Deepening', 'Shifting', 'Steady', 'Fading']
const CHANGE_OPTIONS = ['Increasing', 'Steady', 'Decreasing']
const PAIRING_REACTIONS = ['Loved it', 'Worked well', 'Neutral', 'Clashed']

export default function SecondThird() {
  const navigate = useNavigate()
  const { session, completeStep, addXP, setSecondThirdTasting } = useGuestSession()
  const [selected, setSelected] = useState(new Set())
  const [rating, setRating] = useState(0)
  const [flavorDevelopment, setFlavorDevelopment] = useState(null)
  const [strengthChange, setStrengthChange] = useState(null)
  const [bodyChange, setBodyChange] = useState(null)
  const [ashQuality, setAshQuality] = useState(0)
  const [pairingReaction, setPairingReaction] = useState(null)
  const [done, setDone] = useState(false)

  const mentorGuidance = getMentorGuidance(session, 'second-third')

  function toggleNote(n) { triggerHaptic('light'); setSelected(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s }) }

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    const notesSelected = NOTES.filter(n => selected.has(n))
    const notesCount = notesSelected.length
    const hasRating = rating > 0
    setSecondThirdTasting({
      notesSelected,
      notesCount,
      rating: hasRating ? rating : null,
      hasRating,
      flavorDevelopment,
      strengthChange,
      bodyChange,
      ashQuality: ashQuality || null,
      pairingReaction,
      mentorTip: mentorGuidance ? mentorGuidance.tip : null,
      mentorName: mentorGuidance ? mentorGuidance.mentorName : null,
    })
    completeStep('second-third')
    addXP(50)
    navigate('/smokecraft/final-third')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage:"url('/assets/smokecraft/cropped/flavor-dna-bg.jpg')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(0deg,rgba(19,19,20,0.96) 0%,rgba(19,19,20,0.72) 45%,rgba(19,19,20,0.96) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/first-third')} aria-label="Back">arrow_back</button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <div className="mb-6 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <span>Step 10 of 17</span>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:'58.8%' }} /></div>
          <span>Second Third</span>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-2" style={{ fontSize:'clamp(26px,4vw,40px)' }}>Second Third — Tasting</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8" style={{ maxWidth:560 }}>The flavor profile typically deepens and transitions. Note the evolution.</p>

        <div
          className="rounded-3xl border border-primary/15 backdrop-blur-xl"
          style={{
            padding: 28,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.12) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Flavor Notes</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {NOTES.map(n => { const on = selected.has(n); return (
            <button key={n} onClick={() => toggleNote(n)} className="sc-tactile px-4 py-2 rounded-full border font-label-lg text-label-lg transition-all duration-300 active:scale-95"
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

        <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Flavor Development</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {FLAVOR_DEVELOPMENT.map(d => { const on = flavorDevelopment === d; return (
            <button key={d} type="button" onClick={() => { triggerHaptic('light'); setFlavorDevelopment(d) }}
              className="sc-tactile px-4 py-2 rounded-full border font-label-lg text-label-lg transition-all duration-300 active:scale-95"
              style={{
                borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)',
                background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                color: on ? '#e9c176' : 'rgba(255,255,255,0.6)',
                boxShadow: on ? '0 0 0 1px rgba(233,193,118,0.25), 0 8px 28px rgba(233,193,118,0.18)' : 'none',
              }}>
              {d}
            </button>
          )})}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-3">Strength Change</p>
            <div className="flex flex-wrap gap-2">
              {CHANGE_OPTIONS.map(c => { const on = strengthChange === c; return (
                <button key={c} type="button" onClick={() => { triggerHaptic('light'); setStrengthChange(c) }}
                  className="sc-tactile px-3 py-2 rounded-full border font-label-sm text-label-sm transition-all duration-300 active:scale-95"
                  style={{
                    borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)',
                    background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                    color: on ? '#e9c176' : 'rgba(255,255,255,0.6)',
                    boxShadow: on ? '0 0 0 1px rgba(233,193,118,0.25), 0 8px 28px rgba(233,193,118,0.18)' : 'none',
                  }}>
                  {c}
                </button>
              )})}
            </div>
          </div>
          <div>
            <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-3">Body Change</p>
            <div className="flex flex-wrap gap-2">
              {CHANGE_OPTIONS.map(c => { const on = bodyChange === c; return (
                <button key={c} type="button" onClick={() => { triggerHaptic('light'); setBodyChange(c) }}
                  className="sc-tactile px-3 py-2 rounded-full border font-label-sm text-label-sm transition-all duration-300 active:scale-95"
                  style={{
                    borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)',
                    background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                    color: on ? '#e9c176' : 'rgba(255,255,255,0.6)',
                    boxShadow: on ? '0 0 0 1px rgba(233,193,118,0.25), 0 8px 28px rgba(233,193,118,0.18)' : 'none',
                  }}>
                  {c}
                </button>
              )})}
            </div>
          </div>
        </div>

        <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Burn Consistency (Draw Rating)</p>
        <div className="flex gap-3 mb-8">
          {[1,2,3,4,5].map(v => (
            <button key={v} onClick={() => { triggerHaptic('light'); setRating(v) }}
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

        <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Ash Quality</p>
        <div className="flex gap-3 mb-8">
          {[1,2,3,4,5].map(v => (
            <button key={v} onClick={() => { triggerHaptic('light'); setAshQuality(v) }}
              className="sc-tactile w-12 h-12 rounded-full border-2 font-label-lg text-label-lg transition-all duration-300 active:scale-90"
              style={{
                borderColor: ashQuality >= v ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.2)',
                background: ashQuality >= v ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                color: ashQuality >= v ? '#e9c176' : 'rgba(255,255,255,0.4)',
                boxShadow: ashQuality >= v ? '0 0 0 1px rgba(233,193,118,0.25), 0 8px 28px rgba(233,193,118,0.18)' : 'none',
              }}>
              {v}
            </button>
          ))}
        </div>

        <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Pairing Reaction</p>
        <div className="flex flex-wrap gap-2 mb-10">
          {PAIRING_REACTIONS.map(r => { const on = pairingReaction === r; return (
            <button key={r} type="button" onClick={() => { triggerHaptic('light'); setPairingReaction(r) }}
              className="sc-tactile px-4 py-2 rounded-full border font-label-lg text-label-lg transition-all duration-300 active:scale-95"
              style={{
                borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)',
                background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                color: on ? '#e9c176' : 'rgba(255,255,255,0.6)',
                boxShadow: on ? '0 0 0 1px rgba(233,193,118,0.25), 0 8px 28px rgba(233,193,118,0.18)' : 'none',
              }}>
              {r}
            </button>
          )})}
        </div>

        {mentorGuidance && (
          <div className="rounded-2xl border border-primary/20" style={{ padding: 16, background: 'rgba(233,193,118,0.06)' }}>
            <p className="font-label-sm text-[11px] text-primary uppercase tracking-widest mb-1">Mentor Tip — {mentorGuidance.mentorName}{mentorGuidance.mentorCountry ? ` (${mentorGuidance.mentorCountry})` : ''}</p>
            <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">{mentorGuidance.tip}</p>
          </div>
        )}
        {!mentorGuidance && (
          <p className="font-label-sm text-[11px] text-on-surface-variant/50">No mentor selected yet — mentor tips will appear here once you choose a mentor.</p>
        )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-12">
          <button onClick={handleContinue}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Final Third <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/smokecraft/first-third')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height:64,paddingInline:32 }}>
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
        </div>
      </main>
    </div>
  )
}
