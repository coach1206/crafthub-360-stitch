import Card, { SectionLabel, StatusBadge, ModuleChip } from '../components/Card.jsx'

const taps = [
  { name: 'Barrel Stout',    style: 'Imperial Stout',  abv: '11.2%', ibu: 65, status: 'Pouring' },
  { name: 'Gold Haze',       style: 'New England IPA', abv: '6.8%',  ibu: 42, status: 'Pouring' },
  { name: 'Amber Protocol',  style: 'Amber Ale',       abv: '5.4%',  ibu: 32, status: 'Pouring' },
  { name: 'Obsidian Lager',  style: 'Munich Dunkel',   abv: '4.9%',  ibu: 18, status: 'Low Keg' },
]

export default function BeerCraft() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <StatusBadge label="Tap Room Active — 4 Live Taps" />

      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1 className="text-display-tour gold-foil-text" style={{ marginBottom: 16 }}>
          BEERCRAFT
        </h1>
        <p className="text-body-intro text-on-surface-var" style={{ maxWidth: 640, margin: '0 auto' }}>
          Brew intelligence — tap management, fermentation tracking, grain bill analytics,
          and full lifecycle from mash to glass.
        </p>
      </div>

      <div className="bento-grid">

        {[['18', 'Recipes'], ['4', 'Live Taps'], ['6.8%', 'Avg ABV'], ['39', 'Avg IBU']].map(([v, l]) => (
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
              <ModuleChip label="Tap Manager" />
              <ModuleChip label="Brew Log" />
              <ModuleChip label="Fermentation Tracker" />
              <ModuleChip label="Hop Index" />
              <ModuleChip label="Grain Bill" />
              <ModuleChip label="ABV Calculator" />
              <ModuleChip label="Yeast Library" done={false} />
              <ModuleChip label="Water Profile"  done={false} />
            </div>
          </Card>
        </div>

        <div className="col-7">
          <Card accent>
            <SectionLabel>Live Taps</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {taps.map(({ name, style, abv, ibu, status }) => (
                <div key={name} className="manifest-row" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span className="material-symbols-outlined icon-fill text-primary">sports_bar</span>
                    <div>
                      <div className="text-body-md" style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>{name}</div>
                      <div className="text-label-sm text-on-surface-var">{style} · {abv} ABV · {ibu} IBU</div>
                    </div>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-label)', fontSize: 11, letterSpacing: '0.1em',
                    textTransform: 'uppercase', padding: '4px 14px', borderRadius: 9999,
                    background: status === 'Pouring' ? 'rgba(212,175,55,0.12)' : 'rgba(255,80,80,0.1)',
                    color: status === 'Pouring' ? 'var(--primary)' : '#ff6b6b',
                    border: `1px solid ${status === 'Pouring' ? 'rgba(212,175,55,0.3)' : 'rgba(255,100,100,0.3)'}`,
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
