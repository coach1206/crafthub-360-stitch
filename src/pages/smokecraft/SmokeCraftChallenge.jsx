import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const QUESTIONS = [
  { id: 'q1', prompt: 'Which wrapper tends toward sweet, dark, fermented flavor?', options: ['Connecticut', 'Maduro', 'Claro'], answer: 'Maduro' },
  { id: 'q2', prompt: 'What does a deepening flavor in the second third usually signal?', options: ['Burn issue', 'Flavor transition', 'Wrapper defect'], answer: 'Flavor transition' },
]

export default function SmokeCraftChallenge() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [answers, setAnswers] = useState({})
  const [done, setDone] = useState(false)

  function choose(qid, opt) { triggerHaptic('light'); setAnswers(prev => ({ ...prev, [qid]: opt })) }

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    const correct = QUESTIONS.filter(q => answers[q.id] === q.answer).length
    completeStep('smokecraft-challenge')
    addXP(correct === QUESTIONS.length ? 100 : 75)
    navigate('/smokecraft/second-humidor-match')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(0deg,rgba(19,19,20,0.96) 0%,rgba(19,19,20,0.72) 45%,rgba(19,19,20,0.96) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth: 48, minHeight: 48 }} onClick={() => navigate('/smokecraft/scorecard')} aria-label="Back">arrow_back</button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360 — Visit 7</p>
        <h2 className="font-headline-md text-on-surface mb-2" style={{ fontSize: 'clamp(26px,4vw,40px)' }}>SmokeCraft Challenge</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-10" style={{ maxWidth: 560 }}>Test what you've learned so far before moving to your second cigar.</p>

        <div className="flex flex-col gap-8 mb-12">
          {QUESTIONS.map(q => (
            <div key={q.id}>
              <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">{q.prompt}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map(opt => { const on = answers[q.id] === opt; return (
                  <button key={opt} type="button" onClick={() => choose(q.id, opt)}
                    className="sc-tactile px-4 py-2 rounded-full border font-label-lg text-label-lg transition-all duration-300 active:scale-95"
                    style={{
                      borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)',
                      background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                      color: on ? '#e9c176' : 'rgba(255,255,255,0.6)',
                    }}>
                    {opt}
                  </button>
                )})}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleContinue}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height: 64, paddingInline: 40, background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314', boxShadow: '0 4px 20px rgba(233,193,118,0.3)' }}>
            Continue <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/smokecraft/scorecard')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height: 64, paddingInline: 32 }}>
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
        </div>
      </main>
    </div>
  )
}
