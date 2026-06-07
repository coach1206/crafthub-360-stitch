import Card, { SectionDivider, ModuleChip, StatusBadge } from '../components/Card.jsx'

const taps = [
  { name: 'Barrel Stout',    style: 'Imperial Stout',  abv: '11.2%', ibu: 65 },
  { name: 'Gold Haze',       style: 'New England IPA', abv: '6.8%',  ibu: 42 },
  { name: 'Amber Protocol',  style: 'Amber Ale',       abv: '5.4%',  ibu: 32 },
  { name: 'Obsidian Lager',  style: 'Munich Dunkel',   abv: '4.9%',  ibu: 18 },
]

export default function BeerCraft() {
  return (
    <div style={{ padding: '4px 16px 16px' }}>
      <div style={{ marginBottom: 12 }}>
        <StatusBadge label="Tap Room Active" />
      </div>
      <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 700, marginBottom: 4 }}>
        <span style={{ color: '#fff' }}>Beer</span>
        <span className="gold-text">Craft</span>
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
        Brew intelligence — tap management, fermentation tracking, and flavor profiles.
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[['18', 'Recipes'], ['4', 'On Tap'], ['6.8%', 'Avg ABV']].map(([v, l]) => (
          <Card key={l} style={{ padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e8a020', fontFamily: 'Space Grotesk, sans-serif' }}>{v}</div>
            <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* Modules */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: '16px 20px 20px' }}>
          <SectionDivider label="Module Status" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <ModuleChip label="Tap Manager" />
            <ModuleChip label="Brew Log" />
            <ModuleChip label="Fermentation Tracker" />
            <ModuleChip label="Hop Index" />
            <ModuleChip label="Grain Bill" />
            <ModuleChip label="ABV Calculator" />
          </div>
        </div>
      </Card>

      {/* Tap list */}
      <Card>
        <div style={{ padding: '16px 20px' }}>
          <div className="font-caps" style={{ fontSize: 10, color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 14 }}>Live Taps</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {taps.map(({ name, style, abv, ibu }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{name}</div>
                  <div className="font-caps" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{style}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e8a020' }}>{abv}</div>
                  <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ibu} IBU</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
