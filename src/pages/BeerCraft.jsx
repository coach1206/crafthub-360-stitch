import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Beer } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const taps = [
  { name: 'Barrel Stout',   style: 'Imperial Stout',  abv: '11.2%', ibu: 65, status: 'Pouring' },
  { name: 'Gold Haze',      style: 'New England IPA', abv: '6.8%',  ibu: 42, status: 'Pouring' },
  { name: 'Amber Protocol', style: 'Amber Ale',       abv: '5.4%',  ibu: 32, status: 'Pouring' },
  { name: 'Obsidian Lager', style: 'Munich Dunkel',   abv: '4.9%',  ibu: 18, status: 'Low Keg' },
]

const modules = [
  ['Tap Manager',     true ], ['Brew Log',          true ],
  ['Ferment Tracker', true ], ['Hop Index',          true ],
  ['Grain Bill',      true ], ['ABV Calculator',     true ],
  ['Yeast Library',   false], ['Water Profile',      false],
]

const ferment = [
  { label: 'Primary Ferment',   days: 7,  pct: 100 },
  { label: 'Secondary Clarify', days: 14, pct: 75  },
  { label: 'Conditioning',      days: 21, pct: 40  },
  { label: 'Packaging Ready',   days: 28, pct: 0   },
]

export default function BeerCraft() {
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
        <span className="font-label text-xs tracking-widest uppercase text-primary">Tap Room Active — 4 Live Taps</span>
      </motion.div>

      <motion.div variants={FADE} className="text-center mb-16">
        <h1 className="text-display-tour gold-foil-text mb-4 leading-tight">BEERCRAFT</h1>
        <p className="text-body-intro text-on-surface-variant max-w-2xl mx-auto">
          Brew intelligence — tap management, fermentation tracking, grain bill analytics,
          and full lifecycle from mash to glass.
        </p>
      </motion.div>

      <motion.div variants={FADE} className="grid grid-cols-4 gap-8 w-full mb-8">
        {[['18','Recipes'],['4','Live Taps'],['6.8%','Avg ABV'],['39','Avg IBU']].map(([v,l]) => (
          <div key={l} className="stitch-card text-center">
            <div className="gold-foil-text font-display text-5xl font-bold mb-2">{v}</div>
            <p className="font-label text-xs tracking-widest uppercase text-on-surface-variant">{l}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={FADE} className="grid grid-cols-12 gap-8 w-full mb-8">
        <div className="col-span-12 md:col-span-5 stitch-card stitch-card-accent">
          <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-6">Module Status</h3>
          <div className="grid grid-cols-2 gap-2">
            {modules.map(([label, done]) => (
              <div key={label} className="module-chip">
                <span className="text-sm text-on-surface">{label}</span>
                {done ? <CheckCircle2 size={16} className="text-primary shrink-0" /> : <XCircle size={16} className="text-on-surface-variant/30 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 md:col-span-7 stitch-card stitch-card-accent">
          <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-6">Live Taps</h3>
          <ul className="space-y-2">
            {taps.map(({ name, style, abv, ibu, status }) => (
              <li key={name} className="manifest-row">
                <div className="flex items-center gap-4">
                  <Beer size={22} className="text-primary shrink-0" />
                  <div>
                    <div className="font-semibold text-on-surface">{name}</div>
                    <div className="font-label text-xs text-on-surface-variant mt-0.5">{style} · {abv} ABV · {ibu} IBU</div>
                  </div>
                </div>
                <span className="font-label text-xs tracking-widest uppercase px-3 py-1 rounded-full"
                  style={{
                    background: status === 'Pouring' ? 'rgba(212,175,55,0.12)' : 'rgba(255,80,80,0.1)',
                    color: status === 'Pouring' ? '#f2ca50' : '#ff6b6b',
                    border: `1px solid ${status === 'Pouring' ? 'rgba(212,175,55,0.3)' : 'rgba(255,100,100,0.3)'}`,
                  }}>
                  {status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Fermentation timeline */}
      <motion.div variants={FADE} className="stitch-card w-full">
        <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-8">Fermentation Timeline — Active Batch</h3>
        <div className="flex items-start justify-between relative">
          <div className="absolute left-0 right-0 top-2.5 h-0.5 bg-surface-container-highest z-0" />
          {ferment.map(({ label, days, pct }) => (
            <div key={label} className="flex flex-col items-center gap-3 relative z-10 flex-1">
              <div className="w-5 h-5 rounded-full border-2 transition-all"
                style={{
                  background: pct === 100 ? '#d4af37' : pct > 0 ? 'rgba(212,175,55,0.4)' : '#353534',
                  borderColor: pct > 0 ? '#f2ca50' : 'rgba(255,255,255,0.15)',
                  boxShadow: pct === 100 ? '0 0 12px rgba(212,175,55,0.5)' : 'none',
                }}
              />
              <div className="text-center">
                <div className="font-label text-xs font-semibold tracking-widest uppercase mb-1"
                  style={{ color: pct > 0 ? '#f2ca50' : '#d0c5af' }}>
                  {label}
                </div>
                <div className="font-label text-xs text-on-surface-variant">Day {days}</div>
                {pct > 0 && <div className="font-label text-xs text-primary mt-0.5">{pct}%</div>}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
