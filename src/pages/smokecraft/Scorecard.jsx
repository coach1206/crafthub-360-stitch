import { useState, useCallback } from 'react'
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

const LS_KEY = 'sc_scorecard_v1'

function readCigarDetails(smokeCraft) {
  const rec = smokeCraft?.selectedHumidorRecommendation
  const fmt = smokeCraft?.selectedFormat
  if (rec) return { name: rec.selectedCigarName || '—', country: rec.selectedCigarCountry || '—', type: rec.selectedCigarType || '—', size: fmt?.name || '—' }
  if (fmt) return { name: fmt.name || '—', country: '—', type: '—', size: fmt.name || '—' }
  return null
}

function readPairingDetails(smokeCraft) {
  const pairings = smokeCraft?.pairingSelections
  if (pairings?.length) return pairings
  return null
}

const EMPTY_STATE = {
  categories: { appearance: null, construction: null, draw: null, burn: null, flavor: null, pairing: null },
  meta: { durationMinutes: null, puffCount: null, relightCount: 0 },
  personalNotes: '', savedAt: null, submittedScorecardId: null,
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...EMPTY_STATE, ...JSON.parse(raw) } : { ...EMPTY_STATE }
  } catch { return { ...EMPTY_STATE } }
}
function saveLocal(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ...s, savedAt: s.savedAt || Date.now() })) } catch {}
}

export default function Scorecard() {
  const { awardSessionRewards, session } = useGuestSession()
  const { journey } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const smokeCraft  = session?.smokeCraft || {}
  const currentXP   = session?.xp || 0
  const currentRank = session?.rank || getRankFromXP(currentXP).name
  const stepsCount  = session?.completedSteps?.length || 0

  const cigarDetails   = readCigarDetails(smokeCraft) || (journey.selectedCigar ? {
    name: journey.selectedCigar.name || '—', country: journey.selectedCigar.origin || '—',
    type: journey.selectedCigar.wrapper || '—', size: journey.selectedCigar.format || journey.format?.label || '—',
  } : null)
  const pairingDetails = readPairingDetails(smokeCraft)

  const firstThird  = smokeCraft?.firstThird  || null
  const secondThird = smokeCraft?.secondThird  || null
  const finalThird  = (() => { try { return JSON.parse(sessionStorage.getItem('smokecraftFinalThird') || 'null') } catch { return null } })()

  const [sc, setSc]       = useState(loadLocal)
  const [done, setDone]   = useState(false)

  const submitScorecard = useCallback(async (data) => {
    try {
      await fetch('/api/smokecraft/scorecard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.sessionId || 'local-session',
          guestId:   session?.guestId   || 'guest',
          categories: data.categories,
          cigarDetails,
          pairingDetails: pairingDetails ? { selectedPairings: pairingDetails } : null,
          tastingData: { firstThird, secondThird, finalThird },
          sessionMeta: {
            ...data.meta,
            xpAtSubmission: currentXP,
            rank: currentRank,
            stepsCompleted: stepsCount,
          },
          notes: data.personalNotes,
        }),
      }).then(async r => {
        if (r.ok) {
          const result = await r.json()
          setSc(prev => ({ ...prev, submittedScorecardId: result.scorecard?.scorecardId, savedAt: Date.now() }))
        }
      })
    } catch {}
  }, [session, cigarDetails, pairingDetails, firstThird, secondThird, finalThird, currentXP, currentRank, stepsCount]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    const snapshot = { ...sc, savedAt: Date.now() }
    saveLocal(snapshot)
    await submitScorecard(snapshot)
    awardSessionRewards('scorecard')
    navigate('/smokecraft/final-review')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.scorecard}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Scorecard — Your Complete Cigar Review"
      />

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Continue to Final Review →'}
        onPrimary={handleContinue}
      />
    </>
  )
}
