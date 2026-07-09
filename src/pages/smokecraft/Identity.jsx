import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function Identity() {
  const { awardSessionRewards } = useGuestSession()

  const HOTSPOTS = [
    {
      label: 'Continue to Gold Box',
      x: 10, y: 75, width: 80, height: 20,
      // 'enroll' is the SESSION_REWARDS key for session 2 — the identity/profile-capture step.
      // Route is /smokecraft/identity (alias of /smokecraft/enroll). Key must stay 'enroll'.
      onClick: () => { triggerHaptic('medium'); awardSessionRewards('enroll') },
      to: '/smokecraft/golden-box',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-profile-capture.png"
      alt="Profile Capture"
      hotspots={HOTSPOTS}
      route="/smokecraft/identity"
    />
  )
}
