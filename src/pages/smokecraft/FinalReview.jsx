import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftReferenceCanvas from '../../components/smokecraft/SmokeCraftReferenceCanvas.jsx'

const HIGHLIGHTS = ['Flavor discovery', 'Mentor guidance', 'Pairing experiments', 'Humidor matches', 'Scorecard ranking', 'Challenge round']

export default function FinalReview() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [selected, setSelected] = useState(new Set())
  const [done, setDone] = useState(false)

  function toggle(h) { triggerHaptic('light'); setSelected(prev => { const s = new Set(prev); s.has(h) ? s.delete(h) : s.add(h); return s }) }

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('final-review')
    addXP(100)
    navigate('/smokecraft/passport-stamp')
  }

  return (
    <SmokeCraftReferenceCanvas
      src="/assets/smokecraft-reference/approved/smokecraft-final-review.png"
      alt="SmokeCraft Final Review"
    >
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f5d28a', marginBottom: 10 }}>Session Highlights</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {HIGHLIGHTS.map(h => {
            const on = selected.has(h)
            return (
              <button key={h} type="button" onClick={() => toggle(h)} className="sc-tactile"
                style={{ minHeight: 40, padding: '0 16px', borderRadius: 20, border: `1px solid ${on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)'}`, background: on ? 'rgba(233,193,118,0.14)' : 'rgba(255,255,255,0.03)', color: on ? '#e9c176' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13 }}>
                {h}
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={handleContinue} className="sc-tactile"
          style={{ height: 56, padding: '0 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          Claim Passport Stamp <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <button onClick={() => navigate('/smokecraft/mini-tasting')} className="sc-tactile"
          style={{ height: 56, padding: '0 24px', borderRadius: 12, border: '1px solid rgba(212,175,55,0.3)', background: 'transparent', color: '#e9c176', cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined">arrow_back</span> Back
        </button>
      </div>
    </SmokeCraftReferenceCanvas>
  )
}
