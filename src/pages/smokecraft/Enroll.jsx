import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function Enroll() {
  const { completeStep } = useGuestSession()

  const HOTSPOTS = [
    {
      label: 'Continue to Intake',
      x: 10, y: 75, width: 80, height: 20,
      onClick: () => { triggerHaptic('medium'); completeStep('enroll') },
      to: '/smokecraft/identity',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-entry-gate.png"
      alt="Enroll"
      hotspots={HOTSPOTS}
      route="/smokecraft/enroll"
    />
  )
}
