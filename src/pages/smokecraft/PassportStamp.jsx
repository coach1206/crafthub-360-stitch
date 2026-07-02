import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function PassportStamp() {
  const { awardSessionRewards } = useGuestSession()

  const HOTSPOTS = [
    {
      label: 'Continue to Connections',
      x: 10, y: 75, width: 80, height: 20,
      onClick: () => { triggerHaptic('medium'); awardSessionRewards('passport-stamp') },
      to: '/smokecraft/connections',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-passport-stamp.png"
      alt="Passport Stamp"
      hotspots={HOTSPOTS}
      route="/smokecraft/passport-stamp"
    />
  )
}
