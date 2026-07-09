import { useEffect } from 'react'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'
import SmokeCraftHandoffTrigger from '../../components/smokecraft/SmokeCraftHandoffTrigger.jsx'
import { syncSmokeCraftSessionToBackend, saveFlavorMemoryToBackend, writeSyncAuditEvent } from '../../services/passportAdapter.js'
import { createPassportId } from '../../services/passportService.js'
import { syncManagement, recordGuestActivity, createManagerAlertSync, createInventorySignalSync, writeEATSyncAuditEvent } from '../../modules/smokecraft/services/smokecraftManagementSyncService.js'

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

    // Fire-and-forget backend sync — does NOT block guest screen.
    // backendConnected in context stays false; only backend returns true.
    ;(async () => {
      try {
        const guestId = createPassportId()
        const completedSteps = session.completedSteps || []
        const xpSummary = session.smokeCraft?.xp || {}
        const stampSummary = session.passport?.earnedStamps || []

        const [sessionResult, flavorResult] = await Promise.allSettled([
          syncSmokeCraftSessionToBackend({
            guestId,
            completedSteps,
            tasteProfile: tasteTags,
            xpSummary,
            stampSummary,
            completedRoute: session.smokeCraft?.selectedRoute || null,
            sessionStatus: 'completed',
            completedAt: new Date().toISOString(),
          }),
          tasteTags.length > 0
            ? saveFlavorMemoryToBackend({
                guestId,
                tasteTags,
                tastingNotes: flavorMemory?.tastingNotes || {},
                flavorProfileSource: tasteProfileSource,
                dataQualityStatus: tasteProfileSource === 'local_session' ? 'partial' : 'observe_confirm_only',
              })
            : Promise.resolve({ ok: false, backendConnected: false }),
        ])

        const sessionOk = sessionResult.status === 'fulfilled' && sessionResult.value?.backendConnected
        await writeSyncAuditEvent({
          guestId,
          eventType: 'session_complete_sync',
          syncStatus: sessionOk ? 'ok' : 'fallback',
          backendConnected: sessionOk,
          summary: sessionOk
            ? 'SmokeCraft session synced to Passport 360 backend'
            : 'SmokeCraft session stored locally — backend not available',
          metadata: {
            completedStepsCount: completedSteps.length,
            tasteProfileSource,
            flavorSynced: flavorResult.status === 'fulfilled' && flavorResult.value?.backendConnected,
          },
        })

        // E.A.T. backend sync — fire-and-forget, never blocks guest screen
        const [eatSessionResult] = await Promise.allSettled([
          syncManagement({
            guestId,
            completedSteps,
            xpSummary,
            stampSummary,
            tasteProfile: tasteTags,
            sessionStatus: 'completed',
            completedRoute: session.smokeCraft?.selectedRoute || null,
          }),
        ])

        const eatOk = eatSessionResult.status === 'fulfilled' && eatSessionResult.value?.backendConnected

        await Promise.allSettled([
          recordGuestActivity({
            guestId,
            activityType: 'session_complete',
            activitySummary: `SmokeCraft journey complete — ${completedSteps.length} steps, ${tasteTags.length > 0 ? tasteTags.join(', ') : 'no taste data'}`,
            flavorTags: tasteTags,
            loyaltySignal: completedSteps.length >= 15 ? 'high' : 'medium',
            managerVisibility: true,
          }),
          createManagerAlertSync({
            guestId,
            alertType: 'session_complete',
            alertPriority: 'normal',
            alertMessage: `SmokeCraft session complete. Steps: ${completedSteps.length}. XP: ${xpSummary?.total || 0}.`,
          }),
          // Inventory signal only if cigar/menu data exists in session
          session.smokeCraft?.selectedCigar
            ? createInventorySignalSync({
                smokecraftSessionId: guestId,
                cigarReference: session.smokeCraft.selectedCigar,
                inventorySignalType: 'purchase_request',
                reorderSignal: false,
              })
            : Promise.resolve(),
        ])

        await writeEATSyncAuditEvent({
          guestId,
          eventType: 'session_complete_eat_sync',
          syncStatus: eatOk ? 'ok' : 'fallback',
          backendConnected: eatOk,
          summary: eatOk
            ? 'SmokeCraft session synced to E.A.T. backend'
            : 'E.A.T. sync skipped — backend not available',
          metadata: { completedStepsCount: completedSteps.length, tasteProfileSource },
        })
      } catch {
        // backend sync failure must never surface to guest
      }
    })()
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
