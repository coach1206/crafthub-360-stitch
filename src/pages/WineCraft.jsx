import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScoreRing from '../components/ScoreRing.jsx'
import AchievementBadge from '../components/AchievementBadge.jsx'
import craftImages from '../lib/craftImages.js'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const cellar = [
  { name: 'Opus One 2018',        region: 'Napa Valley', varietal: 'Cab Blend', score: 98, peak: '2028–2040', price: '$320',
    accentColor: '#8B1A3C', img: craftImages.wines.opusOne },
  { name: 'Barolo Riserva 2016',  region: 'Piedmont',    varietal: 'Nebbiolo',  score: 96, peak: '2026–2035', price: '$185',
    accentColor: '#6B1414', img: craftImages.wines.barolo },
  { name: 'Pomerol Reserve 2019', region: 'Bordeaux',    varietal: 'Merlot',    score: 94, peak: '2025–2030', price: '$140',
    accentColor: '#5C1A2E', img: craftImages.wines.pomerol },
  { name: 'Sassicaia 2017',       region: 'Tuscany',     varietal: 'Cab Sauv',  score: 97, peak: '2027–2038', price: '$260',
    accentColor: '#7A2020', img: craftImages.wines.sassicaia },
]

const regions = [
  { name: 'Napa Valley', pct: 34, color: '#D4AF37' },
  { name: 'Bordeaux',    pct: 25, color: '#B8962E' },
  { name: 'Piedmont',    pct: 23, color: '#A07820' },
  { name: 'Tuscany',     pct: 18, color: '#7A5A10' },
]

const badges = [
  { icon: '🍷', label: 'Sommelier',   earned: true           },
  { icon: '🏰', label: 'Bordeaux',    earned: true, count: 4 },
  { icon: '🕯️', label: 'Cellar Lord', earned: true           },
  { icon: '🥇', label: 'Parker 100',  earned: false          },
]

function WineCard({ wine }) {
  const [pressed, setPressed] = useState(false)

  return (
    <motion.div whileTap={{ scale: 0.96 }} style={{ flexShrink: 0, width: 200, cursor: 'pointer' }}>
      <div
        className="glass-card overflow-hidden"
        style={{ borderRadius: 16, border: `1px solid ${wine.accentColor}44` }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
      >
        {/* Wine image */}
        <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
          <img
            src={wine.img}
            alt={wine.name}
            loading="lazy"
            onError={e => { e.currentTarget.src = craftImages.fallbacks.wine }}
            style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s', transform: pressed ? 'scale(1.06)' : 'scale(1)' }}
          />
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(to bottom, ${wine.accentColor}22 0%, rgba(6,4,2,0.9) 100%)` }} />
          {/* Price badge */}
          <div style={{
            position:'absolute', top:10, right:10,
            background:'rgba(6,4,2,0.82)', backdropFilter:'blur(8px)',
            padding:'4px 10px', borderRadius:20,
            border:`1px solid ${wine.accentColor}66`,
          }}>
            <span style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#D4AF37' }}>{wine.price}</span>
          </div>
          {/* Region tag */}
          <div style={{
            position:'absolute', top:10, left:10,
            background:'rgba(6,4,2,0.75)', backdropFilter:'blur(8px)',
            padding:'3px 8px', borderRadius:20,
            border:`1px solid ${wine.accentColor}44`,
          }}>
            <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:`${wine.accentColor}dd`, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700 }}>{wine.region}</span>
          </div>
        </div>

        {/* Card content */}
        <div style={{ padding: '14px 14px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'"Hanken Grotesk",sans-serif', fontWeight:700, fontSize:13, color:'#E5E2E1', lineHeight:1.2, marginBottom:3 }}>{wine.name}</div>
              <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(212,175,55,0.55)', letterSpacing:'0.05em' }}>{wine.varietal}</div>
              <div style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8.5, color:'rgba(212,175,55,0.4)', marginTop:2 }}>Peak {wine.peak}</div>
            </div>
            <ScoreRing score={wine.score} label="pts" size={52} strokeWidth={4} />
          </div>

          {/* Cellar status badge */}
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:10, padding:'5px 8px', borderRadius:8, background:`${wine.accentColor}12`, border:`1px solid ${wine.accentColor}30` }}>
            <span className="material-symbols-outlined" style={{ fontSize:11, color:wine.accentColor, fontVariationSettings:"'FILL' 1" }}>wine_bar</span>
            <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:8, color:`${wine.accentColor}cc`, letterSpacing:'0.08em', textTransform:'uppercase' }}>In Cellar · Available</span>
          </div>

          {/* Buttons */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {['Decant', 'Order'].map(lbl => (
              <button
                key={lbl}
                onTouchStart={e => e.currentTarget.style.transform='scale(0.93)'}
                onTouchEnd={e => e.currentTarget.style.transform=''}
                style={{
                  height: 38, borderRadius: 8, cursor:'pointer',
                  background: lbl === 'Decant'
                    ? `linear-gradient(135deg,${wine.accentColor}cc,${wine.accentColor})`
                    : 'rgba(212,175,55,0.07)',
                  border: lbl === 'Order' ? '1px solid rgba(212,175,55,0.22)' : 'none',
                  fontFamily:'"JetBrains Mono",monospace', fontWeight:700, fontSize:9,
                  color: lbl === 'Decant' ? 'rgba(255,255,255,0.95)' : '#D4AF37',
                  letterSpacing:'0.1em', textTransform:'uppercase',
                  transition:'transform 0.1s',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function WineCraft() {
  const navigate = useNavigate()

  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}>

      {/* Hero */}
      <motion.div variants={FADE} style={{ position: 'relative', height: 280 }}>
        <img
          src={craftImages.backgrounds.winecraft}
          alt="WineCraft Cellar"
          onError={e => { e.currentTarget.src = craftImages.fallbacks.cellar }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,1,1,0.0) 20%, rgba(1,1,1,0.97) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 5 }}>
            Cellar Management System · 142 Bottles
          </div>
          <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 36, color: '#E5E2E1', letterSpacing: '-0.02em', lineHeight: 1 }}>WineCraft 360</div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color:'rgba(212,175,55,0.55)', marginTop: 6, letterSpacing:'0.06em' }}>
            Vintage Selections · Peak Drinking Windows · Cellar Intelligence
          </div>
        </div>
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', cursor: 'pointer', zIndex: 2 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#D4AF37' }}>arrow_back</span>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BACK</span>
        </button>
      </motion.div>

      {/* Score + stats */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card-gold" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 28 }}>
          <ScoreRing score={97} label="Avg Rating" size={110} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 18, color: '#E5E2E1', marginBottom: 6 }}>Cellar Status</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['142','Bottles'],['24','Screens'],['4','Regions'],['97','Avg Pts']].map(([v,l]) => (
                <div key={l} style={{ background: 'rgba(212,175,55,0.06)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(212,175,55,0.12)' }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 20, color: '#D4AF37', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Wine cellar cards */}
      <motion.div variants={FADE} style={{ margin: '20px 0 0' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14, paddingLeft: 16 }}>
          Cellar Selection — Tap to Decant
        </div>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 8, scrollbarWidth:'none' }}>
          {cellar.map(wine => <WineCard key={wine.name} wine={wine} />)}
        </div>
      </motion.div>

      {/* Cellar composition rings */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Cellar Composition
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12 }}>
            {regions.map(({ name, pct, color }) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 8px' }}>
                  <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={40} cy={40} r={34} fill="none" stroke="rgba(122,122,122,0.15)" strokeWidth={6} />
                    <circle cx={40} cy={40} r={34} fill="none" stroke={color} strokeWidth={6}
                      strokeLinecap="round"
                      strokeDasharray={`${(pct / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                      style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 14, color }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{name}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 24px' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            WineCraft Achievements
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'space-around' }}>
            {badges.map(b => <AchievementBadge key={b.label} {...b} />)}
          </div>
        </div>
      </motion.div>

    </motion.div>
  )
}
