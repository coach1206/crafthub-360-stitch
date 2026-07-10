import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function PassportStamp() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()

  const handleContinue = useCallback(() => {
    triggerHaptic('success')
    completeStep('passport-stamp')
    addXP(100)
    navigate('/smokecraft/connections')
  }, [navigate, completeStep, addXP])

  const HOTSPOTS = [
    { label: 'Continue to Connections', x: 10, y: 75, width: 80, height: 20, onClick: handleContinue },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-passport-stamp.png"
      alt="Passport Stamp"
      hotspots={HOTSPOTS}
      route="/smokecraft/passport-stamp"
    />
  )
}
