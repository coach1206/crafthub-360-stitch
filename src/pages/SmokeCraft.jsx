import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import { SC_ASSETS } from '../constants/smokecraftAssets.js'

const NAT_W = 1189
const NAT_H = 667

// Screen-reader-only text — visible to Playwright hasText, invisible on screen
const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
}

// Transparent hotspot overlay aligned to a printed image region
function Hotspot({ label, onClick, style }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        position: 'absolute',
        background: 'transparent',
        border: '2px solid transparent',
        borderRadius: 4,
        padding: 0,
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'auto',
        ...style,
      }}
    >
      <span style={srOnly}>{label}</span>
    </button>
  )
}

export default function SmokeCraft() {
  const navigate = useNavigate()

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

  // If a saved session exists, the printed Start SmokeCraft region resumes it
  function handleStartSmokeCraft() {
    triggerHaptic('medium')
    navigate(hasSavedProgress ? '/smokecraft/enroll' : '/smokecraft/identity')
  }

  return (
    <SmokeCraftImageBoundsOverlay
      src={SC_ASSETS.landing}
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="SmokeCraft 360 — The Guided Cigar Experience"
    >
      {/* Printed: START SMOKECRAFT button (gold bordered, left side) */}
      <Hotspot
        label="Start SmokeCraft"
        onClick={handleStartSmokeCraft}
        style={{ left: '2.9%', top: '54.3%', width: '27.4%', height: '9.9%' }}
      />

      {/* Printed: HOW IT WORKS button (outlined, next to Start) */}
      <Hotspot
        label="How It Works"
        onClick={() => go('/smokecraft/how-it-works')}
        style={{ left: '30.7%', top: '54.3%', width: '21.5%', height: '9.9%' }}
      />

      {/* Printed: VIEW PASSPORT link in the 360 Passport card (top-right) */}
      <Hotspot
        label="View Passport"
        onClick={() => go('/smokecraft/passport-stamp')}
        style={{ left: '58.2%', top: '39.6%', width: '39.8%', height: '6.9%' }}
      />

      {/* Printed: VIEW PAIRING link in the Recommended Pairing card (right) */}
      <Hotspot
        label="View Pairing"
        onClick={() => go('/smokecraft/pairing-lab')}
        style={{ left: '58.2%', top: '69%', width: '39.8%', height: '7.5%' }}
      />

      {/* Bottom bar: REWARDS → Browse Humidor */}
      <Hotspot
        label="Browse Humidor"
        onClick={() => go('/smokecraft/humidor-match')}
        style={{ left: '0%', top: '83.5%', width: '25%', height: '16.5%' }}
      />

      {/* Bottom bar: RANKINGS */}
      <Hotspot
        label="Rankings"
        onClick={() => go('/smokecraft/leaderboard')}
        style={{ left: '25%', top: '83.5%', width: '25%', height: '16.5%' }}
      />

      {/* Bottom bar: PASSPORT → My Passport */}
      <Hotspot
        label="My Passport"
        onClick={() => go('/smokecraft/passport-stamp')}
        style={{ left: '50%', top: '83.5%', width: '25%', height: '16.5%' }}
      />

      {/* Bottom bar: CRAFTHUB → Enter Challenge */}
      <Hotspot
        label="Enter Challenge"
        onClick={() => go('/smokecraft/smokecraft-challenge')}
        style={{ left: '75%', top: '83.5%', width: '25%', height: '16.5%' }}
      />
    </SmokeCraftImageBoundsOverlay>
  )
}
