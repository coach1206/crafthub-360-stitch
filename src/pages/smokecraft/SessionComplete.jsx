import { useEffect } from 'react'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'
import SmokeCraftHandoffTrigger from '../../components/smokecraft/SmokeCraftHandoffTrigger.jsx'

function readLocalFlavorMemory() {
  try {
    const raw = sessionStorage.getItem('smokecraftFlavorMemory')
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export default function SessionComplete() {
  const { session, awardSessionRewards, awardStamp, completeSmokeCraftSession, syncPos3Activity, syncEATActivity } = useGuestSession()

  useEffect(() => {
    const alreadyDone = session.completedSteps.includes('session-complete')
    if (!alreadyDone) {
      awardSessionRewards('session-complete')
      awardStamp('journey-complete', 'session-complete')
      triggerHaptic('success')
    }
    // Read taste profile from session data — honest fallback if not collected
    const flavorMemory = readLocalFlavorMemory()
    const tasteTags =
      flavorMemory?.tasteTags?.length > 0 ? flavorMemory.tasteTags
      : session?.smokeCraft?.finalThird?.notesSelected?.length > 0 ? session.smokeCraft.finalThird.notesSelected
      : []
    const tasteProfileSource = tasteTags.length > 0 ? 'local_session' : 'not_collected'
    completeSmokeCraftSession({
      tasteProfile: tasteTags,
      tasteProfileSource,
      backendConnected: false,
      safeClaim: tasteProfileSource === 'not_collected'
        ? 'No guest taste data collected at this pilot stage'
        : 'Taste profile from local session only — not synced to backend',
    })
    syncPos3Activity()
    syncEATActivity()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hotspots = [
    {
      // POS360 routes are nested under /pos3 — this is the correct staff route.
      // Handoff is preview/internal: no live payment processing, no external POS provider.
      label: 'Staff Handoff — Preview',
      x: 10, y: 75, width: 80, height: 20,
      to: '/pos3',
      handoffType: 'pos360_preview',
      backendConnected: false,
      safeClaim: 'POS360 handoff is preview/internal — provider connection not yet enabled',
    },
  ]

  return (
    <>
      <SmokeCraftAssetRoute
        src="/assets/smokecraft-reference/approved/smokecraft-session-complete.png"
        alt="Session Complete"
        hotspots={hotspots}
        route="/smokecraft/session-complete"
      />
      <SmokeCraftHandoffTrigger allowEAT allowPOS360 />
    </>
  )
}
