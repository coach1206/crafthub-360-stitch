import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftReferenceCanvas from '../../components/smokecraft/SmokeCraftReferenceCanvas.jsx'

const RECOMMENDATIONS = [
  { id: 'stepup',    label: 'Step-Up Pick',        desc: 'A slightly bolder cigar than your first, building on what you liked.' },
  { id: 'bestmatch', label: 'Best Match',           desc: 'Closely mirrors the flavor profile you rated highest last time.' },
  { id: 'venue',     label: 'Venue Featured Pick',  desc: "Tonight's house recommendation from the humidor team." },
]

export default function SecondHumidorMatch() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [choice, setChoice] = useState(null)
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('second-humidor-match')
    addXP(75)
    navigate('/smokecraft/mini-tasting')
  }

  return (
    <SmokeCraftReferenceCanvas
      src="/assets/smokecraft-reference/approved/smokecraft-second-humidor-match.png"
      alt="Second Humidor Match"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
        {RECOMMENDATIONS.map(r => {
          const on = choice === r.id
          return (
            <button key={r.id} type="button" onClick={() => { triggerHaptic('light'); setChoice(r.id) }} className="sc-tactile"
              style={{ padding: '16px 18px', borderRadius: 14, border: `1px solid ${on ? 'rgba(233,193,118,0.4)' : 'rgba(255,255,255,0.08)'}`, background: on ? 'rgba(233,193,118,0.08)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: on ? '#e9c176' : '#f5d28a', marginBottom: 4 }}>{r.label}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{r.desc}</p>
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={handleContinue} className="sc-tactile"
          style={{ height: 56, padding: '0 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          Continue <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <button onClick={() => navigate('/smokecraft/smokecraft-challenge')} className="sc-tactile"
          style={{ height: 56, padding: '0 24px', borderRadius: 12, border: '1px solid rgba(212,175,55,0.3)', background: 'transparent', color: '#e9c176', cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined">arrow_back</span> Back
        </button>
      </div>
    </SmokeCraftReferenceCanvas>
  )
}
