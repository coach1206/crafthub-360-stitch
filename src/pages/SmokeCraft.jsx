import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const vitolas = [
  { name: 'Robusto',   ring: 50, length: '5"',   rating: 94, country: 'Nicaragua' },
  { name: 'Churchill', ring: 47, length: '7"',   rating: 96, country: 'Dominican' },
  { name: 'Toro',      ring: 52, length: '6"',   rating: 92, country: 'Honduras'  },
  { name: 'Lancero',   ring: 38, length: '7.5"', rating: 97, country: 'Cuba'      },
]

const modules = [
  ['Humidor Entry',          true ],
  ['Stick Selection',        true ],
  ['Draw Tension Analytics', true ],
  ['Aging Calculator',       true ],
  ['Leaf Provenance',        true ],
  ['Ash Quality Review',     true ],
  ['Blind Rating Mode',      false],
  ['Pairing Engine',         false],
]

const drawStats = [
  { label: 'Perfect Draw', pct: 72, color: '#f2ca50' },
  { label: 'Slight Tight', pct: 18, color: 'rgba(212,175,55,0.5)' },
  { label: 'Plugged',      pct: 6,  color: 'rgba(255,100,100,0.6)' },
  { label: 'Too Open',     pct: 4,  color: 'rgba(255,255,255,0.25)' },
]

export default function SmokeCraft() {
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
        <span className="font-label text-xs tracking-widest uppercase text-primary">Humidor Online — 48 Sticks Active</span>
      </motion.div>

      <motion.div variants={FADE} className="text-center mb-16">
        <h1 className="text-display-tour gold-foil-text mb-4 leading-tight">SMOKECRAFT</h1>
        <p className="text-body-intro text-on-surface-variant max-w-2xl mx-auto">
          Cigar intelligence module. Aging analytics, draw precision tracking,
          and leaf provenance from seed to smoke.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={FADE} className="grid grid-cols-4 gap-8 w-full mb-8">
        {[['48','Sticks'],['6','Aging'],['94','Avg Score'],['28','Screens']].map(([v,l]) => (
          <div key={l} className="stitch-card text-center">
            <div className="gold-foil-text font-display text-5xl font-bold mb-2">{v}</div>
            <p className="font-label text-xs tracking-widest uppercase text-on-surface-variant">{l}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={FADE} className="grid grid-cols-12 gap-8 w-full mb-8">
        {/* Module checklist */}
        <div className="col-span-12 md:col-span-5 stitch-card stitch-card-accent">
          <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-6">Module Status</h3>
          <div className="grid grid-cols-2 gap-2">
            {modules.map(([label, done]) => (
              <div key={label} className="module-chip">
                <span className="text-sm text-on-surface">{label}</span>
                {done
                  ? <CheckCircle2 size={18} className="text-primary shrink-0" />
                  : <XCircle size={18} className="text-on-surface-variant/30 shrink-0" />
                }
              </div>
            ))}
          </div>
        </div>

        {/* Vitola list */}
        <div className="col-span-12 md:col-span-7 stitch-card stitch-card-accent">
          <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-6">Active Vitolas</h3>
          <ul className="space-y-2">
            {vitolas.map(({ name, ring, length, rating, country }) => (
              <li key={name} className="manifest-row">
                <div>
                  <div className="font-semibold text-on-surface">{name}</div>
                  <div className="font-label text-xs text-on-surface-variant mt-1">Ring {ring} · {length} · {country}</div>
                </div>
                <div className="text-right">
                  <div className="gold-foil-text font-display text-4xl font-bold leading-none">{rating}</div>
                  <div className="font-label text-xs text-on-surface-variant tracking-widest uppercase">pts</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Draw Tension */}
      <motion.div variants={FADE} className="stitch-card w-full">
        <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-8">Draw Tension Analytics</h3>
        <div className="grid grid-cols-4 gap-8">
          {drawStats.map(({ label, pct, color }) => (
            <div key={label} className="text-center">
              <div className="font-display text-5xl font-bold mb-2" style={{ color }}>{pct}%</div>
              <div className="font-label text-xs text-on-surface-variant tracking-widest uppercase mb-3">{label}</div>
              <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
