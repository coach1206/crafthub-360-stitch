import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function RequestPurchase() {
  const { completeStep, addXP } = useGuestSession()

  const HOTSPOTS = [
    {
      label: 'Continue to Cut Toast Light',
      x: 10, y: 75, width: 80, height: 20,
      onClick: () => { triggerHaptic('medium'); completeStep('request-purchase'); addXP(50) },
      to: '/smokecraft/cut-toast-light',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-request-purchase.png"
      alt="Request Purchase"
      hotspots={HOTSPOTS}
      route="/smokecraft/request-purchase"
    />
  )
}
