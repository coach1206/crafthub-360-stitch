import { useState } from 'react'

/**
 * Renders a full-viewport SmokeCraft screen image.
 *
 * The image is contained within the viewport (objectFit: contain, centered).
 * Children are rendered in a position:absolute overlay that is EXACTLY sized
 * to the rendered image — not the viewport. This ensures that any overlaid
 * hotspot/button percentage coordinates are relative to the image content,
 * not the viewport, fixing the "misplaced pill" bug on non-matching aspect
 * ratios (e.g. portrait image on landscape desktop).
 */
export default function SmokeCraftAssetScreen({ src, alt = 'SmokeCraft screen', children }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <main
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050505',
      }}
    >
      {/*
        Wrapper div sizes itself to the intrinsic rendered image dimensions.
        With width/height: auto and max constraints, the <img> takes the largest
        size that fits inside the viewport while maintaining aspect ratio.
        The wrapper (display: inline-block) matches this size exactly, giving
        child overlays a coordinate system that is IMAGE-relative, not viewport-relative.
      */}
      <div style={{ position: 'relative', lineHeight: 0, display: 'inline-block' }}>
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          draggable={false}
          style={{
            display: 'block',
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: 'auto',
            height: 'auto',
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
      </div>
    </main>
  )
}
