import { useState } from 'react'
import { resolveSmokeCraftAsset } from '../../services/smokecraft/assetResolver.js'

const BORDER = 'rgba(233,193,118,0.22)'
const GOLD_DIM = 'rgba(233,193,118,0.55)'

/**
 * SC-D090 — a shared, real, governed decorative header banner for
 * supporting-module screens that were rebuilt as real live DOM but had no
 * dedicated hero photography of their own (Mini Tasting Round, Management
 * Sync, Final Review). Reuses the SAME approved `humidorMatchHero`
 * photograph already governed and displayed elsewhere on Humidor Match —
 * no new asset, no substitute art, same resolveSmokeCraftAsset governance
 * (R2 first, approved repository fallback second, safe branded failure
 * third) and the same "decorative only, never a surface controls sit on"
 * contract as HumidorMatch.jsx's own hero.
 */
export default function SmokeCraftSupportingHero({ label, assetKey = 'humidorMatchHero' }) {
  const [errored, setErrored] = useState(false)
  const resolved = resolveSmokeCraftAsset(assetKey)
  const src = resolved.ok ? resolved.url : null
  if (!src || errored) {
    return (
      <div
        role="img"
        aria-label={label}
        style={{
          width: '100%', aspectRatio: '16 / 5', borderRadius: 14, marginBottom: 4,
          background: 'linear-gradient(135deg, rgba(233,193,118,0.10), rgba(11,15,24,0.9))',
          border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 12, color: GOLD_DIM }} aria-hidden="true">Image unavailable</span>
      </div>
    )
  }
  return (
    <div
      role="img"
      aria-label={label}
      style={{
        width: '100%', aspectRatio: '16 / 5', borderRadius: 14, marginBottom: 4,
        overflow: 'hidden', position: 'relative', border: `1px solid ${BORDER}`,
        boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
      }}
    >
      <img
        src={src} alt="" aria-hidden="true" loading="lazy" onError={() => setErrored(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%', display: 'block' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,8,12,0.1) 0%, rgba(6,8,12,0.7) 100%)' }} />
    </div>
  )
}
