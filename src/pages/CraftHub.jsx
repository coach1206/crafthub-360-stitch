import { useNavigate } from 'react-router-dom'
import Card, { StatusBadge } from '../components/Card.jsx'

const modules = [
  { path: '/smokecraft', icon: 'local_fire_department', label: 'SmokeCraft',       sub: 'Cigar & Tobacco',      screens: 28, color: '#c47c2b' },
  { path: '/pourcraft',  icon: 'local_bar',             label: 'PourCraft',        sub: 'Cocktail Command',     screens: 22, color: '#7c4dff' },
  { path: '/beercraft',  icon: 'sports_bar',            label: 'BeerCraft',        sub: 'Brew Intelligence',    screens: 18, color: '#e8a020' },
  { path: '/winecraft',  icon: 'wine_bar',              label: 'WineCraft',        sub: 'Cellar Management',    screens: 24, color: '#9c3a5e' },
  { path: '/passport',   icon: 'badge',                 label: 'Passport',         sub: 'Member Connection',    screens: 16, color: '#2196f3' },
  { path: '/pos',        icon: 'point_of_sale',         label: 'POS3',             sub: 'Point of Sale',        screens: 14, color: '#00bcd4' },
  { path: '/eat',        icon: 'restaurant',            label: 'EAT Command',      sub: 'Dining Intelligence',  screens: 12, color: '#4caf50' },
]

export default function CraftHub() {
  const navigate = useNavigate()
  return (
    <div style={{ padding: '4px 16px 16px' }}>
      <div style={{ marginBottom: 12 }}>
        <StatusBadge label="All Systems Online" />
      </div>
      <h1 className="font-serif" style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
        CraftHub <span className="gold-text">360</span>
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24, lineHeight: 1.6 }}>
        Full ecosystem dashboard — 134 screens compiled across 7 modules.
      </p>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {[['134', 'Screens'], ['7', 'Modules'], ['100%', 'Synced']].map(([v, l]) => (
          <Card key={l} style={{ padding: '12px 10px', textAlign: 'center' }}>
            <div className="gold-text font-caps" style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
            <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* Module grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {modules.map(({ path, icon, label, sub, screens, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <Card style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.2s' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined fill-icon" style={{ fontSize: 22, color }}>{icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{label}</div>
                <div className="font-caps" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sub}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="font-caps" style={{ fontSize: 18, fontWeight: 700, color }}>{screens}</div>
                <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>screens</div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)' }}>chevron_right</span>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}
