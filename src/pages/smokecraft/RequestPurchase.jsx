import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'
import SmokeCraftMenuButton from '../../components/smokecraft/SmokeCraftMenuButton.jsx'
import { useSmokeCraftOrder } from '../../context/SmokeCraftOrderContext.jsx'

export default function RequestPurchase() {
  const { awardSessionRewards } = useGuestSession()
  const { setResumeRoute } = useSmokeCraftOrder()

  const HOTSPOTS = [
    {
      label: 'Order Pairing / Request Purchase',
      x: 10, y: 60, width: 80, height: 18,
      onClick: () => {
        triggerHaptic('medium')
        setResumeRoute('/smokecraft/request-purchase')
      },
      to: '/smokecraft/menu',
    },
    {
      label: 'Continue to Cut Toast Light',
      x: 10, y: 80, width: 80, height: 15,
      onClick: () => { triggerHaptic('medium'); awardSessionRewards('request-purchase') },
      to: '/smokecraft/cut-toast-light',
    },
  ]

  return (
    <>
      <SmokeCraftAssetRoute
        src="/assets/smokecraft-reference/approved/smokecraft-request-purchase.png"
        alt="Request Purchase"
        hotspots={HOTSPOTS}
        route="/smokecraft/request-purchase"
      />
      <SmokeCraftMenuButton label="Order Pairing" />
    </>
  )
}
