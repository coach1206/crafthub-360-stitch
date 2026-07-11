import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function PairingLab() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()

  const handleContinue = useCallback(() => {
    triggerHaptic('medium')
    completeStep('pairing-lab')
    addXP(75)
    navigate('/smokecraft/humidor-match')
  }, [navigate, completeStep, addXP])

  const HOTSPOTS = [
    { label: 'Continue to Humidor Match', x: 10, y: 75, width: 80, height: 20, onClick: handleContinue },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/batch-22/pairing lab hotspot.png"
      alt="Pairing Lab"
      hotspots={HOTSPOTS}
      route="/smokecraft/pairing-lab"
    />
  )
}
