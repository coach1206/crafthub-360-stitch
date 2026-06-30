import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

export default function FirstThird() {
  const navigate = useNavigate()
  const { completeStep, addXP, setFirstThirdTasting } = useGuestSession()
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    setFirstThirdTasting({
      notesSelected: [],
      notesCount: 0,
      drawRating: null,
      hasDrawRating: false,
      strength: null,
      body: null,
      smokeOutput: null,
      burnQuality: null,
      pairingReaction: null,
      mentorTip: null,
      mentorName: null,
    })
    completeStep('first-third')
    addXP(5)
    navigate('/smokecraft/second-third')
  }

  return (
    <div onClick={handleContinue} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft-reference/approved/smokecraft-first-third.png"
        alt="First Third Tasting"
      />
    </div>
  )
}
