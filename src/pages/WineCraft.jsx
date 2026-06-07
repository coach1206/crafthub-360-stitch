import Card, { SectionDivider, ModuleChip, StatusBadge } from '../components/Card.jsx'

const cellar = [
  { name: 'Opus One 2018',        region: 'Napa Valley',    varietal: 'Cab Blend', vintage: 2018, score: 98 },
  { name: 'Barolo Riserva 2016',  region: 'Piedmont',       varietal: 'Nebbiolo',  vintage: 2016, score: 96 },
  { name: 'Pomerol Reserve 2019', region: 'Bordeaux',       varietal: 'Merlot',    vintage: 2019, score: 94 },
  { name: 'Sassicaia 2017',       region: 'Tuscany',        varietal: 'Cab Sauv',  vintage: 2017, score: 97 },
]

export default function WineCraft() {
  return (
    <div style={{ padding: '4px 16px 16px' }}>
      <div style={{ marginBottom: 12 }}>
        <StatusBadge label="Cellar Synced" />
      </div>
      <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 700, marginBottom: 4 }}>
        <span style={{ color: '#fff' }}>Wine</span>
        <span className="gold-text">Craft</span>
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
        Cellar management — provenance tracking, peak drinking windows, and vintage intelligence.
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[['24', 'Screens'], ['142', 'Bottles'], ['97', 'Avg Score']].map(([v, l]) => (
          <Card key={l} style={{ padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#9c3a5e', fontFamily: 'Space Grotesk, sans-serif' }}>{v}</div>
            <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* Modules */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: '16px 20px 20px' }}>
          <SectionDivider label="Module Status" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <ModuleChip label="Cellar Map" />
            <ModuleChip label="Vintage Tracker" />
            <ModuleChip label="Peak Window" />
            <ModuleChip label="Provenance Log" />
            <ModuleChip label="Decant Timer" />
            <ModuleChip label="Pairing Engine" />
          </div>
        </div>
      </Card>

      {/* Cellar list */}
      <Card>
        <div style={{ padding: '16px 20px' }}>
          <div className="font-caps" style={{ fontSize: 10, color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 14 }}>Cellar Selection</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cellar.map(({ name, region, varietal, vintage, score }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{name}</div>
                  <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{region} · {varietal} · {vintage}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#9c3a5e' }}>{score}</div>
                  <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
