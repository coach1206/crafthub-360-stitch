import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftReferenceCanvas from '../../components/smokecraft/SmokeCraftReferenceCanvas.jsx'

const PAIRINGS = [
  { id: 'scotch',     label: 'Single Malt Scotch', desc: 'Smoky, peaty — mirrors a full-bodied cigar.' },
  { id: 'rum',        label: 'Añejo Rum',           desc: 'Sweet caramel notes complement medium wrappers.' },
  { id: 'espresso',   label: 'Dark Espresso',       desc: 'Bitter contrast that sharpens flavor transitions.' },
  { id: 'chocolate',  label: 'Dark Chocolate 72%',  desc: 'Bittersweet harmony with cocoa-forward tobacco.' },
]

export default function PairingLab() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [pairing, setPairing] = useState(null)
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('pairing-lab')
    addXP(75)
    navigate('/smokecraft/humidor-match')
  }

  return (
    <SmokeCraftReferenceCanvas
      src="/assets/smokecraft-reference/approved/smokecraft-pairing-lab.png"
      alt="Pairing Lab"
    >
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f5d28a', marginBottom: 12 }}>Choose Your Pairing</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {PAIRINGS.map(p => {
            const on = pairing === p.id
            return (
              <button key={p.id} type="button" onClick={() => { triggerHaptic('light'); setPairing(p.id) }} className="sc-tactile"
                style={{ padding: '16px 18px', borderRadius: 14, border: `1px solid ${on ? 'rgba(233,193,118,0.5)' : 'rgba(233,193,118,0.22)'}`, background: on ? 'rgba(233,193,118,0.12)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'left' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: on ? '#e9c176' : '#f5d28a', marginBottom: 4 }}>{p.label}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{p.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={handleContinue} className="sc-tactile"
          style={{ height: 56, padding: '0 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          Continue <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <button onClick={() => navigate('/smokecraft/seed-soil')} className="sc-tactile"
          style={{ height: 56, padding: '0 24px', borderRadius: 12, border: '1px solid rgba(212,175,55,0.3)', background: 'transparent', color: '#e9c176', cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined">arrow_back</span> Back
        </button>
      </div>
    </SmokeCraftReferenceCanvas>
  )
}
