import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

const GOLD = '#E9C176'

export default function GoldenBox() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()
  const [acknowledged, setAcknowledged] = useState(false)

  function handleContinue() {
    if (!acknowledged) return
    awardSessionRewards('golden-box')
    navigate('/smokecraft/mentor-selection')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft/GOLDEN%20BOX%20RULES.png"
        alt="SmokeCraft Golden Box Rules — The Five Principles"
      />

      {/* Rule acknowledgement — real React checkbox, not a hotspot */}
      <div style={{
        position: 'fixed',
        bottom: 110, left: 0, right: 0,
        zIndex: 400,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <label style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(10,6,3,0.92)',
          border: `1px solid rgba(233,193,118,0.3)`,
          borderRadius: 10,
          padding: '10px 16px',
          cursor: 'pointer',
          color: GOLD,
          fontFamily: 'Georgia, serif',
          fontSize: 16,
          letterSpacing: '0.05em',
        }}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={e => { triggerHaptic('light'); setAcknowledged(e.target.checked) }}
            style={{ width: 18, height: 18, accentColor: GOLD, cursor: 'pointer' }}
          />
          I acknowledge the Golden Box rules and commit to the experience
        </label>
      </div>

      <SmokeCraftNavBar
        primary="Continue to Mentor Selection →"
        onPrimary={handleContinue}
        primaryDisabled={!acknowledged}
      />
    </>
  )
}
