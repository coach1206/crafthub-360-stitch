import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

export default function Scan() {
  const navigate = useNavigate()
  const { updateProfile } = useGuestSession()
  const [code, setCode] = useState('')

  function handleManualSubmit(e) {
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
        <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#E6C76A' }}>Scan QR Code</span>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(201,168,76,0.28)', marginBottom: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.45)', width: '100%', maxWidth: 640 }}>
          <img src="/assets/smokecraft-reference/approved/smokecraft-scan.png" alt="SmokeCraft Scan" style={{ display: 'block', width: '100%', minHeight: 260, maxHeight: 420, objectFit: 'cover', objectPosition: 'center top' }} />
        </div>
        <div
          style={{ width: 'min(420px,100%)', borderRadius: 22, border: '1.5px solid rgba(233,193,118,0.6)', padding: '32px 28px 28px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(20,14,9,0.97), rgba(8,5,3,0.98))', boxShadow: '0 32px 90px rgba(0,0,0,0.7), 0 0 36px rgba(233,193,118,0.18)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 64, color: '#E6C76A', marginBottom: 12, display: 'block' }}>qr_code_scanner</span>
          <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, color: '#f7d88a', margin: '0 0 10px' }}>Scan QR Code</h3>
          <p style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(244,236,218,0.65)', margin: '0 0 22px' }}>
            Point your camera at a table, bar, humidor, or event QR code to enter SmokeCraft 360 directly into that context. Camera scanning activates on the venue device.
          </p>

          <div style={{ borderTop: '1px solid rgba(212,175,55,0.2)', paddingTop: 20, textAlign: 'left' }}>
            <p style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#E6C76A', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
              No camera? Enter venue code manually
            </p>
            <form onSubmit={handleManualSubmit}>
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Venue code"
                style={{ width: '100%', height: 48, borderRadius: 10, border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(255,255,255,0.04)', color: '#f4ead7', padding: '0 16px', marginBottom: 14, fontSize: 14 }}
              />
              <button
                type="submit"
                className="sc-tactile"
                style={{ width: '100%', height: 50, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'linear-gradient(135deg, #E9C176, #B8952A)', color: '#1A1207', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
