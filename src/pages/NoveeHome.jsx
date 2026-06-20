import { useNavigate } from 'react-router-dom'
import { useDemoMode } from '../context/DemoModeContext.jsx'

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
