import { useEffect } from 'react'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

const TASTE_TAGS = ['Dark Cocoa', 'Cedar Smoke', 'Leather', 'Toasted Almond']

export default function SessionComplete() {
  const { session, addXP, completeStep, awardStamp, completeSmokeCraftSession, syncPos3Activity, syncEATActivity } = useGuestSession()

  useEffect(() => {
    const alreadyDone = session.completedSteps.includes('session-complete')
    if (!alreadyDone) {
      completeStep('session-complete')
      addXP(XP_AWARDS.SESSION_1_COMPLETE)
      awardStamp('journey-complete', 'session-complete')
      triggerHaptic('success')
    }
    completeSmokeCraftSession({ tasteProfile: TASTE_TAGS })
    syncPos3Activity()
    syncEATActivity()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/smokecraft-session-complete.png"
      alt="Session Complete"
    />
  )
}
