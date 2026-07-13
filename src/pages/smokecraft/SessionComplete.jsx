import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { getRankFromXP } from '../../constants/session.js'

const GOLD   = '#E9C176'
const PANEL  = 'rgba(5,3,1,0.92)'
const BORDER = 'rgba(233,193,118,0.18)'
const DIM    = 'rgba(229,226,225,0.55)'

export default function SessionComplete() {
  const { session, awardSessionRewards, awardStamp } = useGuestSession()
  const { journey } = useSmokeCraftJourney()
  const navigate = useNavigate()

  useEffect(() => {
    if (!session.completedSteps.includes('session-complete')) {
      awardSessionRewards('session-complete')
      awardStamp('journey-complete', 'session-complete')
      triggerHaptic('success')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const xpTotal = session?.smokeCraft?.xp?.total || session?.xp || 0
  const rank = getRankFromXP(xpTotal)
  const stepsCompleted = (session?.completedSteps || []).length

  // Guest identity — read from journey context (set by Identity.jsx) or sc_identity_v1 fallback
  const identity = journey.identity || (() => {
    try {
      const raw = localStorage.getItem('sc_identity_v1')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })()
  const guestName = identity?.preferredName || identity?.fullName || null

  // Journey summary data
  const cigar        = journey.selectedCigar
  const pairing      = journey.pairing
  const mentor       = journey.mentor
  const format       = journey.format
  const flavorMemory = journey.flavorMemory

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.sessionComplete}
        alt="SmokeCraft 360 — Session Complete"
        classification="DECORATIVE_BACKGROUND"
      >
        <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{
            background: PANEL, borderTop: `1px solid ${BORDER}`,
            padding: 'clamp(16px,3vw,28px) clamp(16px,5vw,36px) clamp(80px,12vh,120px)',
            maxWidth: 560, width: '100%', margin: '0 auto', boxSizing: 'border-box',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Georgia, serif' }}>
                SmokeCraft 360 · Journey Complete
              </div>
              {guestName && (
                <div style={{ fontSize: 'clamp(18px,3.5vw,24px)', fontFamily: 'Georgia, serif', fontWeight: 700, color: '#e5e2e1', marginBottom: 4 }}>
                  Well done, {guestName}.
                </div>
              )}
              <div style={{ fontSize: 15, fontFamily: 'Georgia, serif', color: DIM, lineHeight: 1.5 }}>
                Your first SmokeCraft session is complete and saved.
              </div>
            </div>

            {/* Stat tiles */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { value: xpTotal,              label: 'XP Earned',       size: 22 },
                { value: rank?.name || 'Novice', label: 'Current Rank',  size: 14 },
                { value: stepsCompleted,        label: 'Steps Completed', size: 22 },
              ].map(tile => (
                <div key={tile.label} style={{
                  background: 'rgba(233,193,118,0.08)', border: `1px solid ${BORDER}`,
                  borderRadius: 10, padding: '10px 18px', textAlign: 'center', flex: '1 1 100px',
                }}>
                  <div style={{ fontSize: tile.size, fontWeight: 700, color: GOLD, fontFamily: 'Georgia, serif' }}>{tile.value}</div>
                  <div style={{ fontSize: 9, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{tile.label}</div>
                </div>
              ))}
            </div>

            {/* Journey summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {cigar && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#e5e2e1', fontFamily: 'Georgia, serif' }}>
                  <span style={{ color: GOLD, fontWeight: 700, minWidth: 80, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: 1 }}>Cigar</span>
                  <span>{cigar.name}{cigar.origin ? ` · ${cigar.origin}` : ''}</span>
                </div>
              )}
              {pairing?.recommendation && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#e5e2e1', fontFamily: 'Georgia, serif' }}>
                  <span style={{ color: GOLD, fontWeight: 700, minWidth: 80, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: 1 }}>Pairing</span>
                  <span>{pairing.recommendation}</span>
                </div>
              )}
              {Array.isArray(mentor) && mentor.length > 0 && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#e5e2e1', fontFamily: 'Georgia, serif' }}>
                  <span style={{ color: GOLD, fontWeight: 700, minWidth: 80, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: 1 }}>Mentor</span>
                  <span>{mentor.map(m => m.name).join(', ')}</span>
                </div>
              )}
              {format?.label && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#e5e2e1', fontFamily: 'Georgia, serif' }}>
                  <span style={{ color: GOLD, fontWeight: 700, minWidth: 80, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: 1 }}>Format</span>
                  <span>{format.label} · {format.desc}</span>
                </div>
              )}
              {flavorMemory?.selectedFlavors?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#e5e2e1', fontFamily: 'Georgia, serif' }}>
                  <span style={{ color: GOLD, fontWeight: 700, minWidth: 80, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: 1 }}>Flavors</span>
                  <span>{flavorMemory.selectedFlavors.slice(0, 4).join(', ')}{flavorMemory.selectedFlavors.length > 4 ? '…' : ''}</span>
                </div>
              )}
            </div>

            <div style={{
              background: 'rgba(233,193,118,0.05)', border: `1px solid ${BORDER}`,
              borderRadius: 10, padding: '10px 14px', fontSize: 13,
              fontFamily: 'Georgia, serif', color: DIM, lineHeight: 1.6, textAlign: 'center',
            }}>
              Return on your next visit to unlock the next chapter of your SmokeCraft journey.
            </div>
          </div>
        </div>
      </SmokeCraftAssetScreen>

      <SmokeCraftNavBar
        primary="Return to SmokeCraft Hub"
        onPrimary={() => { triggerHaptic('medium'); navigate('/smokecraft') }}
        secondary="View My Passport"
        onSecondary={() => { triggerHaptic('light'); navigate('/passport') }}
      />
    </>
  )
}
