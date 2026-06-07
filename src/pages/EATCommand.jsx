import Card, { SectionDivider, ModuleChip, StatusBadge } from '../components/Card.jsx'

const courses = [
  { name: 'Wagyu A5 Nigiri',       type: 'Course 1', status: 'Served',  time: '7:14 PM' },
  { name: 'Black Truffle Risotto', type: 'Course 2', status: 'Firing',  time: '7:32 PM' },
  { name: 'Aged Duck Confit',      type: 'Course 3', status: 'Pending', time: '7:55 PM' },
  { name: 'Miso Chocolate Tart',   type: 'Dessert',  status: 'Pending', time: '8:20 PM' },
]

const statusColor = { Served: '#4caf50', Firing: '#f2ca50', Pending: 'rgba(255,255,255,0.3)' }

export default function EATCommand() {
  return (
    <div style={{ padding: '4px 16px 16px' }}>
      <div style={{ marginBottom: 12 }}>
        <StatusBadge label="Kitchen Live" />
      </div>
      <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 700, marginBottom: 4 }}>
        <span className="gold-text">EAT</span>
        <span style={{ color: '#fff' }}> Command</span>
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
        Dining intelligence — kitchen coordination, course pacing, and table experience.
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[['12', 'Screens'], ['4', 'Courses'], ['2', 'Tables']].map(([v, l]) => (
          <Card key={l} style={{ padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#4caf50', fontFamily: 'Space Grotesk, sans-serif' }}>{v}</div>
            <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* Modules */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: '16px 20px 20px' }}>
          <SectionDivider label="Module Status" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <ModuleChip label="Table Manager" />
            <ModuleChip label="Course Pacing" />
            <ModuleChip label="Kitchen Display" />
            <ModuleChip label="Allergy Filter" />
            <ModuleChip label="Sommelier Link" />
            <ModuleChip label="Experience Log" />
          </div>
        </div>
      </Card>

      {/* Course fire order */}
      <Card>
        <div style={{ padding: '16px 20px' }}>
          <div className="font-caps" style={{ fontSize: 10, color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 14 }}>Fire Order — Table 3</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {courses.map(({ name, type, status, time }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[status], flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{name}</div>
                    <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{type}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    className="font-caps"
                    style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: `${statusColor[status]}18`, color: statusColor[status], border: `1px solid ${statusColor[status]}44`, letterSpacing: '0.08em' }}
                  >
                    {status}
                  </span>
                  <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
