import { useState } from 'react'

export default function SmokeCraftVisualPanel({ src, alt, eyebrow, title, caption }) {
  const [broken, setBroken] = useState(false)

  return (
    <div style={{
      width: '100%',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid rgba(201,168,76,0.28)',
      boxShadow: '0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      marginBottom: 28,
      background: '#0a0704',
    }}>
      {(eyebrow || title) && (
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(201,168,76,0.15)',
          background: 'rgba(10,7,4,0.9)',
        }}>
          {eyebrow && (
            <div style={{
              color: '#c9a84c',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: title ? 2 : 0,
            }}>
              {eyebrow}
            </div>
          )}
          {title && (
            <div style={{ color: '#f0e8d0', fontSize: 15, fontWeight: 600 }}>
              {title}
            </div>
          )}
        </div>
      )}

      <div style={{ position: 'relative', minHeight: 260, background: '#050402' }}>
        {broken ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 260,
            padding: 24,
            color: '#c0392b',
            background: '#0d0303',
            gap: 8,
          }}>
            <span style={{ fontSize: 28 }}>⚠</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Image failed to load</span>
            <span style={{
              fontSize: 11,
              fontFamily: 'monospace',
              color: '#7a3030',
              wordBreak: 'break-all',
              textAlign: 'center',
              maxWidth: 480,
            }}>
              {src}
            </span>
          </div>
        ) : (
          <img
            src={src}
            alt={alt || title || ''}
            onError={() => setBroken(true)}
            style={{
              display: 'block',
              width: '100%',
              minHeight: 260,
              maxHeight: 520,
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
        )}
      </div>

      {caption && (
        <div style={{
          padding: '8px 20px',
          borderTop: '1px solid rgba(201,168,76,0.1)',
          background: 'rgba(10,7,4,0.9)',
          color: '#6a5830',
          fontSize: 11,
          fontFamily: 'monospace',
        }}>
          {caption}
        </div>
      )}
    </div>
  )
}
