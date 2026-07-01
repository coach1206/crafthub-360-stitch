import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function SeedSoil() {
  const { completeStep } = useGuestSession()

  const HOTSPOTS = [
    {
      label: 'Continue to Pairing Lab',
      x: 10, y: 75, width: 80, height: 20,
      onClick: () => { triggerHaptic('medium'); completeStep('seed-soil') },
      to: '/smokecraft/pairing-lab',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-seed-soil.png"
      alt="Seed & Soil"
      hotspots={HOTSPOTS}
      route="/smokecraft/seed-soil"
    />
  )
}
