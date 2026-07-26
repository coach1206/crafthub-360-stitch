import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { useSmokeCraftServerJourney } from '../../hooks/useSmokeCraftServerJourney.js'
import { mapJourneyToSnapshotPayload } from '../../services/smokecraft/managementSyncSnapshotMapper.js'
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

  const cigar   = journey.selectedCigar
  const pairing = journey.pairing
  const flavors = journey.flavorMemory?.selectedFlavors || []

  const hasRealVenue = !!(journey.selectedVenue && !journey.selectedVenue.skipped)

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

        {/* Honest disclosure for Management Insights / Venue Operations
            Impact — venue-wide AGGREGATE analytics (top pairing, most
            selected cigar, satisfaction trend) genuinely have no backend
            yet (Package D scope, see SMOKECRAFT_MANAGEMENT_SYNC_
            DESTINATION_AUDIT.md) — this text is unchanged and still
            accurate. Sync Activity (this single journey's own sync
            record), however, is now real when a venue is selected — see
            the status row below, populated from Package B's real API. */}
        <div style={{
          position: 'absolute',
          left: '61%', top: '32.5%', width: '37%',
          pointerEvents: 'none', fontFamily: 'Georgia, serif',
          fontSize: 'clamp(9px,0.85vw,12px)', color: 'rgba(229,226,225,0.45)',
          lineHeight: 1.5, fontStyle: 'italic',
        }}>
          Venue-wide aggregate insights are not connected yet — this venue analytics backend has not been built.
        </div>

        {/* Real, honest single-journey sync status — server-authoritative
            once populated, never fabricated. No venue selected -> no
            control is shown at all (matches "do not create a journey
            merely because a venue was selected"). */}
        {hasRealVenue && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{
              position: 'absolute',
              left: '11%', top: '68%', width: '78%',
              fontFamily: 'Georgia, serif', fontSize: 'clamp(9px,0.85vw,12px)',
              color: 'rgba(229,226,225,0.65)', lineHeight: 1.6,
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
          </div>
        )}
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
