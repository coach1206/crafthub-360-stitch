import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1448
const NAT_H = 1086

export default function SessionComplete() {
  const { session, awardSessionRewards, awardStamp } = useGuestSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!session.completedSteps.includes('session-complete')) {
      awardSessionRewards('session-complete')
      awardStamp('journey-complete', 'session-complete')
      triggerHaptic('success')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.sessionComplete}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft 360 — Session Complete"
      />

      <SmokeCraftNavBar
        primary="Return to SmokeCraft"
        onPrimary={() => navigate('/smokecraft')}
      />
    </>
  )
}
