import Card, { SectionLabel, ManifestRow, StatusBadge, ModuleChip, SectionDivider } from '../components/Card.jsx'

const vitolas = [
  { name: 'Robusto',   ring: 50, length: '5"',   rating: 94, country: 'Nicaragua' },
  { name: 'Churchill', ring: 47, length: '7"',   rating: 96, country: 'Dominican' },
  { name: 'Toro',      ring: 52, length: '6"',   rating: 92, country: 'Honduras'  },
  { name: 'Lancero',   ring: 38, length: '7.5"', rating: 97, country: 'Cuba'      },
]

export default function SmokeCraft() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <StatusBadge label="Humidor Online — 48 Sticks Active" />

      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1 className="text-display-tour gold-foil-text" style={{ marginBottom: 16 }}>
          SMOKECRAFT
        </h1>
        <p className="text-body-intro text-on-surface-var" style={{ maxWidth: 640, margin: '0 auto' }}>
          Cigar intelligence module. Aging analytics, draw precision tracking, and
          leaf provenance from seed to smoke.
        </p>
      </div>

      <div className="bento-grid">

        {/* Stats strip */}
        {[['48', 'Sticks in Humidor'], ['6', 'Aging Selections'], ['94', 'Avg Score'], ['28', 'Screens']].map(([v, l]) => (
          <div key={l} className="col-3" style={{ gridColumn: 'span 3' }}>
            <Card style={{ textAlign: 'center' }}>
              <div className="gold-foil-text" style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, lineHeight: 1, marginBottom: 8 }}>{v}</div>
              <p className="text-label-sm text-on-surface-var" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</p>
            </Card>
          </div>
        ))}

        {/* Module checklist */}
        <div className="col-5">
          <Card accent>
            <SectionLabel>Module Status</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SectionDivider>Smokecraft Core</SectionDivider>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <ModuleChip label="Humidor Entry" />
                <ModuleChip label="Stick Selection" />
                <ModuleChip label="Draw Tension Analytics" />
                <ModuleChip label="Aging Calculator" />
                <ModuleChip label="Leaf Provenance" />
                <ModuleChip label="Ash Quality Review" />
              </div>
              <SectionDivider>Coming Soon</SectionDivider>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <ModuleChip label="Blind Rating Mode" done={false} />
                <ModuleChip label="Pairing Engine"    done={false} />
              </div>
            </div>
          </Card>
        </div>

        {/* Vitola list */}
        <div className="col-7">
          <Card accent>
            <SectionLabel>Active Vitolas</SectionLabel>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {vitolas.map(({ name, ring, length, rating, country }) => (
                <li key={name} className="manifest-row" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span className="material-symbols-outlined icon-fill text-primary">smoke_free</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>{name}</div>
                      <div className="text-label-sm text-on-surface-var">Ring {ring} · {length} · {country}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="gold-foil-text" style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{rating}</div>
                    <div className="text-label-sm text-on-surface-var" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>pts</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Draw tension card */}
        <div className="col-12">
          <Card>
            <SectionLabel>Draw Tension Analytics</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Perfect Draw',   pct: 72, color: 'var(--primary)' },
                { label: 'Slight Tight',   pct: 18, color: 'rgba(212,175,55,0.5)' },
                { label: 'Plugged',        pct: 6,  color: 'rgba(255,100,100,0.6)' },
                { label: 'Too Open',       pct: 4,  color: 'rgba(255,255,255,0.25)' },
              ].map(({ label, pct, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color, marginBottom: 4 }}>{pct}%</div>
                  <div className="text-label-sm text-on-surface-var" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                  <div style={{ marginTop: 8, height: 4, borderRadius: 9999, background: 'var(--surface-container-highest)' }}>
                    <div style={{ height: '100%', borderRadius: 9999, background: color, width: `${pct}%` }} />
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
