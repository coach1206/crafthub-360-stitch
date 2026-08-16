import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { SMOKECRAFT_NAV_DESTINATIONS as NAV } from '../../constants/smokecraftNavigationRegistry.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(233,193,118,0.06)'
const NAVY_DEEP = '#060810'

const ACK_TEXT = 'I have read, understood, and agree to follow the Golden Box Rules.'

const GOLDEN_PRINCIPLES = [
  { n: 1, title: 'Respect the Cigar', body: 'Treat every cigar with care and appreciation.' },
  { n: 2, title: 'Respect the Environment', body: 'Keep the lounge clean, calm, and comfortable.' },
  { n: 3, title: 'Respect Fellow Guests', body: "Be mindful of others' experience and space." },
  { n: 4, title: 'Savor the Moment', body: 'Slow down, disconnect, and enjoy the journey.' },
  { n: 5, title: 'Protect the Ritual', body: 'Follow the steps, honor the process, and elevate.' },
]

const QUICK_REMINDERS = [
  { icon: '🚬', label: 'Handle With Care' },
  { icon: '🤝', label: 'Respect Others' },
  { icon: '🧹', label: 'Keep It Clean' },
  { icon: '🥃', label: 'Enjoy & Savor' },
]

const RIGHT_WAY_TO_ENJOY = [
  { icon: '✂️', title: 'Cut', body: 'Clean cut for an even draw.' },
  { icon: '🔥', title: 'Toast', body: 'Toast the foot gently.' },
  { icon: '🕯️', title: 'Light', body: 'Use soft flame. No butane.' },
  { icon: '👃', title: 'Savor', body: 'Slow down and enjoy each puff.' },
  { icon: '🪶', title: 'Rest', body: 'Rest it properly. Respect the ash.' },
]

const MISCONDUCT_CONSEQUENCES = [
  'Removal from the lounge',
  'Loss of journey progress',
  'Suspension from future experiences',
]

export default function GoldenBox() {
  const { session, awardSessionRewards } = useGuestSession()
  const { journey, setGoldenBox } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [acknowledged, setAcknowledged] = useState(() => journey.goldenBox?.acknowledged ?? false)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return }
    setGoldenBox({ acknowledged })
  }, [acknowledged]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleContinue() {
    if (!acknowledged) return
    triggerHaptic('medium')
    try { awardSessionRewards('golden-box') } catch (_) {}
    navigate(NAV.MENTOR)
  }

  function toggleAcknowledgement(nextValue) {
    triggerHaptic('light')
    setAcknowledged(nextValue)
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(14px,2.5vw,28px)', paddingBottom: 150 }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
          marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, color: GOLD_DIM, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 5, fontWeight: 700 }}>
              SmokeCraft Journey
            </div>
            <h1 style={{ margin: '0 0 5px', fontSize: 'clamp(22px,2.8vw,30px)', color: CREAM, fontFamily: 'Georgia, serif' }}>
              Golden Box Rules
            </h1>
            <p style={{ margin: '0 0 3px', fontSize: 13, fontStyle: 'italic', color: GOLD_DIM }}>
              Honor the Leaf. Respect the Craft. Elevate the Experience.
            </p>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: 'rgba(229,226,225,0.75)', maxWidth: 620 }}>
              These rules protect the ritual, the guests, and the integrity of your journey. Read, understand, and commit.
            </p>
          </div>
          <div style={{
            flexShrink: 0, minWidth: 104, textAlign: 'center',
            background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 12px',
          }}>
            <div style={{ fontSize: 9.5, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your Journey</div>
            <div style={{ fontSize: 16, color: CREAM, fontWeight: 700 }}>{session?.xp ?? 0} XP</div>
          </div>
        </div>

        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(12px,1.8vw,18px)', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
            The Golden Principles
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', columnGap: 24, rowGap: 8 }}>
            {GOLDEN_PRINCIPLES.map(p => (
              <li key={p.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${GOLD}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: GOLD, fontWeight: 700,
                }}>{p.n}</span>
                <div>
                  <div style={{ fontSize: 13, color: CREAM, fontWeight: 700 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.65)' }}>{p.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginBottom: 14 }}>
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(12px,1.8vw,16px)' }}>
            <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 9 }}>
              Quick Rule Reminders
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {QUICK_REMINDERS.map(r => (
                <div key={r.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '9px 6px', border: `1px solid ${BORDER}`, borderRadius: 8, background: 'rgba(0,0,0,0.2)',
                }}>
                  <span style={{ fontSize: 17 }} aria-hidden="true">{r.icon}</span>
                  <span style={{ fontSize: 10.5, color: CREAM, textAlign: 'center', fontWeight: 600 }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(120,50,20,0.10)', border: '1px solid rgba(233,150,90,0.35)', borderRadius: 12, padding: 'clamp(12px,1.8vw,16px)' }}>
            <div style={{ fontSize: 11, color: '#e9a15a', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden="true">⚠</span> Consequences of Misconduct
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(229,226,225,0.7)', marginBottom: 5 }}>Failure to follow the rules may result in:</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'rgba(229,226,225,0.8)', lineHeight: 1.65 }}>
              {MISCONDUCT_CONSEQUENCES.map(c => <li key={c}>{c}</li>)}
            </ul>
          </div>
        </div>

        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(12px,1.8vw,16px)', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>
            The Right Way to Enjoy
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(229,226,225,0.55)', marginBottom: 10 }}>A visual guide to honoring the leaf.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(100px, 1fr))', gap: 8 }} className="golden-box-enjoy-grid">
            {RIGHT_WAY_TO_ENJOY.map(s => (
              <div key={s.title} style={{ textAlign: 'center', padding: '9px 5px', border: `1px solid ${BORDER}`, borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: 19, marginBottom: 3 }} aria-hidden="true">{s.icon}</div>
                <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.6)' }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>

        <div role="note" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(229,226,225,0.7)' }}>
          <span style={{ color: GOLD, fontWeight: 700 }} aria-hidden="true">ⓘ GOLDEN TIP:</span>
          The more you respect the ritual, the richer your experience becomes.
        </div>

        <style>{`
          @media (max-width: 720px) {
            .golden-box-enjoy-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          }
        `}</style>
      </div>

      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
        background: 'rgba(6,8,16,0.97)', borderTop: `1px solid ${BORDER}`,
        boxShadow: '0 -12px 36px rgba(0,0,0,0.45)',
        padding: '10px clamp(12px,2.5vw,28px) 12px',
      }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'auto minmax(260px,1fr) auto', gap: 12, alignItems: 'center' }} className="golden-box-progress-bar">
          <button
            type="button"
            onClick={() => navigate('/smokecraft/venue-select')}
            style={{
              background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 999,
              color: GOLD, fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14,
              padding: '10px 22px', cursor: 'pointer', minHeight: 44, touchAction: 'manipulation',
            }}
          >
            ← Back
          </button>

          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            minHeight: 44, padding: '8px 12px', borderRadius: 10,
            background: acknowledged ? 'rgba(233,193,118,0.14)' : GLASS,
            border: `1.5px solid ${acknowledged ? GOLD : BORDER}`,
            cursor: 'pointer', color: CREAM,
          }}>
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={e => toggleAcknowledgement(e.target.checked)}
              style={{ width: 22, height: 22, accentColor: GOLD, cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 10.5, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                Rule Acknowledgement
              </span>
              <span style={{ display: 'block', fontSize: 12, color: acknowledged ? CREAM : 'rgba(229,226,225,0.72)', lineHeight: 1.25 }}>
                {ACK_TEXT}
              </span>
            </span>
          </label>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!acknowledged}
            aria-label="Continue to Mentor Selection"
            style={{
              background: acknowledged ? `linear-gradient(180deg, #F3D48E, ${GOLD})` : 'rgba(233,193,118,0.08)',
              color: acknowledged ? '#241605' : 'rgba(233,193,118,0.45)',
              border: `1.5px solid ${acknowledged ? 'transparent' : BORDER}`, borderRadius: 999,
              fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.02em',
              padding: '10px 26px', cursor: acknowledged ? 'pointer' : 'not-allowed',
              minHeight: 44, touchAction: 'manipulation', whiteSpace: 'nowrap',
            }}
          >
            Next: Mentor Selection →
          </button>
        </div>
        <style>{`
          @media (max-width: 760px) {
            .golden-box-progress-bar {
              grid-template-columns: auto 1fr !important;
            }
            .golden-box-progress-bar label {
              grid-column: 1 / -1;
              grid-row: 1;
            }
            .golden-box-progress-bar button:first-of-type { grid-column: 1; grid-row: 2; }
            .golden-box-progress-bar button:last-of-type { grid-column: 2; grid-row: 2; }
          }
        `}</style>
      </div>
    </SmokeCraftScreenShell>
  )
}
