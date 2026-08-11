import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { getRankFromXP } from '../../constants/session.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'
import {
  GOLD, GOLD_DIM, CREAM, BORDER, GLASS,
  heroBannerStyle, pageShellStyle, cardStyle, sectionLabelStyle,
} from '../../constants/smokecraftLiveScreenTokens.js'
import SmokeCraftOwnerHeroBackground from '../../components/smokecraft/SmokeCraftOwnerHeroBackground.jsx'

const ENRICHMENT_23 = getEducationalEnrichment(23)

/**
 * Passport Stamp — /smokecraft/passport-stamp (S23)
 *
 * TWO-GENERATION MIGRATION — replaces a bare SmokeCraftImageBoundsOverlay
 * (no real controls at all beyond a floating Claim button — the entire
 * certificate/summary presentation was the baked image) with real live
 * DOM: a certification card showing exactly what's being stamped (cigar,
 * pairing, mentor, score, XP), eligibility status, and the claim control.
 * No decorative image is used.
 *
 * All logic preserved verbatim: REQUIRED_STEPS eligibility gate, the
 * server-side duplicate-claim check on mount, handleClaimStamp (real
 * POST, 409/duplicate handling, offline handling), and handleContinue.
 */

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

  const claimed = claimStatus === 'claimed' || claimStatus === 'duplicate'

  const summaryFields = [
    { label: 'Cigar', value: cigarName },
    { label: 'Pairing', value: pairingName },
    { label: 'Mentor', value: mentorNames.join(', ') || null },
    { label: 'Final Score', value: finalScore != null ? `${finalScore}/5` : null },
  ]

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <SmokeCraftOwnerHeroBackground assetKey="ownerPassportStampHero" label="A SmokeCraft 360 passport and earned stamps" bgPosition="center top" bgSize="cover" />
      <div style={{ ...pageShellStyle, position: 'relative', zIndex: 2 }}>
        <div style={heroBannerStyle}>
          <div aria-hidden="true" style={{ fontSize: 44 }}>🛂</div>
          <div>
            <div style={{ fontSize: 11, color: GOLD_DIM, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>SmokeCraft 360 — Session 23</div>
            <h1 style={{ margin: '4px 0 6px', color: CREAM, fontSize: 'clamp(26px,3.4vw,36px)' }}>Passport Stamp — Journey Certification</h1>
            <p style={{ margin: 0, maxWidth: 700, color: 'rgba(229,226,225,.68)', lineHeight: 1.55, fontSize: 'clamp(13px,1.4vw,16px)' }}>
              {claimed
                ? `Your journey is certified. Stamp #${claimedStamp?.stampNumber ?? claimedStamp?.id ?? ''} has been recorded.`
                : isEligible
                  ? 'Every required step is complete — claim your stamp to certify this journey.'
                  : `Complete ${missing.length} more required step${missing.length === 1 ? '' : 's'} to become eligible for a stamp.`}
            </p>
          </div>
        </div>

        <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
          <div style={sectionLabelStyle}>Journey Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 12 }}>
            {summaryFields.map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 10.5, color: GOLD_DIM, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</div>
                <div style={{ fontSize: 14, color: f.value ? CREAM : 'rgba(229,226,225,0.4)', marginTop: 3 }}>{f.value || 'Not recorded'}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 10.5, color: GOLD_DIM, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Rank</div>
              <div style={{ fontSize: 14, color: GOLD, marginTop: 3, fontWeight: 700 }}>{currentRank} · {totalXP} XP</div>
            </div>
          </div>

          {!isEligible && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
              <div style={sectionLabelStyle}>Still Required</div>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'rgba(229,226,225,0.6)', fontSize: 12.5, lineHeight: 1.7 }}>
                {missing.map(step => <li key={step}>{step.replace(/-/g, ' ')}</li>)}
                {!hasScorecard && !missing.includes('scorecard') && <li>Submit your scorecard</li>}
              </ul>
            </div>
          )}

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleClaimStamp}
              disabled={!isEligible || claimStatus === 'claiming' || claimed}
              aria-label="Claim Your Stamp"
              style={{
                minHeight: 52, padding: '0 32px', borderRadius: 999,
                border: 'none', fontWeight: 700, fontSize: 15, fontFamily: 'Georgia, serif',
                cursor: (!isEligible || claimStatus === 'claiming' || claimed) ? 'default' : 'pointer',
                opacity: (!isEligible || claimStatus === 'claiming') ? 0.5 : 1,
                background: claimed ? 'rgba(233,193,118,0.15)' : 'linear-gradient(180deg,#F3D48E,#c9a35a)',
                color: claimed ? GOLD : '#1a1205',
              }}
            >
              {claimStatus === 'claiming' ? 'Claiming…' : claimed ? '✓ Stamp Claimed' : 'Claim Your Stamp'}
            </button>
          </div>
        </section>

        <div style={{ height: 90 }} aria-hidden="true" />
      </div>

      <SmokeCraftLessonInfoButton
        sessionNumber={23} totalSessions={TOTAL_SESSIONS} phase={6} totalPhases={TOTAL_VISITS}
        title="Passport Stamp Animation" whyItMatters={ENRICHMENT_23?.whyItMatters} goldenBox={ENRICHMENT_23?.goldenBox}
      />

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Continue to Completed Scorecard →'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/pairing-recommendations'))}
      />
    </SmokeCraftScreenShell>
  )
}
