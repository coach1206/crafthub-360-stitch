import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD = '#E9C176'
const GOLD_DIM = 'rgba(233,193,118,0.70)'
const PANEL = 'rgba(5,3,1,0.92)'
const BORDER = 'rgba(233,193,118,0.18)'

const SHARING_ITEMS = [
  'Cigar selection and pairing preference',
  'Tasting notes and flavor journey',
  'Session date and visit number',
  'Earned badges and XP level',
]

export default function ManagementSync() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()
  const [staffFollowUp, setStaffFollowUp] = useState(false)
  const [syncing, setSyncing] = useState(false)

  function handleComplete() {
    if (syncing) return
    setSyncing(true)
    triggerHaptic('medium')
    awardSessionRewards('management-sync')
    navigate('/smokecraft/session-complete')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.managementSync}
        alt="SmokeCraft Management Sync — Session Summary"
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
            padding: 'clamp(16px,3vw,28px) clamp(16px,5vw,36px) clamp(20px,4vh,36px)',
            maxWidth: 540,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
            maxHeight: '70dvh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}>
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
                SmokeCraft 360
              </div>
              <div style={{ fontSize: 'clamp(18px,3.5vw,22px)', fontFamily: 'Georgia, serif', fontWeight: 700, color: '#e5e2e1' }}>
                Session Saved
              </div>
              <div style={{ fontSize: 15, color: 'rgba(229,226,225,0.6)', fontFamily: 'Georgia, serif', marginTop: 6, lineHeight: 1.5 }}>
                Your SmokeCraft experience has been recorded locally on this device.
              </div>
            </div>

            <div style={{
              background: 'rgba(233,193,118,0.06)',
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                What may be shared with the venue
              </div>
              {SHARING_ITEMS.map(item => (
                <div key={item} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                  fontSize: 15,
                  fontFamily: 'Georgia, serif',
                  color: 'rgba(229,226,225,0.8)',
                }}>
                  <span style={{ color: GOLD, fontSize: 16, flexShrink: 0 }}>✓</span>
                  {item}
                </div>
              ))}
              <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.45)', fontFamily: 'Georgia, serif', marginTop: 8, lineHeight: 1.5 }}>
                Personal contact information is never shared without your explicit consent.
              </div>
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              cursor: 'pointer',
              marginBottom: 0,
            }}>
              <input
                type="checkbox"
                checked={staffFollowUp}
                onChange={e => { triggerHaptic('light'); setStaffFollowUp(e.target.checked) }}
                style={{ width: 20, height: 20, accentColor: GOLD, cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
              />
              <span style={{
                fontFamily: 'Georgia, serif',
                fontSize: 15,
                color: staffFollowUp ? '#e5e2e1' : 'rgba(229,226,225,0.6)',
                lineHeight: 1.5,
              }}>
                Request staff follow-up or a personal recommendation before I leave
              </span>
            </label>
          </div>
        </div>
      </SmokeCraftAssetScreen>

      <SmokeCraftNavBar
        primary={syncing ? 'Completing…' : 'Complete SmokeCraft Journey →'}
        onPrimary={handleComplete}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
