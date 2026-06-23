import { useNavigate } from 'react-router-dom'
import { useDemoMode } from '../../context/DemoModeContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

export default function Demo() {
  const navigate = useNavigate()
  const { enterDemoMode } = useDemoMode()

  function handleConfirm() {
    triggerHaptic('medium')
    enterDemoMode()
    navigate('/smokecraft/enroll')
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#050302', color: '#F4ECDA', fontFamily: '"Hanken Grotesk",sans-serif', display: 'flex', flexDirection: 'column' }}>
      <header style={{ height: 72, display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', borderBottom: '1px solid rgba(212,175,55,0.18)', background: 'rgba(10,7,5,0.75)' }}>
        <button
          className="sc-tactile"
          onClick={() => navigate('/smokecraft')}
          aria-label="Back"
          style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.08)', color: '#E6C76A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#E6C76A' }}>Demo Experience</span>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div
          style={{ width: 'min(460px,100%)', borderRadius: 22, border: '1.5px solid rgba(123,168,219,0.5)', padding: '32px 28px 28px', background: 'linear-gradient(180deg, rgba(20,14,9,0.97), rgba(8,5,3,0.98))', boxShadow: '0 32px 90px rgba(0,0,0,0.7), 0 0 36px rgba(91,143,201,0.16)' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18, padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(123,168,219,0.4)', background: 'rgba(91,143,201,0.1)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#9DC2EE' }}>visibility</span>
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#9DC2EE', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>Demo Mode</span>
          </div>
          <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, color: '#F4ECDA', margin: '0 0 10px' }}>This is not live venue data</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(244,236,218,0.65)', margin: '0 0 22px' }}>
            Demo Experience lets you explore the full SmokeCraft 360 journey using sample content. No real purchases, inventory changes, or venue records are created while in demo mode.
          </p>
          <button
            className="sc-tactile"
            onClick={handleConfirm}
            style={{ width: '100%', height: 52, border: '1px solid rgba(123,168,219,0.45)', borderRadius: 10, cursor: 'pointer', background: 'rgba(91,143,201,0.1)', color: '#9DC2EE', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase' }}
          >
            Continue in Demo Mode
          </button>
        </div>
      </main>
    </div>
  )
}
