import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScoreRing from '../components/ScoreRing.jsx'
import AchievementBadge from '../components/AchievementBadge.jsx'
import craftImages from '../lib/craftImages.js'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const taps = [
  { name: 'Barrel Stout',    style: 'Imperial Stout',   abv: 11.2, ibu: 65, fill: 78, score: 95,
    notes: 'Dark chocolate, espresso, vanilla',
    color: '#8B4513',
    img: craftImages.beers.barrelStout,
  },
  { name: 'Gold Haze IPA',   style: 'NEIPA',            abv: 6.8,  ibu: 42, fill: 62, score: 93,
    notes: 'Tropical fruit, citrus, soft bitterness',
    color: '#D4AF37',
    img: craftImages.beers.goldHazeIPA,
  },
  { name: 'Amber Protocol',  style: 'Amber Ale',        abv: 5.4,  ibu: 32, fill: 45, score: 90,
    notes: 'Caramel malt, toast, mild hops',
    color: '#C88B3A',
    img: craftImages.beers.amberProtocol,
  },
  { name: 'Obsidian Lager',  style: 'Munich Dunkel',    abv: 4.9,  ibu: 18, fill: 20, score: 88,
    notes: 'Dark bread, roasted malt, smooth finish',
    color: '#4A3020',
    img: craftImages.beers.obsidianLager,
  },
]

const badges = [
  { icon: '🍺', label: 'Tap Master',    earned: true, count: 6 },
  { icon: '🌿', label: 'Hop Scholar',   earned: true           },
  { icon: '🖤', label: 'Stout Master',  earned: true, count: 2 },
  { icon: '🧪', label: 'Brew Lab',      earned: false          },
]

function TapCard({ tap, onOrder }) {
  const [pressed, setPressed] = useState(false)
  const fillColor = tap.fill > 50 ? '#D4AF37' : tap.fill > 25 ? '#C88B3A' : '#C06060'

  return (
    <motion.div whileTap={{ scale: 0.97 }}>
      <div
        className="glass-card overflow-hidden"
        style={{ cursor: 'pointer', borderRadius: 16, border: '1px solid rgba(212,175,55,0.15)' }}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
      >
        {/* Hero image */}
        <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
          <img
            src={tap.img}
            alt={tap.name}
            loading="lazy"
            onError={e => { e.currentTarget.src = craftImages.fallbacks.beer }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: pressed ? 'scale(1.04)' : 'scale(1)' }}
          />
          {/* Color-tinted overlay matching beer style */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${tap.color}22 0%, rgba(6,4,2,0.88) 100%)` }} />
          {/* Score ring top-right */}
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <ScoreRing score={tap.score} label="pts" size={56} strokeWidth={4} />
          </div>
          {/* Style tag */}
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'rgba(6,4,2,0.75)', backdropFilter: 'blur(8px)',
            padding: '3px 8px', borderRadius: 20,
            border: `1px solid ${tap.color}55`,
          }}>
            <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize: 8, color: tap.color, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight: 700 }}>{tap.style}</span>
          </div>
          {/* Name at bottom of image */}
          <div style={{ position: 'absolute', bottom: 10, left: 14, right: 70 }}>
            <div style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 16, color: '#E5E2E1', lineHeight: 1.15 }}>{tap.name}</div>
            <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(212,175,55,0.7)', marginTop: 2 }}>{tap.abv}% ABV · {tap.ibu} IBU</div>
          </div>
        </div>

        {/* Card content */}
        <div style={{ padding: '14px 16px 16px' }}>
          {/* Tasting notes */}
          <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(212,175,55,0.55)', letterSpacing:'0.06em', marginBottom: 10, fontStyle:'italic' }}>
            {tap.notes}
          </div>

          {/* Keg fill */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 5 }}>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize: 9, color:'rgba(122,122,122,0.7)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Keg Level</span>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize: 10, fontWeight: 600, color: fillColor }}>{tap.fill}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 9999, background: 'rgba(122,122,122,0.15)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${tap.fill}%`, borderRadius: 9999,
                background: `linear-gradient(90deg, ${fillColor}88, ${fillColor})`,
                boxShadow: `0 0 6px ${fillColor}66`,
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
            <button
              onTouchStart={e => e.currentTarget.style.transform='scale(0.95)'}
              onTouchEnd={e => { e.currentTarget.style.transform=''; onOrder && onOrder(tap) }}
              onClick={() => onOrder && onOrder(tap)}
              style={{
                height: 44, borderRadius: 10, border:'none', cursor:'pointer',
                background: `linear-gradient(135deg,${tap.color}cc,${tap.color})`,
                fontFamily:'"JetBrains Mono",monospace', fontWeight:700, fontSize:10,
                color:'#0a0605', letterSpacing:'0.1em', textTransform:'uppercase',
                transition:'transform 0.1s',
                boxShadow:`0 2px 12px ${tap.color}44`,
              }}
            >
              Order Now
            </button>
            <button
              onTouchStart={e => e.currentTarget.style.transform='scale(0.95)'}
              onTouchEnd={e => e.currentTarget.style.transform=''}
              style={{
                height: 44, borderRadius: 10, cursor:'pointer',
                background:'rgba(212,175,55,0.06)',
                border:`1px solid rgba(212,175,55,0.2)`,
                fontFamily:'"JetBrains Mono",monospace', fontWeight:700, fontSize:10,
                color:'#D4AF37', letterSpacing:'0.1em', textTransform:'uppercase',
                transition:'transform 0.1s',
              }}
            >
              Pairing
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function BeerCraft() {
  const navigate = useNavigate()
  const [ordered, setOrdered] = useState(null)

  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}>

      {/* Hero */}
      <motion.div variants={FADE} style={{ position: 'relative', height: 280 }}>
        <img
          src={craftImages.backgrounds.beercraft}
          alt="BeerCraft Tap Room"
          onError={e => { e.currentTarget.src = craftImages.fallbacks.taproom }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,1,1,0.1) 20%, rgba(1,1,1,0.97) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 5 }}>
            Tap Room Intelligence · 4 Live Taps
          </div>
          <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 36, color: '#E5E2E1', letterSpacing: '-0.02em', lineHeight: 1 }}>BeerCraft 360</div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color:'rgba(212,175,55,0.55)', marginTop: 6, letterSpacing:'0.06em' }}>
            Artisan Pairings · Live Keg Levels · Craft Stamps
          </div>
        </div>
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', cursor: 'pointer', zIndex: 2 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#D4AF37' }}>arrow_back</span>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BACK</span>
        </button>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#66bb6a', boxShadow:'0 0 8px #66bb6a', display:'inline-block' }} />
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>4 TAPS LIVE</span>
          </div>
        </div>
      </motion.div>

      {/* Score + stats */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card-gold" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 28 }}>
          <ScoreRing score={92} label="Avg Rating" size={110} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 18, color: '#E5E2E1', marginBottom: 6 }}>Tap Room Status</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['4','Live Taps'],['18','Recipes'],['6.8%','Avg ABV'],['39','Avg IBU']].map(([v,l]) => (
                <div key={l} style={{ background: 'rgba(212,175,55,0.06)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(212,175,55,0.12)' }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 20, color: '#D4AF37', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tap cards */}
      <motion.div variants={FADE} style={{ margin: '20px 16px 0' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
          Live Taps — Tap to Order
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {taps.map(tap => (
            <TapCard key={tap.name} tap={tap} onOrder={t => setOrdered(t.name)} />
          ))}
        </div>
      </motion.div>

      {/* Order confirmation toast */}
      {ordered && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ margin: '16px 16px 0', padding: '14px 18px', borderRadius: 14, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', display:'flex', alignItems:'center', gap:10 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize:20, color:'#D4AF37', fontVariationSettings:"'FILL' 1" }}>check_circle</span>
          <div>
            <div style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:600, fontSize:14, color:'#E5E2E1' }}>Order placed: {ordered}</div>
            <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:9, color:'rgba(212,175,55,0.6)', marginTop:2 }}>Your pour is being prepared · Est. 3 min</div>
          </div>
          <button onClick={() => setOrdered(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', opacity:0.5 }}>
            <span className="material-symbols-outlined" style={{ fontSize:16, color:'#D4AF37' }}>close</span>
          </button>
        </motion.div>
      )}

      {/* Achievements */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 24px' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            BeerCraft Achievements
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'space-around' }}>
            {badges.map(b => <AchievementBadge key={b.label} {...b} />)}
          </div>
        </div>
      </motion.div>

    </motion.div>
  )
}
