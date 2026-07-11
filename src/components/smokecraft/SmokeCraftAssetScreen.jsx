import { useState, useEffect } from 'react'
import { injectScResponsiveVars } from '../../utils/scResponsive.js'

/**
 * SmokeCraftAssetScreen
 *
 * Full-viewport image layer for SmokeCraft screens.
 * The image fills the area ABOVE the bottom navigation bar (height from
 * --sc-bottom-nav-h CSS variable, injected by injectScResponsiveVars).
 *
 * objectFit:contain preserves the full image without cropping, with a small
 * safe-pad inset. When used via SmokeCraftAssetRoute, a ResizeObserver tracks
 * the actual rendered image bounds so hotspot overlays align correctly.
 *
 * Props:
 *   src            — image path
 *   alt            — accessible label
 *   objectPosition — CSS object-position value (default: 'center center')
 *   imageRef       — optional ref forwarded to the <img> element
 *   containerRef   — optional ref forwarded to the <main> element
 *   children       — interactive overlays (hotspot layers, UI panels, etc.)
 */
export default function SmokeCraftAssetScreen({
  src,
  alt = 'SmokeCraft screen',
  objectPosition = 'center center',
  imageRef,
  containerRef,
  children,
}) {
  const [failed, setFailed] = useState(false)

  useEffect(() => { injectScResponsiveVars() }, [])

  const failedUI = (
    <main
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        bottom: 'var(--sc-bottom-nav-h, 64px)',
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

  if (failed) return failedUI

  return (
    <main
      ref={containerRef}
      aria-label={alt}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 'var(--sc-bottom-nav-h, 64px)',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#050505',
      }}
    >
      {/* Contain image — preserves full image, safe-pad inset prevents edge clipping */}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        draggable={false}
        style={{
          position: 'absolute',
          inset: 'var(--sc-safe-pad, 8px)',
          width: 'calc(100% - 2 * var(--sc-safe-pad, 8px))',
          height: 'calc(100% - 2 * var(--sc-safe-pad, 8px))',
          objectFit: 'contain',
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
      {/* Interactive overlay — children use position:absolute + % coords */}
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
