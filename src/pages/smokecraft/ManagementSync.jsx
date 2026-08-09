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

const GOLD   = '#E9C176'
const GOLD_DIM = 'rgba(233,193,118,0.55)'
const CREAM  = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS  = 'rgba(233,193,118,0.06)'

/**
 * Management Sync — /smokecraft/management-sync (supporting, post-Passport
 * Stamp)
 *
 * SC-D087 rebuild (finishes SC-D083) — this screen was still `mode=
 * "image-shell"` on the approved MANAGEMENT SYNC.png composite: its upper
 * ~54% (4 stat boxes — Journey Sync Status, Data Shared, Guest Impact
 * Score, Venue Benefit — plus a "WAS SYNCED" text row) was baked with
 * empty value zones and only a handful of floating text overlays, no real
 * card structure. SC-D083 (previous pass) already replaced the lower ~45%
 * with a real, honest Available-Now/Coming-Soon panel; this pass converts
 * the ENTIRE screen to real live DOM (`mode="live"`, no baked image at
 * all) so nothing baked-but-empty remains anywhere on the page.
 */
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

  const summaryStats = [
    { label: 'Cigar', value: cigar?.name || null },
    { label: 'Pairing', value: pairing?.recommendation || null },
    { label: 'XP Earned', value: session?.xp > 0 ? String(session.xp) : null },
    { label: 'Flavor Notes', value: flavors.length > 0 ? flavors.join(', ') : null },
  ]

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(16px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Georgia, serif' }}>


        <header>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            SmokeCraft 360 — Supporting Module
          </div>
          <h1 style={{ margin: '4px 0 6px', fontSize: 'clamp(24px,3.4vw,34px)', color: CREAM }}>Management Sync</h1>
          <p style={{ margin: 0, fontSize: 'clamp(13px,1.4vw,15px)', color: 'rgba(229,226,225,0.65)', lineHeight: 1.55, maxWidth: 640 }}>
            Sync this journey's cigar, pairing, and flavor selections into venue operations.
          </p>
        </header>

        {/* Journey Sync Status — real per-field cards, honest "Not recorded" for anything not captured. */}
        <section style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Journey Sync Status
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {summaryStats.map(s => (
              <div key={s.label} style={{ background: '#0b0f18', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12.5, color: s.value ? CREAM : 'rgba(229,226,225,0.35)', fontStyle: s.value ? 'normal' : 'italic' }}>{s.value || 'Not recorded'}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Honest disclosure — venue-wide AGGREGATE analytics (top pairing,
            most selected cigar, satisfaction trend) genuinely have no
            backend yet (Package D scope, see SMOKECRAFT_MANAGEMENT_SYNC_
            DESTINATION_AUDIT.md). */}
        <div style={{ fontSize: 'clamp(10px,0.95vw,12px)', color: 'rgba(229,226,225,0.4)', fontStyle: 'italic', lineHeight: 1.5 }}>
          Venue-wide aggregate insights are not connected yet — this venue analytics backend has not been built.
        </div>

        <section style={{ background: '#0b0f18', borderRadius: 10, border: `1px solid ${BORDER}`, padding: 'clamp(14px,2vw,22px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Available Now
          </div>

          {/* Real, honest single-journey sync status — server-authoritative
              once populated, never fabricated. No venue selected -> no
              control is shown at all. */}
          {hasRealVenue ? (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{ fontSize: 'clamp(10px,0.95vw,13px)', color: 'rgba(229,226,225,0.75)', lineHeight: 1.6, marginBottom: 18 }}
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
        </section>

        <div style={{ height: 90 }} aria-hidden="true" />
      </div>

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Complete SmokeCraft Journey →'}
        onPrimary={handleComplete}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </SmokeCraftScreenShell>
  )
}
