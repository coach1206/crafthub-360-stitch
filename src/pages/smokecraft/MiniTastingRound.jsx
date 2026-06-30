import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftReferenceCanvas from '../../components/smokecraft/SmokeCraftReferenceCanvas.jsx'

const NOTES = ['Spice', 'Cedar', 'Cocoa', 'Citrus', 'Earth', 'Vanilla']

export default function MiniTastingRound() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [selected, setSelected] = useState(new Set())
  const [rating, setRating] = useState(0)
  const [done, setDone] = useState(false)

  function toggle(n) { triggerHaptic('light'); setSelected(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s }) }

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('mini-tasting')
    addXP(75)
    navigate('/smokecraft/final-review')
  }

  return (
    <SmokeCraftReferenceCanvas
      src="/assets/smokecraft-reference/approved/smokecraft-mini-tasting-round.png"
      alt="Mini Tasting Round"
    >
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f5d28a', marginBottom: 10 }}>Flavor Notes</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {NOTES.map(n => {
            const on = selected.has(n)
            return (
              <button key={n} type="button" onClick={() => toggle(n)} className="sc-tactile"
                style={{ minHeight: 40, padding: '0 16px', borderRadius: 20, border: `1px solid ${on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)'}`, background: on ? 'rgba(233,193,118,0.14)' : 'rgba(255,255,255,0.03)', color: on ? '#e9c176' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13 }}>
                {n}
              </button>
            )
          })}
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f5d28a', marginBottom: 10 }}>Overall Rating</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1,2,3,4,5].map(v => (
            <button key={v} onClick={() => { triggerHaptic('light'); setRating(v) }} className="sc-tactile"
              style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${rating >= v ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.2)'}`, background: rating >= v ? 'rgba(233,193,118,0.14)' : 'rgba(255,255,255,0.03)', color: rating >= v ? '#e9c176' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={handleContinue} className="sc-tactile"
          style={{ height: 56, padding: '0 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          Continue <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <button onClick={() => navigate('/smokecraft/second-humidor-match')} className="sc-tactile"
          style={{ height: 56, padding: '0 24px', borderRadius: 12, border: '1px solid rgba(212,175,55,0.3)', background: 'transparent', color: '#e9c176', cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined">arrow_back</span> Back
        </button>
      </div>
    </SmokeCraftReferenceCanvas>
  )
}
