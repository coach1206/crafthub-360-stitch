import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../utils/haptics.js'
import SmokeCraftAssetScreen from '../components/smokecraft/SmokeCraftAssetScreen.jsx'

// Approved landing reference — wide CraftHub 360 composition
const LANDING_SRC = '/assets/smokecraft-reference/approved/smokecraft-landing.png'

const GOLD    = '#E9C176'
const GOLD_DIM = 'rgba(233,193,118,0.65)'
const DARK    = '#0a0603'
const PANEL   = 'rgba(5,3,1,0.88)'
const BORDER  = 'rgba(233,193,118,0.20)'

// Navigation items that match the approved landing composition
const NAV_ITEMS = [
  { label: 'How It Works',   to: '/smokecraft/how-it-works' },
  { label: 'My Passport',    to: '/smokecraft/passport-stamp' },
  { label: 'View Pairing',   to: '/smokecraft/pairing-lab' },
  { label: 'Rankings',       to: '/smokecraft/leaderboard' },
  { label: 'Browse Humidor', to: '/smokecraft/humidor-match' },
  { label: 'Enter Challenge', to: '/smokecraft/smokecraft-challenge' },
]

const chipStyle = {
  background: 'transparent',
  color: GOLD_DIM,
  border: `1px solid rgba(233,193,118,0.28)`,
  borderRadius: 20,
  padding: '10px 14px',
  minHeight: 44,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'Georgia, serif',
  cursor: 'pointer',
  letterSpacing: '0.04em',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  flex: '1 1 auto',
  minWidth: 110,
  textAlign: 'center',
}

export default function SmokeCraft() {
  const navigate = useNavigate()
  // Read saved progress once at mount from localStorage
  const [hasSavedProgress] = useState(() => {
    try {
      const raw = localStorage.getItem('smokecraft_progress')
      if (!raw) return false
      const d = JSON.parse(raw)
      return Array.isArray(d.completedSessions) && d.completedSessions.length > 0
    } catch { return false }
  })

  function go(to) {
    triggerHaptic('light')
    navigate(to)
  }

  return (
    <SmokeCraftAssetScreen
      src={LANDING_SRC}
      classification="DECORATIVE_BACKGROUND"
      alt="SmokeCraft 360 — The Guided Cigar Experience"
    >
      {/* Bottom action dock — sits within the landing composition, no floating overlay */}
      <div
        aria-label="SmokeCraft navigation"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 300,
          padding: '0 16px max(env(safe-area-inset-bottom, 12px), 12px)',
          background: `linear-gradient(to top, ${PANEL} 60%, transparent)`,
        }}
      >
        {/* Primary actions */}
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <button
            type="button"
            onClick={() => { triggerHaptic('medium'); navigate('/smokecraft/identity') }}
            style={{
              display: 'block',
              width: '100%',
              background: GOLD,
              color: DARK,
              border: 'none',
              borderRadius: 28,
              padding: '16px 24px',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'Georgia, serif',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              minHeight: 52,
              boxShadow: '0 4px 24px rgba(233,193,118,0.4)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              marginBottom: hasSavedProgress ? 10 : 14,
            }}
          >
            Start SmokeCraft
          </button>

          {hasSavedProgress && (
            <button
              type="button"
              onClick={() => { triggerHaptic('light'); navigate('/smokecraft/enroll') }}
              style={{
                display: 'block',
                width: '100%',
                background: 'transparent',
                color: GOLD,
                border: `1.5px solid ${GOLD}`,
                borderRadius: 28,
                padding: '14px 24px',
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'Georgia, serif',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                minHeight: 48,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                marginBottom: 14,
              }}
            >
              Continue Previous Session
            </button>
          )}

          {/* Secondary navigation — 2-row chip grid */}
          <div
            style={{
              borderTop: `1px solid ${BORDER}`,
              paddingTop: 10,
              marginBottom: 8,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {NAV_ITEMS.map(item => (
              <button
                key={item.to}
                type="button"
                aria-label={item.label}
                onClick={() => go(item.to)}
                style={chipStyle}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SmokeCraftAssetScreen>
  )
}
