import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const fireOrder = [
  { name: 'Wagyu A5 Nigiri',       type: 'Amuse-Bouche', status: 'Served',  time: '7:14 PM' },
  { name: 'Black Truffle Risotto', type: 'Course II',    status: 'Firing',  time: '7:32 PM' },
  { name: 'Aged Duck Confit',      type: 'Course III',   status: 'Pending', time: '7:55 PM' },
  { name: 'Miso Chocolate Tart',   type: 'Dessert',      status: 'Pending', time: '8:20 PM' },
]

const tables = [
  { id: 1, guests: 2, status: 'Seated',   course: 'Dessert',   spend: 420 },
  { id: 2, guests: 4, status: 'Ordering', course: 'Course I',  spend: 0   },
  { id: 3, guests: 2, status: 'Active',   course: 'Course II', spend: 280 },
  { id: 4, guests: 6, status: 'Reserved', course: '—',         spend: 0   },
]

const modules = [
  ['Table Manager',   true ], ['Course Pacing',  true ],
  ['Kitchen Display', true ], ['Allergy Filter', true ],
  ['Sommelier Link',  true ], ['Experience Log', true ],
]

const pacing = [
  { label: 'Arrival',      done: true  },
  { label: 'Amuse-Bouche', done: true  },
  { label: 'Courses',      done: false },
  { label: 'Digestif',     done: false },
  { label: 'Departure',    done: false },
]

const statusColor = { Served: '#D4AF37', Firing: '#C88B3A', Pending: 'rgba(122,122,122,0.5)' }
const tableColor  = { Seated: '#D4AF37', Ordering: '#C88B3A', Active: '#5A9A5A', Reserved: 'rgba(122,122,122,0.4)' }

export default function EATCommand() {
  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div variants={FADE} style={{ marginBottom: 40 }}>
        <div className="status-pill"><span className="status-dot" />Kitchen Live — Table 3 Active Fire Order</div>
      </motion.div>

      <motion.div variants={FADE} style={{ width: '100%', marginBottom: 32 }}>
        <img src="/eat-command.jpg" alt="EAT Command" className="hero-banner" style={{ height: 320, objectPosition: 'center 40%' }} />
      </motion.div>

      <motion.div variants={FADE} style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 'clamp(36px,4vw,56px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#D4AF37', marginBottom: 12 }}>
          E.A.T. COMMAND
        </h1>
        <p style={{ fontFamily: 'Inter', fontSize: 16, color: '#7A7A7A', maxWidth: 540, margin: '0 auto' }}>
          Venue intelligence system — kitchen coordination, course pacing, table management,
          and the complete experiential arc from first bite to last glass.
        </p>
      </motion.div>

      <motion.div variants={FADE} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, width: '100%', marginBottom: 24 }}>
        {[['12','Screens'],['4','Active Tables'],['4','Courses'],['$700','Floor Revenue']].map(([v,l]) => (
          <div key={l} className="glass-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 32, fontWeight: 600, color: '#D4AF37', lineHeight: 1, marginBottom: 8 }}>{v}</div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7A7A' }}>{l}</div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={FADE} style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 24, width: '100%', marginBottom: 24 }}>
        {/* Fire order */}
        <div className="glass-card-gold" style={{ padding: 28 }}>
          <div className="section-label">Fire Order — Table 3</div>
          {fireOrder.map(({ name, type, status, time }) => (
            <div key={name} className="data-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: statusColor[status],
                  boxShadow: status === 'Firing' ? `0 0 8px ${statusColor[status]}` : 'none',
                }} />
                <div>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 15, color: '#E5E2E1' }}>{name}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{type}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '3px 10px', borderRadius: 3,
                  background: `${statusColor[status]}18`,
                  color: statusColor[status],
                  border: `1px solid ${statusColor[status]}44`,
                  display: 'block', marginBottom: 4,
                }}>{status}</span>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7A7A7A' }}>{time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Modules + Floor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <div className="section-label">Module Status</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {modules.map(([label, done]) => (
                <div key={label} className="module-chip">
                  <span style={{ fontFamily: 'Inter', fontSize: 12, color: '#E5E2E1' }}>{label}</span>
                  {done ? <CheckCircle2 size={13} style={{ color: '#D4AF37', flexShrink: 0 }} /> : <XCircle size={13} style={{ color: 'rgba(122,122,122,0.3)', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <div className="section-label">Floor Status</div>
            {tables.map(({ id, guests, status, course, spend }) => (
              <div key={id} className="data-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: tableColor[status], flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 14, color: '#E5E2E1' }}>Table {id}</div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A' }}>{guests} guests · {course}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {spend > 0 && <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 16, color: '#D4AF37', lineHeight: 1 }}>${spend}</div>}
                  <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: tableColor[status] }}>{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Pacing arc */}
      <motion.div variants={FADE} className="glass-card" style={{ width: '100%', padding: 32 }}>
        <div className="section-label">Experience Pacing — Ideal Arc</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 9, height: 1, background: 'rgba(122,122,122,0.15)', zIndex: 0 }} />
          {pacing.map(({ label, done }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1, flex: 1 }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: done ? '#D4AF37' : '#1A1A1A',
                border: `2px solid ${done ? '#D4AF37' : 'rgba(122,122,122,0.25)'}`,
                boxShadow: done ? '0 0 10px rgba(212,175,55,0.4)' : 'none',
              }} />
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', color: done ? '#D4AF37' : '#7A7A7A' }}>{label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
