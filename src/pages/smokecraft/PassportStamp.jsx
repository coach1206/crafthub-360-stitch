import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../../constants/session.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1448
const NAT_H = 1086

const LS_KEY = 'sc_passport_stamp_v1'

const REQUIRED_STEPS = [
  'humidor-match', 'first-third', 'second-third',
  'flavor-memory', 'final-third', 'scorecard', 'final-review',
]

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function saveLocal(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
}

function readScorecardId() {
  try { return JSON.parse(localStorage.getItem('sc_scorecard_v1') || 'null')?.submittedScorecardId || null } catch { return null }
}
function readFinalScore() {
  try { return JSON.parse(localStorage.getItem('sc_scorecard_v1') || 'null')?.submittedOverall ?? null } catch { return null }
}
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
function readFavoriteFlavors() {
  try {
    const fm = JSON.parse(sessionStorage.getItem('smokecraftFlavorMemory') || 'null')
    if (fm?.selectedFlavors?.length) return fm.selectedFlavors.slice(0, 6)
  } catch {}
  return []
}
function readSessionDuration() {
  try { return JSON.parse(localStorage.getItem('sc_scorecard_v1') || 'null')?.meta?.durationMinutes ?? null } catch { return null }
}

export default function PassportStamp() {
  const { awardSessionRewards, session } = useGuestSession()
  const navigate = useNavigate()
  const claimFiredRef = useRef(false)

  const smokeCraft     = session?.smokeCraft || {}
  const completedSteps = session?.completedSteps || []
  const currentXP      = session?.xp || 0
  const currentRank    = session?.rank || getRankFromXP(currentXP).name

  const scorecardId     = readScorecardId()
  const finalScore      = readFinalScore()
  const cigarName       = readCigarName(smokeCraft)
  const pairingName     = readPairingName(smokeCraft)
  const mentorNames     = readMentorNames(smokeCraft)
  const favoriteFlavors = readFavoriteFlavors()
  const durationMinutes = readSessionDuration()

  const totalXP      = currentXP
  const stampCount   = smokeCraft?.completedSessions?.length || 0
  const journeyCount = smokeCraft?.journeyCount ?? null

  const missing     = REQUIRED_STEPS.filter(s => !completedSteps.includes(s))
  const hasScorecard = Boolean(scorecardId)
  const isEligible  = missing.length === 0 && hasScorecard

  const [claimStatus, setClaimStatus] = useState('idle')
  const [claimedStamp, setClaimedStamp] = useState(null)
  const [done, setDone] = useState(false)

  const sessionId = session?.sessionId || 'local-session'

  // Restore persisted claim
  useEffect(() => {
    const saved = loadLocal()
    if (saved?.claimed && saved?.stamp) {
      setClaimStatus('claimed')
      setClaimedStamp(saved.stamp)
    }
  }, [])

  // Check server for duplicate
  useEffect(() => {
    if (claimStatus !== 'idle') return
    fetch(`/api/smokecraft/passport-stamp/status/${sessionId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.claimed && data?.stamp) {
          setClaimStatus('duplicate')
          setClaimedStamp(data.stamp)
          saveLocal({ claimed: true, stamp: data.stamp })
        }
      })
      .catch(() => {})
  }, [sessionId, claimStatus])

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
        saveLocal({ claimed: true, stamp: data.stamp })
        return
      }
      if (!r.ok) { setClaimStatus('error'); claimFiredRef.current = false; return }
      setClaimStatus('claimed')
      setClaimedStamp(data.stamp)
      saveLocal({ claimed: true, stamp: data.stamp })
      awardSessionRewards('passport-stamp')
    } catch {
      setClaimStatus('offline')
      claimFiredRef.current = false
    }
  }, [isEligible, claimStatus, sessionId, session, completedSteps, scorecardId, cigarName, pairingName, mentorNames, finalScore, totalXP, currentRank, stampCount, journeyCount, favoriteFlavors, durationMinutes, awardSessionRewards]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleContinue() {
    if (done) return
    setDone(true)
    const isClaimed = claimStatus === 'claimed' || claimStatus === 'duplicate'
    if (!isClaimed) awardSessionRewards('passport-stamp')
    navigate('/smokecraft/connections')
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
        primary={done ? 'Continuing…' : 'Continue to Connections →'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
