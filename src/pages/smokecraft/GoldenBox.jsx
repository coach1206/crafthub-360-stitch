import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SMOKECRAFT_NAV_DESTINATIONS as NAV } from '../../constants/smokecraftNavigationRegistry.js'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const GOLDEN_BOX_ASSET = '/assets/smokecraft-reference/approved/smokecraft-gold-box-rules.png'

export default function GoldenBox() {
  const navigate = useNavigate()
  const { completeStep, awardSessionRewards } = useGuestSession()
  const { setGoldenBox } = useSmokeCraftJourney()
  const [acknowledged, setAcknowledged] = useState(false)

  const handleContinue = useCallback(() => {
    if (!acknowledged) return
    triggerHaptic('medium')
    setGoldenBox({ acknowledged: true })
    completeStep('golden-box')
    try { awardSessionRewards('golden-box') } catch (_) {}
    navigate(NAV.MENTOR)
  }, [acknowledged, navigate, completeStep, awardSessionRewards, setGoldenBox])

  return (
    <div
      aria-label="Golden Box Rules"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100dvw',
        height: '100dvh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        backgroundColor: '#050505',
        backgroundImage: `url(${GOLDEN_BOX_ASSET})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          minHeight: '116dvh',
          pointerEvents: 'none',
        }}
      />
      <label
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 'calc(82px + env(safe-area-inset-bottom, 0px))',
          transform: 'translateX(-50%)',
          zIndex: 520,
          width: 'min(92vw, 560px)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          border: `1.5px solid ${acknowledged ? '#E9C176' : 'rgba(233,193,118,0.34)'}`,
          borderRadius: 14,
          background: acknowledged ? 'rgba(9,6,3,0.92)' : 'rgba(9,6,3,0.82)',
          boxShadow: '0 16px 38px rgba(0,0,0,0.42)',
          color: '#e5e2e1',
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(12px, 1.4vw, 14px)',
          lineHeight: 1.35,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => {
            triggerHaptic('light')
            setAcknowledged(event.target.checked)
          }}
          style={{
            flex: '0 0 auto',
            width: 22,
            height: 22,
            accentColor: '#E9C176',
          }}
        />
        <span>I have read, understood, and agree to follow the Golden Box Rules.</span>
      </label>
      <SmokeCraftNavBar
        primary="Continue to Mentor Selection →"
        onPrimary={handleContinue}
        primaryDisabled={!acknowledged}
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft/venue-select')}
      />
    </div>
  )
}
