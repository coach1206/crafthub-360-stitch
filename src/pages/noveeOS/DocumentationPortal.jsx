import { useState, useEffect } from 'react'

const NAVY = '#0a0d14'
const CHARCOAL = '#111520'
const CARD = '#161b27'
const LINE = '#252d3f'
const GOLD = '#c9952c'
const GOLD2 = '#e8b84b'
const TEXT = '#e8e4d8'
const MUTE = '#7a8299'
const GREEN = '#27ae60'
const AMBER = '#e67e22'
const BLUE = '#2980b9'

const BASE = '/api/novee-os/documentation-portal'

async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts,
    })
    return await res.json()
  } catch {
    return { ok: false, localPreview: true, error: 'api_unreachable' }
  }
}

const Badge = ({ label, color }) => (
  <span style={{
    background: color || LINE, color: TEXT, fontSize: 11, fontWeight: 700,
    padding: '2px 8px', borderRadius: 4, letterSpacing: 0.5,
  }}>{label}</span>
)

const SectionHeader = ({ title, badge }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
    <span style={{ color: GOLD2, fontSize: 15, fontWeight: 700 }}>{title}</span>
    {badge && <Badge label={badge} color={LINE} />}
  </div>
)

const InfoRow = ({ label, value, valueColor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
    <span style={{ color: MUTE, fontSize: 13 }}>{label}</span>
    <span style={{ color: valueColor || TEXT, fontSize: 13, fontWeight: 600 }}>{String(value ?? '—')}</span>
  </div>
)

const BlockerRow = ({ blocker }) => (
  <div style={{ background: CHARCOAL, borderRadius: 6, padding: '8px 12px', marginBottom: 8, borderLeft: `3px solid ${AMBER}` }}>
    <div style={{ color: AMBER, fontSize: 12, fontWeight: 700 }}>{blocker.label || blocker.key}</div>
    {blocker.safe_claim && <div style={{ color: MUTE, fontSize: 11, marginTop: 2 }}>Safe claim: {blocker.safe_claim}</div>}
  </div>
)

const ManualCard = ({ record }) => (
  <div style={{ background: CHARCOAL, borderRadius: 8, padding: 14, marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
      <span style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>{record.doc_title || record.manual_title}</span>
      <Badge label={record.status || record.content_depth_status || 'draft'} color={LINE} />
    </div>
    <div style={{ color: MUTE, fontSize: 11 }}>
      {record.doc_key || record.manual_key} · {record.audience_role || 'admin'} · {record.doc_type || 'manual'}
    </div>
    {record.safe_claim && <div style={{ color: GREEN, fontSize: 11, marginTop: 4 }}>✓ {record.safe_claim}</div>}
  </div>
)

const SectionCard = ({ section }) => (
  <div style={{ background: CHARCOAL, borderRadius: 8, padding: 14, marginBottom: 10, borderLeft: `3px solid ${BLUE}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
      <span style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>{section.section_title}</span>
      <Badge label={section.content_depth_status || 'seeded_professional_draft'} color={LINE} />
    </div>
    <div style={{ color: MUTE, fontSize: 11, marginBottom: 6 }}>
      {section.section_key} · {section.manual_key}
    </div>
    {section.content_body && (
      <div style={{
        color: TEXT, fontSize: 12, lineHeight: 1.6,
        maxHeight: 120, overflow: 'hidden',
        background: NAVY, padding: '8px 10px', borderRadius: 4, whiteSpace: 'pre-wrap',
      }}>
        {section.content_body.slice(0, 300)}{section.content_body.length > 300 ? '…' : ''}
      </div>
    )}
    {section.needs_human_review && <div style={{ color: AMBER, fontSize: 11, marginTop: 6 }}>⚠ Needs human review before publication</div>}
  </div>
)

export default function DocumentationPortal() {
  const [active, setActive] = useState('A')
  const [summary, setSummary] = useState(null)
  const [library, setLibrary] = useState([])
  const [seeded, setSeeded] = useState([])
  const [articles, setArticles] = useState([])
  const [contentBlocks, setContentBlocks] = useState([])
  const [reviews, setReviews] = useState([])
  const [exports, setExports] = useState([])
  const [safeClaims, setSafeClaims] = useState([])
  const [safePanel, setSafePanel] = useState(null)
  const [blockers, setBlockers] = useState(null)
  const [completeness, setCompleteness] = useState(null)
  const [auditLog, setAuditLog] = useState([])
  const [flags, setFlags] = useState(null)
  const [readiness, setReadiness] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { apiFetch('/summary').then(r => setSummary(r.data || r)) }, [])

  const loadPanel = async (panel) => {
    setActive(panel)
    setLoading(true)
    try {
      if (panel === 'B') { const r = await apiFetch('/library'); setLibrary(r.data?.records || r.records || []) }
      if (panel === 'C') { const r = await apiFetch('/articles'); setArticles(r.data?.records || r.records || []) }
      if (panel === 'D') { const r = await apiFetch('/seeded-manual-content'); setSeeded(r.data?.records || r.records || []) }
      if (panel === 'E') { const r = await apiFetch('/content-blocks'); setContentBlocks(r.data?.records || r.records || []) }
      if (panel === 'F') { /* search panel — manual trigger */ }
      if (panel === 'G') { const r = await apiFetch('/reviews'); setReviews(r.data?.records || r.records || []) }
      if (panel === 'H') { const r = await apiFetch('/exports'); setExports(r.data?.records || r.records || []) }
      if (panel === 'I') { const r = await apiFetch('/safe-claims'); setSafeClaims(r.data?.records || r.records || []) }
      if (panel === 'J') { const r = await apiFetch('/manual-content-completeness'); setCompleteness(r.data || r) }
      if (panel === 'K') { const r = await apiFetch('/blockers'); setBlockers(r.data || r) }
      if (panel === 'L') { const r = await apiFetch('/safe-claims-panel'); setSafePanel(r.data || r) }
      if (panel === 'M') {
        const [a, f, rd] = await Promise.all([
          apiFetch('/audit-log?limit=50'),
          apiFetch('/feature-flags'),
          apiFetch('/readiness-score'),
        ])
        setAuditLog(a.data?.records || a.records || [])
        setFlags(f.data?.flags || f.flags || null)
        setReadiness(rd.data || rd)
      }
    } finally { setLoading(false) }
  }

  const doSearch = async () => {
    if (!searchQuery.trim()) return
    const r = await apiFetch(`/search?q=${encodeURIComponent(searchQuery)}`)
    setSearchResults(r.data?.results || r.results || [])
  }

  const panels = [
    { id: 'A', label: 'Summary' },
    { id: 'B', label: 'Library (21)' },
    { id: 'C', label: 'Articles' },
    { id: 'D', label: 'Seeded Content' },
    { id: 'E', label: 'Content Blocks' },
    { id: 'F', label: 'Search' },
    { id: 'G', label: 'Reviews' },
    { id: 'H', label: 'Exports' },
    { id: 'I', label: 'Safe Claims' },
    { id: 'J', label: 'Completeness' },
    { id: 'K', label: 'Blockers' },
    { id: 'L', label: 'Safe Panel' },
    { id: 'M', label: 'Audit + Flags' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: TEXT, fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{ background: CHARCOAL, borderBottom: `2px solid ${GOLD}`, padding: '20px 32px' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: GOLD2, letterSpacing: 1 }}>
          NOVEE OS — Documentation Portal
        </div>
        <div style={{ fontSize: 12, color: MUTE, marginTop: 4 }}>
          Phase E.9 · Cover-to-Cover Seeded Professional Draft Documentation
        </div>
        <div style={{
          marginTop: 12, background: '#1a1200', border: `1px solid ${AMBER}`,
          borderRadius: 6, padding: '10px 14px', fontSize: 12, color: AMBER,
        }}>
          BUILD PHASE — Documentation portal is active with seeded professional draft content.
          Publication is NOT enabled. Client-ready and staff-ready publication are NOT enabled.
          Export is NOT enabled. All manuals require human review before publication.
          Seeded content represents professional draft quality — not final published documentation.
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '0 32px', display: 'flex', flexWrap: 'wrap', gap: 4, paddingTop: 8 }}>
        {panels.map(p => (
          <button key={p.id} onClick={() => loadPanel(p.id)} style={{
            background: active === p.id ? GOLD : 'transparent',
            color: active === p.id ? NAVY : MUTE,
            border: 'none', borderRadius: '4px 4px 0 0', padding: '7px 14px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace',
          }}>
            {p.id}. {p.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div style={{ padding: 32, maxWidth: 1100 }}>
        {loading && <div style={{ color: MUTE, fontSize: 13 }}>Loading…</div>}

        {/* A — Summary */}
        {active === 'A' && summary && (
          <div>
            <SectionHeader title="Documentation Portal Summary" badge="BUILD ONLY" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: CARD, borderRadius: 8, padding: 16 }}>
                <InfoRow label="Safety Status" value={summary.safety_status || 'BUILD_ONLY_DOCUMENTATION_NOT_PUBLISHED'} valueColor={AMBER} />
                <InfoRow label="Published" value={String(summary.published ?? false)} valueColor={summary.published ? GREEN : AMBER} />
                <InfoRow label="Client Ready" value={String(summary.client_ready ?? false)} valueColor={AMBER} />
                <InfoRow label="Staff Ready" value={String(summary.staff_ready ?? false)} valueColor={AMBER} />
                <InfoRow label="Documentation Ready" value={String(summary.documentation_ready ?? false)} valueColor={AMBER} />
                <InfoRow label="Seeded Content Ready (seededContentReady)" value={String(summary.seeded_content_ready ?? true)} valueColor={GREEN} />
              </div>
              <div style={{ background: CARD, borderRadius: 8, padding: 16 }}>
                <InfoRow label="Library Records" value={summary.library_count ?? 21} valueColor={BLUE} />
                <InfoRow label="Seeded Sections" value={summary.seeded_content_count ?? '—'} valueColor={BLUE} />
                <InfoRow label="Safe Claims" value={summary.safe_claims_count ?? '—'} valueColor={BLUE} />
                <InfoRow label="Local Preview" value={String(summary.localPreview ?? false)} valueColor={MUTE} />
              </div>
            </div>
          </div>
        )}

        {/* B — Library */}
        {active === 'B' && (
          <div>
            <SectionHeader title="Documentation Library" badge={`${library.length} records`} />
            {library.length === 0 && <div style={{ color: MUTE, fontSize: 13 }}>No records loaded.</div>}
            {library.map((rec, i) => <ManualCard key={i} record={rec} />)}
          </div>
        )}

        {/* C — Articles */}
        {active === 'C' && (
          <div>
            <SectionHeader title="Documentation Articles" badge={`${articles.length} records`} />
            {articles.length === 0 && <div style={{ color: MUTE, fontSize: 13 }}>No articles found. Articles are created during manual authoring.</div>}
            {articles.map((a, i) => (
              <div key={i} style={{ background: CARD, borderRadius: 8, padding: 14, marginBottom: 10 }}>
                <div style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>{a.article_title}</div>
                <div style={{ color: MUTE, fontSize: 11, marginTop: 4 }}>{a.article_key} · {a.article_type} · {a.audience_role}</div>
                <div style={{ color: a.published ? GREEN : AMBER, fontSize: 11, marginTop: 4 }}>Published: {String(a.published)}</div>
              </div>
            ))}
          </div>
        )}

        {/* D — Seeded Manual Content */}
        {active === 'D' && (
          <div>
            <SectionHeader title="Cover-to-Cover Seeded Manual Content" badge={`${seeded.length} sections`} />
            <div style={{
              background: CHARCOAL, border: `1px solid ${GREEN}`,
              borderRadius: 6, padding: '10px 14px', fontSize: 12, color: GREEN, marginBottom: 16,
            }}>
              Professional draft content is seeded for all required platform guides. Each guide includes
              title page, executive overview, setup instructions, daily workflow, safe claims, unsafe claims,
              readiness checklist, and troubleshooting sections. Human review required before publication.
            </div>
            {seeded.map((s, i) => <SectionCard key={i} section={s} />)}
          </div>
        )}

        {/* E — Content Blocks */}
        {active === 'E' && (
          <div>
            <SectionHeader title="Documentation Content Blocks" badge={`${contentBlocks.length} blocks`} />
            {contentBlocks.length === 0 && <div style={{ color: MUTE, fontSize: 13 }}>Content blocks are attached to articles. No blocks loaded.</div>}
            {contentBlocks.map((b, i) => (
              <div key={i} style={{ background: CARD, borderRadius: 8, padding: 14, marginBottom: 10 }}>
                <div style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>{b.block_title}</div>
                <div style={{ color: MUTE, fontSize: 11, marginTop: 4 }}>{b.block_key} · {b.block_type}</div>
                <div style={{ color: b.published ? GREEN : AMBER, fontSize: 11, marginTop: 4 }}>Published: {String(b.published)} · Approved: {String(b.approved)}</div>
              </div>
            ))}
          </div>
        )}

        {/* F — Search */}
        {active === 'F' && (
          <div>
            <SectionHeader title="Documentation Search" badge="PREVIEW" />
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Search manuals, sections, guides…"
                style={{
                  flex: 1, background: CARD, border: `1px solid ${LINE}`,
                  color: TEXT, padding: '8px 12px', borderRadius: 6, fontFamily: 'monospace', fontSize: 13,
                }}
              />
              <button onClick={doSearch} style={{
                background: GOLD, color: NAVY, border: 'none', borderRadius: 6,
                padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace',
              }}>Search</button>
            </div>
            {searchResults.map((r, i) => (
              <div key={i} style={{ background: CARD, borderRadius: 8, padding: 14, marginBottom: 10 }}>
                <div style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>{r.section_title || r.searchable_title}</div>
                <div style={{ color: MUTE, fontSize: 11, marginTop: 4 }}>{r.section_key || r.manual_key}</div>
              </div>
            ))}
          </div>
        )}

        {/* G — Reviews */}
        {active === 'G' && (
          <div>
            <SectionHeader title="Documentation Review Registry" badge={`${reviews.length} records`} />
            <div style={{ color: AMBER, fontSize: 12, marginBottom: 12 }}>
              All manuals require human review before publication. No publications are enabled.
            </div>
            {reviews.length === 0 && <div style={{ color: MUTE, fontSize: 13 }}>No reviews submitted yet.</div>}
            {reviews.map((r, i) => (
              <div key={i} style={{ background: CARD, borderRadius: 8, padding: 14, marginBottom: 10 }}>
                <div style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>{r.review_status}</div>
                <div style={{ color: MUTE, fontSize: 11, marginTop: 4 }}>Reviewer: {r.reviewer_role} · Approved for client: {String(r.approved_for_client)}</div>
              </div>
            ))}
          </div>
        )}

        {/* H — Exports */}
        {active === 'H' && (
          <div>
            <SectionHeader title="Documentation Export Registry" badge={`${exports.length} records`} />
            <div style={{ color: AMBER, fontSize: 12, marginBottom: 12 }}>
              Export is NOT enabled. NOVEE_DOCUMENTATION_EXPORT_ENABLED is false.
              PDF export and email export are not enabled.
            </div>
            {exports.length === 0 && <div style={{ color: MUTE, fontSize: 13 }}>No export requests. Export is disabled.</div>}
          </div>
        )}

        {/* I — Safe Claims Registry */}
        {active === 'I' && (
          <div>
            <SectionHeader title="Safe Claims Registry" badge={`${safeClaims.length} records`} />
            {safeClaims.map((c, i) => (
              <div key={i} style={{ background: CARD, borderRadius: 8, padding: 14, marginBottom: 10, borderLeft: `3px solid ${GREEN}` }}>
                <div style={{ color: GREEN, fontSize: 13, fontWeight: 700 }}>{c.claim_text}</div>
                <div style={{ color: MUTE, fontSize: 11, marginTop: 4 }}>{c.claim_key} · {c.claim_type} · {c.claim_status}</div>
                <div style={{ color: MUTE, fontSize: 11, marginTop: 2 }}>
                  Evidence required: {String(c.evidence_required)} · Approved for sales: {String(c.approved_for_sales)}
                </div>
                {c.blocker_reason && <div style={{ color: AMBER, fontSize: 11, marginTop: 4 }}>{c.blocker_reason}</div>}
              </div>
            ))}
          </div>
        )}

        {/* J — Manual Completeness */}
        {active === 'J' && completeness && (
          <div>
            <SectionHeader title="Manual Content Completeness" badge={`${completeness.total_manuals || 0} manuals`} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: CARD, borderRadius: 8, padding: 12 }}>
                <InfoRow label="Total Manuals" value={completeness.total_manuals ?? '—'} valueColor={BLUE} />
                <InfoRow label="Total Sections" value={completeness.total_sections ?? '—'} valueColor={BLUE} />
                <InfoRow label="All Needs Review" value={String(completeness.all_needs_human_review ?? true)} valueColor={AMBER} />
                <InfoRow label="Published" value={String(completeness.published ?? false)} valueColor={AMBER} />
              </div>
            </div>
            {(completeness.manual_summaries || []).map((m, i) => (
              <div key={i} style={{ background: CARD, borderRadius: 8, padding: 14, marginBottom: 10 }}>
                <div style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>{m.manual_title || m.manual_key}</div>
                <div style={{ color: MUTE, fontSize: 12, marginTop: 4 }}>
                  {m.section_count} sections · {m.seeded_count} seeded
                </div>
                {m.sections?.map((s, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${LINE}`, marginTop: 4 }}>
                    <span style={{ color: MUTE, fontSize: 11 }}>{s.section_title}</span>
                    <span style={{ color: s.has_content ? GREEN : AMBER, fontSize: 11 }}>{s.has_content ? '✓ seeded' : '⚠ empty'}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* K — Blockers */}
        {active === 'K' && blockers && (
          <div>
            <SectionHeader title="Documentation Blockers" badge={`${blockers.blockers?.length || 0} active`} />
            <InfoRow label="Documentation Ready" value={String(blockers.documentation_ready ?? false)} valueColor={AMBER} />
            <InfoRow label="Published" value={String(blockers.published ?? false)} valueColor={AMBER} />
            <div style={{ marginTop: 16 }}>
              {(blockers.blockers || []).map((b, i) => <BlockerRow key={i} blocker={b} />)}
            </div>
          </div>
        )}

        {/* L — Safe Panel */}
        {active === 'L' && safePanel && (
          <div>
            <SectionHeader title="Safe Documentation Claims" badge="VERIFIED" />
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: GOLD2, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>What CAN be claimed:</div>
              {(safePanel.safe_claims || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: GREEN, fontSize: 13 }}>✓</span>
                  <span style={{ color: TEXT, fontSize: 13 }}>{c}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ color: AMBER, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>What CANNOT be claimed:</div>
              {(safePanel.unsafe_claims_blocked || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#c0392b', fontSize: 13 }}>✗</span>
                  <span style={{ color: MUTE, fontSize: 13 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* M — Audit Log + Feature Flags */}
        {active === 'M' && (
          <div>
            <SectionHeader title="Audit Log + Feature Flags" />
            {flags && (
              <div style={{ background: CARD, borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <div style={{ color: GOLD2, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Feature Flag Snapshot</div>
                {Object.entries(flags).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${LINE}` }}>
                    <span style={{ color: MUTE, fontSize: 11 }}>{k}</span>
                    <span style={{ color: v === true ? GREEN : v === false ? AMBER : TEXT, fontSize: 11, fontWeight: 700 }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
            {readiness && (
              <div style={{ background: CARD, borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <div style={{ color: GOLD2, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Readiness Score</div>
                <InfoRow label="Documentation Ready" value={String(readiness.documentation_ready ?? false)} valueColor={AMBER} />
                <InfoRow label="Published" value={String(readiness.published ?? false)} valueColor={AMBER} />
                <InfoRow label="Seeded Content Ready" value={String(readiness.seeded_content_ready ?? true)} valueColor={GREEN} />
                <InfoRow label="Seeded Section Count" value={readiness.seeded_section_count ?? '—'} valueColor={BLUE} />
                <InfoRow label="Covered Manuals" value={`${readiness.covered_manual_count ?? '—'} / ${readiness.required_manual_count ?? '—'}`} valueColor={BLUE} />
              </div>
            )}
            <div style={{ background: CARD, borderRadius: 8, padding: 16 }}>
              <div style={{ color: GOLD2, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Audit Log ({auditLog.length} events)</div>
              {auditLog.length === 0 && <div style={{ color: MUTE, fontSize: 12 }}>No audit events yet.</div>}
              {auditLog.slice(0, 30).map((e, i) => (
                <div key={i} style={{ padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
                  <span style={{ color: MUTE, fontSize: 11 }}>{e.created_at?.slice(0, 19) || '—'}</span>
                  <span style={{ color: BLUE, fontSize: 11, marginLeft: 8 }}>[{e.event_type}]</span>
                  <span style={{ color: TEXT, fontSize: 11, marginLeft: 8 }}>{e.summary}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
