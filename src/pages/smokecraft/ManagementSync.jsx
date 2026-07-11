import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftHandoffTrigger from '../../components/smokecraft/SmokeCraftHandoffTrigger.jsx'
import { getManagementSyncStatus, syncManagement, recordGuestActivity, createManagerAlertSync } from '../../modules/smokecraft/services/smokecraftManagementSyncService.js'
import { createSmokeCraftDayOneConnection, recordDayOneGuestWorkflowEvent } from '../../services/dayone360SmokeCraftConnectionService.js'

export default function ManagementSync() {
  const { session, awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()
  const [eatStatus, setEATStatus] = useState(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const status = await getManagementSyncStatus(session?.venueId || 'novee-grand-lounge')
        setEATStatus(status)

        if (status?.backendConnected) {
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
          await recordGuestActivity({
            guestId: passportId,
            venueId: session?.venueId || null,
            activityType: 'management_sync_screen',
            activitySummary: 'Guest reached Management Sync screen — SmokeCraft journey near completion',
            flavorTags: session?.smokeCraft?.tasteProfile || [],
            loyaltySignal: 'medium',
            managerVisibility: true,
          })
          await createManagerAlertSync({
            guestId: passportId,
            venueId: session?.venueId || null,
            alertType: 'journey_near_complete',
            alertPriority: 'normal',
            alertMessage: 'SmokeCraft guest approaching session complete. Management sync screen reached.',
          })
        }

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
      } catch {}
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleComplete() {
    setSyncing(true)
    triggerHaptic('medium')
    awardSessionRewards('management-sync')
    navigate('/smokecraft/session-complete')
  }

  return (
    <>
      {/* E.A.T. backend status indicator — staff-visible, real React state */}
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

      <SmokeCraftAssetScreen
        src="/assets/smokecraft/MANAGEMENT%20SYNC.png"
        alt="SmokeCraft Management Sync — Session Data Synced"
      />

      <SmokeCraftNavBar
        primary={syncing ? 'Completing…' : 'Complete SmokeCraft Journey →'}
        onPrimary={handleComplete}
      />

      <SmokeCraftHandoffTrigger allowEAT allowPOS360 />
    </>
  )
}
