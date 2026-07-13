import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../../constants/session.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftMenuButton from '../../components/smokecraft/SmokeCraftMenuButton.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD   = '#E9C176'
const DARK   = '#0a0603'
const DIM    = 'rgba(229,226,225,0.55)'
const PANEL  = 'rgba(10,6,3,0.96)'
const BORDER = 'rgba(233,193,118,0.18)'
const GREEN  = '#5adb8e'
const RED    = '#e05a5a'
const AMBER  = '#f0a830'

const LS_KEY = 'sc_passport_stamp_v1'

// ── Required steps for stamp eligibility ──────────────────────────────────────
const REQUIRED_STEPS = [
  'humidor-match',
  'first-third',
  'second-third',
  'flavor-memory',
  'final-third',
  'scorecard',
  'final-review',
]

const STEP_LABELS = {
  'humidor-match':  'Humidor Match',
  'first-third':    'First Third',
  'second-third':   'Second Third',
  'flavor-memory':  'Flavor Memory',
  'final-third':    'Final Third',
  'scorecard':      'Scorecard',
  'final-review':   'Final Review',
}

// ── Persistence ───────────────────────────────────────────────────────────────
function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function saveLocal(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
}

// ── Session data readers ──────────────────────────────────────────────────────
function readScorecardId() {
  try {
    const sc = JSON.parse(localStorage.getItem('sc_scorecard_v1') || 'null')
    return sc?.submittedScorecardId || null
  } catch { return null }
}

function readFinalScore() {
  try {
    const sc = JSON.parse(localStorage.getItem('sc_scorecard_v1') || 'null')
    return sc?.submittedOverall ?? null
  } catch { return null }
}

function readCigarName(smokeCraft) {
  const rec = smokeCraft?.selectedHumidorRecommendation
  if (rec?.selectedCigarName) return rec.selectedCigarName
  const fmt = smokeCraft?.selectedFormat
  return fmt?.name || null
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
  try {
    const sc = JSON.parse(localStorage.getItem('sc_scorecard_v1') || 'null')
    return sc?.meta?.durationMinutes ?? null
  } catch { return null }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SL({ children }) {
  return <div style={{ fontSize: 15, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>{children}</div>
}
function HR() { return <div style={{ borderTop: `1px solid ${BORDER}`, margin: '10px 0' }} /> }

function Row({ label, value, empty }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span style={{ color: DIM, fontSize: 10 }}>{label}</span>
      {value != null
        ? <span style={{ color: GOLD, fontWeight: 700, fontSize: 10 }}>{value}</span>
        : <span style={{ color: DIM, fontSize: 15, fontStyle: 'italic' }}>{empty || '—'}</span>
      }
    </div>
  )
}

function EligibilityChecklist({ completedSteps, scorecardId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {REQUIRED_STEPS.map(step => {
        const done = completedSteps.includes(step)
        return (
          <div key={step} data-req={step} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15, color: done ? GREEN : 'rgba(229,226,225,0.3)' }}>{done ? '✓' : '○'}</span>
            <span style={{ fontSize: 15, color: done ? DIM : 'rgba(229,226,225,0.35)' }}>{STEP_LABELS[step]}</span>
          </div>
        )
      })}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 15, color: scorecardId ? GREEN : 'rgba(229,226,225,0.3)' }}>{scorecardId ? '✓' : '○'}</span>
        <span style={{ fontSize: 15, color: scorecardId ? DIM : 'rgba(229,226,225,0.35)' }}>Scorecard submitted</span>
      </div>
    </div>
  )
}

function StampSeal({ claimed }) {
  return (
    <svg width={90} height={90} viewBox="0 0 90 90" data-testid="stamp-seal">
      <circle cx={45} cy={45} r={42} fill="none"
        stroke={claimed ? GOLD : 'rgba(233,193,118,0.2)'}
        strokeWidth={claimed ? 2.5 : 1.5}
        strokeDasharray={claimed ? 'none' : '4 3'}
      />
      <circle cx={45} cy={45} r={35} fill="none"
        stroke={claimed ? 'rgba(233,193,118,0.4)' : 'rgba(233,193,118,0.1)'}
        strokeWidth={1}
      />
      {claimed ? (
        <>
          <text x={45} y={38} textAnchor="middle" style={{ fontSize: 20, fill: GOLD, fontFamily: 'Georgia, serif' }}>✦</text>
          <text x={45} y={53} textAnchor="middle" style={{ fontSize: 15, fill: GOLD, fontFamily: 'Georgia, serif', fontWeight: 700, letterSpacing: '0.15em' }}>CERTIFIED</text>
          <text x={45} y={63} textAnchor="middle" style={{ fontSize: 7, fill: 'rgba(233,193,118,0.6)', fontFamily: 'Georgia, serif' }}>SmokeCraft</text>
        </>
      ) : (
        <>
          <text x={45} y={42} textAnchor="middle" style={{ fontSize: 15, fill: 'rgba(229,226,225,0.25)', fontFamily: 'Georgia, serif' }}>NOT YET</text>
          <text x={45} y={56} textAnchor="middle" style={{ fontSize: 15, fill: 'rgba(229,226,225,0.2)', fontFamily: 'Georgia, serif', letterSpacing: '0.1em' }}>CLAIMED</text>
        </>
      )}
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PassportStamp() {
  const { awardSessionRewards, session } = useGuestSession()
  const navigate = useNavigate()
  const claimFiredRef = useRef(false)

  const smokeCraft     = session?.smokeCraft || {}
  const completedSteps = session?.completedSteps || []
  const currentXP      = session?.xp || 0
  const currentRank    = session?.rank || getRankFromXP(currentXP).name
  const badges         = session?.badges || []

  const scorecardId     = readScorecardId()
  const finalScore      = readFinalScore()
  const cigarName       = readCigarName(smokeCraft)
  const pairingName     = readPairingName(smokeCraft)
  const mentorNames     = readMentorNames(smokeCraft)
  const favoriteFlavors = readFavoriteFlavors()
  const durationMinutes = readSessionDuration()

  const xpFromRewards = 75
  const totalXP       = currentXP
  const stampCount    = smokeCraft?.completedSessions?.length || 0
  const journeyCount  = smokeCraft?.journeyCount ?? null

  const missing     = REQUIRED_STEPS.filter(s => !completedSteps.includes(s))
  const hasScorecard = Boolean(scorecardId)
  const isEligible  = missing.length === 0 && hasScorecard

  const [claimStatus, setClaimStatus]   = useState('idle')
  const [claimedStamp, setClaimedStamp] = useState(null)
  const [apiError, setApiError]         = useState(null)
  const [done, setDone]                 = useState(false)

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
          guestId:   session?.guestId || 'guest',
          completedSteps,
          scorecardId,
          cigarName,
          pairingName,
          mentorNames,
          finalScore,
          xpEarned:  xpFromRewards,
          totalXP,
          currentLevel: currentRank,
          stampCount:   stampCount + 1,
          journeyCount,
          favoriteFlavors,
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
      if (!r.ok) {
        setApiError(data.error || 'Claim failed')
        setClaimStatus('error')
        claimFiredRef.current = false
        return
      }

      setClaimStatus('claimed')
      setClaimedStamp(data.stamp)
      saveLocal({ claimed: true, stamp: data.stamp })
      awardSessionRewards('passport-stamp')
    } catch (e) {
      const offline = !navigator.onLine || e.message?.includes('fetch')
      setClaimStatus(offline ? 'offline' : 'error')
      setApiError(offline ? 'Saved locally — backend offline' : e.message)
      claimFiredRef.current = false
    }
  }, [isEligible, claimStatus, sessionId, session, completedSteps, scorecardId, cigarName, pairingName, mentorNames, finalScore, totalXP, currentRank, stampCount, journeyCount, favoriteFlavors, durationMinutes, awardSessionRewards])

  const isClaimed = claimStatus === 'claimed' || claimStatus === 'duplicate'

  function handleContinue() {
    if (done) return
    setDone(true)
    if (!isClaimed) awardSessionRewards('passport-stamp')
    navigate('/smokecraft/connections')
  }

  const completedCount = REQUIRED_STEPS.filter(s => completedSteps.includes(s)).length + (hasScorecard ? 1 : 0)
  const totalReqs = REQUIRED_STEPS.length + 1
  const progressPct = Math.round((completedCount / totalReqs) * 100)

  const passportBadges = badges.filter(b => b.id === 'sc-passport-stamp')

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.passportStamp}
        alt="SmokeCraft Passport Stamp — Journey Certification"
      />

      {/* Gradient mask — covers baked stamp count, XP, level, journey stats */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(10,6,3,0.99) 0%, rgba(10,6,3,0.75) 55%, rgba(10,6,3,0.10) 100%)',
      }} />

      {/* Session strip */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 401,
        padding: '8px 16px',
        background: 'linear-gradient(to bottom, rgba(10,6,3,0.94) 70%, transparent)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ fontSize: 15, color: GOLD, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Passport Stamp — Session 21
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 15, color: DIM }}>XP: <span style={{ color: GOLD, fontWeight: 700 }}>{totalXP}</span>
              <span style={{ color: 'rgba(233,193,118,0.45)', fontSize: 10 }}> +{xpFromRewards}</span>
            </span>
            <span style={{ fontSize: 15, color: DIM }}>Rank: <span style={{ color: GOLD, fontWeight: 700 }}>{currentRank}</span></span>
          </div>
        </div>
      </div>

      {/* Main scrollable panel */}
      <div style={{
        position: 'fixed', bottom: 110, left: 0, right: 0,
        zIndex: 400, padding: '0 16px',
        maxHeight: 'calc(100vh - 190px)', overflowY: 'auto',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: PANEL, border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: '14px 14px',
          maxWidth: 500, margin: '0 auto',
        }}>

          {/* ── Passport Stamp Seal ─────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <StampSeal claimed={isClaimed} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: isClaimed ? GOLD : 'rgba(229,226,225,0.35)', fontFamily: 'Georgia, serif', lineHeight: 1.2 }}>
                SmokeCraft Passport
              </div>
              <div style={{ fontSize: 15, color: isClaimed ? GREEN : DIM, marginTop: 2, fontStyle: isClaimed ? 'normal' : 'italic' }}>
                {isClaimed
                  ? `Certified — ${new Date(claimedStamp?.claimedAt || Date.now()).toLocaleDateString()}`
                  : isEligible
                    ? 'Eligible — ready to claim'
                    : `${completedCount}/${totalReqs} requirements met`
                }
              </div>
              <div style={{ fontSize: 15, color: DIM, marginTop: 1 }}>Session 21 of 24 · Visit 8</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ height: 3, background: 'rgba(233,193,118,0.12)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progressPct}%`,
                background: isClaimed ? GREEN : isEligible ? GOLD : AMBER,
                borderRadius: 2, transition: 'width 0.4s',
              }} data-testid="progress-bar" />
            </div>
            <div style={{ fontSize: 15, color: DIM, marginTop: 2, textAlign: 'right' }}>
              {isClaimed ? 'All requirements met — stamp claimed' : `${completedCount}/${totalReqs} complete`}
            </div>
          </div>

          {/* ── Session Summary ──────────────────────── */}
          <div data-section="session-summary">
            <SL>Session Summary</SL>
            <Row label="Session Number"   value="21 of 24" />
            <Row label="Visit Number"     value="8 of 8" />
            <Row label="Venue Name"       value={null} empty="Not configured — admin sets venue name" />
            <Row label="Completion Date"  value={isClaimed ? new Date(claimedStamp?.claimedAt || Date.now()).toLocaleDateString() : null} empty="On stamp claim" />
            <Row label="Session Duration" value={durationMinutes != null ? `${durationMinutes} min` : null} empty="Not tracked" />
          </div>

          {/* ── Cigar & Pairing ─────────────────────── */}
          <HR />
          <div data-section="cigar-pairing">
            <SL>Cigar &amp; Pairing</SL>
            <Row label="Cigar"   value={cigarName}   empty="No cigar selected" />
            <Row label="Pairing" value={pairingName} empty="No pairing recorded" />
            <Row label="Mentor"  value={mentorNames.length ? mentorNames.join(', ') : null} empty="No mentor recorded" />
          </div>

          {/* ── Score & Rewards ──────────────────────── */}
          <HR />
          <div data-section="score-rewards">
            <SL>Score &amp; Rewards</SL>
            <Row label="Final Score"   value={finalScore != null ? `${finalScore}/100` : null} empty="Scorecard not submitted" />
            <Row label="XP Earned"    value={`+${xpFromRewards} XP`} />
            <Row label="Total XP"     value={`${totalXP} XP`} />
            <Row label="Current Level" value={currentRank} />
            <Row label="Stamps Earned" value={isClaimed ? String(stampCount + 1) : null} empty={`${stampCount} — earn this stamp to advance`} />
            {journeyCount != null && <Row label="Journeys" value={String(journeyCount)} />}
          </div>

          {/* ── Flavor Notes ─────────────────────────── */}
          {favoriteFlavors.length > 0 && (
            <>
              <HR />
              <div data-section="flavor-notes">
                <SL>Favorite Flavor Notes</SL>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                  {favoriteFlavors.map(f => (
                    <span key={f} style={{
                      background: 'rgba(233,193,118,0.1)', border: `1px solid rgba(233,193,118,0.25)`,
                      borderRadius: 6, padding: '2px 8px', fontSize: 15, color: GOLD,
                    }}>{f}</span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Stamp Eligibility ────────────────────── */}
          <HR />
          <div data-section="eligibility">
            <SL>Stamp Eligibility</SL>
            <EligibilityChecklist completedSteps={completedSteps} scorecardId={scorecardId} />
          </div>

          {/* ── Claim Stamp (eligible, not yet claimed) ── */}
          {!isClaimed && isEligible && (
            <>
              <HR />
              <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
                <button
                  type="button"
                  data-action="claim-stamp"
                  disabled={claimStatus === 'claiming'}
                  onClick={handleClaimStamp}
                  style={{
                    background: claimStatus === 'claiming' ? 'rgba(233,193,118,0.3)' : GOLD,
                    color: DARK, border: 'none', borderRadius: 28,
                    padding: '12px 32px', fontSize: 14, fontWeight: 700,
                    fontFamily: 'Georgia, serif', letterSpacing: '0.08em',
                    textTransform: 'uppercase', cursor: claimStatus === 'claiming' ? 'default' : 'pointer',
                    width: '100%',
                  }}
                >
                  {claimStatus === 'claiming' ? 'Claiming Stamp…' : 'Claim Passport Stamp'}
                </button>
                <div style={{ fontSize: 15, color: DIM, marginTop: 5 }}>
                  Creates a permanent Passport 360 record
                </div>
              </div>
            </>
          )}

          {/* Ineligible message */}
          {!isClaimed && !isEligible && (
            <>
              <HR />
              <div style={{ fontSize: 15, color: AMBER, fontStyle: 'italic', padding: '4px 0' }}>
                Complete all requirements above to unlock your passport stamp.
              </div>
              {!hasScorecard && (
                <div style={{ fontSize: 15, color: DIM, marginTop: 3 }}>
                  Scorecard not submitted — return to /smokecraft/scorecard to submit.
                </div>
              )}
            </>
          )}

          {/* ── Claimed Success ──────────────────────── */}
          {isClaimed && claimedStamp && (
            <>
              <HR />
              <div data-section="claimed-result" style={{
                padding: '10px 12px', borderRadius: 8,
                background: 'rgba(90,219,142,0.07)', border: '1px solid rgba(90,219,142,0.3)',
              }}>
                <div style={{ fontSize: 15, color: GREEN, fontWeight: 700, fontFamily: 'Georgia, serif', marginBottom: 4 }}>
                  {claimStatus === 'duplicate' ? 'Already Claimed' : 'Passport Stamp Earned'}
                </div>
                <div style={{ fontSize: 15, color: DIM }}>
                  Stamp ID: <span style={{ color: GOLD }}>{claimedStamp.stampId}</span>
                </div>
                <div style={{ fontSize: 15, color: DIM, marginTop: 2 }}>
                  Recorded: {new Date(claimedStamp.claimedAt).toLocaleString()}
                </div>
                {claimedStamp.finalScore != null && (
                  <div style={{ fontSize: 15, color: DIM, marginTop: 2 }}>
                    Final Score: <span style={{ color: GOLD }}>{claimedStamp.finalScore}/100</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Badges ───────────────────────────────── */}
          {passportBadges.length > 0 && (
            <>
              <HR />
              <SL>Achievement Badges</SL>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }} data-section="badges">
                {passportBadges.map(b => (
                  <div key={b.id} data-badge={b.id} style={{
                    background: 'rgba(233,193,118,0.1)', border: `1px solid rgba(233,193,118,0.3)`,
                    borderRadius: 8, padding: '3px 10px', fontSize: 15, color: GOLD,
                  }}>{b.label}</div>
                ))}
              </div>
            </>
          )}

          {/* ── API error state ──────────────────────── */}
          {(claimStatus === 'error' || claimStatus === 'offline') && (
            <div style={{
              marginTop: 8, fontSize: 15,
              color: claimStatus === 'offline' ? AMBER : RED,
              background: claimStatus === 'offline' ? 'rgba(240,168,48,0.08)' : 'rgba(224,90,90,0.08)',
              border: `1px solid ${claimStatus === 'offline' ? 'rgba(240,168,48,0.3)' : 'rgba(224,90,90,0.3)'}`,
              borderRadius: 6, padding: '5px 8px', textAlign: 'center',
            }}>
              {claimStatus === 'offline' ? 'Offline — progress saved locally' : `Error: ${apiError}`}
            </div>
          )}

          {/* ── Next Unlock ──────────────────────────── */}
          <HR />
          <div data-section="next-unlock">
            <SL>Next Unlock</SL>
            <div style={{ fontSize: 15, color: DIM }}>
              {isClaimed
                ? <span>Continue to <span style={{ color: GOLD }}>SmokeCraft Connections</span> — Session 22</span>
                : <span>Claim your passport stamp to unlock <span style={{ color: GOLD }}>Connections</span></span>
              }
            </div>
          </div>

        </div>
      </div>

      <SmokeCraftMenuButton label="View Menu" />

      <SmokeCraftNavBar
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft/final-review')}
        primary="Continue to Connections →"
        onPrimary={handleContinue}
      />
    </>
  )
}
