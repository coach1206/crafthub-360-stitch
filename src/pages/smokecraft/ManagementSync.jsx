import { useEffect, useState } from 'react'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'
import SmokeCraftHandoffTrigger from '../../components/smokecraft/SmokeCraftHandoffTrigger.jsx'
import { getManagementSyncStatus, syncManagement, recordGuestActivity, createManagerAlertSync } from '../../modules/smokecraft/services/smokecraftManagementSyncService.js'
import { createSmokeCraftDayOneConnection, recordDayOneGuestWorkflowEvent } from '../../services/dayone360SmokeCraftConnectionService.js'

export default function ManagementSync() {
  const { session, awardSessionRewards } = useGuestSession()
  const [eatStatus, setEATStatus] = useState(null)

  useEffect(() => {
    // Check E.A.T. backend status and fire management activity sync — fire-and-forget
    ;(async () => {
      try {
        const status = await getManagementSyncStatus(session?.venueId || 'novee-grand-lounge')
        setEATStatus(status)

        if (status?.backendConnected) {
          // Sync management activity record
          const passportId = session?.passport?.passportId || null
          await syncManagement({
            guestId: passportId,
            venueId: session?.venueId || null,
            completedSteps: session?.completedSteps || [],
            xpSummary: session?.smokeCraft?.xp || {},
            stampSummary: session?.passport?.earnedStamps || [],
            tasteProfile: session?.smokeCraft?.tasteProfile || {},
            sessionStatus: 'completed',
          })

          // Record guest activity visible to manager
          await recordGuestActivity({
            guestId: passportId,
            venueId: session?.venueId || null,
            activityType: 'management_sync_screen',
            activitySummary: 'Guest reached Management Sync screen — SmokeCraft journey near completion',
            flavorTags: session?.smokeCraft?.tasteProfile || [],
            loyaltySignal: 'medium',
            managerVisibility: true,
          })

          // Create manager visibility alert
          await createManagerAlertSync({
            guestId: passportId,
            venueId: session?.venueId || null,
            alertType: 'journey_near_complete',
            alertPriority: 'normal',
            alertMessage: 'SmokeCraft guest approaching session complete. Management sync screen reached.',
          })
        }
        // DayOne360 internal workflow reference — fire-and-forget, never blocks guest
        // Does NOT claim live travel/relocation/concierge services
        const d1Result = await createSmokeCraftDayOneConnection({
          venueId: session?.venueId || 'novee-grand-lounge',
          guestId: session?.passport?.passportId || null,
          smokecraftSessionId: session?.sessionId || null,
          connectionType: 'guest_workflow_reference',
          workflowReference: 'management-sync-milestone',
          metadata: { step: 'management_sync', completedSteps: (session?.completedSteps || []).length },
        }).catch(() => ({ ok: false, backendConnected: false }))

        if (d1Result?.backendConnected) {
          await recordDayOneGuestWorkflowEvent({
            connectionId: d1Result?.connection?.connection_id || null,
            venueId: session?.venueId || 'novee-grand-lounge',
            guestId: session?.passport?.passportId || null,
            smokecraftSessionId: session?.sessionId || null,
            eventType: 'journey_milestone',
            eventPayload: { milestone: 'management_sync', completedSteps: (session?.completedSteps || []).length },
          }).catch(() => {})
        }
      } catch {
        // E.A.T. / DayOne360 sync failure must never surface to guest
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const HOTSPOTS = [
    {
      label: 'Complete SmokeCraft',
      x: 10, y: 75, width: 80, height: 20,
      onClick: () => { triggerHaptic('medium'); awardSessionRewards('management-sync') },
      to: '/smokecraft/session-complete',
    },
  ]

  return (
    <>
      {/* E.A.T. sync status — staff/admin only, shown as overlay if backend connected */}
      {eatStatus !== null && (
        <div style={{
          position: 'fixed', top: 8, right: 8, zIndex: 9999,
          padding: '4px 10px', borderRadius: 8, fontSize: 9,
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
          background: eatStatus.backendConnected ? 'rgba(39,174,96,0.15)' : 'rgba(192,57,43,0.12)',
          border: `1px solid ${eatStatus.backendConnected ? 'rgba(39,174,96,0.4)' : 'rgba(192,57,43,0.3)'}`,
          color: eatStatus.backendConnected ? '#27ae60' : '#c0392b',
          pointerEvents: 'none',
        }}>
          {eatStatus.backendConnected ? 'E.A.T. Backend Connected' : 'E.A.T. Local Fallback — Backend Not Connected'}
        </div>
      )}

      <SmokeCraftAssetRoute
        src="/assets/smokecraft-reference/approved/smokecraft-venue-management-sync.png"
        alt="Management Sync"
        hotspots={HOTSPOTS}
        route="/smokecraft/management-sync"
      />
      <SmokeCraftHandoffTrigger allowEAT allowPOS360 />
    </>
  )
}
