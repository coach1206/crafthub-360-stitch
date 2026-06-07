import { useNavigate } from 'react-router-dom'
import Card, { SectionLabel, StatusBadge } from '../components/Card.jsx'

const modules = [
  { path: '/smokecraft', icon: 'local_fire_department', label: 'SmokeCraft',   sub: 'Cigar & Tobacco Intelligence',   screens: 28 },
  { path: '/pourcraft',  icon: 'local_bar',             label: 'PourCraft',   sub: 'Cocktail Command Center',         screens: 22 },
  { path: '/beercraft',  icon: 'sports_bar',            label: 'BeerCraft',   sub: 'Brew Intelligence',               screens: 18 },
  { path: '/winecraft',  icon: 'wine_bar',              label: 'WineCraft',   sub: 'Cellar Management',               screens: 24 },
  { path: '/passport',   icon: 'badge',                 label: 'Passport',    sub: 'Member Connection & Identity',    screens: 16 },
  { path: '/pos',        icon: 'point_of_sale',         label: 'POS3',        sub: 'Unified Point of Sale',           screens: 14 },
  { path: '/eat',        icon: 'restaurant',            label: 'EAT Command', sub: 'Dining Intelligence',             screens: 12 },
]

export default function CraftHub() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <StatusBadge label="All Systems Online — 134 Screens Compiled" />

      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1 className="text-display-tour gold-foil-text" style={{ marginBottom: 16 }}>
          CRAFTHUB 360
        </h1>
        <p className="text-body-intro text-on-surface-var" style={{ maxWidth: 640, margin: '0 auto' }}>
          Full ecosystem dashboard. Seven modules, 134 screens, one unified production tier.
          Select a module to enter its command environment.
        </p>
      </div>

      {/* Summary bento row */}
      <div className="bento-grid" style={{ marginBottom: 32 }}>
        {[['134', 'Total Screens'], ['7', 'Active Modules'], ['100%', 'Sync Status'], ['14ms', 'Cloud Latency']].map(([v, l]) => (
          <div key={l} className="col-3" style={{ gridColumn: 'span 3' }}>
            <Card style={{ textAlign: 'center' }}>
              <div className="gold-foil-text" style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, lineHeight: 1, marginBottom: 8 }}>{v}</div>
              <p className="text-label-sm text-on-surface-var" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</p>
            </Card>
          </div>
        ))}
      </div>

      {/* Module grid */}
      <div className="bento-grid">
        {modules.map(({ path, icon, label, sub, screens }) => (
          <div key={path} className="col-6" style={{ gridColumn: 'span 6' }}>
            <button
              onClick={() => navigate(path)}
              style={{ width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
            >
              <Card style={{
                display: 'flex', alignItems: 'center', gap: 24, padding: 24,
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'
                  e.currentTarget.style.boxShadow = '0 0 32px rgba(212,175,55,0.12)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.8)'
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                  background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined icon-fill text-primary" style={{ fontSize: 28 }}>{icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4 }}>{label}</div>
                  <div className="text-label-sm text-on-surface-var">{sub}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="gold-foil-text" style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{screens}</div>
                  <div className="text-label-sm text-on-surface-var" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>screens</div>
                </div>
                <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 20 }}>chevron_right</span>
              </Card>
            </button>
          </div>
        ))}
      </div>

    </div>
  )
}
