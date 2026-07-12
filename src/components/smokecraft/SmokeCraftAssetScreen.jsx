/**
 * SmokeCraftAssetScreen — responsive background screen wrapper.
 *
 * All SmokeCraft background images are high-fidelity design mockups containing
 * printed UI chrome (buttons, nav bars, form fields, labels). The dark overlay
 * (rgba 0.72) suppresses printed elements so they do not compete with live React
 * controls, while letting atmospheric image elements (smoke, leather, amber glow,
 * cigar texture) show through.
 *
 * classification controls background rendering:
 *   DECORATIVE_BACKGROUND      — cover; no essential content in image
 *   LIVE_REACT_PAGE_ARTWORK    — cover; all controls/text in React overlays
 *   PORTRAIT_PRODUCTION_SHELL  — contain; preserve portrait composition
 *   LANDSCAPE_HERO_TOP         — cover with center-top anchor
 */

const FIT_STYLES = {
  DECORATIVE_BACKGROUND:     { backgroundSize: 'cover',   backgroundPosition: 'center top' },
  LIVE_REACT_PAGE_ARTWORK:   { backgroundSize: 'cover',   backgroundPosition: 'center top' },
  PORTRAIT_PRODUCTION_SHELL: { backgroundSize: 'contain', backgroundPosition: 'center center' },
  LANDSCAPE_HERO_TOP:        { backgroundSize: 'cover',   backgroundPosition: 'center top' },
}

export default function SmokeCraftAssetScreen({
  src,
  alt = 'SmokeCraft screen',
  classification = 'LIVE_REACT_PAGE_ARTWORK',
  children,
}) {
  const fitStyle = FIT_STYLES[classification] ?? FIT_STYLES.LIVE_REACT_PAGE_ARTWORK

  return (
    <div
      aria-label={alt}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100dvw',
        height: '100dvh',
        backgroundImage: src ? `url(${src})` : undefined,
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#050505',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...fitStyle,
      }}
    >
      {/* Suppress printed UI chrome in design-mockup images.
          pointerEvents:none passes all touch/click to React overlays above. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5,5,5,0.82)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Children rendered above the overlay */}
      {children != null && (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
