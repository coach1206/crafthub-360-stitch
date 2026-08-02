import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../../services/compliance/complianceApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { page, wrap, card, h1Style, h2Style, backBtn, primaryBtn, secondaryBtn, draftBanner, statusBadge, DICT, useLocale, setLocalePref, DANGER } from './complianceUiKit.js'

const REQUEST_TYPES = [
  { key: 'access', labelEn: 'Access my data', labelEs: 'Acceder a mis datos' },
  { key: 'export', labelEn: 'Export my data', labelEs: 'Exportar mis datos' },
  { key: 'deletion', labelEn: 'Delete my account', labelEs: 'Eliminar mi cuenta' },
  { key: 'correction', labelEn: 'Correct my data', labelEs: 'Corregir mis datos' },
]

/**
 * Real customer data-rights UI (Production Package 6 Correction) — access,
 * export, deletion, correction requests against the real
 * /api/compliance/data-rights/* workflow, including identity verification,
 * status, retention-exception disclosure, and cancellation-not-applicable
 * honesty (this workflow's requests complete immediately once
 * identity-verified; there is no separate cancel step to fabricate).
 * A customer can only ever act on their OWN subjectId (enforced server-side).
 */
export default function DataRightsCenter() {
  const navigate = useNavigate()
  const [locale, setLocale] = useState(useLocale())
  const t = DICT[locale]
  function toggleLocale() { const next = locale === 'en' ? 'es' : 'en'; setLocale(next); setLocalePref(next) }

  const [subjectId, setSubjectId] = useState(null)
  const [subjectType, setSubjectType] = useState('guest')
  const [requestType, setRequestType] = useState('access')
  const [activeRequest, setActiveRequest] = useState(null)
  const [step, setStep] = useState('idle') // idle | submitted | verifying | verified | previewing | previewed | committing | done | error
  const [errorMsg, setErrorMsg] = useState(null)
  const [preview, setPreview] = useState(null)
  const [exportBundle, setExportBundle] = useState(null)

  useEffect(() => { api.whoAmI().then((who) => { if (who) { setSubjectId(who.subjectId); setSubjectType(who.subjectType) } }) }, [])

  async function submitRequest() {
    if (!subjectId) return
    setErrorMsg(null)
    const r = await api.submitDataRightsRequest({ subjectType, subjectId, requestType })
    if (!r.ok) { setStep('error'); setErrorMsg(r.error); return }
    setActiveRequest(r.request)
    setStep('submitted')
  }

  async function verifyIdentity() {
    setStep('verifying')
    const r = await api.verifyRequestIdentity(activeRequest.id)
    if (!r.ok) { setStep('error'); setErrorMsg(r.error); return }
    setActiveRequest(r.request)
    setStep('verified')
  }

  async function runPreview() {
    setStep('previewing')
    const r = await api.previewDeletion(activeRequest.id)
    if (!r.ok) { setStep('error'); setErrorMsg(r.error); return }
    setPreview(r.preview)
    setStep('previewed')
  }

  async function runExport() {
    const r = await api.generateExport(activeRequest.id)
    if (!r.ok) { setStep('error'); setErrorMsg(r.error); return }
    setExportBundle(r.export)
    setStep('done')
  }

  async function commit() {
    setStep('committing')
    const r = await api.commitDeletion(activeRequest.id)
    if (!r.ok) { setStep('error'); setErrorMsg(r.error); return }
    setStep('done')
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={page} lang={locale}>
        <div style={wrap}>
          <button type="button" onClick={() => navigate(-1)} style={backBtn}>← {locale === 'en' ? 'Back' : 'Atras'}</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h1 style={h1Style}>{t.dataRightsTitle}</h1>
            <button type="button" onClick={toggleLocale} style={secondaryBtn}>{t.langToggle}</button>
          </div>
          <div role="note" style={draftBanner}>{t.draftNotice}</div>

          {!activeRequest && (
            <section style={card}>
              <h2 style={h2Style}>{locale === 'en' ? 'Submit a request' : 'Enviar una solicitud'}</h2>
              <label htmlFor="dr-type" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{locale === 'en' ? 'Request type' : 'Tipo de solicitud'}</label>
              <select id="dr-type" value={requestType} onChange={(e) => setRequestType(e.target.value)} style={{ minHeight: 44, width: '100%', padding: 8, borderRadius: 8, marginBottom: 10, background: 'rgba(255,255,255,0.06)', color: '#e5e2e1', border: '1px solid rgba(233,193,118,0.22)' }}>
                {REQUEST_TYPES.map((rt) => <option key={rt.key} value={rt.key}>{locale === 'en' ? rt.labelEn : rt.labelEs}</option>)}
              </select>
              <button type="button" style={primaryBtn(!!subjectId)} disabled={!subjectId} onClick={submitRequest}>{locale === 'en' ? 'Submit request' : 'Enviar solicitud'}</button>
            </section>
          )}

          {activeRequest && (
            <section style={card} data-datarights-state={step}>
              <h2 style={h2Style}>{locale === 'en' ? 'Request' : 'Solicitud'} #{activeRequest.request_number}</h2>
              <span style={statusBadge(step === 'done' ? 'ok' : 'warn')}>{t.requestStatus}: {step}</span>
              <p style={{ fontSize: 12 }}>{locale === 'en' ? 'Type' : 'Tipo'}: {activeRequest.request_type} · {locale === 'en' ? 'Support case reference' : 'Referencia de caso de soporte'}: {activeRequest.request_number}</p>

              {(step === 'submitted') && (
                <button type="button" style={primaryBtn(true)} onClick={verifyIdentity}>{locale === 'en' ? 'Verify my identity (I am signed in as this account)' : 'Verificar mi identidad (soy esta cuenta)'}</button>
              )}

              {step === 'verified' && activeRequest.request_type === 'deletion' && (
                <button type="button" style={primaryBtn(true)} onClick={runPreview}>{locale === 'en' ? 'Preview what will be deleted' : 'Vista previa de lo que se eliminara'}</button>
              )}
              {step === 'verified' && activeRequest.request_type === 'export' && (
                <button type="button" style={primaryBtn(true)} onClick={runExport}>{t.exportData}</button>
              )}
              {step === 'verified' && (activeRequest.request_type === 'access' || activeRequest.request_type === 'correction') && (
                <button type="button" style={primaryBtn(true)} onClick={runExport}>{t.access}</button>
              )}

              {step === 'previewed' && preview && (
                <div>
                  <h3 style={{ fontSize: 13, color: '#f0c060' }}>{locale === 'en' ? 'Retention exceptions (data that legally must be kept)' : 'Excepciones de retencion (datos que legalmente deben conservarse)'}</h3>
                  <ul style={{ fontSize: 12 }}>
                    {preview.will_retain_with_exception.map((ex) => <li key={ex.category}>{ex.category} — {ex.reason}</li>)}
                  </ul>
                  <button type="button" style={primaryBtn(true)} onClick={commit}>{locale === 'en' ? 'Confirm deletion' : 'Confirmar eliminacion'}</button>
                </div>
              )}

              {step === 'done' && exportBundle && (
                <pre style={{ fontSize: 11, maxHeight: 200, overflow: 'auto', background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8 }}>{JSON.stringify(exportBundle, null, 2)}</pre>
              )}
              {step === 'done' && !exportBundle && (
                <p role="status" style={{ fontSize: 13, color: '#7fd0a3' }}>{locale === 'en' ? 'Your request is complete. Active sessions have been revoked where applicable.' : 'Su solicitud esta completa. Las sesiones activas se revocaron cuando corresponde.'}</p>
              )}

              {errorMsg && <p role="alert" style={{ color: DANGER, fontSize: 12 }}>{errorMsg}</p>}
            </section>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
