/**
 * SmokeCraftAppShell — Unified responsive application shell for all SmokeCraft screens.
 *
 * Layout:
 *   [full-viewport bg image: cover]
 *   ├── [optional header strip — top, z 200]
 *   ├── [content area — flex 1, scrollable, safe-area aware]
 *   └── [action row — bottom, z 300, safe-area aware]
 *
 * Usage:
 *   <SmokeCraftAppShell bgSrc="/path.png" header={<Header />} actions={<NavBar />}>
 *     <ContentPanel>…</ContentPanel>
 *   </SmokeCraftAppShell>
 */
export default function SmokeCraftAppShell({
  bgSrc,
  bgPosition = 'center top',
  alt = 'SmokeCraft screen',
  header,
  children,
  actions,
}) {
  return (
    <div
      aria-label={alt}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100dvw',
        height: '100dvh',
        backgroundImage: bgSrc ? `url(${bgSrc})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: bgPosition,
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#050505',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Optional header */}
      {header && (
        <div style={{ flexShrink: 0, zIndex: 200, position: 'relative' }}>
          {header}
        </div>
      )}

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 100,
        }}
      >
        {children}
      </div>

      {/* Action row */}
      {actions && (
        <div style={{ flexShrink: 0, zIndex: 300, position: 'relative' }}>
          {actions}
        </div>
      )}
    </div>
  )
}
