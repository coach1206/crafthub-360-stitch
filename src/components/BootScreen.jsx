import '../styles/bootScreens.css'

// Staggered data-line positions — horizontal scan lines across the screen
const DATA_LINES = [
  { top: '10%', duration: '5.4s', delay: '0.0s'  },
  { top: '24%', duration: '4.1s', delay: '0.9s'  },
  { top: '38%', duration: '6.8s', delay: '1.7s'  },
  { top: '52%', duration: '3.9s', delay: '0.4s'  },
  { top: '66%', duration: '5.2s', delay: '2.3s'  },
  { top: '80%', duration: '4.6s', delay: '1.1s'  },
  { top: '91%', duration: '7.0s', delay: '0.6s'  },
]

/**
 * BootScreen — cinematic full-screen stage card used during the boot intro.
 *
 * Props
 *   fullBleedImage  – when true, render backgroundImage edge-to-edge with no
 *                     overlaid logo/title/status panels; only subtle scan lines
 *                     remain. Use when the image itself IS the designed screen.
 *   brandName       – display name shown as the large gold title
 *   brandSubtitle   – small blue tracking text below the divider
 *   logo            – src path for the brand logo image
 *   logoHeight      – pixel height for the logo (default 180)
 *   backgroundImage – URL string for bg image; gradient fallback if absent
 *   bootMessage     – label text above the progress bar
 *   progress        – 0-100 value for progress bar width
 *   statusItems     – [{ label, value }] — shown in left/right side panels
 *   connectionItems – [{ label, value }] — shown as centered connection list
 *   itemsRevealed   – how many items (status or connection) are visible
 */
export default function BootScreen({
  fullBleedImage  = false,
  brandName       = '',
  brandSubtitle   = '',
  logo,
  logoHeight      = 180,
  backgroundImage,
  bootMessage,
  progress        = 100,
  statusItems     = [],
  connectionItems = [],
  itemsRevealed   = 999,
}) {
  // ── Full-bleed mode: image IS the designed screen, minimal overlays only ──
  if (fullBleedImage && backgroundImage) {
    return (
      <div className="boot-screen" style={{ background: '#010b1e' }}>
        {/* Hero image — full opacity, no blur, no heavy overlay */}
        <img
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position:   'absolute', inset: 0,
            width:      '100%', height: '100%',
            objectFit:  'cover', objectPosition: 'center',
            userSelect: 'none',
          }}
        />
        {/* Very light edge vignette only — preserves image design */}
        <div style={{
          position:   'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(1,11,30,0.18) 0%, transparent 15%, transparent 80%, rgba(1,11,30,0.45) 100%), linear-gradient(to right, rgba(1,11,30,0.20) 0%, transparent 12%, transparent 88%, rgba(1,11,30,0.20) 100%)',
          pointerEvents: 'none',
        }} />
        {/* Subtle scan lines */}
        <div className="boot-screen__data-lines" aria-hidden="true">
          {DATA_LINES.map(({ top, duration, delay }, i) => (
            <div key={i} className="boot-screen__data-line" style={{ top, animationDuration: duration, animationDelay: delay, opacity: 0.4 }} />
          ))}
        </div>
      </div>
    )
  }
  // Split statusItems evenly between left and right side panels
  const half       = Math.ceil(statusItems.length / 2)
  const leftItems  = statusItems.slice(0, half)
  const rightItems = statusItems.slice(half)

  // Background — image with gradient fallback (CSS stacked backgrounds)
  const bgStyle = backgroundImage
    ? {
        backgroundImage: [
          `url(${backgroundImage})`,
          'linear-gradient(180deg, #010b1e 0%, #020f2c 50%, #010b1e 100%)',
        ].join(', '),
      }
    : {
        backgroundImage: 'linear-gradient(160deg, #010b1e 0%, #041840 40%, #020e2a 65%, #010b1e 100%)',
      }

  return (
    <div className="boot-screen">

      {/* Background layer */}
      <div className="boot-screen__background" style={bgStyle} />

      {/* Edge vignette + depth */}
      <div className="boot-screen__overlay" />

      {/* Data grid texture */}
      <div className="boot-screen__grid" aria-hidden="true" />

      {/* Blue center glow */}
      <div className="boot-screen__center-glow" aria-hidden="true" />

      {/* Moving horizontal data lines */}
      <div className="boot-screen__data-lines" aria-hidden="true">
        {DATA_LINES.map(({ top, duration, delay }, i) => (
          <div
            key={i}
            className="boot-screen__data-line"
            style={{ top, animationDuration: duration, animationDelay: delay }}
          />
        ))}
      </div>

      {/* Concentric glow rings behind logo */}
      <div className="boot-screen__rings" aria-hidden="true">
        {[
          { size: 270, color: 'rgba(201,168,76,0.22)', delay: '0.0s', dur: '3.6s' },
          { size: 370, color: 'rgba(56,189,248,0.12)', delay: '0.9s', dur: '4.4s' },
          { size: 470, color: 'rgba(56,189,248,0.07)', delay: '1.8s', dur: '5.2s' },
        ].map(({ size, color, delay, dur }) => (
          <div
            key={size}
            className="boot-screen__ring"
            style={{
              width:             size,
              height:            size,
              border:            `1px solid ${color}`,
              animationDelay:    delay,
              animationDuration: dur,
            }}
          />
        ))}
      </div>

      {/* Left side status panel */}
      {leftItems.length > 0 && (
        <div className="boot-screen__side-panel boot-screen__side-panel--left">
          {leftItems.map(({ label, value }, i) => (
            <div
              key={label}
              className="boot-screen__status-panel"
              style={{
                opacity:   itemsRevealed > i ? 1 : 0,
                transform: itemsRevealed > i ? 'translateX(0)' : 'translateX(-16px)',
              }}
            >
              <span className="boot-screen__status-label">{label}</span>
              <span className="boot-screen__status-value">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Right side status panel */}
      {rightItems.length > 0 && (
        <div className="boot-screen__side-panel boot-screen__side-panel--right">
          {rightItems.map(({ label, value }, i) => (
            <div
              key={label}
              className="boot-screen__status-panel"
              style={{
                opacity:   itemsRevealed > half + i ? 1 : 0,
                transform: itemsRevealed > half + i ? 'translateX(0)' : 'translateX(16px)',
              }}
            >
              <span className="boot-screen__status-label">{label}</span>
              <span className="boot-screen__status-value">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Center content column */}
      <div className="boot-screen__content">

        {/* Brand logo */}
        {logo && (
          <div className="boot-screen__logo">
            <img
              src={logo}
              alt={brandName}
              draggable={false}
              style={{
                height:    logoHeight,
                width:     'auto',
                maxWidth:  460,
                objectFit: 'contain',
                userSelect: 'none',
              }}
            />
          </div>
        )}

        {/* Brand name + divider + subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
          <h1 className="boot-screen__title">{brandName}</h1>
          <div className="boot-screen__divider" />
          <p className="boot-screen__subtitle">{brandSubtitle}</p>
        </div>

        {/* Connection items (centered list panel) */}
        {connectionItems.length > 0 && (
          <div className="boot-screen__connection-list">
            {connectionItems.map(({ label, value }, i) => (
              <div
                key={label}
                className="boot-screen__connection-item"
                style={{
                  opacity:   itemsRevealed > i ? 1 : 0,
                  transform: itemsRevealed > i ? 'translateX(0)' : 'translateX(-12px)',
                }}
              >
                <div className="boot-screen__connection-dot" />
                <span className="boot-screen__connection-name">{label}</span>
                <span className="boot-screen__connection-status">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Boot message + progress bar */}
        {bootMessage && (
          <div className="boot-screen__progress-wrap">
            <p className="boot-screen__boot-message">{bootMessage}</p>
            <div className="boot-screen__progress">
              <div
                className="boot-screen__progress-fill"
                style={{ '--bs-progress': `${progress}%` }}
              />
            </div>
            {/* Pulse dots below progress */}
            <div className="boot-screen__pulse-dots" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="boot-screen__pulse-dot"
                  style={{ animationDelay: `${i * 0.22}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
