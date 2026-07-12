import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

const GOLD = '#E9C176'

const READINESS_ITEMS = [
  'Journey foundations reviewed',
  'Flavor memory captured',
  'Pairing preference confirmed',
  'Mentor guidance acknowledged',
  'Burn & draw quality noted',
  'Ready to receive passport stamp',
]

export default function FinalReview() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()
  const [checked, setChecked] = useState([])

  function toggleItem(item) {
    triggerHaptic('light')
    setChecked(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item])
  }

  function handleContinue() {
    awardSessionRewards('final-review')
    navigate('/smokecraft/passport-stamp')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft/FINAL%20REVIEW.png"
        alt="SmokeCraft Final Review — Journey Readiness Check"
      />

      {/* Readiness checklist — real React checkboxes */}
      <div style={{
        position: 'fixed',
        bottom: 110, left: 0, right: 0,
        zIndex: 400,
        padding: '0 16px',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(10,6,3,0.94)',
          border: '1px solid rgba(233,193,118,0.2)',
          borderRadius: 12,
          padding: '10px 14px',
          maxWidth: 500,
          margin: '0 auto',
        }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Readiness Check — {checked.length}/{READINESS_ITEMS.length}
          </div>
          {READINESS_ITEMS.map(item => (
            <label key={item} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 8, cursor: 'pointer', minHeight: 44,
              color: checked.includes(item) ? GOLD : 'rgba(229,226,225,0.7)',
              fontSize: 16, fontFamily: 'Georgia, serif',
            }}>
              <input
                type="checkbox"
                checked={checked.includes(item)}
                onChange={() => toggleItem(item)}
                style={{ width: 20, height: 20, accentColor: GOLD, cursor: 'pointer', flexShrink: 0 }}
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Continue to Passport Stamp →"
        onPrimary={handleContinue}
      />
    </>
  )
}
