import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function Connections() {
  const { completeStep } = useGuestSession()

  const HOTSPOTS = [
    {
      label: 'Continue to Management Sync',
      x: 10, y: 75, width: 80, height: 20,
      onClick: () => { triggerHaptic('medium'); completeStep('connections') },
      to: '/smokecraft/management-sync',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-passport-connection.png"
      alt="Connections"
      hotspots={HOTSPOTS}
      route="/smokecraft/connections"
    />
  )
}
