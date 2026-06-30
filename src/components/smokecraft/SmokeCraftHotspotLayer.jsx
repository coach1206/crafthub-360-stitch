import { useNavigate } from 'react-router-dom'

/**
 * Renders invisible percentage-based tap/click targets over a full-viewport asset screen.
 *
 * Each hotspot in `hotspots` accepts:
 *   x, y, width, height  — percentage of viewport (0–100)
 *   label                — aria-label for accessibility
 *   onClick              — optional callback (called first if provided)
 *   to                   — optional react-router navigate target
 *   disabled             — skip rendering this hotspot
 *
 * Debug mode: set sessionStorage key `smokecraft_hotspot_debug=1` to show
 * translucent outlines. Off by default. Never visible in production without
 * that flag.
 */
export default function SmokeCraftHotspotLayer({ hotspots = [], route = '' }) {
  const navigate = useNavigate()
  const debug =
    typeof window !== 'undefined' &&
    sessionStorage.getItem('smokecraft_hotspot_debug') === '1'

  if (debug) {
    hotspots.forEach(h => {
      if (h.disabled) return
      // eslint-disable-next-line no-console
      console.log('[SmokeCraft Hotspot]', {
        route: route || window.location.pathname,
        label: h.label,
        x: h.x + '%',
        y: h.y + '%',
        width: h.width + '%',
        height: h.height + '%',
        target: h.to || '(callback only)',
      })
    })
  }

  return (
    <div
      aria-hidden={hotspots.every(h => h.disabled)}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {hotspots.map((h, i) => {
        if (h.disabled) return null

        function handleAction() {
          if (h.onClick) h.onClick()
          if (h.to) navigate(h.to)
        }

        return (
          <button
            key={i}
            aria-label={h.label}
            onClick={handleAction}
            style={{
              position: 'absolute',
              left: h.x + '%',
              top: h.y + '%',
              width: h.width + '%',
              height: h.height + '%',
              background: debug ? 'rgba(233,193,118,0.18)' : 'transparent',
              border: debug ? '1px solid rgba(233,193,118,0.5)' : 'none',
              outline: 'none',
              cursor: 'pointer',
              pointerEvents: 'auto',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              padding: 0,
              margin: 0,
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: debug ? 'rgba(233,193,118,0.7)' : 'transparent',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              letterSpacing: '0.1em',
              userSelect: 'none',
            }}
          >
            {debug ? h.label : null}
          </button>
        )
      })}
    </div>
  )
}
