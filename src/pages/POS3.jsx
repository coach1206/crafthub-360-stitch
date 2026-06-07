import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Wine, Beer, Martini, UtensilsCrossed, Plus, X, Receipt } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const menuItems = [
  { id: 1, name: 'Robusto Selection',      cat: 'SmokeCraft', price: 42, Icon: Flame          },
  { id: 2, name: 'Old Fashioned',          cat: 'PourCraft',  price: 18, Icon: Martini         },
  { id: 3, name: 'Barrel Stout Draft',     cat: 'BeerCraft',  price: 12, Icon: Beer            },
  { id: 4, name: 'Opus One Pour',          cat: 'WineCraft',  price: 65, Icon: Wine            },
  { id: 5, name: 'Tasting Flight',         cat: 'EAT',        price: 34, Icon: UtensilsCrossed },
  { id: 6, name: 'Churchill Aged Reserve', cat: 'SmokeCraft', price: 78, Icon: Flame           },
]

export default function POS3() {
  const [cart, setCart] = useState([])

  const add = (item) => setCart(c => {
    const ex = c.find(i => i.id === item.id)
    return ex ? c.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...item, qty: 1 }]
  })
  const remove = (id) => setCart(c => c.filter(i => i.id !== id))
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const count = cart.reduce((s, i) => s + i.qty, 0)

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
        <span className="font-label text-xs tracking-widest uppercase text-primary">
          POS3 Live — {count} item{count !== 1 ? 's' : ''} in order
        </span>
      </motion.div>

      <motion.div variants={FADE} className="text-center mb-16">
        <h1 className="text-display-tour gold-foil-text mb-4 leading-tight">POINT OF SALE 3</h1>
        <p className="text-body-intro text-on-surface-variant max-w-2xl mx-auto">
          Unified transaction layer across all CraftHub modules. Compose the order and charge with precision.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={FADE} className="grid grid-cols-4 gap-8 w-full mb-8">
        {[['$0','Revenue Today'],[String(count),'Items in Cart'],['$'+total,'Order Total'],['14','POS Screens']].map(([v,l]) => (
          <div key={l} className="stitch-card text-center">
            <div className="gold-foil-text font-display text-5xl font-bold mb-2">{v}</div>
            <p className="font-label text-xs tracking-widest uppercase text-on-surface-variant">{l}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={FADE} className="grid grid-cols-12 gap-8 w-full">
        {/* Menu */}
        <div className="col-span-12 md:col-span-7 stitch-card stitch-card-accent">
          <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-6">Menu</h3>
          <ul className="space-y-2">
            {menuItems.map(item => (
              <li key={item.id} className="manifest-row">
                <div className="flex items-center gap-4">
                  <item.Icon size={22} className="text-primary shrink-0" />
                  <div>
                    <div className="font-semibold text-on-surface">{item.name}</div>
                    <div className="font-label text-xs text-on-surface-variant tracking-widest uppercase mt-0.5">{item.cat}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-display text-2xl font-bold text-primary">${item.price}</span>
                  <button onClick={() => add(item)}
                    className="w-9 h-9 rounded-full flex items-center justify-center border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <Plus size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Cart */}
        <div className="col-span-12 md:col-span-5 stitch-card stitch-card-accent flex flex-col">
          <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-6">Current Order</h3>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-40 py-16">
              <Receipt size={48} className="text-primary" />
              <p className="text-on-surface-variant">No items added yet</p>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              <div className="space-y-2 flex-1 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container">
                    <span className="text-sm font-semibold text-on-surface">{item.qty}× {item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-xl font-bold text-primary">${item.price * item.qty}</span>
                      <button onClick={() => remove(item.id)} className="text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-outline-variant/30 pt-5 mb-5">
                <div className="flex justify-between items-center">
                  <span className="font-label text-sm tracking-widest uppercase text-on-surface-variant">Total</span>
                  <span className="gold-foil-text font-display text-5xl font-bold leading-none">${total}</span>
                </div>
              </div>
              <button className="btn-primary gold-shimmer w-full">CHARGE ${total}</button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
