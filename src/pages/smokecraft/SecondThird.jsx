import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

export default function SecondThird() {
  const navigate = useNavigate()
  const { completeStep, addXP, setSecondThirdTasting } = useGuestSession()
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    setSecondThirdTasting({
      notesSelected: [],
      notesCount: 0,
      rating: null,
      hasRating: false,
      flavorDevelopment: null,
      strengthChange: null,
      bodyChange: null,
      ashQuality: null,
      pairingReaction: null,
      mentorTip: null,
      mentorName: null,
    })
    completeStep('second-third')
    addXP(50)
    navigate('/smokecraft/flavor-memory')
  }

  return (
    <div onClick={handleContinue} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft-reference/approved/smokecraft-second-third.png"
        alt="Second Third Tasting"
      />
    </div>
  )
}
