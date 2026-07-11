import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

const GOLD = '#E9C176'
const DARK = '#0a0603'

const CUT_METHODS = ['Straight Cut', 'V-Cut', 'Punch Cut']
const TOAST_METHODS = ['Gentle Toast', 'Foot Toast', 'Full Toast']
const LIGHT_METHODS = ['Cedar Spill', 'Torch Lighter', 'Soft Flame']

function MethodGroup({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {options.map(opt => {
          const active = value === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => { triggerHaptic('light'); onChange(active ? null : opt) }}
              style={{
                background: active ? GOLD : 'transparent',
                color: active ? DARK : GOLD,
                border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.4)'}`,
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
                letterSpacing: '0.03em',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CutToastLight() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()
  const [cutMethod, setCutMethod] = useState(null)
  const [toastMethod, setToastMethod] = useState(null)
  const [lightMethod, setLightMethod] = useState(null)

  function handleContinue() {
    awardSessionRewards('cut-toast-light')
    navigate('/smokecraft/first-third')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft/CUT, TOAST,& LIGHT22.png"
        alt="SmokeCraft Cut, Toast & Light — Preparation Methods"
      />

      {/* Method selectors — real React state */}
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
          padding: '10px 12px',
          maxWidth: 500,
          margin: '0 auto',
        }}>
          <MethodGroup label="Cutting Method" options={CUT_METHODS} value={cutMethod} onChange={setCutMethod} />
          <MethodGroup label="Toasting Technique" options={TOAST_METHODS} value={toastMethod} onChange={setToastMethod} />
          <MethodGroup label="Lighting Method" options={LIGHT_METHODS} value={lightMethod} onChange={setLightMethod} />
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Continue to First Third →"
        onPrimary={handleContinue}
      />
    </>
  )
}
