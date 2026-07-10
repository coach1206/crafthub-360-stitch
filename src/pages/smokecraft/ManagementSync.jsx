import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { hapticTap } from '../../utils/scTouch.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function ManagementSync() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()

  const handleComplete = useCallback(() => {
    hapticTap('success')
    completeStep('management-sync')
    addXP(100)
    navigate('/smokecraft/session-complete')
  }, [navigate, completeStep, addXP])

  const HOTSPOTS = [
    {
      label: 'Complete SmokeCraft',
      x: 10, y: 75, width: 80, height: 20,
      onClick: handleComplete,
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-venue-management-sync.png"
      alt="Management Sync"
      hotspots={HOTSPOTS}
      route="/smokecraft/management-sync"
    />
  )
}
