// Production Build Identity pass — a small, non-intrusive frontend build
// marker present on every page, plus a query-controlled expanded diagnostic
// panel (?diagnostics=1) and a non-destructive version-mismatch banner.
// Never covers approved SmokeCraft visuals — fixed bottom-right, small,
// low-opacity until hovered/expanded.
import { useEffect, useState } from 'react'
import { BUILD_INFO } from '../../generated/buildInfo.js'

const GOLD = '#E9C176'

// Single Build & Live Runtime pass — the mismatch banner alone was passive:
// it told the user a newer build existed but left the stale bundle running
// until they clicked. The reported live symptom (one domain serving two
// different build IDs across routes) is exactly the case where a stale tab
// must heal itself. This performs ONE automatic recovery attempt per
// detected backend build, then never again.
//
// Loop prevention is essential: if the reload does not resolve the mismatch
// (e.g. the server itself is serving inconsistent builds, which no client
// fix can repair), a naive reload-on-mismatch would spin forever. The
// sessionStorage marker is keyed to the backend commit we are reloading
// FOR, so a genuine later deploy can still trigger one fresh attempt, but
// the same unresolved mismatch never reloads twice. The banner remains as
// the manual fallback when the automatic attempt has already been spent.
const RECOVERY_KEY = 'sc_build_recovery_attempt'

function attemptOneShotRecovery(backendCommit) {
  let alreadyTried = false
  try { alreadyTried = sessionStorage.getItem(RECOVERY_KEY) === backendCommit } catch { alreadyTried = true }
  if (alreadyTried) return

  try { sessionStorage.setItem(RECOVERY_KEY, backendCommit) } catch { return }

  const cleanup = []

  // Unregister any stale service worker that could be pinning old chunks.
  if ('serviceWorker' in navigator) {
    cleanup.push(
      navigator.serviceWorker.getRegistrations()
        .then(regs => Promise.all(regs.map(r => r.unregister())))
        .catch(() => {})
    )
  }

  // Delete only caches this application owns — never all browser storage.
  // localStorage/IndexedDB (novee_guest_session, sc_journey_v1, Passport
  // identity, archived journeys) are deliberately untouched, so recovery
  // can never cost the user their journey.
  if (typeof caches !== 'undefined' && caches?.keys) {
    cleanup.push(
      caches.keys()
        .then(keys => Promise.all(
          keys
            .filter(k => ['novee-os', 'smokecraft', 'workbox', 'crafthub'].some(p => k.toLowerCase().startsWith(p)))
            .map(k => caches.delete(k))
        ))
        .catch(() => {})
    )
  }

  Promise.all(cleanup).finally(() => {
    window.location.reload()
  })
}

export default function BuildDiagnosticFooter() {
  const [expanded, setExpanded] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('diagnostics') === '1' } catch { return false }
  })
  const [apiVersion, setApiVersion] = useState(null)
  const [mismatch, setMismatch] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/version', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data) return
        setApiVersion(data)
        // Single monorepo build — a genuine mismatch here means this
        // browser tab loaded an older frontend bundle than what the
        // server is now serving (a new deploy happened after this tab's
        // last load), not a frontend/backend split-deploy scenario.
        if (data.backendCommit && BUILD_INFO.commit !== 'local' && data.backendCommit !== BUILD_INFO.commit) {
          setMismatch(true)
          attemptOneShotRecovery(data.backendCommit)
        }
      })
      .catch(() => { /* diagnostics must never break the real user journey */ })
      .finally(() => { if (!cancelled) setChecked(true) })
    return () => { cancelled = true }
  }, [])

  function hardRefresh() {
    // Clear only obsolete caches this app owns (any stray service-worker
    // registration — src/main.jsx already proactively unregisters these on
    // every load, this is a manual retry path for the mismatch banner) —
    // never touches novee_guest_session / sc_journey_v1 (active journey
    // data), Passport identity, or archived journey history.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
    }
    window.location.reload()
  }

  return (
    <>
      {mismatch && (
        // SC-D027 fix: this banner is a full-viewport-width `position:fixed`
        // strip at top:0 with the highest z-index in the app. It previously
        // had no `pointerEvents` override, so its entire bounding box —
        // including the empty flex-gutter space around the centered text —
        // intercepted clicks on any control that happened to render near
        // the top of the viewport on ANY screen, not just this banner's own
        // text/button. The fix: the outer wrapper is pointer-transparent
        // (`pointerEvents: 'none'`), so nothing underneath it is ever
        // blocked; only the actually-interactive Refresh button opts back
        // in (`pointerEvents: 'auto'`), so it stays fully clickable/
        // focusable. role="alert" (announced to screen readers on mount)
        // and the visible text/styling are unchanged — no visual redesign.
        <div
          role="alert"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
            background: '#3a2a0a', color: GOLD, fontFamily: 'Georgia, serif',
            fontSize: 13, padding: '8px 16px', textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            borderBottom: `1px solid ${GOLD}`,
            pointerEvents: 'none',
          }}
        >
          <span>Version mismatch — a newer build is available. Refresh to get the latest SmokeCraft experience.</span>
          <button
            type="button"
            onClick={hardRefresh}
            style={{
              background: GOLD, color: '#241605', border: 'none', borderRadius: 999,
              padding: '4px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Georgia, serif',
              pointerEvents: 'auto',
            }}
          >
            Refresh Now
          </button>
        </div>
      )}

      <div
        data-testid="build-diagnostic-footer"
        style={{
          position: 'fixed', bottom: 4, right: 6, zIndex: 40,
          fontFamily: 'monospace', fontSize: 10, color: 'rgba(233,193,118,0.45)',
          background: 'rgba(6,8,16,0.5)', borderRadius: 4, padding: '2px 6px',
          pointerEvents: 'auto', cursor: 'pointer', userSelect: 'text',
        }}
        onClick={() => setExpanded(e => !e)}
        title="SmokeCraft build diagnostics"
      >
        Build: {BUILD_INFO.commitShort} · {BUILD_INFO.environment}
      </div>

      {expanded && (
        <div
          role="dialog"
          aria-label="Build diagnostics"
          style={{
            position: 'fixed', bottom: 28, right: 6, zIndex: 41, maxWidth: 340,
            background: '#0b0f18', border: `1px solid ${GOLD}`, borderRadius: 8,
            padding: 12, fontFamily: 'monospace', fontSize: 11, color: '#e5e2e1',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ color: GOLD, marginBottom: 6, fontWeight: 700 }}>Frontend</div>
          <div>commit: {BUILD_INFO.commit}</div>
          <div>branch: {BUILD_INFO.branch}</div>
          <div>builtAt: {BUILD_INFO.builtAt}</div>
          <div>assetVersion: {BUILD_INFO.assetVersion}</div>
          <div>route: {typeof window !== 'undefined' ? window.location.pathname : ''}</div>
          <div style={{ color: GOLD, margin: '10px 0 6px', fontWeight: 700 }}>Backend (/api/version)</div>
          {!checked && <div>loading…</div>}
          {checked && !apiVersion && <div>unreachable</div>}
          {apiVersion && (
            <>
              <div>backendCommit: {apiVersion.backendCommit}</div>
              <div>branch: {apiVersion.branch}</div>
              <div>assetVersion: {apiVersion.assetVersion}</div>
              <div>environment: {apiVersion.environment}</div>
              <div>parity: {apiVersion.backendCommit === BUILD_INFO.commit ? 'match' : 'MISMATCH'}</div>
            </>
          )}
          <div style={{ color: GOLD, margin: '10px 0 6px', fontWeight: 700 }}>Service Worker</div>
          <div>{'serviceWorker' in navigator ? 'unregistered on load (see main.jsx)' : 'not supported'}</div>
        </div>
      )}
    </>
  )
}
