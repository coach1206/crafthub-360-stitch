import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

export default function SmokeCraftChallenge() {
  const navigate = useNavigate()
  const { awardSessionRewards } = useGuestSession()
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    awardSessionRewards('smokecraft-challenge')
    navigate('/smokecraft/second-humidor-match')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.smokecraftChallenge}
        alt="SmokeCraft Challenge — Advanced Cigar Recognition"
        classification="DECORATIVE_BACKGROUND"
      />
      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Accept the Challenge →'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
