import { useEffect } from 'react'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const TASTE_TAGS = ['Dark Cocoa', 'Cedar Smoke', 'Leather', 'Toasted Almond']

export default function SessionComplete() {
  const { session, awardSessionRewards, awardStamp, completeSmokeCraftSession, syncPos3Activity, syncEATActivity } = useGuestSession()

  useEffect(() => {
    const alreadyDone = session.completedSteps.includes('session-complete')
    if (!alreadyDone) {
      awardSessionRewards('session-complete')
      awardStamp('journey-complete', 'session-complete')
      triggerHaptic('success')
    }
    completeSmokeCraftSession({ tasteProfile: TASTE_TAGS })
    syncPos3Activity()
    syncEATActivity()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hotspots = [
    {
      label: 'Staff Handoff',
      x: 10, y: 75, width: 80, height: 20,
      to: '/pos3',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-session-complete.png"
      alt="Session Complete"
      hotspots={hotspots}
      route="/smokecraft/session-complete"
    />
  )
}
