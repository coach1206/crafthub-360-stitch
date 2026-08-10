const GOLD = '#E9C176'
const GOLD_DIM = 'rgba(233,193,118,0.55)'
const CREAM = '#e5e2e1'

/**
 * Shared decorative header band for the Entry Layer screens (Launch, Enroll,
 * Resume). Purely presentational — no route logic, no persisted/fabricated
 * data. `image` should already be a clean crop (no baked text/UI bleeding
 * into frame); `imagePosition` is a CSS background-position string.
 */
export default function SmokeCraftEntryHeaderBand({
  eyebrow,
  title,
  subtitle,
  image,
  imagePosition = 'center',
  imageSize = 'cover',
  overlayStrength = 0.82,
  status,
  children,
}) {
  return (
    <header
      role="img"
      aria-label={title}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 'clamp(96px,14vh,140px)',
        backgroundImage: image
          ? `linear-gradient(180deg, rgba(6,8,16,${Math.max(0, overlayStrength - 0.15)}), rgba(6,8,16,${overlayStrength})), url(${image})`
          : `linear-gradient(180deg, rgba(6,8,16,0.9), rgba(6,8,16,0.96))`,
        backgroundSize: imageSize,
        backgroundPosition: imagePosition,
        backgroundRepeat: 'no-repeat',
        boxSizing: 'border-box',
        padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px)',
        zIndex: 3,
        flexShrink: 0,
      }}
    >
      {eyebrow && (
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6 }}>
          {eyebrow}
        </div>
      )}
      {title && (
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700, color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15, fontFamily: 'Georgia, serif' }}>
          {title}
        </h1>
      )}
      {subtitle && (
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(229,226,225,0.72)', lineHeight: 1.5, maxWidth: 520, fontFamily: 'Georgia, serif' }}>
          {subtitle}
        </p>
      )}
      {status}
      {children}
    </header>
  )
}
