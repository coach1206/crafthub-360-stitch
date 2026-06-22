import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

/**
 * Honest "Coming Soon" page for a CraftHub vertical that has no real
 * session/scoring/backend logic behind it yet. Per docs/crafthub-coming-soon-policy.md:
 * no fake scorecards, no fake leaderboards, no fake POS/inventory data — this
 * renders only the required Coming Soon copy and the premium dark-glass/gold
 * visual language already established by SmokeCraft.
 */
export default function CraftHubComingSoon({ title, tagline, icon, heroImage }) {
  const navigate = useNavigate()

  return (
    <motion.div initial="hidden" animate="show" variants={FADE} style={{ minHeight: '100vh', background: '#0a0805', color: '#f1e6c8' }}>
      <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
        {heroImage ? (
          <img src={heroImage} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.4) brightness(0.5)' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1410, #0a0805, #000)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,8,5,0.3) 0%, rgba(10,8,5,0.96) 100%)' }} />
        <button
          onClick={() => navigate('/crafthub')}
          style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', cursor: 'pointer', color: '#d4af37', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          CraftHub
        </button>
      </div>

      <div style={{ maxWidth: 560, margin: '-40px auto 0', padding: '0 24px 64px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 0 40px rgba(212,175,55,0.15)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#d4af37' }}>{icon}</span>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 99, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37' }} />
          <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#d4af37', fontWeight: 700 }}>Coming Soon</span>
        </div>

        <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700, margin: '0 0 12px' }}>{title}</h1>
        <p style={{ fontSize: 14, color: '#cbb98f', lineHeight: 1.6, marginBottom: 28 }}>{tagline}</p>

        <div style={{ borderRadius: 16, border: '1px solid rgba(212,175,55,0.18)', background: '#120f0a', padding: '20px 24px', textAlign: 'left' }}>
          <p style={{ fontSize: 13, color: '#f1e6c8', margin: '0 0 8px' }}>Built on the SmokeCraft MVP2 engine.</p>
          <p style={{ fontSize: 13, color: '#cbb98f', margin: 0 }}>
            Unlocks after SmokeCraft, POS3, and E.A.T. are complete. The session/scorecard/winner/POS3/E.A.T./shared-storage
            pattern is proven by SmokeCraft — this vertical is a matter of replication, not an unproven gamble.
          </p>
        </div>

        <button
          onClick={() => navigate('/smokecraft')}
          style={{ marginTop: 28, padding: '12px 28px', borderRadius: 99, border: '1px solid rgba(212,175,55,0.4)', background: 'transparent', color: '#d4af37', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          See the SmokeCraft MVP2 Proof
        </button>
      </div>
    </motion.div>
  )
}
