import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import {
  GOLD, GOLD_DIM, CREAM, BORDER, GLASS,
  heroBannerStyle, pageShellStyle, cardStyle, sectionLabelStyle,
} from '../../constants/smokecraftLiveScreenTokens.js'
import SmokeCraftOwnerHeroBackground from '../../components/smokecraft/SmokeCraftOwnerHeroBackground.jsx'

/**
 * Connections — /smokecraft/connections (supporting)
 *
 * TWO-GENERATION MIGRATION — replaces SmokeCraftImageBoundsOverlay (7
 * share-platform hotspots over a decorative portrait crop) with the
 * shared live-DOM card system. No decorative image is used, matching
 * the other supporting-screen conversions this pass. All logic
 * preserved verbatim: toggle/setConnections persistence, handleContinue.
 */

const CONNECTION_OPTIONS = [
  { id: 'instagram', label: 'Instagram',    icon: '📷' },
  { id: 'facebook',  label: 'Facebook',     icon: '📘' },
  { id: 'twitter',   label: 'Twitter',      icon: '🐦' },
  { id: 'whatsapp',  label: 'WhatsApp',     icon: '💬' },
  { id: 'email',     label: 'Email',        icon: '✉️' },
  { id: 'sms',       label: 'SMS',          icon: '📱' },
  { id: 'passport',  label: 'NoveePassport', icon: '🛂' },
]

export default function Connections() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setConnections } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [selected, setSelected] = useState(() => new Set(journey.connections?.selected || []))

  function toggle(id) {
    triggerHaptic('light')
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      setConnections({ selected: [...next] })
      return next
    })
  }

  function handleContinue() {
    triggerHaptic('medium')
    awardSessionRewards('connections')
    navigate('/smokecraft/management-sync')
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <SmokeCraftOwnerHeroBackground assetKey="ownerConnectionsHero" label="Fellow cigar enthusiasts connecting in a lounge" bgPosition="center" bgSize="cover" />
      <div style={{ ...pageShellStyle, position: 'relative', zIndex: 2 }}>
        <div style={heroBannerStyle}>
          <div aria-hidden="true" style={{ fontSize: 40 }}>🔗</div>
          <div>
            <div style={{ fontSize: 11, color: GOLD_DIM, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>SmokeCraft 360 — Share &amp; Connect</div>
            <h1 style={{ margin: '4px 0 6px', color: CREAM, fontSize: 'clamp(26px,3.4vw,36px)' }}>Stay Connected</h1>
            <p style={{ margin: 0, maxWidth: 700, color: 'rgba(229,226,225,.68)', lineHeight: 1.55, fontSize: 'clamp(13px,1.4vw,16px)' }}>
              Choose how you'd like to share your journey or stay in touch. Nothing here is required.
            </p>
          </div>
        </div>

        <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
          <div style={sectionLabelStyle}>Select a way to connect</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginTop: 12 }}>
            {CONNECTION_OPTIONS.map(opt => {
              const active = selected.has(opt.id)
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-label={`${opt.label}${active ? ' (selected)' : ''}`}
                  aria-pressed={active}
                  onClick={() => toggle(opt.id)}
                  style={{
                    minHeight: 96, padding: 14, borderRadius: 12,
                    border: `1px solid ${active ? GOLD : BORDER}`,
                    background: active ? 'rgba(233,193,118,.12)' : GLASS,
                    color: active ? GOLD : CREAM, cursor: 'pointer', fontFamily: 'Georgia, serif',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <span style={{ fontSize: 26 }} aria-hidden="true">{opt.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{active ? '✓ ' : ''}{opt.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
          <div style={sectionLabelStyle}>Privacy &amp; Sharing</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginTop: 12 }}>
            <div>
              <div style={{ color: GOLD, fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>🔒 Nothing is shared automatically</div>
              <p style={{ margin: 0, color: 'rgba(229,226,225,.62)', fontSize: 12.5, lineHeight: 1.55 }}>
                Selecting a platform above only marks your preference for this visit — no post, message, or contact is sent without a separate, explicit action from you.
              </p>
            </div>
            <div>
              <div style={{ color: GOLD, fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>🥃 Why connect at all</div>
              <p style={{ margin: 0, color: 'rgba(229,226,225,.62)', fontSize: 12.5, lineHeight: 1.55 }}>
                Staying in touch lets the venue notify you about new cigar drops, tasting events, and your NoveePassport rewards — entirely optional, never required to continue your journey.
              </p>
            </div>
          </div>
        </section>

        <div style={{ height: 90 }} aria-hidden="true" />
      </div>

      <SmokeCraftNavBar
        primary="Continue to Management Sync →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </SmokeCraftScreenShell>
  )
}
