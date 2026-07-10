import { useState } from 'react'

/**
 * SmokeCraftAssetScreen
 *
 * Full-viewport image layer for SmokeCraft screens.
 * Image fills the entire viewport via object-fit: cover — no black bars.
 * Children are rendered in an absolute overlay that covers the full viewport,
 * so hotspot/overlay percentages are relative to the viewport (0–100%).
 *
 * Props:
 *   src      — image path
 *   alt      — accessible label
 *   children — interactive overlays (hotspot layers, UI panels, etc.)
 */
export default function SmokeCraftAssetScreen({ src, alt = 'SmokeCraft screen', children }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <main
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050505',
          color: '#f5d28a',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            border: '1px solid rgba(212,175,55,0.6)',
            borderRadius: 20,
            padding: 28,
            background: 'rgba(20,13,6,0.92)',
          }}
        >
          Image failed to load:<br />{src}
        </div>
      </main>
    )
  }

  return (
    <main
      aria-label={alt}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#050505',
      }}
    >
      {/* Full-viewport cover image — no letter-box bars on any orientation */}
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          display: 'block',
          margin: 0,
          padding: 0,
          border: 0,
          borderRadius: 0,
          boxShadow: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'manipulation',
        }}
      />
      {/* Interactive overlay — full-viewport; children use position:absolute + % coords */}
      {children && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {children}
        </div>
      )}
    </main>
  )
}
