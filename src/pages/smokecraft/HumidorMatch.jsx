import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function HumidorMatch() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()

  const handleContinue = useCallback(() => {
    triggerHaptic('medium')
    completeStep('humidor-match')
    addXP(75)
    navigate('/smokecraft/request-purchase')
  }, [navigate, completeStep, addXP])

  const HOTSPOTS = [
    { label: 'Request Purchase', x: 10, y: 75, width: 80, height: 20, onClick: handleContinue },
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
