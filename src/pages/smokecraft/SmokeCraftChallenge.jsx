import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftReferenceCanvas from '../../components/smokecraft/SmokeCraftReferenceCanvas.jsx'

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
    <SmokeCraftReferenceCanvas
      src="/assets/smokecraft-reference/approved/smokecraft-challenge.png"
      alt="SmokeCraft Challenge"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20 }}>
        {QUESTIONS.map(q => (
          <div key={q.id}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f5d28a', marginBottom: 10 }}>{q.prompt}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {q.options.map(opt => {
                const on = answers[q.id] === opt
                return (
                  <button key={opt} type="button" onClick={() => choose(q.id, opt)} className="sc-tactile"
                    style={{ minHeight: 40, padding: '0 16px', borderRadius: 20, border: `1px solid ${on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)'}`, background: on ? 'rgba(233,193,118,0.14)' : 'rgba(255,255,255,0.03)', color: on ? '#e9c176' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13 }}>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={handleContinue} className="sc-tactile"
          style={{ height: 56, padding: '0 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          Continue <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <button onClick={() => navigate('/smokecraft/scorecard')} className="sc-tactile"
          style={{ height: 56, padding: '0 24px', borderRadius: 12, border: '1px solid rgba(212,175,55,0.3)', background: 'transparent', color: '#e9c176', cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined">arrow_back</span> Back
        </button>
      </div>
    </SmokeCraftReferenceCanvas>
  )
}
