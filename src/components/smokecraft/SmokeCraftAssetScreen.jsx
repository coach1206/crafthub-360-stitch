import { useState } from 'react'

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
        inline-block wrapper sizes itself to the rendered image dimensions.
        Children rendered inside get percentage coordinates relative to the
        image, not the full viewport — fixing hotspot drift on non-matching
        aspect ratios (portrait image on landscape desktop).
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
