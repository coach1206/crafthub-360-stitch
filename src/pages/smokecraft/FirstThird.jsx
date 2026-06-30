import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { getMentorGuidance } from '../../utils/smokecraftMentorTips.js'
import { getVisitProgress } from '../../constants/session.js'

const NOTES = ['Cedar','Cream','Pepper','Grass','Earth','Floral','Leather','Nuts']

const SCALE_FIELDS = [
  { id: 'strength', label: 'Strength' },
  { id: 'body',     label: 'Body' },
  { id: 'smokeOutput', label: 'Smoke Output' },
  { id: 'burnQuality', label: 'Burn Quality' },
]

const PAIRING_REACTIONS = ['Loved it', 'Worked well', 'Neutral', 'Clashed']

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
  const { session, completeStep, addXP, setFirstThirdTasting } = useGuestSession()
  const [selected, setSelected] = useState(new Set())
  const [rating, setRating] = useState(0)
  const [strength, setStrength] = useState(0)
  const [body, setBody] = useState(0)
  const [smokeOutput, setSmokeOutput] = useState(0)
  const [burnQuality, setBurnQuality] = useState(0)
  const [pairingReaction, setPairingReaction] = useState(null)
  const [done, setDone] = useState(false)

  const mentorGuidance = getMentorGuidance(session, 'first-third')
  const scaleValue = { strength, body, smokeOutput, burnQuality }
  const scaleSetter = { strength: setStrength, body: setBody, smokeOutput: setSmokeOutput, burnQuality: setBurnQuality }

  function toggleNote(n) { triggerHaptic('light'); setSelected(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s }) }

  function selectPairingReaction(r) { triggerHaptic('light'); setPairingReaction(r) }

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
      strength: strength || null,
      body: body || null,
      smokeOutput: smokeOutput || null,
      burnQuality: burnQuality || null,
      pairingReaction,
      mentorTip: mentorGuidance ? mentorGuidance.tip : null,
      mentorName: mentorGuidance ? mentorGuidance.mentorName : null,
    })
    completeStep('first-third')
    addXP(tastingXP(notesCount, hasDrawRating))
    navigate('/smokecraft/second-third')
  }

  const notesCountLive = selected.size
  const stepProgress = getVisitProgress(session.completedSteps)

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage:"url('/assets/smokecraft/cropped/first-third-bg.png')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(0deg,rgba(19,19,20,0.96) 0%,rgba(19,19,20,0.72) 45%,rgba(19,19,20,0.96) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/cut-toast-light')} aria-label="Back">arrow_back</button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[1100px] mx-auto">
        <div className="mb-6 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <div className="smokecraft-progress-label flex items-center gap-3">
            <span>Round {stepProgress.round} of 3</span>
            <span>Visit {stepProgress.visit} of {stepProgress.totalVisits}</span>
            <span>Session {stepProgress.session} of {stepProgress.totalSessions}</span>
          </div>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:`${(stepProgress.session/24)*100}%` }} /></div>
          <span>First Third</span>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-2" style={{ fontSize:'clamp(26px,4vw,40px)' }}>First Third — Tasting</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-6" style={{ maxWidth:560 }}>Note what you taste and smell in the opening third of the cigar.</p>
        <img src="/assets/smokecraft-reference/approved/smokecraft-first-third.png" alt="First Third Tasting" style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain', marginBottom: 28 }} />

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
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
            <div className="flex gap-3 mb-8">
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

            <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Profile Ratings</p>
            <div className="flex flex-col gap-4 mb-8">
              {SCALE_FIELDS.map(f => (
                <div key={f.id}>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">{f.label}</p>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(v => (
                      <button key={v} type="button" onClick={() => { triggerHaptic('light'); scaleSetter[f.id](v) }}
                        className="sc-tactile w-10 h-10 rounded-full border-2 font-label-sm text-label-sm transition-all duration-300 active:scale-90"
                        style={{
                          borderColor: scaleValue[f.id] >= v ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.2)',
                          background: scaleValue[f.id] >= v ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                          color: scaleValue[f.id] >= v ? '#e9c176' : 'rgba(255,255,255,0.4)',
                        }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Pairing Reaction</p>
            <div className="flex flex-wrap gap-2">
              {PAIRING_REACTIONS.map(r => { const on = pairingReaction === r; return (
                <button key={r} type="button" onClick={() => selectPairingReaction(r)}
                  className="sc-tactile px-4 py-2 rounded-full border font-label-lg text-label-lg transition-all duration-300 active:scale-95"
                  style={{
                    borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)',
                    background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                    color: on ? '#e9c176' : 'rgba(255,255,255,0.6)',
                  }}>
                  {r}
                </button>
              )})}
            </div>

            {mentorGuidance && (
              <div className="rounded-2xl border border-primary/20 mt-8" style={{ padding: 16, background: 'rgba(233,193,118,0.06)' }}>
                <p className="font-label-sm text-[11px] text-primary uppercase tracking-widest mb-1">Mentor Tip — {mentorGuidance.mentorName}{mentorGuidance.mentorCountry ? ` (${mentorGuidance.mentorCountry})` : ''}</p>
                <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">{mentorGuidance.tip}</p>
              </div>
            )}
            {!mentorGuidance && (
              <p className="font-label-sm text-[11px] text-on-surface-variant/50 mt-8">No mentor selected yet — mentor tips will appear here once you choose a mentor.</p>
            )}
          </div>

          <aside
            className="hidden lg:flex flex-col rounded-3xl border border-primary/15 backdrop-blur-xl overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.15) 100%)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="bg-cover bg-center"
              style={{ height: 180, backgroundImage:"url('/assets/smokecraft/cropped/first-third-bg.png')" }}
            />
            <div style={{ padding: 24 }}>
              <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-3">Opening Draw</p>
              <p className="font-body-md text-body-md text-on-surface-variant mb-5">The first third sets the tone. Aromas are brightest now — take note before they mellow.</p>

              <p className="font-label-sm text-label-sm text-primary/70 uppercase tracking-widest mb-2">Notes Selected</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {notesCountLive === 0
                  ? <span className="font-body-md text-body-md text-on-surface-variant/60 italic">None yet</span>
                  : NOTES.filter(n => selected.has(n)).map(n => (
                    <span key={n} className="px-3 py-1 rounded-full font-label-sm text-label-sm" style={{ background:'rgba(233,193,118,0.14)', color:'#e9c176', border:'1px solid rgba(233,193,118,0.35)' }}>{n}</span>
                  ))
                }
              </div>

              <p className="font-label-sm text-label-sm text-primary/70 uppercase tracking-widest mb-2">Draw Rating</p>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {rating === 0 ? 'Not rated yet.' : `${rating} / 5 — ${rating <= 2 ? 'tight, needs attention' : rating === 3 ? 'workable draw' : 'smooth, ideal draw'}.`}
              </p>
            </div>
          </aside>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-12">
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
