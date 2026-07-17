import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftEntryHeaderBand from '../../components/smokecraft/SmokeCraftEntryHeaderBand.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD    = '#E9C176'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM   = '#e5e2e1'
const BORDER  = 'rgba(233,193,118,0.22)'
const GLASS   = 'rgba(8,10,16,0.86)'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Enroll() {
  const { session, awardSessionRewards, updateProfile } = useGuestSession()
  const navigate = useNavigate()
  const [mode, setMode] = useState(null) // null | 'signin' | 'guest'
  const [email, setEmail] = useState(session?.profile?.email || '')
  const [touched, setTouched] = useState(false)

  const emailValid = EMAIL_RE.test(email.trim())
  const isValid = mode === 'guest' || (mode === 'signin' && emailValid)

  function selectMode(next) {
    triggerHaptic('light')
    setMode(next)
  }

  function handleContinue() {
    if (!isValid) return
    triggerHaptic('medium')
    if (mode === 'signin') updateProfile({ email: email.trim() })
    awardSessionRewards('enroll')
    navigate('/smokecraft/venue-select')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: `
        radial-gradient(ellipse at 20% -10%, rgba(233,193,118,0.10), transparent 55%),
        radial-gradient(ellipse at 100% 110%, ${WOOD_DIM}, transparent 60%),
        linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)
      `,
      fontFamily: 'Georgia, serif',
    }}>
      <SmokeCraftEntryHeaderBand
        eyebrow="SmokeCraft 360"
        title="Your Guided Cigar Experience"
        subtitle="A locked 27-session continuous journey through identity, pairing, tasting, and certification — guided by a Master Mentor."
        image={SC_ASSETS.enroll}
        imagePosition="center 30%"
        overlayStrength={0.8}
      />

      <main style={{
        flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '20px clamp(16px,4vw,40px) clamp(150px,20vh,190px)',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(233,193,118,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            How would you like to continue?
          </div>

          <button
            type="button"
            aria-pressed={mode === 'guest'}
            onClick={() => selectMode('guest')}
            style={{
              textAlign: 'left', background: GLASS, borderRadius: 14, padding: '18px 20px',
              border: `1.5px solid ${mode === 'guest' ? GOLD : BORDER}`, cursor: 'pointer',
              minHeight: 64, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: CREAM, marginBottom: 4 }}>Continue as Guest</div>
            <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.65)' }}>Start right away — your progress is saved on this device.</div>
          </button>

          <button
            type="button"
            aria-pressed={mode === 'signin'}
            onClick={() => selectMode('signin')}
            style={{
              textAlign: 'left', background: GLASS, borderRadius: 14, padding: '18px 20px',
              border: `1.5px solid ${mode === 'signin' ? GOLD : BORDER}`, cursor: 'pointer',
              minHeight: 64, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: CREAM, marginBottom: 4 }}>Sign In</div>
            <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.65)' }}>Link your email so we can recognize you on return visits.</div>
          </button>

          {mode === 'signin' && (
            <div>
              <label htmlFor="enroll-email" style={{ display: 'block', fontSize: 11, color: 'rgba(229,226,225,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                id="enroll-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="you@example.com"
                style={{
                  width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${touched && !emailValid ? 'rgba(229,170,100,0.7)' : BORDER}`,
                  borderRadius: 10, padding: '12px 14px', fontSize: 14, color: CREAM,
                  fontFamily: 'Georgia, serif', outline: 'none',
                }}
              />
              {touched && !emailValid && (
                <div role="alert" style={{ marginTop: 6, fontSize: 12, color: 'rgba(229,170,100,0.9)' }}>
                  Please enter a valid email address.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <SmokeCraftNavBar
        primary="Continue →"
        onPrimary={handleContinue}
        primaryDisabled={!isValid}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </div>
  )
}
