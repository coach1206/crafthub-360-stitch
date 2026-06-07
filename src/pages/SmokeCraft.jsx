import Card, { ModuleChip, SectionDivider, StatusBadge } from '../components/Card.jsx'

const vitolas = [
  { name: 'Robusto',    ring: 50, length: '5"',  rating: 94 },
  { name: 'Churchill',  ring: 47, length: '7"',  rating: 96 },
  { name: 'Toro',       ring: 52, length: '6"',  rating: 92 },
  { name: 'Lancero',    ring: 38, length: '7.5"',rating: 97 },
]

export default function SmokeCraft() {
  return (
    <div style={{ padding: '4px 16px 16px' }}>
      <div style={{ marginBottom: 12 }}>
        <StatusBadge label="Humidor Online" />
      </div>
      <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 700, marginBottom: 4 }}>
        <span style={{ color: '#fff' }}>Smoke</span>
        <span className="gold-text">Craft</span>
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
        Cigar intelligence, aging analytics, and draw precision.
      </p>

      {/* Live stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[['48', 'Sticks'], ['6', 'Aging'], ['94', 'Avg Score']].map(([v, l]) => (
          <Card key={l} style={{ padding: '12px 10px', textAlign: 'center' }}>
            <div className="gold-text font-caps" style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
            <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* Module checklist */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: '16px 20px 8px' }}>
          <SectionDivider label="Module Status" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <ModuleChip label="Humidor Entry" />
            <ModuleChip label="Stick Selection" />
            <ModuleChip label="Draw Tension Analytics" />
            <ModuleChip label="Aging Calculator" />
            <ModuleChip label="Leaf Provenance" />
            <ModuleChip label="Ash Quality Review" />
          </div>
        </div>
        <div style={{ padding: '12px 20px 20px' }}>
          <SectionDivider label="Coming Soon" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <ModuleChip label="Blind Rating" checked={false} />
            <ModuleChip label="Pairing Engine" checked={false} />
          </div>
        </div>
      </Card>

      {/* Vitola list */}
      <Card>
        <div style={{ padding: '16px 20px' }}>
          <div className="font-caps" style={{ fontSize: 10, color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 14 }}>Active Vitolas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vitolas.map(({ name, ring, length, rating }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{name}</div>
                  <div className="font-caps" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Ring {ring} · {length}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="gold-text font-caps" style={{ fontSize: 20, fontWeight: 700 }}>{rating}</div>
                  <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
