import { useNavigate } from 'react-router-dom'
import { useDemoMode } from '../context/DemoModeContext.jsx'

const ADMIN_LINKS = [
  { label: 'NOVEE OS Command Center',      to: '/novee-os/command-center',   note: 'All platform areas — one hub' },
  { label: 'Universal 360 Platform Registry', to: '/novee-os/360-platforms', note: '14 platforms, status & blockers' },
  { label: 'Module Registry',              to: '/novee-os/modules',           note: 'Module activation matrix' },
  { label: 'Tenant Governance',            to: '/novee-os/tenants',           note: 'Multi-tenant isolation' },
  { label: 'Billing Governance',           to: '/novee-os/billing',           note: 'Plan gates & entitlements' },
  { label: 'Security Governance',          to: '/novee-os/security',          note: 'Roles & access controls' },
  { label: 'Final Readiness',              to: '/novee-os/final-readiness',   note: 'System-wide launch gate' },
  { label: 'D.1 Provider Activation',     to: '/phase-d/provider-activation',        note: 'Phase D.1 — built' },
  { label: 'D.2 Payment Providers',       to: '/phase-d/payment-provider-activation', note: 'Phase D.2 — built' },
  { label: 'D.3 External POS',            to: '/phase-d/external-pos-activation',     note: 'Phase D.3 — built' },
  { label: 'D.4 Inventory Activation',    to: '/phase-d/inventory-activation',        note: 'Phase D.4 — built' },
  { label: 'D.5 Communication',           to: '/phase-d/communication-activation',    note: 'Phase D.5 — built' },
  { label: 'D.6 Security Activation',    to: '/phase-d/security-activation',         note: 'Phase D.6 — built' },
  { label: 'D.7 Deployment Activation', to: '/phase-d/deployment-activation',       note: 'Phase D.7 — built' },
  { label: 'D.8 Live Pilot Readiness',  to: '/phase-d/live-pilot-readiness',        note: 'Phase D.8 — built' },
  { label: 'E.6 Remote Module Distribution', to: '/novee-os/remote-distribution',  note: 'Phase E.6 — built' },
]

const CARDS = [
  { title: 'CraftHub 360',              desc: 'Guest craft module grid — SmokeCraft, PourCraft, WineCraft, BeerCraft.', status: 'Active', to: '/crafthub' },
  { title: 'SmokeCraft 360',            desc: 'Guided cigar pairing, mentor tasting, scorecard, passport stamp.',      status: 'Active', to: '/smokecraft' },
  { title: 'PourCraft 360',             desc: 'Cocktail discovery, bar specials, pairing moments.',                    status: 'Active', to: '/pourcraft' },
  { title: 'WineCraft 360',             desc: 'Wine flights, cellar signals, tasting notes.',                          status: 'Active', to: '/winecraft' },
  { title: 'BeerCraft 360',             desc: 'Beer flights, taproom specials, style matching.',                       status: 'Active', to: '/beercraft' },
  { title: '360 Passport Connections',  desc: 'Guest identity, stamps, networking, experience history.',               status: 'Active', to: '/passport/connections' },
  { title: 'POS 3',                     desc: 'Staff point-of-sale and fulfillment terminal.',                         status: 'Staff Access', to: '/pos' },
  { title: 'E.A.T. Management Hub',     desc: 'Venue intelligence, inventory, staff performance command center.',      status: 'Staff Access', to: '/eat' },
  { title: 'DayOne360 Travel',          desc: 'Travel placement, venue offers, destination experiences.',              status: 'External', to: 'https://dayone360.com', external: true },
  { title: 'Leaderboard',               desc: 'Grand Lounge rankings across every craft module.',                     status: 'Active', to: '/leaderboard' },
  { title: 'How CraftHub 360 Works',    desc: 'How NOVEE OS, CraftHub, POS 3, and E.A.T. connect.',                    status: 'Active', to: '/system-explained' },
]

export default function NoveeHome() {
  const navigate = useNavigate()
  const { enterDemoMode } = useDemoMode()

  function openCard(card) {
    if (card.external) {
      window.open(card.to, '_blank', 'noopener,noreferrer')
      return
    }
    navigate(card.to)
  }

  function handleDemoMode() {
    enterDemoMode()
    navigate('/crafthub')
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(180deg, #0a0b0d 0%, #131314 100%)', color: '#EDE8DF', fontFamily: '"Hanken Grotesk", sans-serif' }}>
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50, height: 80, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 32px',
          background: 'rgba(10,11,13,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,175,55,0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: '#9cc2e8', background: 'rgba(91,143,201,0.08)', border: '1px solid rgba(91,143,201,0.35)',
              borderRadius: 20, padding: '8px 16px', cursor: 'pointer', minHeight: 44,
            }}
          >
            Back to NOVEE OS
          </button>
        </div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 24, fontWeight: 700, color: '#e9c176', letterSpacing: '0.04em', margin: 0 }}>
          NOVEE OS
        </h1>
        <button
          onClick={handleDemoMode}
          style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#e9c176', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.35)',
            borderRadius: 20, padding: '8px 16px', cursor: 'pointer', minHeight: 44,
          }}
        >
          Demo Mode
        </button>
      </header>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px 8px', textAlign: 'center' }}>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(156,194,232,0.85)' }}>
          Private Experience Layer
        </p>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(32px, 5vw, 48px)', color: '#EDE8DF', margin: '8px 0 0' }}>
          Every system, one command hub.
        </h2>
      </section>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 80px' }}>
        {/* NOVEE OS Admin Navigation */}
        <div style={{ marginBottom: 40, padding: '20px 24px', background: 'rgba(10,13,20,0.85)', border: '1px solid rgba(201,149,44,0.18)', borderRadius: 16 }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(201,149,44,0.7)', marginBottom: 14 }}>
            NOVEE OS — Operator &amp; Admin Access
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ADMIN_LINKS.map(link => (
              <button
                key={link.to}
                onClick={() => navigate(link.to)}
                title={link.note}
                style={{
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.1em',
                  color: '#9cc2e8', background: 'rgba(41,128,185,0.08)', border: '1px solid rgba(91,143,201,0.25)',
                  borderRadius: 20, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(91,143,201,0.6)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(91,143,201,0.25)' }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {CARDS.map(card => (
            <button
              key={card.title}
              onClick={() => openCard(card)}
              style={{
                textAlign: 'left', cursor: 'pointer', minHeight: 200, borderRadius: 18, padding: 24,
                border: '1px solid rgba(212,175,55,0.2)',
                background: 'linear-gradient(160deg, rgba(212,175,55,0.06), rgba(91,143,201,0.05) 60%, rgba(10,11,13,0.6))',
                backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', gap: 16, transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.55)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-block', fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
                    letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9cc2e8',
                    border: '1px solid rgba(91,143,201,0.4)', borderRadius: 12, padding: '3px 10px', marginBottom: 14,
                  }}
                >
                  {card.status}
                </div>
                <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 21, fontWeight: 700, color: '#e9c176', margin: '0 0 8px' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: '#A89B86', margin: 0 }}>{card.desc}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e9c176', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                Enter
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
