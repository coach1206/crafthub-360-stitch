import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function HumidorMatch() {
  const { awardSessionRewards } = useGuestSession()

  const HOTSPOTS = [
    {
      label: 'Request Purchase',
      x: 10, y: 75, width: 80, height: 20,
      onClick: () => { triggerHaptic('medium'); awardSessionRewards('humidor-match') },
      to: '/smokecraft/request-purchase',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-humidor-match.png"
      alt="Humidor Match"
      hotspots={HOTSPOTS}
      route="/smokecraft/humidor-match"
    />
  )
}
