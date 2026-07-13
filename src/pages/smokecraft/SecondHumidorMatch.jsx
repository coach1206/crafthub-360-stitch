import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

export default function SecondHumidorMatch() {
  const navigate = useNavigate()
  const { awardSessionRewards } = useGuestSession()
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    awardSessionRewards('second-humidor-match')
    navigate('/smokecraft/mini-tasting')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.secondHumidorMatch}
        alt="SmokeCraft Second Humidor Match — Your Next Cigar"
        classification="DECORATIVE_BACKGROUND"
      />
      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Select Your Cigar →'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
