import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Wine, Beer, Martini, Badge, ShoppingCart, UtensilsCrossed, ChevronRight } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const modules = [
  { path: '/smokecraft', Icon: Flame,           label: 'SmokeCraft',   sub: 'Cigar & Tobacco Intelligence',  screens: 28 },
  { path: '/pourcraft',  Icon: Martini,         label: 'PourCraft',    sub: 'Cocktail Command Center',        screens: 22 },
  { path: '/beercraft',  Icon: Beer,            label: 'BeerCraft',    sub: 'Brew Intelligence',              screens: 18 },
  { path: '/winecraft',  Icon: Wine,            label: 'WineCraft',    sub: 'Cellar Management',              screens: 24 },
  { path: '/passport',   Icon: Badge,           label: 'Passport',     sub: 'Member Connection & Identity',   screens: 16 },
  { path: '/pos',        Icon: ShoppingCart,    label: 'POS3',         sub: 'Unified Point of Sale',          screens: 14 },
  { path: '/eat',        Icon: UtensilsCrossed, label: 'EAT Command',  sub: 'Dining Intelligence',            screens: 12 },
]

export default function CraftHub() {
  const navigate = useNavigate()
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
        <span className="font-label text-xs tracking-widest uppercase text-primary">All Systems Online — 134 Screens Compiled</span>
      </motion.div>

      <motion.div variants={FADE} className="text-center mb-16">
        <h1 className="text-display-tour gold-foil-text mb-4 leading-tight">CRAFTHUB 360</h1>
        <p className="text-body-intro text-on-surface-variant max-w-2xl mx-auto">
          Full ecosystem dashboard. Seven modules, 134 screens, one unified production tier.
        </p>
      </motion.div>

      {/* Summary row */}
      <motion.div variants={FADE} className="grid grid-cols-4 gap-8 w-full mb-8">
        {[['134','Total Screens'],['7','Active Modules'],['100%','Sync Status'],['14ms','Cloud Latency']].map(([v,l]) => (
          <div key={l} className="stitch-card text-center">
            <div className="gold-foil-text font-display text-5xl font-bold mb-2">{v}</div>
            <p className="font-label text-xs tracking-widest uppercase text-on-surface-variant">{l}</p>
          </div>
        ))}
      </motion.div>

      {/* Module grid */}
      <motion.div variants={FADE} className="grid grid-cols-12 gap-6 w-full">
        {modules.map(({ path, Icon, label, sub, screens }) => (
          <div key={path} className="col-span-12 md:col-span-6">
            <button
              onClick={() => navigate(path)}
              className="w-full text-left group"
            >
              <div className="stitch-card flex items-center gap-6 p-6 transition-all duration-200 group-hover:border-primary/30"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon size={26} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-xl font-semibold text-on-surface mb-1">{label}</div>
                  <div className="font-label text-xs text-on-surface-variant tracking-wide">{sub}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="gold-foil-text font-display text-3xl font-bold leading-none">{screens}</div>
                  <div className="font-label text-xs text-on-surface-variant tracking-widest uppercase">screens</div>
                </div>
                <ChevronRight size={18} className="text-on-surface-variant/40 shrink-0" />
              </div>
            </button>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}
