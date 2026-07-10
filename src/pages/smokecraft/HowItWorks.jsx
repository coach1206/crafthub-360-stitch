import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { hapticTap } from '../../utils/scTouch.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function HowItWorks() {
  const navigate = useNavigate()

  const handleStart = useCallback(() => {
    hapticTap('medium')
    navigate('/smokecraft/identity')
  }, [navigate])

  const HOTSPOTS = [
    {
      label: 'Get Started',
      x: 10, y: 75, width: 80, height: 20,
      onClick: handleStart,
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-how-it-works.png"
      alt="How SmokeCraft Works"
      hotspots={HOTSPOTS}
      route="/smokecraft/how-it-works"
    />
  )
}
