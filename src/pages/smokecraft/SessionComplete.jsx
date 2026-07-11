import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftHandoffTrigger from '../../components/smokecraft/SmokeCraftHandoffTrigger.jsx'
import { syncSmokeCraftSessionToBackend, saveFlavorMemoryToBackend, writeSyncAuditEvent } from '../../services/passportAdapter.js'
import { createPassportId } from '../../services/passportService.js'
import { syncManagement, recordGuestActivity, createManagerAlertSync, createInventorySignalSync, writeEATSyncAuditEvent } from '../../modules/smokecraft/services/smokecraftManagementSyncService.js'
import { createSmokeCraftDayOneConnection, recordDayOneGuestWorkflowEvent, writeDayOneConnectionAuditEvent } from '../../services/dayone360SmokeCraftConnectionService.js'

function readLocalFlavorMemory() {
  try {
    const raw = sessionStorage.getItem('smokecraftFlavorMemory')
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export default function SessionComplete() {
  const { session, awardSessionRewards, awardStamp, completeSmokeCraftSession, syncPos3Activity, syncEATActivity } = useGuestSession()
  const navigate = useNavigate()

  useEffect(() => {
    const alreadyDone = session.completedSteps.includes('session-complete')
    if (!alreadyDone) {
      awardSessionRewards('session-complete')
      awardStamp('journey-complete', 'session-complete')
      triggerHaptic('success')
    }

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

    ;(async () => {
      try {
        const guestId = createPassportId()
        const completedSteps = session.completedSteps || []
        const xpSummary = session.smokeCraft?.xp || {}
        const stampSummary = session.passport?.earnedStamps || []

        const [sessionResult, flavorResult] = await Promise.allSettled([
          syncSmokeCraftSessionToBackend({
            guestId, completedSteps, tasteProfile: tasteTags,
            xpSummary, stampSummary,
            completedRoute: session.smokeCraft?.selectedRoute || null,
            sessionStatus: 'completed',
            completedAt: new Date().toISOString(),
          }),
          tasteTags.length > 0
            ? saveFlavorMemoryToBackend({
                guestId, tasteTags,
                tastingNotes: flavorMemory?.tastingNotes || {},
                flavorProfileSource: tasteProfileSource,
                dataQualityStatus: tasteProfileSource === 'local_session' ? 'partial' : 'observe_confirm_only',
              })
            : Promise.resolve({ ok: false, backendConnected: false }),
        ])

        const sessionOk = sessionResult.status === 'fulfilled' && sessionResult.value?.backendConnected
        await writeSyncAuditEvent({
          guestId, eventType: 'session_complete_sync',
          syncStatus: sessionOk ? 'ok' : 'fallback',
          backendConnected: sessionOk,
          summary: sessionOk
            ? 'SmokeCraft session synced to Passport 360 backend'
            : 'SmokeCraft session stored locally — backend not available',
          metadata: {
            completedStepsCount: completedSteps.length, tasteProfileSource,
            flavorSynced: flavorResult.status === 'fulfilled' && flavorResult.value?.backendConnected,
          },
        })

        const [eatSessionResult] = await Promise.allSettled([
          syncManagement({ guestId, completedSteps, xpSummary, stampSummary, tasteProfile: tasteTags, sessionStatus: 'completed', completedRoute: session.smokeCraft?.selectedRoute || null }),
        ])
        const eatOk = eatSessionResult.status === 'fulfilled' && eatSessionResult.value?.backendConnected

        await Promise.allSettled([
          recordGuestActivity({ guestId, activityType: 'session_complete', activitySummary: `SmokeCraft journey complete — ${completedSteps.length} steps`, flavorTags: tasteTags, loyaltySignal: completedSteps.length >= 15 ? 'high' : 'medium', managerVisibility: true }),
          createManagerAlertSync({ guestId, alertType: 'session_complete', alertPriority: 'normal', alertMessage: `SmokeCraft session complete. Steps: ${completedSteps.length}.` }),
          session.smokeCraft?.selectedCigar
            ? createInventorySignalSync({ smokecraftSessionId: guestId, cigarReference: session.smokeCraft.selectedCigar, inventorySignalType: 'purchase_request', reorderSignal: false })
            : Promise.resolve(),
        ])

        await writeEATSyncAuditEvent({ guestId, eventType: 'session_complete_eat_sync', syncStatus: eatOk ? 'ok' : 'fallback', backendConnected: eatOk, summary: eatOk ? 'SmokeCraft session synced to E.A.T. backend' : 'E.A.T. sync skipped — backend not available', metadata: { completedStepsCount: completedSteps.length, tasteProfileSource } })

        const d1ConnectionResult = await createSmokeCraftDayOneConnection({ venueId: 'novee-grand-lounge', guestId, smokecraftSessionId: guestId, connectionType: 'smokecraft_session_link', workflowReference: `smokecraft-session-${guestId}`, metadata: { completedSteps: completedSteps.length, tasteProfileSource } }).catch(() => ({ ok: false, backendConnected: false }))
        const d1Ok = d1ConnectionResult?.backendConnected === true

        if (d1Ok) {
          await Promise.allSettled([
            recordDayOneGuestWorkflowEvent({ connectionId: d1ConnectionResult?.connection?.connection_id || null, venueId: 'novee-grand-lounge', guestId, smokecraftSessionId: guestId, eventType: 'session_complete', eventPayload: { completedSteps: completedSteps.length, tasteProfileSource, xpTotal: xpSummary?.total || 0 } }),
            writeDayOneConnectionAuditEvent({ connectionId: d1ConnectionResult?.connection?.connection_id || null, venueId: 'novee-grand-lounge', eventType: 'session_complete_dayone360_link', syncStatus: 'ok', backendConnected: true, metadata: { guestId, completedSteps: completedSteps.length } }),
          ]).catch(() => {})
        }
      } catch {}
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleHandoff() {
    triggerHaptic('medium')
    navigate('/pos3')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft/SESSION%20COMPLETE.png"
        alt="SmokeCraft Session Complete — Your Journey is Recorded"
      />

      <SmokeCraftNavBar
        primary="Staff Handoff — Preview"
        onPrimary={handleHandoff}
      />

      <SmokeCraftHandoffTrigger allowEAT allowPOS360 />
    </>
  )
}
