import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import SmokeCraftReferenceCanvas from '../../components/smokecraft/SmokeCraftReferenceCanvas.jsx'

export default function Art() {
  const navigate = useNavigate()
  const { addXP, addBadge, completeStep } = useGuestSession()
  const [accepted, setAccepted] = useState(false)

  function handleContinue() {
    if (accepted) return
    setAccepted(true)
    addXP(50)
    addBadge({ id: 'art-appreciation', name: 'Art Appreciation', icon: 'palette' })
    completeStep('art')
    setTimeout(() => navigate('/smokecraft/mentor'), 500)
  }

  return (
    <SmokeCraftReferenceCanvas
      src="/assets/smokecraft-reference/approved/smokecraft-art.png"
      alt="The Art of SmokeCraft"
    >
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={handleContinue} disabled={accepted} className="sc-tactile"
          style={{ height: 56, padding: '0 32px', borderRadius: 12, border: 'none', cursor: accepted ? 'default' : 'pointer', background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, opacity: accepted ? 0.7 : 1 }}>
          {accepted ? 'Continuing...' : 'Select My Mentor'}
          <span className="material-symbols-outlined">{accepted ? 'check' : 'arrow_forward'}</span>
        </button>
        <button onClick={() => navigate('/smokecraft')} className="sc-tactile"
          style={{ height: 56, padding: '0 24px', borderRadius: 12, border: '1px solid rgba(212,175,55,0.3)', background: 'transparent', color: '#e9c176', cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined">arrow_back</span> Back
        </button>
      </div>
    </SmokeCraftReferenceCanvas>
  )
}
