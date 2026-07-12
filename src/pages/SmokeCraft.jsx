import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../utils/haptics.js'
import SmokeCraftAssetScreen from '../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../components/smokecraft/SmokeCraftNavBar.jsx'

const GOLD = '#E9C176'
const DARK = '#0a0603'

const SECONDARY_NAV = [
  { label: 'Browse Humidor', to: '/smokecraft/humidor-match' },
  { label: 'Enter Challenge', to: '/smokecraft/smokecraft-challenge' },
  { label: 'How It Works', to: '/smokecraft/how-it-works' },
  { label: 'View Pairing', to: '/smokecraft/pairing-lab' },
  { label: 'My Passport', to: '/smokecraft/passport-stamp' },
  { label: 'Rankings', to: '/smokecraft/leaderboard' },
]

export default function SmokeCraft() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()

  function handleStartNew() {
    triggerHaptic('medium')
    navigate('/smokecraft/identity')
  }

  function handleContinue() {
    triggerHaptic('light')
    navigate('/smokecraft/enroll')
  }

  function handleSecondary(to) {
    triggerHaptic('light')
    navigate(to)
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft-reference/approved/smokecraft-landing.png"
        alt="SmokeCraft 360 — The Guided Cigar Experience"
      />

      {/* Secondary navigation grid */}
      <div style={{
        position: 'fixed',
        bottom: 168, left: 0, right: 0,
        zIndex: 400,
        padding: '0 16px',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(10,6,3,0.93)',
          border: '1px solid rgba(233,193,118,0.18)',
          borderRadius: 12,
          padding: '10px 12px',
          maxWidth: 520,
          margin: '0 auto',
        }}>
          <div style={{
            fontSize: 11,
            color: GOLD,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            SmokeCraft 360
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SECONDARY_NAV.map(item => (
              <button
                key={item.to}
                type="button"
                aria-label={item.label}
                onClick={() => handleSecondary(item.to)}
                style={{
                  background: 'transparent',
                  color: GOLD,
                  border: '1px solid rgba(233,193,118,0.35)',
                  borderRadius: 20,
                  padding: '11px 16px',
                  minHeight: 44,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'Georgia, serif',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Start New SmokeCraft Session →"
        onPrimary={handleStartNew}
        secondary="Continue Previous Session"
        onSecondary={handleContinue}
      />
    </>
  )
}
