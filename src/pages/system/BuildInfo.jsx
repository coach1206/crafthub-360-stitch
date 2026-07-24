// Production Build Identity pass — /system/build-info. A non-sensitive
// diagnostic page an operator can open to immediately prove what a given
// Railway deployment is actually serving, without needing shell/dashboard
// access. No secrets, tokens, or personal data are ever rendered here.
import { useEffect, useState } from 'react'
import { BUILD_INFO } from '../../generated/buildInfo.js'
import { TOTAL_SESSIONS, TOTAL_VISITS, VISIT_STRUCTURE } from '../../constants/session.js'

const GOLD = '#E9C176'
const CARD = { background: '#0b0f18', border: '1px solid rgba(233,193,118,0.25)', borderRadius: 10, padding: 16, marginBottom: 16 }

function Row({ label, value, ok }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>
      <span style={{ color: 'rgba(229,226,225,0.6)' }}>{label}</span>
      <span style={{ color: ok === false ? '#e57373' : ok === true ? '#8fd19e' : '#e5e2e1', fontFamily: 'monospace' }}>{String(value)}</span>
    </div>
  )
}

export default function BuildInfo() {
  const [apiVersion, setApiVersion] = useState(null)
  const [manifest, setManifest] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/version', { cache: 'no-store' }).then(r => r.json()).then(setApiVersion).catch(() => setError('api/version unreachable'))
    fetch('/build-manifest.json', { cache: 'no-store' }).then(r => r.json()).then(setManifest).catch(() => setError('build-manifest.json unreachable'))
  }, [])

  const allSessions = VISIT_STRUCTURE.flatMap(v => v.sessions)
  const parity = apiVersion && BUILD_INFO.commit !== 'local' ? apiVersion.backendCommit === BUILD_INFO.commit : null
  const okAssets = manifest?.criticalRouteAssets?.filter(a => a.assetStatus === 'ok').length ?? 0
  const totalAssets = manifest?.criticalRouteAssets?.length ?? 0

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#e5e2e1', fontFamily: 'Georgia, serif', padding: 'clamp(16px,4vw,40px)' }}>
      <h1 style={{ color: GOLD, fontSize: 22, marginBottom: 4 }}>SmokeCraft Production Build Info</h1>
      <p style={{ color: 'rgba(229,226,225,0.55)', fontSize: 13, marginBottom: 24 }}>
        Non-sensitive deployment diagnostics — no secrets, tokens, or personal data.
      </p>

      {error && <div style={{ color: '#e57373', marginBottom: 16 }}>{error}</div>}

      <div style={CARD}>
        <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>Frontend build identity</div>
        <Row label="commit" value={BUILD_INFO.commit} />
        <Row label="commitShort" value={BUILD_INFO.commitShort} />
        <Row label="branch" value={BUILD_INFO.branch} />
        <Row label="builtAt" value={BUILD_INFO.builtAt} />
        <Row label="environment" value={BUILD_INFO.environment} />
        <Row label="assetVersion" value={BUILD_INFO.assetVersion} />
      </div>

      <div style={CARD}>
        <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>Backend (/api/version)</div>
        {apiVersion ? (
          <>
            <Row label="backendCommit" value={apiVersion.backendCommit} />
            <Row label="branch" value={apiVersion.branch} />
            <Row label="buildTimestamp" value={apiVersion.buildTimestamp} />
            <Row label="assetVersion" value={apiVersion.assetVersion} />
            <Row label="environment" value={apiVersion.environment} />
            <Row label="manifestFound" value={apiVersion.manifestFound} ok={apiVersion.manifestFound} />
          </>
        ) : <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.5)' }}>loading…</div>}
      </div>

      <div style={CARD}>
        <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>Version parity result</div>
        <Row label="frontend commit === backend commit" value={parity === null ? 'unknown (local dev build)' : parity ? 'MATCH' : 'MISMATCH'} ok={parity} />
      </div>

      <div style={CARD}>
        <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>Route registry</div>
        <Row label="27-session registry count" value={allSessions.length} ok={allSessions.length === 27} />
        <Row label="6-phase count" value={TOTAL_VISITS} ok={TOTAL_VISITS === 6} />
        <Row label="TOTAL_SESSIONS constant" value={TOTAL_SESSIONS} ok={TOTAL_SESSIONS === 27} />
      </div>

      <div style={CARD}>
        <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>Critical asset availability ({okAssets}/{totalAssets})</div>
        {manifest?.criticalRouteAssets?.map(a => (
          <Row key={a.key} label={a.key} value={a.assetStatus} ok={a.assetStatus === 'ok' ? true : a.assetStatus === 'missing-approved-asset' ? undefined : false} />
        ))}
      </div>

      <div style={CARD}>
        <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>Service worker</div>
        <Row label="registered service workers" value={'serviceWorker' in navigator ? 'proactively unregistered on every page load (src/main.jsx)' : 'unsupported'} ok={true} />
      </div>

      <div style={{ ...CARD, marginBottom: 0 }}>
        <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>Current production origin</div>
        <Row label="location" value={typeof window !== 'undefined' ? window.location.origin : 'unknown'} />
      </div>
    </div>
  )
}
