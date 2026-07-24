import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { getRankFromXP } from '../../constants/session.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1448
const NAT_H = 1086

const REQUIRED_STEPS = [
  'humidor-match', 'first-third', 'second-third',
  'flavor-memory', 'final-third', 'scorecard', 'final-review',
]

function readCigarName(smokeCraft) {
  const rec = smokeCraft?.selectedHumidorRecommendation
  if (rec?.selectedCigarName) return rec.selectedCigarName
  return smokeCraft?.selectedFormat?.name || null
}
function readPairingName(smokeCraft) {
  const pairings = smokeCraft?.pairingSelections
  if (pairings?.length) return pairings.join(', ')
  return null
}
function readMentorNames(smokeCraft) {
  const m = smokeCraft?.selectedMentor
  if (!m) return []
  return [m.name || m.id].filter(Boolean)
}
export default function PassportStamp({ onBack, onComplete } = {}) {
  const { awardSessionRewards, session } = useGuestSession()
  const { journey, setPassportStamp } = useSmokeCraftJourney()
  const navigate = useNavigate()
  const claimFiredRef = useRef(false)

  const smokeCraft     = session?.smokeCraft || {}
  const completedSteps = session?.completedSteps || []
  const currentXP      = session?.xp || 0
  const currentRank    = session?.rank || getRankFromXP(currentXP).name

  const scorecardId     = journey.scorecard?.submittedScorecardId || null
  const finalScore      = journey.scorecard?.overall ?? null
  const cigarName       = readCigarName(smokeCraft)
  const pairingName     = readPairingName(smokeCraft)
  const mentorNames     = readMentorNames(smokeCraft)
  const favoriteFlavors = journey.flavorMemory?.selectedFlavors?.slice(0, 6) || []
  const durationMinutes = journey.scorecard?.meta?.durationMinutes ?? null

  const totalXP      = currentXP
  const stampCount   = smokeCraft?.completedSessions?.length || 0
  const journeyCount = smokeCraft?.journeyCount ?? null

  const missing     = REQUIRED_STEPS.filter(s => !completedSteps.includes(s))
  const hasScorecard = Boolean(scorecardId)
  const isEligible  = missing.length === 0 && hasScorecard

  // Restore persisted claim from canonical journey state
  const [claimStatus, setClaimStatus] = useState(() =>
    journey.passportStamp?.claimed && journey.passportStamp?.stamp ? 'claimed' : 'idle'
  )
  const [claimedStamp, setClaimedStamp] = useState(() => journey.passportStamp?.stamp || null)
  const [done, setDone] = useState(false)

  const sessionId = session?.sessionId || 'local-session'

  // Check server for duplicate
  useEffect(() => {
    if (claimStatus !== 'idle') return
    fetch(`/api/smokecraft/passport-stamp/status/${sessionId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.claimed && data?.stamp) {
          setClaimStatus('duplicate')
          setClaimedStamp(data.stamp)
          setPassportStamp({ claimed: true, stamp: data.stamp })
        }
      })
      .catch(() => {})
  }, [sessionId, claimStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClaimStamp = useCallback(async () => {
    if (claimFiredRef.current || !isEligible) return
    if (claimStatus === 'claimed' || claimStatus === 'duplicate') return

    claimFiredRef.current = true
    setClaimStatus('claiming')
    triggerHaptic('heavy')

    try {
      const r = await fetch('/api/smokecraft/passport-stamp/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          guestId: session?.guestId || 'guest',
          completedSteps, scorecardId, cigarName, pairingName, mentorNames,
          finalScore, xpEarned: 75, totalXP, currentLevel: currentRank,
          stampCount: stampCount + 1, journeyCount, favoriteFlavors,
          sessionDurationMinutes: durationMinutes,
          completedAt: new Date().toISOString(),
          venueName: null,
        }),
      })
      const data = await r.json()
      if (r.status === 409 || data.duplicate) {
        setClaimStatus('duplicate')
        setClaimedStamp(data.stamp)
        setPassportStamp({ claimed: true, stamp: data.stamp })
        return
      }
      if (!r.ok) { setClaimStatus('error'); claimFiredRef.current = false; return }
      setClaimStatus('claimed')
      setClaimedStamp(data.stamp)
      setPassportStamp({ claimed: true, stamp: data.stamp })
      awardSessionRewards('passport-stamp')
    } catch {
      setClaimStatus('offline')
      claimFiredRef.current = false
    }
  }, [isEligible, claimStatus, sessionId, session, completedSteps, scorecardId, cigarName, pairingName, mentorNames, finalScore, totalXP, currentRank, stampCount, journeyCount, favoriteFlavors, durationMinutes, awardSessionRewards, setPassportStamp]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleContinue() {
    if (done) return
    setDone(true)
    const isClaimed = claimStatus === 'claimed' || claimStatus === 'duplicate'
    if (onComplete) {
      onComplete()
      return
    }
    if (!isClaimed) awardSessionRewards('passport-stamp')
    navigate('/smokecraft/final-review')
  }

  // Auto-claim when eligible and page loads
  useEffect(() => {
    if (isEligible && claimStatus === 'idle') {
      handleClaimStamp()
    }
  }, [isEligible, claimStatus, handleClaimStamp])

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.passportStamp}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Passport Stamp — Journey Certification"
      />

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Continue to Completed Scorecard →'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/pairing-recommendations'))}
      />
    </>
  )
}
