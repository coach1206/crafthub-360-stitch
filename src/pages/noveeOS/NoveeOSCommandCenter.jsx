/**
 * NOVEE OS Command Center — Phase E.2
 * Surfaces all built platform areas from one admin-facing hub.
 * contains_secrets: false
 * No live activation. No fake remote deployment. Honest status only.
 */

import { useNavigate } from 'react-router-dom'

const NAVY      = '#0a0d14'
const CHARCOAL  = '#111520'
const CARD      = '#161b27'
const LINE      = '#252d3f'
const GOLD      = '#c9952c'
const GOLD2     = '#e8b84b'
const TEXT      = '#e8e4d8'
const MUTE      = '#7a8299'
const RED       = '#c0392b'
const GREEN     = '#27ae60'
const BLUE      = '#2980b9'
const AMBER     = '#e67e22'

const STATUS_COLORS = {
  active:       GREEN,
  preview:      BLUE,
  reserved:     AMBER,
  missing:      RED,
  'built-hidden': MUTE,
}

function Badge({ label, color }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
      color, border: `1px solid ${color}55`, borderRadius: 10, padding: '2px 8px',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      {label}
    </span>
  )
}

function SectionHeader({ title, note }) {
  return (
    <div style={{ borderBottom: `1px solid ${LINE}`, paddingBottom: 10, marginBottom: 20, marginTop: 40, display: 'flex', alignItems: 'baseline', gap: 12 }}>
      <h2 style={{ margin: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>{title}</h2>
      {note && <span style={{ fontSize: 10, color: MUTE }}>{note}</span>}
    </div>
  )
}

function PlatformCard({ title, desc, status, route, statusLabel, disabled }) {
  const navigate = useNavigate()
  const color = STATUS_COLORS[status] || MUTE
  return (
    <button
      onClick={() => !disabled && navigate(route)}
      disabled={disabled}
      style={{
        textAlign: 'left', background: CARD, border: `1px solid ${disabled ? LINE : color + '44'}`,
        borderRadius: 12, padding: '18px 20px', cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.15s', opacity: disabled ? 0.55 : 1,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = color + 'aa' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.borderColor = color + '44' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 15, fontWeight: 700, color: TEXT }}>{title}</span>
        <Badge label={statusLabel || status} color={color} />
      </div>
      <p style={{ margin: 0, fontSize: 12, color: MUTE, lineHeight: 1.5 }}>{desc}</p>
      {!disabled && (
        <span style={{ fontSize: 10, color, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em' }}>
          {route} →
        </span>
      )}
    </button>
  )
}

// ── Section A: Core Platform ──────────────────────────────────
const CORE_PLATFORMS = [
  { title: 'NOVEE OS Module Registry',    desc: 'All registered modules, activation status, capability matrix.',            status: 'active',       route: '/novee-os/modules' },
  { title: 'Tenant Governance',           desc: 'Multi-tenant isolation, permissions, scoping rules.',                      status: 'active',       route: '/novee-os/tenants' },
  { title: 'Billing Governance',          desc: 'Platform billing contracts, plan gates, entitlement logic.',               status: 'active',       route: '/novee-os/billing' },
  { title: 'Security Governance',         desc: 'Role definitions, access controls, security policy registry.',             status: 'active',       route: '/novee-os/security' },
  { title: 'Final Readiness',             desc: 'NOVEE OS system-wide launch gate and production checklist.',               status: 'active',       route: '/novee-os/final-readiness' },
  { title: 'Universal 360 Platform Registry', desc: 'All 14 NOVEE OS platforms — status, readiness, blockers, ecosystem snapshot.', status: 'active', route: '/novee-os/360-platforms' },
  { title: 'CraftHub Dashboard',          desc: 'CraftHub 360 operator dashboard — modules, status, activity.',             status: 'active',       route: '/crafthub/dashboard' },
  { title: 'CraftHub Onboarding',         desc: '21-step venue onboarding wizard.',                                         status: 'preview',      route: '/crafthub/onboarding' },
]

// ── Section B: Active 360 Platforms ──────────────────────────
const ACTIVE_PLATFORMS = [
  { title: 'POS360 Platform',             desc: 'Full point-of-sale — floor, orders, payments, KDS, staff, analytics.',    status: 'active',       route: '/pos360' },
  { title: 'POS360 Floor Management',     desc: 'Table layout, sections, drag-drop floor plan.',                           status: 'active',       route: '/pos360/floor-management' },
  { title: 'POS360 Menu Builder',         desc: 'Menu items, modifiers, pricing, availability.',                           status: 'active',       route: '/pos360/menu-builder' },
  { title: 'POS360 Payments',             desc: 'Stripe-connected payment flows, closeout, reconciliation.',               status: 'active',       route: '/pos360/payments' },
  { title: 'E.A.T. Command Hub',          desc: 'Venue intelligence — inventory, staff, reports, kitchen, bar, humidor.',  status: 'active',       route: '/eat' },
  { title: 'SmokeCraft 360',              desc: 'Cigar journey — pairing, scoring, passport, mentor, challenge.',          status: 'active',       route: '/smokecraft' },
  { title: 'CraftHub 360',               desc: 'Guest craft module hub — SmokeCraft, PourCraft, WineCraft, BeerCraft.',   status: 'active',       route: '/crafthub' },
  { title: '360 Passport',               desc: 'Guest identity, stamps, connections, directory.',                          status: 'preview',      route: '/passport' },
]

// ── Section C: Phase D Activation Centers ─────────────────────
const PHASE_D = [
  { title: 'D.1 — Provider Activation',  desc: 'External provider registration and contract framework.',                   status: 'built-hidden', statusLabel: 'built', route: '/phase-d/provider-activation' },
  { title: 'D.2 — Payment Provider',     desc: 'Stripe Connect, payment gateway activation contracts.',                    status: 'built-hidden', statusLabel: 'built', route: '/phase-d/payment-provider-activation' },
  { title: 'D.3 — External POS',         desc: 'Third-party POS integration contracts and readiness gates.',              status: 'built-hidden', statusLabel: 'built', route: '/phase-d/external-pos-activation' },
  { title: 'D.4 — Inventory Activation', desc: 'Inventory provider contracts, sync rules, reorder connectors.',           status: 'built-hidden', statusLabel: 'built', route: '/phase-d/inventory-activation' },
  { title: 'D.5 — Communication',        desc: '10 providers, 10 channels, 20 message areas. Build-only, no real delivery.', status: 'built-hidden', statusLabel: 'built', route: '/phase-d/communication-activation' },
  { title: 'D.6 — Security Activation',  desc: 'Security provider contracts, audit logging, policy enforcement.',         status: 'missing',      statusLabel: 'not built', route: '/placeholder/phase-d-security',         disabled: true },
  { title: 'D.7 — Deployment Activation',desc: 'Deployment provider contracts, pipeline gates, environment locks.',       status: 'missing',      statusLabel: 'not built', route: '/placeholder/phase-d-deployment',       disabled: true },
  { title: 'D.8 — Live Pilot Readiness', desc: 'Production environment checklist, pilot sign-off gate.',                  status: 'missing',      statusLabel: 'not built', route: '/placeholder/phase-d-live-pilot',       disabled: true },
]

// ── Section D: Phase E Readiness ──────────────────────────────
const PHASE_E = [
  { title: 'E.1 — Codebase Audit',       desc: 'Full read-only audit of all NOVEE OS systems. Complete.',                 status: 'active',       statusLabel: 'complete', route: '#',                                     disabled: true },
  { title: 'E.2 — Command Center',       desc: 'This page — dashboard visibility + navigation hub.',                      status: 'active',       statusLabel: 'this page', route: '/novee-os/command-center',             disabled: true },
  { title: 'E.3 — D.6 Security Build',   desc: 'Security activation contracts and audit foundation.',                     status: 'missing',      statusLabel: 'pending',  route: '/placeholder/e3',                       disabled: true },
  { title: 'E.4 — D.7 Deployment Build', desc: 'Deployment activation contracts and pipeline gates.',                     status: 'missing',      statusLabel: 'pending',  route: '/placeholder/e4',                       disabled: true },
  { title: 'E.5 — D.8 Live Pilot',       desc: 'Live pilot readiness gates and environment sign-off.',                    status: 'missing',      statusLabel: 'pending',  route: '/placeholder/e5',                       disabled: true },
  { title: 'E.6 — Remote Module Distribution', desc: 'Real remote module packaging and distribution system.',             status: 'missing',      statusLabel: 'pending',  route: '/placeholder/e6',                       disabled: true },
  { title: 'E.7 — Onboarding + Training',desc: 'Operator onboarding flows, training center, role guides.',                status: 'missing',      statusLabel: 'pending',  route: '/placeholder/e7',                       disabled: true },
  { title: 'E.8 — AMBI Foundation',      desc: 'AMBI intelligence platform — software layer only.',                       status: 'missing',      statusLabel: 'pending',  route: '/placeholder/e8',                       disabled: true },
  { title: 'E.9 — Documentation Portal', desc: 'Operator and developer documentation hub.',                               status: 'missing',      statusLabel: 'pending',  route: '/placeholder/e9',                       disabled: true },
  { title: 'E.10 — Final Go-Live Gate',  desc: 'System-wide production readiness and go-live verification.',              status: 'missing',      statusLabel: 'pending',  route: '/placeholder/e10',                      disabled: true },
]

// ── Section E: Risk / Audit / Compliance ──────────────────────
const RISK = [
  { title: 'POS360 Production Readiness',desc: 'POS360 system-wide production readiness audit.',                           status: 'active',       route: '/pos360/production-readiness' },
  { title: 'SmokeCraft DB Activation',   desc: 'SmokeCraft database activation and schema audit.',                         status: 'active',       route: '/smokecraft/visual-proof' },
]

export default function NoveeOSCommandCenter() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100dvh', background: NAVY, color: TEXT, fontFamily: '"Hanken Grotesk", sans-serif' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 28px',
        background: CHARCOAL, borderBottom: `1px solid ${LINE}`,
      }}>
        <button
          onClick={() => navigate('/novee-home')}
          style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: MUTE, background: 'transparent', border: `1px solid ${LINE}`, borderRadius: 20,
            padding: '6px 14px', cursor: 'pointer',
          }}
        >
          ← NOVEE OS Home
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD, marginBottom: 2 }}>NOVEE OS</div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, color: TEXT }}>Command Center</div>
        </div>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTE }}>
          Phase E.2
        </div>
      </header>

      {/* Safety notice */}
      <div style={{ background: `${AMBER}11`, borderBottom: `1px solid ${AMBER}33`, padding: '10px 28px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: AMBER, letterSpacing: '0.12em' }}>
          OPERATOR VIEW — No live activation. No real deployment. All systems preview-only unless explicitly marked active.
        </span>
      </div>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 28px 80px' }}>

        {/* Intro */}
        <div style={{ marginBottom: 8 }}>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: GOLD2, margin: '0 0 8px' }}>
            NOVEE OS — Universal Command Hub
          </h1>
          <p style={{ fontSize: 13, color: MUTE, margin: 0, lineHeight: 1.6 }}>
            All built platform areas, activation centers, and readiness gates in one place. Cards marked <span style={{ color: RED }}>not built</span> link to placeholder pages, not real systems.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '20px 0 0', padding: '14px 18px', background: CHARCOAL, borderRadius: 10, border: `1px solid ${LINE}` }}>
          {Object.entries(STATUS_COLORS).map(([k, c]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: MUTE }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
              {k}
            </span>
          ))}
        </div>

        {/* A. Core Platform */}
        <SectionHeader title="A — Core Platform + OS Governance" note="8 built systems" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {CORE_PLATFORMS.map(p => <PlatformCard key={p.title} {...p} />)}
        </div>

        {/* B. Active 360 Platforms */}
        <SectionHeader title="B — Active 360 Platforms" note="8 platforms" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {ACTIVE_PLATFORMS.map(p => <PlatformCard key={p.title} {...p} />)}
        </div>

        {/* C. Phase D */}
        <SectionHeader title="C — Phase D Activation Centers" note="D.1–D.5 built (hidden); D.6–D.8 not built" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {PHASE_D.map(p => <PlatformCard key={p.title} {...p} />)}
        </div>

        {/* D. Phase E */}
        <SectionHeader title="D — Phase E Readiness" note="E.1–E.2 complete; E.3–E.10 pending" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {PHASE_E.map(p => <PlatformCard key={p.title} {...p} />)}
        </div>

        {/* E. Risk / Audit */}
        <SectionHeader title="E — Risk / Audit / Compliance" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {RISK.map(p => <PlatformCard key={p.title} {...p} />)}
        </div>

        {/* Reserved platforms notice */}
        <div style={{ marginTop: 48, padding: '20px 24px', background: CHARCOAL, borderRadius: 12, border: `1px solid ${LINE}` }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>
            Reserved Platforms — Not Available
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { name: 'Agent X 360',  note: 'agent_platform — reserved, not built' },
              { name: 'DayOne 360',   note: 'business_platform — reserved, not built' },
              { name: 'EgoMusic 360', note: 'music_platform — reserved, not built' },
              { name: 'AMBI',         note: 'intelligence_platform — preview registry only' },
              { name: 'AI Coaching',  note: 'coaching_platform — preview registry only' },
            ].map(p => (
              <div key={p.name} style={{ padding: '8px 14px', background: NAVY, border: `1px solid ${LINE}`, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: MUTE, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: LINE, marginTop: 2, fontFamily: '"JetBrains Mono", monospace' }}>{p.note}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
