import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { SMOKECRAFT_NAV_DESTINATIONS as NAV } from '../../constants/smokecraftNavigationRegistry.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

// Live Production Player-Experience Repair pass.
//
// ROOT CAUSE of the reported defect ("several large panels are completely
// blank, behaves like a static shell"): this screen was an image-shell
// screen built on the approved GOLDEN BOX RULES.png composite, with three
// large regions of that baked artwork ("YOUR COMMITMENT" guest-info form,
// "VENUE SETTINGS" form, "GUEST AGREEMENTS (STAFF USE)" table) covered by
// an opaque `BlankPanel` mask. That masking was the right call — those
// three baked forms duplicated Identity/Venue Select's real fields (or,
// for the staff table, had no real feature behind it at all) and would
// have been fake, non-functional UI if left visible — but masking them
// with an empty void instead of removing them and reflowing real content
// left exactly the "static incomplete shell" a real player sees today.
//
// Fix: rebuilt as real, live DOM (same pattern already proven for
// HumidorMatch, SC-D076) — every remaining real, approved piece of
// content (Golden Principles, Quick Rule Reminders, Rule Acknowledgement,
// Consequences of Misconduct, The Right Way to Enjoy, Golden Tip) is now
// real text/DOM, transcribed from the approved composite
// (public/assets/smokecraft/GOLDEN BOX RULES.png), not baked pixels. No
// blank panels remain. No fake duplicate-of-Identity/Venue-Select forms
// were reintroduced — the same "not this screen's job" reasoning is kept,
// just without leaving a visible void where they used to be masked.

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(233,193,118,0.06)'

// Approved copy — from the same GOLDEN BOX RULES.png composite this
// screen was always built against.
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

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(16px,3vw,32px)', paddingBottom: 132 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        marginBottom: 20,
      }}>
        <div>
          <div style={{ fontSize: 11, color: GOLD_DIM, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 }}>
            SmokeCraft Journey
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(22px,2.8vw,30px)', color: CREAM, fontFamily: 'Georgia, serif' }}>
            Golden Box Rules
          </h1>
          <p style={{ margin: '0 0 4px', fontSize: 13.5, fontStyle: 'italic', color: GOLD_DIM }}>
            Honor the Leaf. Respect the Craft. Elevate the Experience.
          </p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'rgba(229,226,225,0.75)', maxWidth: 560 }}>
            These rules protect the ritual, the guests, and the integrity of your journey. Read, understand, and commit.
          </p>
        </div>
        <div style={{
          flexShrink: 0, minWidth: 110, textAlign: 'center',
          background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 14px',
        }}>
          <div style={{ fontSize: 10, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your Journey</div>
          <div style={{ fontSize: 16, color: CREAM, fontWeight: 700 }}>{session?.xp ?? 0} XP</div>
        </div>
      </div>

      {/* ── The Golden Principles ── */}
      <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2.2vw,20px)', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
          The Golden Principles
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {GOLDEN_PRINCIPLES.map(p => (
            <li key={p.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{
                flexShrink: 0, width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${GOLD}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: GOLD, fontWeight: 700,
              }}>{p.n}</span>
              <div>
                <div style={{ fontSize: 13.5, color: CREAM, fontWeight: 700 }}>{p.title}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(229,226,225,0.65)' }}>{p.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Quick Rule Reminders + Rule Acknowledgement + Consequences ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,18px)' }}>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
            Quick Rule Reminders
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {QUICK_REMINDERS.map(r => (
              <div key={r.label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 6px', border: `1px solid ${BORDER}`, borderRadius: 8, background: 'rgba(0,0,0,0.2)',
              }}>
                <span style={{ fontSize: 20 }} aria-hidden="true">{r.icon}</span>
                <span style={{ fontSize: 10.5, color: CREAM, textAlign: 'center', fontWeight: 600 }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(120,50,20,0.10)', border: '1px solid rgba(233,150,90,0.35)', borderRadius: 12, padding: 'clamp(14px,2vw,18px)' }}>
          <div style={{ fontSize: 11, color: '#e9a15a', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden="true">⚠</span> Consequences of Misconduct
          </div>
          <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.7)', marginBottom: 6 }}>Failure to follow the rules may result in:</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'rgba(229,226,225,0.8)', lineHeight: 1.8 }}>
            {MISCONDUCT_CONSEQUENCES.map(c => <li key={c}>{c}</li>)}
          </ul>
        </div>
      </div>

      {/* ── Rule Acknowledgement — real checkbox, gates Continue ── */}
      <label
        style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          background: acknowledged ? 'rgba(233,193,118,0.12)' : GLASS,
          border: `1.5px solid ${acknowledged ? GOLD : BORDER}`, borderRadius: 12,
          padding: 'clamp(12px,1.8vw,16px)', cursor: 'pointer', minHeight: 44,
        }}
      >
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={e => { triggerHaptic('light'); setAcknowledged(e.target.checked) }}
          style={{ width: 22, height: 22, accentColor: GOLD, cursor: 'pointer', flexShrink: 0 }}
        />
        <span>
          <span style={{ display: 'block', fontSize: 11, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>
            Rule Acknowledgement
          </span>
          <span style={{ fontSize: 13, color: acknowledged ? CREAM : 'rgba(229,226,225,0.65)', lineHeight: 1.4 }}>
            {ACK_TEXT}
          </span>
        </span>
        {acknowledged && (
          <span style={{ marginLeft: 'auto', flexShrink: 0, color: GOLD, fontSize: 13, fontWeight: 700 }} aria-hidden="true">✓</span>
        )}
      </label>

      {/* ── The Right Way to Enjoy ── */}
      <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2.2vw,20px)', marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>
          The Right Way to Enjoy
        </div>
        <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.55)', marginBottom: 12 }}>A visual guide to honoring the leaf.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
          {RIGHT_WAY_TO_ENJOY.map(s => (
            <div key={s.title} style={{ textAlign: 'center', padding: '10px 6px', border: `1px solid ${BORDER}`, borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }} aria-hidden="true">{s.icon}</div>
              <div style={{ fontSize: 11.5, color: GOLD, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(229,226,225,0.6)' }}>{s.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Golden Tip ── */}
      <div role="note" style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
        fontSize: 12.5, color: 'rgba(229,226,225,0.7)',
      }}>
        <span style={{ color: GOLD, fontWeight: 700 }} aria-hidden="true">ⓘ GOLDEN TIP:</span>
        The more you respect the ritual, the richer your experience becomes.
      </div>
    </div>
    <SmokeCraftNavBar
      primary="Continue to Mentor Selection →"
      onPrimary={handleContinue}
      primaryDisabled={!acknowledged}
      secondary="← Back"
      onSecondary={() => navigate('/smokecraft/venue-select')}
    />
    </SmokeCraftScreenShell>
  )
}
