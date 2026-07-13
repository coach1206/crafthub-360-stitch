import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { getRankFromXP } from '../../constants/session.js'

const GOLD = '#E9C176'
const PANEL = 'rgba(5,3,1,0.92)'
const BORDER = 'rgba(233,193,118,0.18)'

export default function SessionComplete() {
  const { session, awardSessionRewards, awardStamp } = useGuestSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!session.completedSteps.includes('session-complete')) {
      awardSessionRewards('session-complete')
      awardStamp('journey-complete', 'session-complete')
      triggerHaptic('success')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const xpTotal = session?.smokeCraft?.xp?.total || 0
  const rank = getRankFromXP(xpTotal)
  const guestName = (() => {
    try {
      const raw = localStorage.getItem('sc_identity_v1')
      if (raw) {
        const d = JSON.parse(raw)
        return d.preferredName || d.fullName || null
      }
    } catch {}
    return null
  })()
  const stepsCompleted = (session?.completedSteps || []).length

  function handleReturn() {
    triggerHaptic('medium')
    navigate('/smokecraft')
  }

  function handlePassport() {
    triggerHaptic('light')
    navigate('/passport')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.sessionComplete}
        alt="SmokeCraft 360 — Session Complete"
        classification="DECORATIVE_BACKGROUND"
      >
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}>
          <div style={{
            background: PANEL,
            borderTop: `1px solid ${BORDER}`,
            padding: 'clamp(20px,3vw,32px) clamp(20px,5vw,40px) clamp(80px,12vh,120px)',
            maxWidth: 560,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Georgia, serif' }}>
                SmokeCraft 360 · Journey Complete
              </div>
              {guestName && (
                <div style={{ fontSize: 'clamp(20px,3.5vw,26px)', fontFamily: 'Georgia, serif', fontWeight: 700, color: '#e5e2e1', marginBottom: 6 }}>
                  Well done, {guestName}.
                </div>
              )}
              <div style={{ fontSize: 16, fontFamily: 'Georgia, serif', color: 'rgba(229,226,225,0.7)', lineHeight: 1.5 }}>
                Your first SmokeCraft session is complete and saved.
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              marginBottom: 20,
              flexWrap: 'wrap',
            }}>
              <div style={{
                background: 'rgba(233,193,118,0.08)',
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: '12px 20px',
                textAlign: 'center',
                flex: '1 1 120px',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: GOLD, fontFamily: 'Georgia, serif' }}>{xpTotal}</div>
                <div style={{ fontSize: 10, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>XP Earned</div>
              </div>
              <div style={{
                background: 'rgba(233,193,118,0.08)',
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: '12px 20px',
                textAlign: 'center',
                flex: '1 1 120px',
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: GOLD, fontFamily: 'Georgia, serif' }}>{rank?.name || 'Novice'}</div>
                <div style={{ fontSize: 10, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Current Rank</div>
              </div>
              <div style={{
                background: 'rgba(233,193,118,0.08)',
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: '12px 20px',
                textAlign: 'center',
                flex: '1 1 120px',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: GOLD, fontFamily: 'Georgia, serif' }}>{stepsCompleted}</div>
                <div style={{ fontSize: 10, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Steps Completed</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(233,193,118,0.05)',
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 4,
              fontSize: 14,
              fontFamily: 'Georgia, serif',
              color: 'rgba(229,226,225,0.65)',
              lineHeight: 1.6,
              textAlign: 'center',
            }}>
              Return on your next visit to unlock the next chapter of your SmokeCraft journey.
            </div>
          </div>
        </div>
      </SmokeCraftAssetScreen>

      <SmokeCraftNavBar
        primary="Return to SmokeCraft Hub"
        onPrimary={handleReturn}
        secondary="View My Passport"
        onSecondary={handlePassport}
      />
    </>
  )
}
