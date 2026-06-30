import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftReferenceCanvas from '../../components/smokecraft/SmokeCraftReferenceCanvas.jsx'

export default function HowItWorks() {
  const navigate = useNavigate()

  function handleStart() {
    triggerHaptic('medium')
    navigate('/smokecraft/enroll')
  }

  return (
    <SmokeCraftReferenceCanvas
      src="/assets/smokecraft-reference/approved/smokecraft-how-it-works.png"
      alt="How SmokeCraft Works"
    >
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          className="sc-tactile"
          onClick={handleStart}
          style={{ height: 60, padding: '0 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #E9C176, #B8952A)', color: '#1A1207', fontFamily: '"JetBrains Mono",monospace', fontSize: 13, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          Start SmokeCraft
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <button
          className="sc-tactile"
          onClick={() => navigate('/smokecraft')}
          style={{ height: 60, padding: '0 24px', borderRadius: 12, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(212,175,55,0.35)', color: '#E6C76A', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </button>
      </div>
    </SmokeCraftReferenceCanvas>
  )
}
