import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function Connections() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()

  const handleContinue = useCallback(() => {
    triggerHaptic('medium')
    completeStep('connections')
    addXP(75)
    navigate('/smokecraft/management-sync')
  }, [navigate, completeStep, addXP])

  const HOTSPOTS = [
    { label: 'Continue to Management Sync', x: 10, y: 75, width: 80, height: 20, onClick: handleContinue },
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
