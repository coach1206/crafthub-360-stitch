import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as api from '../../../services/compliance/complianceApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { page, wrap, card, h1Style, h2Style, backBtn, primaryBtn, secondaryBtn, draftBanner, statusBadge, DICT, useLocale, setLocalePref, DANGER } from './complianceUiKit.js'

const TYPE_TITLES = { terms: 'termsTitle', privacy: 'privacyTitle', tobacco_warning: 'warningTitle' }

/**
 * Real Terms / Privacy / Tobacco-warning acceptance UI (Production Package
 * 6 Correction). Loads the CURRENT policy_versions row per type from the
 * server (never a hardcoded local copy) and records real, versioned
 * acceptance via POST /api/compliance/policies/accept. Every legal body is
 * shown with its counsel-review draft label — never presented as final.
 */
export default function PolicyCenter() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/smokecraft'
  const jurisdictionCode = searchParams.get('jurisdiction') || 'US-DEFAULT'
  const onlyType = searchParams.get('type') // optional: focus a single policy type

  const [locale, setLocale] = useState(useLocale())
  const t = DICT[locale]
  function toggleLocale() { const next = locale === 'en' ? 'es' : 'en'; setLocale(next); setLocalePref(next) }

  const [subjectId, setSubjectId] = useState(null)
  const [subjectType, setSubjectType] = useState('guest')
  const [policies, setPolicies] = useState([])
  const [accepted, setAccepted] = useState({})
  const [loadState, setLoadState] = useState('loading')
  const [declined, setDeclined] = useState(false)

  useEffect(() => {
    api.whoAmI().then((who) => { if (who) { setSubjectId(who.subjectId); setSubjectType(who.subjectType) } })
    load()
  }, [locale]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoadState('loading')
    const r = await api.listPolicies(undefined, locale)
    if (!r.ok) { setLoadState('error'); return }
    let current = r.policies.filter((p) => p.is_current && ['terms', 'privacy', 'tobacco_warning'].includes(p.policy_type) && (p.jurisdiction_code === null || p.jurisdiction_code === jurisdictionCode))
    if (onlyType) current = current.filter((p) => p.policy_type === onlyType)
    // de-dupe by type (prefer jurisdiction-specific over global)
    const byType = {}
    for (const p of current) { if (!byType[p.policy_type] || p.jurisdiction_code) byType[p.policy_type] = p }
    setPolicies(Object.values(byType))
    setLoadState(Object.keys(byType).length ? 'ready' : 'unavailable')
  }

  async function accept(policy) {
    if (!subjectId) return
    const r = await api.acceptPolicy({ subjectType, subjectId, policyVersionId: policy.id, locale })
    if (r.ok) setAccepted((prev) => ({ ...prev, [policy.policy_type]: true }))
  }

  const allAccepted = policies.length > 0 && policies.every((p) => accepted[p.policy_type])

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={page} lang={locale}>
        <div style={wrap}>
          <button type="button" onClick={() => navigate(-1)} style={backBtn}>← {locale === 'en' ? 'Back' : 'Atras'}</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h1 style={h1Style}>{locale === 'en' ? 'Legal & Policy Acceptance' : 'Aceptacion Legal y de Politicas'}</h1>
            <button type="button" onClick={toggleLocale} style={secondaryBtn}>{t.langToggle}</button>
          </div>
          <div role="note" style={draftBanner}>{t.draftNotice}</div>

          {loadState === 'loading' && <p>{locale === 'en' ? 'Loading policies…' : 'Cargando politicas…'}</p>}
          {loadState === 'error' && <p role="alert" style={{ color: DANGER }}>{locale === 'en' ? 'Unable to load policies right now.' : 'No se pudieron cargar las politicas.'}</p>}
          {loadState === 'unavailable' && <p role="status">{locale === 'en' ? 'No current policy is configured for this locale/jurisdiction yet.' : 'Aun no hay una politica vigente configurada para este idioma/jurisdiccion.'}</p>}

          {loadState === 'ready' && policies.map((p) => (
            <section key={p.policy_type} style={card} aria-labelledby={`policy-h-${p.policy_type}`}>
              <h2 id={`policy-h-${p.policy_type}`} style={h2Style}>{t[TYPE_TITLES[p.policy_type]]}</h2>
              <span style={statusBadge(accepted[p.policy_type] ? 'ok' : 'warn')}>
                {accepted[p.policy_type] ? t.accepted : (locale === 'en' ? 'Not yet accepted' : 'Aun no aceptado')}
              </span>
              <p style={{ fontSize: 11, opacity: 0.6 }}>{t.version} {p.version} · {t.effective} {p.effective_date} · counsel_review_status: {p.counsel_review_status}</p>
              <div style={{ maxHeight: 220, overflowY: 'auto', fontSize: 12, lineHeight: 1.5, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, background: 'rgba(0,0,0,0.25)' }} tabIndex={0} aria-label={`${t[TYPE_TITLES[p.policy_type]]} text`}>
                {p.body_markdown}
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button type="button" style={primaryBtn(!accepted[p.policy_type])} disabled={accepted[p.policy_type]} onClick={() => accept(p)}>{t.accept}</button>
                <button type="button" style={secondaryBtn} onClick={() => setDeclined(true)}>{t.decline}</button>
              </div>
            </section>
          ))}

          {declined && (
            <div role="alert" style={{ ...card, borderColor: DANGER }}>
              <p style={{ fontSize: 13 }}>{locale === 'en' ? 'You declined one or more required policies. Tobacco purchases cannot proceed until all required policies are accepted.' : 'Rechazo una o mas politicas requeridas. Las compras de tabaco no pueden continuar hasta aceptar todas las politicas requeridas.'}</p>
            </div>
          )}

          {loadState === 'ready' && (
            <button type="button" style={primaryBtn(allAccepted)} disabled={!allAccepted} onClick={() => navigate(returnTo)}>
              {locale === 'en' ? 'Continue' : 'Continuar'}
            </button>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
