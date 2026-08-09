import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { useSmokeCraftServerJourney } from '../../hooks/useSmokeCraftServerJourney.js'
import { mapJourneyToSnapshotPayload } from '../../services/smokecraft/managementSyncSnapshotMapper.js'
import * as smokecraftManagementSyncService from '../../modules/smokecraft/services/smokecraftManagementSyncService.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1448
const NAT_H = 1086

const GOLD = '#E9C176'

export default function ManagementSync() {
  const { awardSessionRewards, session } = useGuestSession()
  const { journey } = useSmokeCraftJourney()
  const { managementSync, startOrResumeJourney, saveSnapshot, completeOnServer, requestSync } = useSmokeCraftServerJourney()
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const [syncActionState, setSyncActionState] = useState('idle') // idle | working | done | error
  const [eatStatus, setEatStatus] = useState(null) // E.A.T. backend health — honest, never assumed

  const cigar   = journey.selectedCigar
  const pairing = journey.pairing
  const flavors = journey.flavorMemory?.selectedFlavors || []

  const hasRealVenue = !!(journey.selectedVenue && !journey.selectedVenue.skipped)

  // E.A.T. backend health check — read-only, fire-and-forget, never blocks
  // render or gameplay. Honestly reflects backend-connected vs local-only.
  useEffect(() => {
    ;(async () => {
      try {
        const status = await smokecraftManagementSyncService.getManagementSyncStatus(
          journey.selectedVenue?.id || null
        )
        setEatStatus(status)
      } catch {
        setEatStatus({ backendConnected: false })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Explicit user action only — never triggered by mount/render/polling.
  // A guest without a real selected venue never reaches the server at
  // all (honest — matches the "no venue" disclosure already in place).
  async function handleSyncToVenue() {
    if (!hasRealVenue || syncActionState === 'working') return
    setSyncActionState('working')
    try {
      const started = await startOrResumeJourney({
        venueId: journey.selectedVenue.id,
        sessionNumber: 27,
        phase: 'management_sync',
        sourceVersion: 'package-c',
      })
      if (!started.ok) { setSyncActionState('error'); return }
      const serverJourneyId = started.journey.journeyId

      const snap = await saveSnapshot(
        { ...mapJourneyToSnapshotPayload(journey), completionState: 'completed' },
        serverJourneyId
      )
      if (!snap.ok) { setSyncActionState('error'); return }

      const completed = await completeOnServer(serverJourneyId)
      if (!completed.ok) { setSyncActionState('error'); return }

      const synced = await requestSync('venue_insights', serverJourneyId)
      setSyncActionState(synced.ok ? 'done' : 'error')

      // E.A.T. live sync — genuinely separate from the venue-journey server
      // above; fire-and-forget, never blocks the guest UI or reverses the
      // venue-sync result already set. Failures degrade to local_fallback
      // inside the service itself — SmokeCraft completion stays canonical.
      smokecraftManagementSyncService.syncManagement({
        venueId:             journey.selectedVenue.id,
        guestId:             session?.guestId || session?.id || null,
        smokecraftSessionId: serverJourneyId,
        sessionStatus:       'completed',
        completedRoute:      'management-sync',
        completedSteps:      session?.completedSteps || [],
        xpSummary:           { xp: session?.xp || 0 },
        stampSummary:        session?.stamps || [],
        tasteProfile:        { tasteTags: flavors },
      }).then(res => setEatStatus(res)).catch(() => {})
      smokecraftManagementSyncService.recordGuestActivity({
        venueId:          journey.selectedVenue.id,
        guestId:          session?.guestId || session?.id || null,
        managerVisibility: true,
      }).catch(() => {})
      smokecraftManagementSyncService.createManagerAlertSync({
        venueId:   journey.selectedVenue.id,
        alertType: 'session_synced',
      }).catch(() => {})
    } catch {
      setSyncActionState('error')
    }
  }

  function handleComplete() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    awardSessionRewards('management-sync')
    navigate('/smokecraft/session-complete')
  }

  return (
    <>
            <SmokeCraftScreenShell
        mode="image-shell"
        status="ready"
        imageProps={{ src: SC_ASSETS.managementSync, naturalW: NAT_W, naturalH: NAT_H, alt: "SmokeCraft Management Sync — Session Summary" }}
      >
        {/* Journey data in the summary zone — left was 5%, inside the
            baked sidebar icon column (0-9.2%), causing the XP badge to
            render floating over the nav icons. Moved to align with the
            approved "Journey Sync Status" field row (starts ~10.6%). */}
        <div style={{
          position: 'absolute',
          left: '11%', top: '30%',
          width: '55%',
          display: 'flex',
          flexDirection: 'column',
          gap: '2%',
          pointerEvents: 'none',
          fontFamily: 'Georgia, serif',
          fontWeight: 600,
          color: GOLD,
          letterSpacing: '0.03em',
          userSelect: 'none',
          fontSize: 'clamp(10px,1.1vw,15px)',
          lineHeight: 1.4,
        }}>
          {cigar?.name   && <span>{cigar.name}</span>}
          {pairing?.recommendation && <span>{pairing.recommendation}</span>}
          {session?.xp   > 0 && <span>{session.xp} XP</span>}
          {flavors.length > 0 && <span>{flavors.join(', ')}</span>}
        </div>

        {/* Honest disclosure for Management Insights — venue-wide AGGREGATE
            analytics (top pairing, most selected cigar, satisfaction trend)
            genuinely have no backend yet (Package D scope, see
            SMOKECRAFT_MANAGEMENT_SYNC_DESTINATION_AUDIT.md). */}
        <div style={{
          position: 'absolute',
          left: '61%', top: '32.5%', width: '37%',
          pointerEvents: 'none', fontFamily: 'Georgia, serif',
          fontSize: 'clamp(9px,0.85vw,12px)', color: 'rgba(229,226,225,0.45)',
          lineHeight: 1.5, fontStyle: 'italic',
        }}>
          Venue-wide aggregate insights are not connected yet — this venue analytics backend has not been built.
        </div>

        {/* SC-D083 fix: the lower ~45% of the approved MANAGEMENT SYNC.png
            composite is a fully baked mock dashboard — Venue Operations
            Impact cards, a Sync Activity table, a Command Hub panel — none
            of it backed by any real data or control. A real player could
            never interact with or trust any of it. Rather than leave that
            fake chrome visible (or invent fake data to fill it), an opaque
            panel now replaces it with one honest, real section that
            clearly separates what's live today (this journey's own sync
            status) from what's a real, disclosed future feature — matching
            the same "mask + honest real content" pattern used to fix the
            Golden Box Rules blank-panel defect (SC-D079). */}
        <div style={{
          position: 'absolute', left: '5%', top: '54%', width: '90%', height: '43%',
          background: '#0b0f18', borderRadius: 10, border: '1px solid rgba(233,193,118,0.22)',
          padding: 'clamp(14px,2vw,22px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          fontFamily: 'Georgia, serif',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Available Now
          </div>

          {/* Real, honest single-journey sync status — server-authoritative
              once populated, never fabricated. No venue selected -> no
              control is shown at all (matches "do not create a journey
              merely because a venue was selected"). */}
          {hasRealVenue ? (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{
              fontFamily: 'Georgia, serif', fontSize: 'clamp(10px,0.95vw,13px)',
              color: 'rgba(229,226,225,0.75)', lineHeight: 1.6, marginBottom: 18,
            }}
          >
            {syncActionState === 'idle' && managementSync.syncStatus !== 'completed' && (
              <button
                type="button"
                onClick={handleSyncToVenue}
                aria-label="Sync this journey's cigar, pairing, and flavor selections to the venue"
                style={{
                  background: 'transparent', border: `1.5px solid ${GOLD}`, color: GOLD,
                  borderRadius: 16, padding: '6px 16px', fontSize: 'inherit', fontFamily: 'inherit',
                  cursor: 'pointer', pointerEvents: 'auto', minHeight: 44,
                }}
              >
                Sync This Journey to Venue
              </button>
            )}
            {syncActionState === 'working' && <span>Syncing…</span>}
            {syncActionState === 'error' && (
              <span style={{ color: 'rgba(255,150,150,0.8)' }}>
                Sync failed — venue backend unavailable.{' '}
                <button
                  type="button"
                  onClick={handleSyncToVenue}
                  aria-label="Retry syncing this journey to the venue"
                  style={{
                    background: 'transparent', border: `1px solid rgba(255,150,150,0.6)`, color: 'rgba(255,180,180,0.95)',
                    borderRadius: 12, padding: '3px 10px', fontSize: 'inherit', fontFamily: 'inherit',
                    cursor: 'pointer', pointerEvents: 'auto', minHeight: 44, marginLeft: 4,
                  }}
                >
                  Retry
                </button>
              </span>
            )}
            {(syncActionState === 'done' || managementSync.syncStatus === 'completed') && (
              <span style={{ color: GOLD }}>
                ✓ Synced to venue{managementSync.snapshotVersion ? ` — snapshot v${managementSync.snapshotVersion}` : ''}
              </span>
            )}
            {eatStatus && (
              <div style={{ marginTop: 6, fontSize: '0.85em', color: eatStatus.backendConnected ? GOLD : 'rgba(229,226,225,0.45)' }}>
                {eatStatus.backendConnected ? 'E.A.T. Backend Connected' : 'E.A.T. Local Fallback — no data leaves this device yet'}
              </div>
            )}
          </div>
          ) : (
            <div style={{ fontSize: 'clamp(10px,0.95vw,13px)', color: 'rgba(229,226,225,0.5)', fontStyle: 'italic', marginBottom: 18 }}>
              Select a venue earlier in your journey to sync this session.
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(233,193,118,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, borderTop: '1px solid rgba(233,193,118,0.15)', paddingTop: 14 }}>
            Coming In A Future Update
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {[
              'Venue Operations Impact (inventory, staff, revenue signals)',
              'Management Insights (top pairing, most-selected cigar, satisfaction trend)',
              'Sync Activity Log (multi-session history)',
              'Command Hub (analytics, reports, operational tools)',
            ].map(label => (
              <div key={label} style={{
                background: 'rgba(233,193,118,0.05)', border: '1px dashed rgba(233,193,118,0.25)',
                borderRadius: 8, padding: '10px 12px', fontSize: 'clamp(9px,0.82vw,11.5px)',
                color: 'rgba(229,226,225,0.5)', lineHeight: 1.4,
              }}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </SmokeCraftScreenShell>

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Complete SmokeCraft Journey →'}
        onPrimary={handleComplete}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
