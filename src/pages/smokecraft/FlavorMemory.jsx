import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftReferenceCanvas from '../../components/smokecraft/SmokeCraftReferenceCanvas.jsx'

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
    <SmokeCraftReferenceCanvas
      src="/assets/smokecraft-reference/approved/smokecraft-flavor-memory.png"
      alt="Flavor Memory"
    >
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f5d28a', marginBottom: 12 }}>Select Your Memories</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {MEMORIES.map(m => {
            const on = selected.has(m)
            return (
              <button key={m} type="button" onClick={() => toggle(m)}
                className="sc-tactile"
                style={{ minHeight: 44, padding: '0 18px', borderRadius: 22, border: `1px solid ${on ? 'rgba(233,193,118,0.55)' : 'rgba(233,193,118,0.25)'}`, background: on ? 'rgba(233,193,118,0.14)' : 'rgba(255,255,255,0.04)', color: on ? '#e9c176' : 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {m}
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={handleContinue} className="sc-tactile"
          style={{ height: 56, padding: '0 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          Final Third <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <button onClick={() => navigate('/smokecraft/second-third')} className="sc-tactile"
          style={{ height: 56, padding: '0 24px', borderRadius: 12, border: '1px solid rgba(212,175,55,0.3)', background: 'transparent', color: '#e9c176', cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined">arrow_back</span> Back
        </button>
      </div>
    </SmokeCraftReferenceCanvas>
  )
}
