import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const fireOrder = [
  { name: 'Wagyu A5 Nigiri',        type: 'Amuse-Bouche', status: 'Served',  time: '7:14 PM' },
  { name: 'Black Truffle Risotto',  type: 'Course II',    status: 'Firing',  time: '7:32 PM' },
  { name: 'Aged Duck Confit',       type: 'Course III',   status: 'Pending', time: '7:55 PM' },
  { name: 'Miso Chocolate Tart',    type: 'Dessert',      status: 'Pending', time: '8:20 PM' },
]

const tables = [
  { id: 1, guests: 2, status: 'Seated',   course: 'Dessert',   spend: 420 },
  { id: 2, guests: 4, status: 'Ordering', course: 'Course I',  spend: 0   },
  { id: 3, guests: 2, status: 'Active',   course: 'Course II', spend: 280 },
  { id: 4, guests: 6, status: 'Reserved', course: '—',         spend: 0   },
]

const modules = [
  ['Table Manager',    true ], ['Course Pacing',  true ],
  ['Kitchen Display',  true ], ['Allergy Filter', true ],
  ['Sommelier Link',   true ], ['Experience Log', true ],
]

const pacing = [
  { label: 'Arrival',      time: '7:00', done: true  },
  { label: 'Amuse-Bouche', time: '7:14', done: true  },
  { label: 'Courses',      time: '7:32', done: false },
  { label: 'Digestif',     time: '8:30', done: false },
  { label: 'Departure',    time: '9:00', done: false },
]

const statusColor  = { Served: '#f2ca50', Firing: '#ff9800', Pending: 'rgba(255,255,255,0.25)' }
const tableColor   = { Seated: '#f2ca50', Ordering: '#ff9800', Active: '#4caf50', Reserved: 'rgba(255,255,255,0.3)' }

export default function EATCommand() {
  return (
    <motion.div className="flex flex-col items-center"
      initial="hidden" animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
    >
      <motion.div variants={FADE} className="status-badge mb-12">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
        </span>
        <span className="font-label text-xs tracking-widest uppercase text-primary">Kitchen Live — Table 3 Active Fire Order</span>
      </motion.div>

      <motion.div variants={FADE} className="text-center mb-16">
        <h1 className="text-display-tour gold-foil-text mb-4 leading-tight">EAT COMMAND</h1>
        <p className="text-body-intro text-on-surface-variant max-w-2xl mx-auto">
          Dining intelligence — kitchen coordination, course pacing, table management,
          and the complete experiential arc from first bite to last glass.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={FADE} className="grid grid-cols-4 gap-8 w-full mb-8">
        {[['12','EAT Screens'],['4','Tables Active'],['4','Courses'],['$700','Floor Revenue']].map(([v,l]) => (
          <div key={l} className="stitch-card text-center">
            <div className="gold-foil-text font-display text-5xl font-bold mb-2">{v}</div>
            <p className="font-label text-xs tracking-widest uppercase text-on-surface-variant">{l}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={FADE} className="grid grid-cols-12 gap-8 w-full mb-8">

        {/* Fire order */}
        <div className="col-span-12 md:col-span-7 stitch-card stitch-card-accent">
          <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-6">Fire Order — Table 3</h3>
          <ul className="space-y-2">
            {fireOrder.map(({ name, type, status, time }) => (
              <li key={name} className="manifest-row">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: statusColor[status], boxShadow: status === 'Firing' ? '0 0 8px #ff9800' : 'none' }} />
                  <div>
                    <div className="font-semibold text-on-surface">{name}</div>
                    <div className="font-label text-xs text-on-surface-variant tracking-widest uppercase mt-0.5">{type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-label text-xs tracking-widest uppercase px-3 py-1 rounded-full"
                    style={{ background: `${statusColor[status]}18`, color: statusColor[status], border: `1px solid ${statusColor[status]}44` }}>
                    {status}
                  </span>
                  <div className="font-label text-xs text-on-surface-variant mt-1">{time}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Module + table status */}
        <div className="col-span-12 md:col-span-5 flex flex-col gap-6">
          <div className="stitch-card stitch-card-accent">
            <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-4">Module Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {modules.map(([label, done]) => (
                <div key={label} className="module-chip">
                  <span className="text-sm text-on-surface">{label}</span>
                  {done ? <CheckCircle2 size={16} className="text-primary shrink-0" /> : <XCircle size={16} className="text-on-surface-variant/30 shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          <div className="stitch-card">
            <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-4">Floor Status</h3>
            <div className="space-y-2">
              {tables.map(({ id, guests, status, course, spend }) => (
                <div key={id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: tableColor[status] }} />
                    <div>
                      <div className="text-sm font-semibold text-on-surface">Table {id}</div>
                      <div className="font-label text-xs text-on-surface-variant">{guests} guests · {course}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {spend > 0 && <div className="font-display text-lg font-bold text-primary">${spend}</div>}
                    <span className="font-label text-xs tracking-widest uppercase" style={{ color: tableColor[status] }}>{status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pacing arc */}
      <motion.div variants={FADE} className="stitch-card w-full">
        <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-8">Experience Pacing — Ideal Arc</h3>
        <div className="flex items-start justify-between relative">
          <div className="absolute left-0 right-0 top-2.5 h-0.5 bg-surface-container-highest z-0" />
          {pacing.map(({ label, time, done }, i) => (
            <div key={label} className="flex flex-col items-center gap-3 relative z-10 flex-1">
              <div className="w-5 h-5 rounded-full border-2 transition-all"
                style={{
                  background: done ? '#d4af37' : '#353534',
                  borderColor: done ? '#f2ca50' : 'rgba(255,255,255,0.15)',
                  boxShadow: done ? '0 0 12px rgba(212,175,55,0.5)' : 'none',
                }}
              />
              <div className="text-center">
                <div className="font-label text-xs font-semibold tracking-widest uppercase" style={{ color: done ? '#f2ca50' : '#d0c5af' }}>{label}</div>
                <div className="font-label text-xs text-on-surface-variant">{time} PM</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
