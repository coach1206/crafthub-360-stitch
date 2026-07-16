import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { useNavigate } from 'react-router-dom'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD = '#E9C176'
const PANEL = 'rgba(5,3,1,0.88)'
const BORDER = 'rgba(233,193,118,0.20)'

export default function Enroll() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()

  function handleContinue() {
    triggerHaptic('medium')
    awardSessionRewards('enroll')
    navigate('/smokecraft/venue-select')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.enroll}
        alt="SmokeCraft 360 — Begin Your Guided Cigar Experience"
        classification="DECORATIVE_BACKGROUND"
      >
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          pointerEvents: 'none',
        }}>
          <div style={{
            pointerEvents: 'auto',
            background: `linear-gradient(to top, ${PANEL} 70%, transparent)`,
            padding: 'clamp(24px,4vw,40px) clamp(20px,5vw,40px) clamp(28px,5vh,48px)',
            maxWidth: 560,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 10,
              fontFamily: 'Georgia, serif',
            }}>
              SmokeCraft 360
            </div>
            <div style={{
              fontSize: 'clamp(24px,4vw,32px)',
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              color: '#e5e2e1',
              letterSpacing: '0.03em',
              marginBottom: 10,
              lineHeight: 1.2,
            }}>
              Your Guided Cigar Experience
            </div>
            <div style={{
              fontSize: 16,
              fontFamily: 'Georgia, serif',
              color: 'rgba(229,226,225,0.72)',
              lineHeight: 1.6,
              marginBottom: 24,
              maxWidth: 420,
            }}>
              A premium 8-visit journey through identity, pairing, tasting, and certification — guided by a Master Mentor.
            </div>
            <div style={{
              borderTop: `1px solid ${BORDER}`,
              paddingTop: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <button
                type="button"
                onClick={handleContinue}
                style={{
                  display: 'block',
                  width: '100%',
                  background: GOLD,
                  color: '#0a0603',
                  border: 'none',
                  borderRadius: 28,
                  padding: '16px 24px',
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: 'Georgia, serif',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  minHeight: 52,
                  boxShadow: '0 4px 24px rgba(233,193,118,0.4)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Begin Your Journey →
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(229,226,225,0.5)',
                  fontSize: 14,
                  fontFamily: 'Georgia, serif',
                  cursor: 'pointer',
                  padding: '10px 0',
                  textAlign: 'center',
                  touchAction: 'manipulation',
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </SmokeCraftAssetScreen>
    </>
  )
}
