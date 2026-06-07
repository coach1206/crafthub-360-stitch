import Card, { SectionDivider, ModuleChip, StatusBadge } from '../components/Card.jsx'

const cocktails = [
  { name: 'Old Fashioned',  base: 'Bourbon',   complexity: 'Classic',  status: 'Ready' },
  { name: 'Negroni',        base: 'Gin',        complexity: 'Stirred',  status: 'Ready' },
  { name: 'Mezcal Sour',    base: 'Mezcal',    complexity: 'Shaken',   status: 'Draft' },
  { name: 'Smoke & Mirror', base: 'Rye',        complexity: 'Custom',   status: 'Ready' },
]

export default function PourCraft() {
  return (
    <div style={{ padding: '4px 16px 16px' }}>
      <div style={{ marginBottom: 12 }}>
        <StatusBadge label="Bar Module Live" />
      </div>
      <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 700, marginBottom: 4 }}>
        <span style={{ color: '#fff' }}>Pour</span>
        <span className="gold-text">Craft</span>
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
        Cocktail command center — recipes, ratios, and spirit intelligence.
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[['22', 'Recipes'], ['8', 'Spirits'], ['3', 'On Draft']].map(([v, l]) => (
          <Card key={l} style={{ padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#7c4dff', fontFamily: 'Space Grotesk, sans-serif' }}>{v}</div>
            <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* Modules */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: '16px 20px 20px' }}>
          <SectionDivider label="Module Status" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <ModuleChip label="Recipe Builder" />
            <ModuleChip label="Spirit Library" />
            <ModuleChip label="Ratio Engine" />
            <ModuleChip label="Bitters Index" />
            <ModuleChip label="Garnish Guide" />
            <ModuleChip label="Session Log" />
          </div>
        </div>
      </Card>

      {/* Cocktail list */}
      <Card>
        <div style={{ padding: '16px 20px' }}>
          <div className="font-caps" style={{ fontSize: 10, color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 14 }}>Recipe Index</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cocktails.map(({ name, base, complexity, status }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{name}</div>
                  <div className="font-caps" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{base} · {complexity}</div>
                </div>
                <span
                  className="font-caps"
                  style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.1em', background: status === 'Ready' ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)', color: status === 'Ready' ? '#f2ca50' : 'rgba(255,255,255,0.4)', border: `1px solid ${status === 'Ready' ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}` }}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
