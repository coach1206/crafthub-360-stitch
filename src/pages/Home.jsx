import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Cloud, Terminal, Copy, Check } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

function PingBadge({ label }) {
  return (
    <div className="status-badge mb-12">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
      </span>
      <span className="font-label text-xs tracking-widest uppercase text-primary">{label}</span>
    </div>
  )
}

export default function Home() {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      className="flex flex-col items-center"
      initial="hidden" animate="show"
      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
    >
      <motion.div variants={FADE}>
        <PingBadge label="System Production Online" />
      </motion.div>

      {/* Cinematic title */}
      <motion.div variants={FADE} className="text-center mb-16">
        <h1 className="text-display-tour gold-foil-text mb-4 leading-tight">
          DEPLOYMENT SUCCESSFUL
        </h1>
        <p className="text-body-intro text-on-surface-variant max-w-2xl mx-auto">
          The CraftHub 360 Ecosystem has been successfully compiled and pushed to the global
          production tier. All design tokens and technical architectures are now live.
        </p>
      </motion.div>

      {/* Bento grid — 12 cols */}
      <motion.div variants={FADE} className="grid grid-cols-12 gap-8 w-full">

        {/* Sync status — 5 cols */}
        <div className="col-span-12 md:col-span-5 stitch-card stitch-card-accent flex flex-col justify-between">
          <div>
            <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-6">
              Synchronization Status
            </h3>
            <div className="flex items-end gap-4 mb-2">
              <span className="font-display text-8xl font-bold text-on-surface leading-none">100</span>
              <span className="font-display text-4xl text-primary mb-2">%</span>
            </div>
            <div className="progress-track mb-2">
              <div className="progress-fill glow-pulse w-full" />
            </div>
            <p className="text-xs font-label text-on-surface-variant">All global clusters are currently in sync.</p>
          </div>

          <div className="mt-8">
            <div className="obsidian-glass flex items-center gap-4 p-4 rounded-2xl border border-outline-variant/30">
              <svg className="text-primary shrink-0" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 17l-3.5-3.5 1.41-1.41L10 14.17l6.09-6.09 1.41 1.41L10 17z"/>
              </svg>
              <div>
                <p className="font-semibold text-on-surface">Cloud Latency: 14ms</p>
                <p className="text-xs font-label text-on-surface-variant">Edge nodes responding globally</p>
              </div>
            </div>
          </div>
        </div>

        {/* Manifest — 7 cols */}
        <div className="col-span-12 md:col-span-7 stitch-card stitch-card-accent">
          <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-8">
            Deployment Manifest
          </h3>
          <ul className="space-y-2">
            {[
              { label: '130+ Orchestrated Screens',     badge: 'Verified'  },
              { label: 'Obsidian Glass Design Tokens',  badge: 'Synced'    },
              { label: 'NOVEE OS Technical Codex',      badge: 'Published' },
              { label: '1.2 GB Asset Bundle',           badge: 'Locked'    },
            ].map(({ label, badge }) => (
              <li key={label} className="manifest-row">
                <div className="flex items-center gap-4">
                  <CheckCircle2 size={20} className="text-primary shrink-0" fill="currentColor" fillOpacity={0.15} />
                  <span className="text-body-md text-on-surface">{label}</span>
                </div>
                <span className="font-label text-xs tracking-widest uppercase text-primary-container">{badge}</span>
              </li>
            ))}
          </ul>
        </div>

      </motion.div>

      {/* Live GitHub badge */}
      <motion.div variants={FADE} className="mt-16 text-center">
        <div className="obsidian-glass gold-shimmer inline-flex items-center gap-4 border border-primary/40 px-8 py-4 rounded-2xl">
          <Terminal size={20} className="text-primary" />
          <span className="font-label text-sm tracking-widest uppercase text-on-surface">LIVE ON GITHUB:</span>
          <code className="font-mono text-sm text-primary-fixed bg-surface-container-highest px-3 py-1 rounded tracking-wider">
            github.com/crafthub-360/production-core
          </code>
          <button onClick={handleCopy} className="text-on-surface-variant hover:text-primary transition-colors">
            {copied ? <Check size={20} className="text-primary" /> : <Copy size={20} />}
          </button>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div variants={FADE} className="mt-20">
        <button className="btn-primary gold-shimmer">
          ENTER PRODUCTION TERMINAL
        </button>
      </motion.div>
    </motion.div>
  )
}
