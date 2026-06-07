import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, GlassWater } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const recipes = [
  { name: 'Old Fashioned',  base: 'Bourbon', style: 'Stirred', abv: '38%', status: 'Ready'  },
  { name: 'Negroni',        base: 'Gin',     style: 'Stirred', abv: '26%', status: 'Ready'  },
  { name: 'Mezcal Sour',    base: 'Mezcal',  style: 'Shaken',  abv: '18%', status: 'Draft'  },
  { name: 'Smoke & Mirror', base: 'Rye',     style: 'Custom',  abv: '32%', status: 'Ready'  },
  { name: 'Gold Daiquiri',  base: 'Rum',     style: 'Shaken',  abv: '22%', status: 'Active' },
]

const modules = [
  ['Recipe Builder', true], ['Spirit Library', true],
  ['Ratio Engine',   true], ['Bitters Index',  true],
  ['Garnish Guide',  true], ['Session Log',    true],
  ['Flavor Map',    false], ['Batch Calc',    false],
]

export default function PourCraft() {
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
        <span className="font-label text-xs tracking-widest uppercase text-primary">Bar Module Live — 22 Recipes Compiled</span>
      </motion.div>

      <motion.div variants={FADE} className="text-center mb-16">
        <h1 className="text-display-tour gold-foil-text mb-4 leading-tight">POURCRAFT</h1>
        <p className="text-body-intro text-on-surface-variant max-w-2xl mx-auto">
          Cocktail command center. Recipes, ratios, spirit intelligence,
          and the science of the perfect pour.
        </p>
      </motion.div>

      <motion.div variants={FADE} className="grid grid-cols-4 gap-8 w-full mb-8">
        {[['22','Recipes'],['8','Spirits'],['3','On Draft'],['5','Active']].map(([v,l]) => (
          <div key={l} className="stitch-card text-center">
            <div className="gold-foil-text font-display text-5xl font-bold mb-2">{v}</div>
            <p className="font-label text-xs tracking-widest uppercase text-on-surface-variant">{l}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={FADE} className="grid grid-cols-12 gap-8 w-full">
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
          <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-6">Recipe Index</h3>
          <ul className="space-y-2">
            {recipes.map(({ name, base, style, abv, status }) => (
              <li key={name} className="manifest-row">
                <div className="flex items-center gap-4">
                  <GlassWater size={22} className="text-primary shrink-0" />
                  <div>
                    <div className="font-semibold text-on-surface">{name}</div>
                    <div className="font-label text-xs text-on-surface-variant mt-0.5">{base} · {style} · {abv} ABV</div>
                  </div>
                </div>
                <span className="font-label text-xs tracking-widest uppercase px-3 py-1 rounded-full"
                  style={{
                    background: (status === 'Ready' || status === 'Active') ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.06)',
                    color: (status === 'Ready' || status === 'Active') ? '#f2ca50' : '#d0c5af',
                    border: `1px solid ${(status === 'Ready' || status === 'Active') ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                  {status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  )
}
