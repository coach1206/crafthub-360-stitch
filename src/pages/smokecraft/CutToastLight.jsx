import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function CutToastLight() {
  const { awardSessionRewards } = useGuestSession()

  const HOTSPOTS = [
    {
      label: 'Continue to First Third',
      x: 10, y: 75, width: 80, height: 20,
      onClick: () => { triggerHaptic('medium'); awardSessionRewards('cut-toast-light') },
      to: '/smokecraft/first-third',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-cut-toast-light.png"
      alt="Cut Toast Light"
      hotspots={HOTSPOTS}
      route="/smokecraft/cut-toast-light"
    />
  )
}
