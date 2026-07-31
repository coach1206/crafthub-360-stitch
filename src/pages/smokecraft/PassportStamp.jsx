import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { getRankFromXP } from '../../constants/session.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const ENRICHMENT_23 = getEducationalEnrichment(23)

const NAT_W = 1448
const NAT_H = 1086

// SC-D067 fix: 'final-review' (Session 24) is REMOVED — it comes AFTER
// passport-stamp (Session 23) in route order (pairing-recommendations(22)
// -> passport-stamp(23) -> final-review(24)), so requiring it made
// first-time eligibility impossible on a normal visit.
const REQUIRED_STEPS = [
  'humidor-match', 'first-third', 'second-third',
  'flavor-memory', 'final-third', 'scorecard',
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
    if (onComplete) {
      onComplete()
      return
    }
    // Session 23's own generic completion is now server-gated on real
    // Passport stamp evidence (hasPassportStampEvidence, mirroring the
    // Package A/B/C additive gate-check pattern) — this call is safe to
    // fire unconditionally because the server will reject it (and no
    // local state changes) unless the stamp was actually claimed via a
    // real player click above. The stamp itself can never appear from a
    // route visit alone.
    awardSessionRewards('passport-stamp')
    navigate('/smokecraft/final-review')
  }

  // Note: the stamp is now claimed only via an explicit player click on
  // the "Claim Your Stamp" button (handleClaimStamp), never auto-fired
  // by an effect on page load — matching every other Package's
  // requirement that the player perform the required interaction.

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.passportStamp}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Passport Stamp — Journey Certification"
      />

      <SmokeCraftLessonInfoButton
        sessionNumber={23} totalSessions={TOTAL_SESSIONS} phase={6} totalPhases={TOTAL_VISITS}
        title="Passport Stamp Animation" whyItMatters={ENRICHMENT_23?.whyItMatters} goldenBox={ENRICHMENT_23?.goldenBox}
      />

      {claimStatus !== 'claimed' && claimStatus !== 'duplicate' && (
        <button
          type="button"
          onClick={handleClaimStamp}
          disabled={!isEligible || claimStatus === 'claiming'}
          aria-label="Claim Your Stamp"
          style={{
            position: 'fixed', bottom: '96px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 20, padding: '12px 28px', borderRadius: '999px', border: 'none',
            fontWeight: 700, fontSize: '15px', cursor: (!isEligible || claimStatus === 'claiming') ? 'not-allowed' : 'pointer',
            opacity: (!isEligible || claimStatus === 'claiming') ? 0.5 : 1,
            background: '#c9a35a', color: '#1a1a1a',
          }}
        >
          {claimStatus === 'claiming' ? 'Claiming…' : 'Claim Your Stamp'}
        </button>
      )}

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Continue to Completed Scorecard →'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/pairing-recommendations'))}
      />
    </>
  )
}
