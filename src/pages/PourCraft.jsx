import Card, { SectionLabel, StatusBadge, ModuleChip, SectionDivider } from '../components/Card.jsx'

const recipes = [
  { name: 'Old Fashioned',  base: 'Bourbon',  style: 'Stirred', abv: '38%', status: 'Ready'  },
  { name: 'Negroni',        base: 'Gin',      style: 'Stirred', abv: '26%', status: 'Ready'  },
  { name: 'Mezcal Sour',    base: 'Mezcal',  style: 'Shaken',  abv: '18%', status: 'Draft'  },
  { name: 'Smoke & Mirror', base: 'Rye',      style: 'Custom',  abv: '32%', status: 'Ready'  },
  { name: 'Gold Daiquiri',  base: 'Rum',      style: 'Shaken',  abv: '22%', status: 'Active' },
]

export default function PourCraft() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <StatusBadge label="Bar Module Live — 22 Recipes Compiled" />

      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1 className="text-display-tour gold-foil-text" style={{ marginBottom: 16 }}>
          POURCRAFT
        </h1>
        <p className="text-body-intro text-on-surface-var" style={{ maxWidth: 640, margin: '0 auto' }}>
          Cocktail command center. Recipes, ratios, spirit intelligence,
          and the science of the perfect pour.
        </p>
      </div>

      <div className="bento-grid">

        {[['22', 'Recipes'], ['8', 'Spirits'], ['3', 'On Draft'], ['5', 'Active']].map(([v, l]) => (
          <div key={l} style={{ gridColumn: 'span 3' }}>
            <Card style={{ textAlign: 'center' }}>
              <div className="gold-foil-text" style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, lineHeight: 1, marginBottom: 8 }}>{v}</div>
              <p className="text-label-sm text-on-surface-var" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</p>
            </Card>
          </div>
        ))}

        <div className="col-5">
          <Card accent>
            <SectionLabel>Module Status</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <ModuleChip label="Recipe Builder" />
              <ModuleChip label="Spirit Library" />
              <ModuleChip label="Ratio Engine" />
              <ModuleChip label="Bitters Index" />
              <ModuleChip label="Garnish Guide" />
              <ModuleChip label="Session Log" />
              <ModuleChip label="Flavor Map" done={false} />
              <ModuleChip label="Batch Calc"  done={false} />
            </div>
          </Card>
        </div>

        <div className="col-7">
          <Card accent>
            <SectionLabel>Recipe Index</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recipes.map(({ name, base, style, abv, status }) => (
                <div key={name} className="manifest-row" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span className="material-symbols-outlined icon-fill text-primary">local_bar</span>
                    <div>
                      <div className="text-body-md" style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>{name}</div>
                      <div className="text-label-sm text-on-surface-var">{base} · {style} · {abv} ABV</div>
                    </div>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-label)', fontSize: 11, letterSpacing: '0.1em',
                    textTransform: 'uppercase', padding: '4px 14px', borderRadius: 9999,
                    background: status === 'Ready' || status === 'Active' ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.06)',
                    color: status === 'Ready' || status === 'Active' ? 'var(--primary)' : 'var(--on-surface-variant)',
                    border: `1px solid ${status === 'Ready' || status === 'Active' ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
