import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function SeedSoil() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()

  const handleContinue = useCallback(() => {
    triggerHaptic('medium')
    completeStep('seed-soil')
    addXP(75)
    navigate('/smokecraft/pairing-lab')
  }, [navigate, completeStep, addXP])

  const HOTSPOTS = [
    { label: 'Continue to Pairing Lab', x: 10, y: 75, width: 80, height: 20, onClick: handleContinue },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-seed-soil.png"
      alt="Seed and Soil"
      hotspots={HOTSPOTS}
      route="/smokecraft/seed-soil"
    />
  )
}
