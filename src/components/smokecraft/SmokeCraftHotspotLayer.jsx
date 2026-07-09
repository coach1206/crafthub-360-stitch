import { useNavigate } from 'react-router-dom'

/**
 * Renders percentage-based tap/click targets over a full-viewport asset screen.
 *
 * Each hotspot in `hotspots` accepts:
 *   x, y, width, height  — percentage of viewport (0–100)
 *   label                — aria-label and CTA pill text
 *   onClick              — optional callback (called first if provided)
 *   to                   — optional react-router navigate target
 *   disabled             — skip rendering this hotspot
 *
 * Each hotspot renders a visible CTA pill (dark+gold, pulse animation) so
 * guests on touchscreen devices see a clear, pressable call-to-action.
 *
 * Debug mode: set sessionStorage key `smokecraft_hotspot_debug=1` to show
 * full translucent hotspot area outlines in addition to the CTA pills.
 */

// Injected once; drives the pulse glow and press-flash animations.
const STYLE_ID = 'sc-hotspot-anim'
function ensureAnimStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes sc-pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(233,193,118,0.0), 0 0 8px 0 rgba(233,193,118,0.15); }
      50%      { box-shadow: 0 0 0 4px rgba(233,193,118,0.18), 0 0 18px 2px rgba(233,193,118,0.28); }
    }
    @keyframes sc-tap-flash {
      0%   { background: rgba(233,193,118,0.22); }
      100% { background: rgba(0,0,0,0.65); }
    }
    .sc-cta-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 22px;
      background: rgba(0,0,0,0.65);
      border: 1px solid rgba(233,193,118,0.65);
      border-radius: 40px;
      color: rgba(233,193,118,0.92);
      font-family: "JetBrains Mono", "Courier New", monospace;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      min-width: 160px;
      max-width: 260px;
      min-height: 44px;
      animation: sc-pulse 2.4s ease-in-out infinite;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }
    .sc-hotspot-btn:hover .sc-cta-pill,
    .sc-hotspot-btn:focus-visible .sc-cta-pill {
      background: rgba(233,193,118,0.12);
      border-color: rgba(233,193,118,0.9);
      color: rgba(233,193,118,1);
      animation: none;
      box-shadow: 0 0 0 4px rgba(233,193,118,0.2), 0 0 20px 4px rgba(233,193,118,0.25);
    }
    .sc-hotspot-btn:active .sc-cta-pill {
      background: rgba(233,193,118,0.22);
      border-color: #e9c176;
      color: #e9c176;
      animation: sc-tap-flash 0.18s ease forwards;
      box-shadow: 0 0 0 6px rgba(233,193,118,0.25);
      transform: scale(0.97);
      transition: transform 0.08s ease;
    }
    .sc-hotspot-btn:focus-visible {
      outline: 2px solid rgba(233,193,118,0.6);
      outline-offset: 3px;
    }
  `
  document.head.appendChild(el)
}

// Derive a short, guest-facing label from the internal route label.
function shortLabel(label = '') {
  if (!label) return 'Continue'
  const lower = label.toLowerCase()
  if (lower.includes('accept')) return 'Accept the Challenge'
  if (lower.includes('complete') && lower.includes('session')) return 'Complete Journey'
  if (lower.includes('stamp')) return 'Claim Passport Stamp'
  if (lower.includes('scorecard')) return 'View Scorecard'
  if (lower.includes('purchase') || lower.includes('order')) return 'Request Purchase'
  if (lower.includes('handoff') || lower.includes('staff')) return 'Complete ↗'
  if (lower.includes('pairing')) return 'Enter Pairing Lab'
  if (lower.includes('humidor')) return 'Match Humidor'
  if (lower.includes('mentor')) return 'Meet Your Mentor'
  if (lower.includes('identity')) return 'Begin Journey'
  if (lower.includes('passport')) return 'Stamp Passport'
  if (lower.includes('management') || lower.includes('sync')) return 'Sync to E.A.T.'
  if (lower.includes('first third')) return 'First Third ↓'
  if (lower.includes('second third')) return 'Second Third ↓'
  if (lower.includes('final third')) return 'Final Third ↓'
  if (lower.includes('flavor')) return 'Flavor Memory'
  if (lower.includes('review')) return 'Final Review'
  if (lower.includes('connection')) return 'View Connections'
  if (lower.includes('seed') || lower.includes('soil')) return 'Seed & Soil'
  if (lower.includes('cut') || lower.includes('toast')) return 'Cut · Toast · Light'
  if (lower.includes('golden') || lower.includes('box')) return 'Open the Box'
  return 'Continue →'
}

export default function SmokeCraftHotspotLayer({ hotspots = [], route = '' }) {
  const navigate = useNavigate()

  if (typeof window !== 'undefined') ensureAnimStyles()

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

        const pill = shortLabel(h.label)

        return (
          <button
            key={i}
            className="sc-hotspot-btn"
            aria-label={h.label}
            onClick={handleAction}
            style={{
              position: 'absolute',
              left: h.x + '%',
              top: h.y + '%',
              width: h.width + '%',
              height: h.height + '%',
              background: debug ? 'rgba(233,193,118,0.10)' : 'transparent',
              border: debug ? '1px dashed rgba(233,193,118,0.45)' : 'none',
              outline: 'none',
              cursor: 'pointer',
              pointerEvents: 'auto',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              padding: 0,
              margin: 0,
              borderRadius: 0,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '12%',
              userSelect: 'none',
            }}
          >
            <span className="sc-cta-pill">
              {pill}
            </span>
            {debug && (
              <span style={{
                position: 'absolute',
                top: 4,
                left: 6,
                fontSize: 8,
                color: 'rgba(233,193,118,0.5)',
                fontFamily: 'monospace',
                pointerEvents: 'none',
              }}>
                {h.x},{h.y} {h.width}×{h.height}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
