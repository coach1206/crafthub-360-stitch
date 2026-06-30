import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

export default function GuestPass() {
  const navigate = useNavigate()
  const { updateProfile } = useGuestSession()
  const [code, setCode] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    triggerHaptic('medium')
    if (code) updateProfile({ venueGuestPassCode: code })
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
        <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#E6C76A' }}>Venue Guest Pass</span>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <img src="/assets/smokecraft-reference/approved/smokecraft-guest-pass.png" alt="SmokeCraft Guest Pass" style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain', marginBottom: 28, maxWidth: 640 }} />
        <form
          onSubmit={handleSubmit}
          style={{ width: 'min(420px,100%)', borderRadius: 22, border: '1.5px solid rgba(233,193,118,0.6)', padding: '32px 28px 28px', background: 'linear-gradient(180deg, rgba(20,14,9,0.97), rgba(8,5,3,0.98))', boxShadow: '0 32px 90px rgba(0,0,0,0.7), 0 0 36px rgba(233,193,118,0.18)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#E6C76A', marginBottom: 14, display: 'block' }}>badge</span>
          <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, color: '#f7d88a', margin: '0 0 10px' }}>Venue Guest Pass</h3>
          <p style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(244,236,218,0.65)', margin: '0 0 18px' }}>
            Enter the guest pass code provided by the venue (QR scan, text link, or staff-issued access) to begin your session.
          </p>
          <input
            autoFocus
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Guest pass code"
            style={{ width: '100%', height: 48, borderRadius: 10, border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(255,255,255,0.04)', color: '#f4ead7', padding: '0 16px', marginBottom: 16, fontSize: 14 }}
          />
          <button
            type="submit"
            className="sc-tactile"
            style={{ width: '100%', height: 52, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'linear-gradient(135deg, #E9C176, #B8952A)', color: '#1A1207', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase' }}
          >
            Enter SmokeCraft
          </button>
        </form>
      </main>
    </div>
  )
}
