import SmokeCraftImageBoundsOverlay from './SmokeCraftImageBoundsOverlay.jsx'

const GOLD = '#E9C176'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const CREAM = '#e5e2e1'

/**
 * Holistic Fix 1 — SmokeCraft Shared Game Architecture: canonical
 * screen-shell CONTRACT.
 *
 * This is not yet applied to any existing screen (screen migration is
 * explicitly out of scope for this pass — see the migration queue in
 * SMOKECRAFT_MIGRATION_QUEUE.md). It is the enforceable target every
 * screen in that queue migrates to, so the same loading/empty/error
 * presentation, the same horizontal-tablet-safe layout math, and the same
 * keyboard/pointer/touch affordances are written ONCE instead of
 * independently re-implemented per screen (which is exactly how the
 * inconsistent responsive rules and scattered honest-error patterns
 * documented in the defect register happened).
 *
 * Two rendering modes, matching the two classifications this operation
 * actually found in real screens (see SMOKECRAFT_GAME_MANIFEST.json):
 *   - mode="image-shell": wraps SmokeCraftImageBoundsOverlay (the existing,
 *     already-proven pattern for an approved image + percentage-positioned
 *     live controls).
 *   - mode="live": a plain full-viewport React content shell with the same
 *     bottom-safe-area, scroll, and status-state contract, for screens that
 *     render real UI rather than an approved-image backdrop.
 *
 * `status` drives the one shared loading/empty/error/placeholder
 * presentation. Passing children only ever happens for status="ready" —
 * every other status renders this shell's own honest, non-fabricated
 * message, never a blank screen and never invented content.
 */
export default function SmokeCraftScreenShell({
  mode = 'live',
  status = 'ready',
  onRetry,
  emptyMessage = 'Nothing to show yet.',
  loadingMessage = 'Loading…',
  errorMessage = 'Something went wrong loading this screen.',
  offlineMessage = "You're offline — showing your last loaded state.",
  imageProps,
  children,
}) {
  if (mode === 'image-shell') {
    if (!imageProps) throw new Error('SmokeCraftScreenShell: mode="image-shell" requires imageProps (src/naturalW/naturalH/alt)')
    return (
      <SmokeCraftImageBoundsOverlay {...imageProps}>
        {status === 'ready' && children}
        {status !== 'ready' && (
          <ShellStatusPanel status={status} onRetry={onRetry} emptyMessage={emptyMessage} loadingMessage={loadingMessage} errorMessage={errorMessage} offlineMessage={offlineMessage} overlay />
        )}
      </SmokeCraftImageBoundsOverlay>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', background: '#0b0f18', fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {status === 'ready' ? children : (
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
          <ShellStatusPanel status={status} onRetry={onRetry} emptyMessage={emptyMessage} loadingMessage={loadingMessage} errorMessage={errorMessage} offlineMessage={offlineMessage} />
        </div>
      )}
    </div>
  )
}

function ShellStatusPanel({ status, onRetry, emptyMessage, loadingMessage, errorMessage, offlineMessage, overlay = false }) {
  const wrapStyle = overlay
    ? { position: 'absolute', left: '10%', top: '35%', width: '80%', textAlign: 'center', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,28px)' }
    : { background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }

  if (status === 'loading') {
    return (
      <div role="status" aria-live="polite" style={wrapStyle}>
        <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'sc-shell-spin 0.9s linear infinite' }} />
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>{loadingMessage}</p>
        <style>{'@keyframes sc-shell-spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div style={wrapStyle}>
        <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>{errorMessage}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', minHeight: 40 }}>
            Retry
          </button>
        )}
      </div>
    )
  }
  if (status === 'offline') {
    return (
      <div role="status" style={wrapStyle}>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.6)' }}>{offlineMessage}</p>
      </div>
    )
  }
  // status === 'empty'
  return (
    <div style={wrapStyle}>
      <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.55)' }}>{emptyMessage}</p>
    </div>
  )
}
