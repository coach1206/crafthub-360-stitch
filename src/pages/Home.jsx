import { motion } from 'framer-motion'
import { CheckCircle2, Cloud, Terminal, Copy, Check } from 'lucide-react'
import { useState } from 'react'

const FADE = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } }
const STAGGER = { show: { transition: { staggerChildren: 0.1 } } }

const manifest = [
  { label: '130+ Orchestrated Screens',    badge: 'Verified'  },
  { label: 'Obsidian Glass Design Tokens', badge: 'Synced'    },
  { label: 'NOVEE OS Technical Codex',     badge: 'Published' },
  { label: '1.2 GB Asset Bundle',          badge: 'Locked'    },
]

export default function Home() {
  const [copied, setCopied] = useState(false)
  function copy() { setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* Status pill */}
      <motion.div variants={FADE} style={{ marginBottom: 48 }}>
        <div className="status-pill">
          <span className="status-dot" />
          System Production Online
        </div>
      </motion.div>

      {/* Title block */}
      <motion.div variants={FADE} style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1 style={{
          fontFamily: '"Hanken Grotesk", sans-serif',
          fontSize: 'clamp(40px, 5vw, 72px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          color: '#D4AF37',
          marginBottom: 20,
        }}>
          DEPLOYMENT SUCCESSFUL
        </h1>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 16,
          lineHeight: '26px',
          color: '#A09A8E',
          maxWidth: 560,
          margin: '0 auto',
        }}>
          The CraftHub 360 Ecosystem has been successfully compiled and pushed to the global
          production tier. All design tokens and technical architectures are now live.
        </p>
      </motion.div>

      {/* Bento grid */}
      <motion.div variants={FADE} style={{
        display: 'grid',
        gridTemplateColumns: '5fr 7fr',
        gap: 24,
        width: '100%',
        marginBottom: 24,
      }}>
        {/* Sync status */}
        <div className="glass-card-gold" style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="section-label">Synchronization Status</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 80, fontWeight: 700,
                color: '#E5E2E1', lineHeight: 1,
              }}>100</span>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 32, color: '#D4AF37', marginBottom: 6 }}>%</span>
            </div>
            <div className="progress-track" style={{ marginBottom: 12 }}>
              <div className="progress-fill" style={{ width: '100%' }} />
            </div>
            <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#7A7A7A', letterSpacing: '0.08em' }}>
              All global clusters are currently in sync.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '14px 18px', marginTop: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Cloud size={28} style={{ color: '#D4AF37', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600, fontSize: 15, color: '#E5E2E1' }}>
                Cloud Latency: 14ms
              </div>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#7A7A7A', letterSpacing: '0.06em' }}>
                Edge nodes responding globally
              </div>
            </div>
          </div>
        </div>

        {/* Deployment manifest */}
        <div className="glass-card" style={{ padding: 32 }}>
          <div className="section-label">Deployment Manifest</div>
          <div>
            {manifest.map(({ label, badge }) => (
              <div key={label} className="data-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <CheckCircle2 size={18} style={{ color: '#D4AF37', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#E5E2E1' }}>{label}</span>
                </div>
                <span style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#7A7A7A',
                }}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* GitHub link */}
      <motion.div variants={FADE} style={{ width: '100%', marginBottom: 40 }}>
        <div className="glass-card" style={{
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Terminal size={18} style={{ color: '#D4AF37', flexShrink: 0 }} />
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Live on GitHub:
          </span>
          <code style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 13,
            color: '#D4AF37', flex: 1,
            background: 'rgba(212,175,55,0.06)', padding: '4px 10px', borderRadius: 4,
          }}>
            github.com/crafthub-360/production-core
          </code>
          <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#D4AF37' : '#7A7A7A', transition: 'color 0.15s' }}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div variants={FADE}>
        <button className="btn-gold">
          <Terminal size={14} />
          Enter Production Terminal
        </button>
      </motion.div>
    </motion.div>
  )
}
