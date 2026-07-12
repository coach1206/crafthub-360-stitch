import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSmokeCraftProgress } from '../context/SmokeCraftProgressContext.jsx'
import { triggerHaptic } from '../utils/haptics.js'
import SmokeCraftAssetScreen from '../components/smokecraft/SmokeCraftAssetScreen.jsx'

// Read-once at mount to avoid re-reading stale context values
function readSavedProgress() {
  try {
    const raw = localStorage.getItem('smokecraft_progress')
    if (!raw) return false
    const data = JSON.parse(raw)
    // Non-empty completedSessions means the guest has moved past session 1
    return Array.isArray(data.completedSessions) && data.completedSessions.length > 0
  } catch { return false }
}

const GOLD   = '#E9C176'
const GOLD_DIM = 'rgba(233,193,118,0.72)'
const DARK   = '#0a0603'
const PANEL  = 'rgba(5,3,1,0.82)'
const BORDER = 'rgba(233,193,118,0.18)'

// Clean atmospheric cigar photography — no printed buttons or navigation
const LANDING_BG = '/assets/smokecraft-reference/approved/smokecraft-art.png'

// Quick-access grid items (each appears exactly once)
const QUICK_NAV = [
  { label: 'View Passport',  to: '/smokecraft/passport-stamp' },
  { label: 'View Pairing',   to: '/smokecraft/pairing-lab' },
  { label: 'Browse Humidor', to: '/smokecraft/humidor-match' },
  { label: 'Enter Challenge', to: '/smokecraft/smokecraft-challenge' },
  { label: 'Rankings',       to: '/smokecraft/leaderboard' },
  { label: 'CraftHub',       to: '/crafthub' },
]

const btn = {
  display: 'block',
  width: '100%',
  border: 'none',
  borderRadius: 28,
  padding: '17px 24px',
  fontSize: 16,
  fontWeight: 700,
  fontFamily: 'Georgia, serif',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  minHeight: 52,
  boxSizing: 'border-box',
}

const chipBtn = {
  background: 'transparent',
  color: GOLD_DIM,
  border: `1px solid rgba(233,193,118,0.25)`,
  borderRadius: 20,
  padding: '12px 16px',
  minHeight: 44,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'Georgia, serif',
  cursor: 'pointer',
  letterSpacing: '0.04em',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  boxSizing: 'border-box',
  flex: '1 1 calc(33% - 6px)',
  minWidth: 120,
}

export default function SmokeCraft() {
  const navigate = useNavigate()
  const { isDemoMode } = useSmokeCraftProgress()
  // Read saved-progress once at mount from localStorage; isDemoMode also enables Continue
  const [hasSavedProgress] = useState(() => isDemoMode || readSavedProgress())

  function handleStart() {
    triggerHaptic('medium')
    navigate('/smokecraft/identity')
  }

  function handleContinue() {
    triggerHaptic('light')
    navigate('/smokecraft/enroll')
  }

  function handleHowItWorks() {
    triggerHaptic('light')
    navigate('/smokecraft/how-it-works')
  }

  function handleNav(to) {
    triggerHaptic('light')
    navigate(to)
  }

  return (
    <SmokeCraftAssetScreen
      src={LANDING_BG}
      classification="DECORATIVE_BACKGROUND"
      alt="SmokeCraft 360 — The Guided Cigar Experience"
    >
      {/* Full-height scrollable container — normal document flow, no fixed/absolute */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Gradient veil — lets atmospheric photo show through at top, darkens toward content */}
        <div
          aria-hidden="true"
          style={{
            position: 'sticky',
            top: 0,
            height: 0,
            overflow: 'visible',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Spacer — atmospheric photo visible at top */}
        <div style={{ flex: '0 0 clamp(120px, 28vh, 220px)' }} />

        {/* Content panel */}
        <div
          style={{
            background: PANEL,
            borderTop: `1px solid ${BORDER}`,
            flex: 1,
            padding: 'clamp(24px, 4vw, 48px) clamp(16px, 5vw, 40px) clamp(40px, 8vh, 80px)',
            maxWidth: 680,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              CraftHub 360
            </div>
            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(26px, 5vw, 38px)',
              fontWeight: 700,
              color: '#e5e2e1',
              margin: 0,
              letterSpacing: '0.04em',
            }}>
              SmokeCraft 360
            </h1>
          </div>

          {/* Hero */}
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <p style={{
              fontSize: 'clamp(16px, 2.4vw, 18px)',
              color: GOLD,
              fontFamily: 'Georgia, serif',
              fontWeight: 600,
              margin: '0 0 10px',
              letterSpacing: '0.02em',
            }}>
              Discover Your Cigar Profile
            </p>
            <p style={{
              fontSize: 16,
              color: 'rgba(229,226,225,0.72)',
              fontFamily: 'Georgia, serif',
              margin: 0,
              lineHeight: 1.65,
            }}>
              Your personalized cigar journey. Explore, learn, pair, and track
              every step with craftsmanship and purpose.
            </p>
          </div>

          {/* Primary actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            <button
              type="button"
              onClick={handleStart}
              style={{
                ...btn,
                background: GOLD,
                color: DARK,
                boxShadow: '0 4px 24px rgba(233,193,118,0.4)',
              }}
            >
              Start SmokeCraft
            </button>

            {hasSavedProgress && (
              <button
                type="button"
                onClick={handleContinue}
                style={{
                  ...btn,
                  background: 'transparent',
                  color: GOLD,
                  border: `1.5px solid ${GOLD}`,
                }}
              >
                Continue Previous Session
              </button>
            )}

            <button
              type="button"
              onClick={handleHowItWorks}
              style={{
                ...btn,
                background: 'transparent',
                color: 'rgba(229,226,225,0.65)',
                border: '1px solid rgba(229,226,225,0.2)',
                fontSize: 15,
                padding: '14px 24px',
              }}
            >
              How It Works
            </button>
          </div>

          {/* Quick access */}
          <div style={{
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 20,
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'rgba(233,193,118,0.55)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}>
              Quick Access
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}>
              {QUICK_NAV.map(item => (
                <button
                  key={item.to}
                  type="button"
                  aria-label={item.label}
                  onClick={() => handleNav(item.to)}
                  style={chipBtn}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SmokeCraftAssetScreen>
  )
}
