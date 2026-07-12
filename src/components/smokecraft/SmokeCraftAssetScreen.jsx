/**
 * SmokeCraftAssetScreen — Full-viewport background image shell.
 *
 * Uses CSS background-size: cover so the image always fills the entire viewport
 * with no black margins, regardless of image aspect ratio or device orientation.
 *
 * Children render as flex-column content on top of the image.
 * The image is purely atmospheric — all interactive controls are in children.
 */
export default function SmokeCraftAssetScreen({ src, alt = 'SmokeCraft screen', children }) {
  return (
    <div
      aria-label={alt}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100dvw',
        height: '100dvh',
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#050505',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
