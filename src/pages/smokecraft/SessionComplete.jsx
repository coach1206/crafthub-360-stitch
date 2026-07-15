import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1448
const NAT_H = 1086

const GOLD = '#E9C176'

export default function SessionComplete() {
  const { session, awardSessionRewards, awardStamp } = useGuestSession()
  const { journey } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const cigarName     = journey?.selectedCigar?.name   || null
  const pairingRec    = journey?.pairing?.recommendation || null
  const mentorName    = Array.isArray(journey?.mentor) && journey.mentor.length > 0
    ? journey.mentor[0]?.name || null : null
  const flavors       = journey?.flavorMemory?.selectedFlavors || []
  const guestName     = journey?.identity?.preferredName || journey?.identity?.fullName || null
  const formatLabel   = journey?.format?.label || null

  useEffect(() => {
    if (!session.completedSteps.includes('session-complete')) {
      awardSessionRewards('session-complete')
      awardStamp('journey-complete', 'session-complete')
      triggerHaptic('success')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const textStyle = {
    pointerEvents: 'none',
    fontFamily: 'Georgia, serif',
    fontWeight: 600,
    color: GOLD,
    letterSpacing: '0.03em',
    userSelect: 'none',
    fontSize: 'clamp(10px,1.2vw,16px)',
    lineHeight: 1.4,
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.sessionComplete}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft 360 — Session Complete"
      >
        {/* Journey summary — displayed in the lower data zone of the image */}
        <div style={{
          position: 'absolute',
          left: '5%', top: '55%',
          width: '55%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5%',
          ...textStyle,
        }}>
          {guestName    && <span>{guestName}</span>}
          {cigarName    && <span>{cigarName}</span>}
          {formatLabel  && <span>{formatLabel}</span>}
          {pairingRec   && <span>{pairingRec}</span>}
          {mentorName   && <span>{mentorName}</span>}
          {flavors.length > 0 && (
            <span>{flavors.join(', ')}</span>
          )}
        </div>
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary="Return to SmokeCraft"
        onPrimary={() => navigate('/smokecraft')}
      />
    </>
  )
}
