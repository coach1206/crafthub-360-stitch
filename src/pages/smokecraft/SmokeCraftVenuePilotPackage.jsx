/**
 * SmokeCraft 360 Venue Pilot Package
 * Staff / admin-facing. Not part of the guest journey.
 * Route: /smokecraft/venue-pilot-package
 *
 * Shows pilot status, checklists, safe/unsafe claims, known blockers,
 * and documentation portal reference. Does NOT claim live backend connections.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const NAVY     = '#0a0d14'
const CHARCOAL = '#111520'
const CARD     = '#161b27'
const LINE     = '#252d3f'
const GOLD     = '#c9952c'
const GOLD2    = '#e8b84b'
const TEXT     = '#e8e4d8'
const MUTE     = '#7a8299'
const RED      = '#c0392b'
const GREEN    = '#27ae60'
const AMBER    = '#e67e22'

const PILOT_STATUS = [
  { label: 'SmokeCraft 360 Pilot Status',   value: 'Pilot Package In Preparation',      ok: false },
  { label: 'Passport Backend',              value: 'Not Connected',                      ok: false },
  { label: 'POS360 Handoff',               value: 'Preview / Internal Only',            ok: false },
  { label: 'E.A.T. Sync',                  value: 'Preview / Internal Only',            ok: false },
  { label: 'Tasting Data',                  value: 'Observe-Confirm / Local Only',       ok: false },
  { label: 'Return Visit Record',           value: 'Session Storage Only (not durable)', ok: false },
  { label: '18-Screen Guest Journey',       value: 'Built — Locked Journey',             ok: true  },
  { label: 'Local XP & Passport Preview',  value: 'Working (Session Only)',             ok: true  },
  { label: 'Staff Handoff Trigger',         value: 'Preview / Internal — Not Live',      ok: false },
]

const GUEST_JOURNEY = [
  '1. Identity (Profile Capture)',
  '2. Golden Box Rules',
  '3. Mentor Selection',
  '4. Pairing Lab',
  '5. Seed & Soil',
  '6. Humidor Match',
  '7. Request Purchase',
  '8. Cut / Toast / Light',
  '9. First Third Tasting',
  '10. Second Third Tasting',
  '11. Flavor Memory',
  '12. Final Third Tasting',
  '13. Scorecard / Ranking',
  '14. Final Review',
  '15. Passport Stamp',
  '16. Connections',
  '17. Management Sync',
  '18. Session Complete',
]

const VENUE_SETUP_CHECKLIST = [
  'Confirm venue profile is created and correct',
  'Confirm staff roles are assigned in system',
  'Confirm staff PIN flow is working (/staff/pin)',
  'Confirm SmokeCraft guest path starts at /smokecraft/identity',
  'Confirm cigar and menu items are set for pilot',
  'Confirm Request Purchase preview handoff is understood by staff',
  'Confirm Passport local preview behavior explained to staff',
  'Confirm what staff should say to guests about Passport stamps',
  'Confirm what staff must NOT claim to guests (see safe claims below)',
  'Confirm pilot feedback form / process is in place',
  'Confirm manager review owner is identified',
  'Confirm all known limitations are documented and accepted',
]

const STAFF_SHIFT_CHECKLIST = [
  'Open SmokeCraft pilot flow and confirm guest path launches',
  'Confirm guest starts at Identity screen (/smokecraft/identity)',
  'Assist guests only when needed — guide, do not lead the journey',
  'Use Request Purchase preview handoff carefully — it is not a live POS order',
  'If guest asks about Passport stamp: explain it is a local session preview',
  'Do not promise guests that Passport stamps persist across devices or sessions',
  'Do not promise live POS submission — menu is preview/internal',
  'Do not promise live inventory sync or vendor ordering',
  'Record staff feedback notes after each pilot session',
  'Escalate any blocker issues to manager or admin immediately',
]

const MANAGER_CHECKLIST = [
  'Review all 18 SmokeCraft screens in order before pilot launch',
  'Confirm Pairing Lab hotspot routes to /smokecraft/visit-complete',
  'Confirm Final Review hotspot routes to /smokecraft/passport-stamp',
  'Confirm Session Complete staff handoff routes to /pos3 (POS360 preview)',
  'Confirm Passport stamp local preview is visible to guest (not backend)',
  'Confirm Management Sync is labeled preview/internal — not live E.A.T.',
  'Confirm staff team understands safe vs. unsafe claims',
  'Confirm venue is NOT using SmokeCraft as a production billing system',
  'Confirm pilot guests understand this is a guided experience pilot',
  'Confirm feedback collection (screenshots, notes, guest reactions)',
  'Confirm manager owns post-pilot review and blocker escalation',
]

const SAFE_CLAIMS = [
  'SmokeCraft 360 supports a guided cigar education and tasting journey',
  'SmokeCraft 360 has an 18-screen premium guest flow',
  'SmokeCraft 360 can award local XP and local Passport preview stamps',
  'SmokeCraft 360 can initiate preview/internal staff handoff to POS360',
  'SmokeCraft 360 can show management sync preview status',
  'SmokeCraft 360 is being prepared for controlled venue pilot testing',
]

const UNSAFE_CLAIMS = [
  'Production-ready',
  'Live Passport backend connected',
  'Durable cross-device Passport persistence',
  'Live POS360 provider integration',
  'Live payment processing',
  'Live E.A.T. backend sync',
  'Live inventory sync',
  'Live vendor ordering',
  'Live staff notification delivery',
  'Certified compliance (PCI, SOC2, etc.)',
  'Fully automated venue operations',
]

const KNOWN_BLOCKERS = [
  'Passport backend not connected — stamps are session-local only',
  'POS360 handoff is preview/internal — no external provider connection',
  'E.A.T. sync is preview/internal — no live management backend',
  'Backend persistence not complete — return visit state not durable',
  'Tasting input UI is observe-confirm only — no interactive guest input captured',
  'Return visit record lives in sessionStorage only — lost on browser close',
  'Venue pilot approval and controlled testing not yet completed',
  'Phase F.6 final pilot verification not yet run',
]

function Section({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ marginBottom: 20, border: `1px solid ${LINE}`, borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: CHARCOAL, border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700, color: GOLD2, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          {title}
        </span>
        <span style={{ color: MUTE, fontSize: 14 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ background: CARD, padding: '14px 16px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function CheckItem({ text, ok }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
      <span style={{ fontSize: 13, color: ok ? GREEN : AMBER, flexShrink: 0, marginTop: 1 }}>{ok ? '✓' : '○'}</span>
      <span style={{ fontSize: 12, color: TEXT, lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

function StatusRow({ label, value, ok }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${LINE}` }}>
      <span style={{ fontSize: 12, color: MUTE }}>{label}</span>
      <span style={{
        fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700,
        color: ok ? GREEN : RED,
        background: ok ? 'rgba(39,174,96,0.1)' : 'rgba(192,57,43,0.1)',
        border: `1px solid ${ok ? 'rgba(39,174,96,0.3)' : 'rgba(192,57,43,0.3)'}`,
        borderRadius: 4, padding: '2px 8px',
      }}>
        {value}
      </span>
    </div>
  )
}

export default function SmokeCraftVenuePilotPackage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: TEXT, fontFamily: 'system-ui,sans-serif', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${LINE}` }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: MUTE, cursor: 'pointer', fontSize: 12, marginBottom: 12, padding: 0 }}
          >
            ← Back
          </button>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 6 }}>
            STAFF / ADMIN — NOT GUEST-FACING
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: GOLD2 }}>
            SmokeCraft 360 Venue Pilot Package
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: MUTE, lineHeight: 1.6 }}>
            Pilot readiness status, venue checklists, safe claims, known blockers, and documentation references.
            This page is for venue managers and staff teams preparing for a controlled pilot.
          </p>
          {/* Not production-ready banner */}
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(192,57,43,0.09)', border: `1px solid rgba(192,57,43,0.3)`,
            fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700,
            color: RED, textTransform: 'uppercase', letterSpacing: '0.12em',
          }}>
            NOT PRODUCTION-READY — VENUE PILOT PACKAGE IN PREPARATION
          </div>
        </div>

        {/* Pilot Status */}
        <Section title="Pilot Status">
          {PILOT_STATUS.map(s => <StatusRow key={s.label} {...s} />)}
        </Section>

        {/* Guest Journey Overview */}
        <Section title="Locked 18-Screen Guest Journey">
          <p style={{ fontSize: 11, color: MUTE, marginBottom: 12 }}>
            The 18 SmokeCraft guest journey screens are locked. Do not reorder or remove screens for pilot.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '4px 16px' }}>
            {GUEST_JOURNEY.map(step => (
              <div key={step} style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: TEXT, padding: '4px 0', borderBottom: `1px solid ${LINE}` }}>
                {step}
              </div>
            ))}
          </div>
        </Section>

        {/* Venue Setup Checklist */}
        <Section title="Venue Setup Checklist">
          {VENUE_SETUP_CHECKLIST.map(t => <CheckItem key={t} text={t} ok={false} />)}
        </Section>

        {/* Staff Shift Checklist */}
        <Section title="Staff Shift Checklist">
          {STAFF_SHIFT_CHECKLIST.map(t => <CheckItem key={t} text={t} ok={false} />)}
        </Section>

        {/* Manager Readiness Checklist */}
        <Section title="Manager Readiness Checklist">
          {MANAGER_CHECKLIST.map(t => <CheckItem key={t} text={t} ok={false} />)}
        </Section>

        {/* Safe Claims */}
        <Section title="Safe Sales Claims (Can Claim)">
          {SAFE_CLAIMS.map(c => (
            <div key={c} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
              <span style={{ color: GREEN, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12, color: TEXT, lineHeight: 1.5 }}>{c}</span>
            </div>
          ))}
        </Section>

        {/* Unsafe Claims */}
        <Section title="Unsafe / Prohibited Claims (Cannot Claim)">
          {UNSAFE_CLAIMS.map(c => (
            <div key={c} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
              <span style={{ color: RED, flexShrink: 0 }}>✗</span>
              <span style={{ fontSize: 12, color: TEXT, lineHeight: 1.5 }}>{c}</span>
            </div>
          ))}
        </Section>

        {/* Known Blockers */}
        <Section title="Known Blockers — Must Resolve Before Real Pilot">
          {KNOWN_BLOCKERS.map(b => (
            <div key={b} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
              <span style={{ color: AMBER, flexShrink: 0 }}>⚠</span>
              <span style={{ fontSize: 12, color: TEXT, lineHeight: 1.5 }}>{b}</span>
            </div>
          ))}
        </Section>

        {/* Documentation Portal Reference */}
        <Section title="Documentation Portal Reference">
          <div style={{ padding: '4px 0 12px' }}>
            <p style={{ fontSize: 12, color: MUTE, lineHeight: 1.6, marginBottom: 14 }}>
              Full seeded draft manuals and safe claims live in the NOVEE OS Documentation Portal.
              Documents are in draft form and have not been published or human-reviewed for production use.
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, padding: '8px 12px', background: 'rgba(192,57,43,0.07)', border: `1px solid rgba(192,57,43,0.2)`, borderRadius: 6 }}>
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Draft / Not Published / Needs Review
              </span>
            </div>
            <button
              onClick={() => navigate('/novee-os/documentation-portal')}
              style={{
                padding: '10px 20px', background: CHARCOAL, border: `1px solid ${LINE}`,
                borderRadius: 8, color: GOLD2, cursor: 'pointer',
                fontFamily: '"JetBrains Mono",monospace', fontSize: 11, letterSpacing: '0.08em',
              }}
            >
              Open NOVEE OS Documentation Portal →
            </button>
          </div>
        </Section>

        {/* Next Phase */}
        <div style={{ padding: '16px', background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 10 }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
            Next Required Phase
          </div>
          <p style={{ fontSize: 13, color: TEXT, margin: 0 }}>
            <strong>Phase F.6 — Final SmokeCraft Pilot Verification</strong><br />
            <span style={{ color: MUTE, fontSize: 12 }}>
              Run the final end-to-end pilot verification before any real venue deployment.
              SmokeCraft is not venue pilot-ready until F.6 passes.
            </span>
          </p>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, textAlign: 'center', fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: MUTE, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Route: /smokecraft/venue-pilot-package · Staff / Admin Only · Not Guest-Facing · Not Production-Ready
        </div>
      </div>
    </div>
  )
}
