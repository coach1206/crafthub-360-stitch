import Card, { SectionLabel, StatusBadge, ModuleChip } from '../components/Card.jsx'

const cellar = [
  { name: 'Opus One 2018',         region: 'Napa Valley', varietal: 'Cabernet Blend',  vintage: 2018, score: 98, peak: '2028–2040' },
  { name: 'Barolo Riserva 2016',   region: 'Piedmont',    varietal: 'Nebbiolo',        vintage: 2016, score: 96, peak: '2026–2035' },
  { name: 'Pomerol Reserve 2019',  region: 'Bordeaux',    varietal: 'Merlot',          vintage: 2019, score: 94, peak: '2025–2030' },
  { name: 'Sassicaia 2017',        region: 'Tuscany',     varietal: 'Cabernet Sauv',   vintage: 2017, score: 97, peak: '2027–2038' },
]

export default function WineCraft() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <StatusBadge label="Cellar Synced — 142 Bottles Logged" />

      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1 className="text-display-tour gold-foil-text" style={{ marginBottom: 16 }}>
          WINECRAFT
        </h1>
        <p className="text-body-intro text-on-surface-var" style={{ maxWidth: 640, margin: '0 auto' }}>
          Cellar management — provenance tracking, peak drinking windows,
          vintage intelligence, and the art of the perfect decant.
        </p>
      </div>

      <div className="bento-grid">

        {[['24', 'Screens'], ['142', 'Bottles'], ['97', 'Avg Score'], ['4', 'Regions']].map(([v, l]) => (
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
              <ModuleChip label="Cellar Map" />
              <ModuleChip label="Vintage Tracker" />
              <ModuleChip label="Peak Window" />
              <ModuleChip label="Provenance Log" />
              <ModuleChip label="Decant Timer" />
              <ModuleChip label="Pairing Engine" />
              <ModuleChip label="Auction Watch"   done={false} />
              <ModuleChip label="Futures Tracker" done={false} />
            </div>
          </Card>
        </div>

        <div className="col-7">
          <Card accent>
            <SectionLabel>Cellar Selection</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cellar.map(({ name, region, varietal, vintage, score, peak }) => (
                <div key={name} className="manifest-row" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span className="material-symbols-outlined icon-fill text-primary">wine_bar</span>
                    <div>
                      <div className="text-body-md" style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>{name}</div>
                      <div className="text-label-sm text-on-surface-var">{region} · {varietal} · Peak {peak}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="gold-foil-text" style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{score}</div>
                    <div className="text-label-sm text-on-surface-var" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>pts</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
