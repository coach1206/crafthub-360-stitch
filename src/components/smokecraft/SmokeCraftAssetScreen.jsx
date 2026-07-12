/**
 * SmokeCraftAssetScreen — responsive background screen wrapper.
 *
 * classification controls rendering:
 *   DECORATIVE_BACKGROUND      — cover always; no essential content in image
 *   LIVE_REACT_PAGE_ARTWORK    — cover always; all controls/text in React overlays
 *   PORTRAIT_PRODUCTION_SHELL  — contain; preserve portrait composition
 *   LANDSCAPE_HERO_TOP         — cover with center-top anchor; landscape image,
 *                                 content above fold is most important
 *
 * The caller is responsible for any fixed-position overlay children.
 * SmokeCraftAssetScreen itself is the viewport background layer only.
 */

const FIT_STYLES = {
  DECORATIVE_BACKGROUND:     { backgroundSize: 'cover', backgroundPosition: 'center top' },
  LIVE_REACT_PAGE_ARTWORK:   { backgroundSize: 'cover', backgroundPosition: 'center top' },
  PORTRAIT_PRODUCTION_SHELL: { backgroundSize: 'contain', backgroundPosition: 'center center' },
  LANDSCAPE_HERO_TOP:        { backgroundSize: 'cover', backgroundPosition: 'center top' },
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
      {children}
    </div>
  )
}
