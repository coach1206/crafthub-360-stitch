import { useState } from 'react'

/**
 * SmokeCraftAssetScreen
 *
 * Full-viewport image layer for SmokeCraft screens.
 * The image fills the area ABOVE the 64px bottom navigation bar so the nav
 * never covers image content. objectFit:cover fills without letterbox bars.
 * Children are rendered in an absolute overlay covering the same area, so
 * hotspot/overlay percentages are relative to the visible image area only.
 *
 * Props:
 *   src            — image path
 *   alt            — accessible label
 *   objectPosition — CSS object-position value (default: 'center center')
 *                    Use 'center bottom' on screens whose CTAs are at image bottom
 *   children       — interactive overlays (hotspot layers, UI panels, etc.)
 */
export default function SmokeCraftAssetScreen({ src, alt = 'SmokeCraft screen', objectPosition = 'center center', children }) {
  const [failed, setFailed] = useState(false)

  // 64px = SmokeCraftBottomNav height. Image stops at the top of the nav bar.
  const NAV_HEIGHT = 64

  if (failed) {
    return (
      <main
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: NAV_HEIGHT,
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
        top: 0,
        left: 0,
        right: 0,
        bottom: NAV_HEIGHT,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#050505',
      }}
    >
      {/* Cover image — fills the area above the bottom nav bar */}
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
          objectPosition,
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
      {/* Interactive overlay — same bounds as image; children use position:absolute + % coords */}
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
