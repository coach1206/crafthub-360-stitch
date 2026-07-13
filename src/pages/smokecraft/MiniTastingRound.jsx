import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

export default function MiniTastingRound() {
  const navigate = useNavigate()
  const { awardSessionRewards } = useGuestSession()
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    awardSessionRewards('mini-tasting')
    navigate('/smokecraft/visit-complete')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.miniTasting}
        alt="SmokeCraft Mini Tasting Round — Comparative Evaluation"
        classification="DECORATIVE_BACKGROUND"
      />
      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Complete Tasting Round →'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
