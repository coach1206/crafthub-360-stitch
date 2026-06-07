import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Wine } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const cellar = [
  { name: 'Opus One 2018',        region: 'Napa Valley', varietal: 'Cabernet Blend', vintage: 2018, score: 98, peak: '2028–2040' },
  { name: 'Barolo Riserva 2016',  region: 'Piedmont',    varietal: 'Nebbiolo',       vintage: 2016, score: 96, peak: '2026–2035' },
  { name: 'Pomerol Reserve 2019', region: 'Bordeaux',    varietal: 'Merlot',         vintage: 2019, score: 94, peak: '2025–2030' },
  { name: 'Sassicaia 2017',       region: 'Tuscany',     varietal: 'Cabernet Sauv',  vintage: 2017, score: 97, peak: '2027–2038' },
]

const modules = [
  ['Cellar Map',     true ], ['Vintage Tracker', true ],
  ['Peak Window',    true ], ['Provenance Log',  true ],
  ['Decant Timer',   true ], ['Pairing Engine',  true ],
  ['Auction Watch',  false], ['Futures Tracker', false],
]

const regions = [
  { name: 'Napa Valley', bottles: 48, pct: 34 },
  { name: 'Bordeaux',    bottles: 36, pct: 25 },
  { name: 'Piedmont',    bottles: 32, pct: 23 },
  { name: 'Tuscany',     bottles: 26, pct: 18 },
]

export default function WineCraft() {
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
        <span className="font-label text-xs tracking-widest uppercase text-primary">Cellar Synced — 142 Bottles Logged</span>
      </motion.div>

      <motion.div variants={FADE} className="text-center mb-16">
        <h1 className="text-display-tour gold-foil-text mb-4 leading-tight">WINECRAFT</h1>
        <p className="text-body-intro text-on-surface-variant max-w-2xl mx-auto">
          Cellar management — provenance tracking, peak drinking windows,
          vintage intelligence, and the art of the perfect decant.
        </p>
      </motion.div>

      <motion.div variants={FADE} className="grid grid-cols-4 gap-8 w-full mb-8">
        {[['24','Screens'],['142','Bottles'],['97','Avg Score'],['4','Regions']].map(([v,l]) => (
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
          <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-6">Cellar Selection</h3>
          <ul className="space-y-2">
            {cellar.map(({ name, region, varietal, vintage, score, peak }) => (
              <li key={name} className="manifest-row">
                <div className="flex items-center gap-4">
                  <Wine size={22} className="text-primary shrink-0" />
                  <div>
                    <div className="font-semibold text-on-surface">{name}</div>
                    <div className="font-label text-xs text-on-surface-variant mt-0.5">{region} · {varietal} · Peak {peak}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="gold-foil-text font-display text-4xl font-bold leading-none">{score}</div>
                  <div className="font-label text-xs text-on-surface-variant tracking-widest uppercase">pts</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Region breakdown */}
      <motion.div variants={FADE} className="stitch-card w-full">
        <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-8">Cellar Composition by Region</h3>
        <div className="grid grid-cols-4 gap-6">
          {regions.map(({ name, bottles, pct }) => (
            <div key={name} className="text-center">
              <div className="gold-foil-text font-display text-5xl font-bold mb-2">{pct}%</div>
              <div className="font-label text-xs font-semibold tracking-widest uppercase text-on-surface mb-1">{name}</div>
              <div className="font-label text-xs text-on-surface-variant mb-3">{bottles} bottles</div>
              <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                <div className="h-full rounded-full bg-primary glow-pulse" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
