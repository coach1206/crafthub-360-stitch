import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../../../services/compliance/complianceApiClient.js'
import SmokeCraftScreenShell from '../../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { page, wrap, card, h1Style, h2Style, backBtn, secondaryBtn, draftBanner, statusBadge, DANGER } from '../complianceUiKit.js'

const TABS = ['jurisdictions', 'retention', 'dataRights', 'staffAcks', 'mediaRights', 'accessibility', 'audit']

/**
 * Real, backend-connected compliance administration center (Production
 * Package 6 Correction). RBAC (requireManager/requireAdmin) is enforced
 * SERVER-SIDE on every one of these endpoints — this UI never fakes
 * client-only permission gating; a non-admin caller hitting these routes
 * gets real 401/403 responses from complianceRoutes.js, surfaced honestly
 * below rather than hidden.
 */
export default function ComplianceAdmin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('jurisdictions')
  const [data, setData] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load(tab) }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load(which) {
    setLoading(true); setError(null)
    let r
    if (which === 'jurisdictions') r = await api.getJurisdictions()
    else if (which === 'retention') r = await api.listRetentionPolicies()
    else if (which === 'dataRights') r = await api.listDataRightsRequests()
    else if (which === 'staffAcks') r = await api.listStaffAcknowledgements()
    else if (which === 'mediaRights') r = await api.listMediaRightsReview()
    else if (which === 'accessibility') r = await api.listAccessibilityIssues()
    else if (which === 'audit') r = await api.listAuditEvents()
    setLoading(false)
    if (!r?.ok) { setError(r?.error || 'load_failed'); return }
    setData((prev) => ({ ...prev, [which]: r }))
  }

  async function toggleJurisdiction(code, field, current) {
    const r = await api.updateJurisdiction(code, { [field]: !current })
    if (r.ok) load('jurisdictions')
  }

  const rows = data[tab]

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={page}>
        <div style={{ ...wrap, maxWidth: 1000 }}>
          <button type="button" onClick={() => navigate(-1)} style={backBtn}>← Back</button>
          <h1 style={h1Style}>Compliance Administration</h1>
          <div role="note" style={draftBanner}>DRAFT — PENDING QUALIFIED LEGAL COUNSEL REVIEW. All jurisdiction/policy states shown here are operational defaults, not legal approvals.</div>

          <nav aria-label="Compliance admin sections" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {TABS.map((tKey) => (
              <button key={tKey} type="button" aria-current={tab === tKey ? 'page' : undefined}
                style={{ ...secondaryBtn, minHeight: 40, padding: '8px 14px', fontSize: 12, opacity: tab === tKey ? 1 : 0.6 }}
                onClick={() => setTab(tKey)}>{tKey}</button>
            ))}
          </nav>

          {loading && <p role="status">Loading…</p>}
          {error && <p role="alert" style={{ color: DANGER }}>Access/load error: {error}{error === 'forbidden' || error === 'unauthorized' ? ' — this admin surface correctly enforces RBAC server-side.' : ''}</p>}

          {!loading && !error && tab === 'jurisdictions' && rows && (
            <div style={card}>
              <h2 style={h2Style}>Jurisdictions</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead><tr><th style={{ textAlign: 'left' }}>Code</th><th>Status</th><th>Min age</th><th>Tobacco</th><th>Shipping</th><th>Counsel</th></tr></thead>
                  <tbody>
                    {rows.jurisdictions.map((j) => (
                      <tr key={j.code}>
                        <td>{j.code}</td>
                        <td><span style={statusBadge(j.status === 'active' ? 'ok' : 'warn')}>{j.status}</span></td>
                        <td>{j.min_purchase_age}</td>
                        <td>
                          <button type="button" style={{ ...secondaryBtn, minHeight: 36, padding: '4px 10px', fontSize: 11 }} onClick={() => toggleJurisdiction(j.code, 'tobacco_sales_allowed', j.tobacco_sales_allowed)}>
                            {j.tobacco_sales_allowed ? 'allowed' : 'denied'}
                          </button>
                        </td>
                        <td>
                          <button type="button" style={{ ...secondaryBtn, minHeight: 36, padding: '4px 10px', fontSize: 11 }} onClick={() => toggleJurisdiction(j.code, 'shipping_allowed', j.shipping_allowed)}>
                            {j.shipping_allowed ? 'allowed' : 'denied'}
                          </button>
                        </td>
                        <td>{j.counsel_review_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && !error && tab === 'retention' && rows && (
            <div style={card}><h2 style={h2Style}>Retention Policies</h2>
              <ul style={{ fontSize: 12 }}>{rows.policies.map((p) => <li key={p.data_category}>{p.data_category}: {p.retention_days}d — {p.legal_basis_note}</li>)}</ul>
            </div>
          )}

          {!loading && !error && tab === 'dataRights' && rows && (
            <div style={card}><h2 style={h2Style}>Data-Rights Requests</h2>
              <ul style={{ fontSize: 12 }}>{rows.requests.map((r) => <li key={r.id}>{r.request_number} — {r.request_type} — {r.status}</li>)}</ul>
            </div>
          )}

          {!loading && !error && tab === 'staffAcks' && rows && (
            <div style={card}><h2 style={h2Style}>Staff Acknowledgements</h2>
              <ul style={{ fontSize: 12 }}>{rows.acknowledgements.map((a) => <li key={a.id}>Staff {a.staff_id} — policy {a.policy_version_id} — {a.acknowledged_at}</li>)}</ul>
            </div>
          )}

          {!loading && !error && tab === 'mediaRights' && rows && (
            <div style={card}><h2 style={h2Style}>Media Rights Review</h2>
              <ul style={{ fontSize: 12 }}>{rows.mediaRights.map((m) => <li key={m.media_id}>{m.media_id} — {m.rights_status}</li>)}</ul>
            </div>
          )}

          {!loading && !error && tab === 'accessibility' && rows && (
            <div style={card}><h2 style={h2Style}>Accessibility Issues</h2>
              <ul style={{ fontSize: 12 }}>{rows.issues.map((i) => <li key={i.id}>{i.screen} — {i.severity} — {i.status}</li>)}</ul>
              {rows.issues.length === 0 && <p style={{ fontSize: 12 }}>No open issues logged.</p>}
            </div>
          )}

          {!loading && !error && tab === 'audit' && rows && (
            <div style={card}><h2 style={h2Style}>Audit Trail (append-only)</h2>
              <ul style={{ fontSize: 11, maxHeight: 300, overflowY: 'auto' }}>{rows.events.map((e) => <li key={e.id}>{e.created_at} — {e.event_type} — subject:{e.subject_id || '—'}</li>)}</ul>
            </div>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
