import Card, { SectionLabel, StatusBadge, ModuleChip, SectionDivider } from '../components/Card.jsx'

const courseOrder = [
  { name: 'Wagyu A5 Nigiri',        type: 'Amuse-Bouche', status: 'Served',  time: '7:14 PM', table: 3 },
  { name: 'Black Truffle Risotto',  type: 'Course II',    status: 'Firing',  time: '7:32 PM', table: 3 },
  { name: 'Aged Duck Confit',       type: 'Course III',   status: 'Pending', time: '7:55 PM', table: 3 },
  { name: 'Miso Chocolate Tart',    type: 'Dessert',      status: 'Pending', time: '8:20 PM', table: 3 },
]

const tables = [
  { id: 1, guests: 2, status: 'Seated',   course: 'Dessert',   spend: 420 },
  { id: 2, guests: 4, status: 'Ordering', course: 'Course I',  spend: 0   },
  { id: 3, guests: 2, status: 'Active',   course: 'Course II', spend: 280 },
  { id: 4, guests: 6, status: 'Reserved', course: '—',         spend: 0   },
]

const statusColor = {
  Served:  'var(--primary)',
  Firing:  '#ff9800',
  Pending: 'rgba(255,255,255,0.25)',
}
const tableColor = {
  Seated:   'var(--primary)',
  Ordering: '#ff9800',
  Active:   '#4caf50',
  Reserved: 'rgba(255,255,255,0.3)',
}

export default function EATCommand() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <StatusBadge label="Kitchen Live — Table 3 Active Fire Order" />

      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1 className="text-display-tour gold-foil-text" style={{ marginBottom: 16 }}>
          EAT COMMAND
        </h1>
        <p className="text-body-intro text-on-surface-var" style={{ maxWidth: 640, margin: '0 auto' }}>
          Dining intelligence — kitchen coordination, course pacing,
          table management, and the complete experiential arc from first bite to last glass.
        </p>
      </div>

      <div className="bento-grid">

        {/* Stats */}
        {[['12', 'EAT Screens'], ['4', 'Tables Active'], ['4', 'Courses'], ['$700', 'Floor Revenue']].map(([v, l]) => (
          <div key={l} style={{ gridColumn: 'span 3' }}>
            <Card style={{ textAlign: 'center' }}>
              <div className="gold-foil-text" style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, lineHeight: 1, marginBottom: 8 }}>{v}</div>
              <p className="text-label-sm text-on-surface-var" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</p>
            </Card>
          </div>
        ))}

        {/* Fire order card */}
        <div className="col-7">
          <Card accent>
            <SectionLabel>Fire Order — Table 3</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {courseOrder.map(({ name, type, status, time }) => (
                <div key={name} className="manifest-row" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor[status], flexShrink: 0, boxShadow: status === 'Firing' ? '0 0 8px #ff9800' : 'none' }} />
                    <div>
                      <div className="text-body-md" style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>{name}</div>
                      <div className="text-label-sm text-on-surface-var" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{type}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontFamily: 'var(--font-label)', fontSize: 11, letterSpacing: '0.1em',
                      textTransform: 'uppercase', padding: '4px 12px', borderRadius: 9999,
                      background: `${statusColor[status]}18`,
                      color: statusColor[status],
                      border: `1px solid ${statusColor[status]}44`,
                    }}>
                      {status}
                    </span>
                    <div className="text-label-sm text-on-surface-var" style={{ marginTop: 6 }}>{time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Module checklist + table status */}
        <div className="col-5" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card accent>
            <SectionLabel>Module Status</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <ModuleChip label="Table Manager" />
              <ModuleChip label="Course Pacing" />
              <ModuleChip label="Kitchen Display" />
              <ModuleChip label="Allergy Filter" />
              <ModuleChip label="Sommelier Link" />
              <ModuleChip label="Experience Log" />
            </div>
          </Card>

          <Card>
            <SectionLabel>Floor Status</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tables.map(({ id, guests, status, course, spend }) => (
                <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: tableColor[status] }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface)' }}>Table {id}</div>
                      <div className="text-label-sm text-on-surface-var">{guests} guests · {course}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {spend > 0 && <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>${spend}</div>}
                    <span style={{ fontFamily: 'var(--font-label)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: tableColor[status] }}>{status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Pacing timeline */}
        <div className="col-12">
          <Card>
            <SectionLabel>Experience Pacing — Ideal Arc</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
              {[
                { label: 'Arrival',      time: '7:00',  done: true  },
                { label: 'Amuse-Bouche', time: '7:14',  done: true  },
                { label: 'Courses',      time: '7:32',  done: false },
                { label: 'Digestif',     time: '8:30',  done: false },
                { label: 'Departure',    time: '9:00',  done: false },
              ].map(({ label, time, done }, i, arr) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
                  {i < arr.length - 1 && (
                    <div style={{ position: 'absolute', left: '50%', top: 10, width: '100%', height: 2, background: done ? 'var(--primary-container)' : 'var(--surface-container-highest)', zIndex: 0 }} />
                  )}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', zIndex: 1, flexShrink: 0,
                    background: done ? 'var(--primary-container)' : 'var(--surface-container-highest)',
                    border: done ? '2px solid var(--primary)' : '2px solid rgba(255,255,255,0.15)',
                    boxShadow: done ? '0 0 12px rgba(212,175,55,0.4)' : 'none',
                  }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 600, color: done ? 'var(--primary)' : 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                    <div className="text-label-sm text-on-surface-var">{time} PM</div>
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
