import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../../services/compliance/complianceApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { page, wrap, card, h1Style, h2Style, backBtn, primaryBtn, secondaryBtn, draftBanner, DICT, useLocale, setLocalePref, OK, DANGER } from './complianceUiKit.js'

const CONSENT_VERSION = '2026.08.0-draft'

/**
 * Real, server-backed consent preference center (Production Package 6
 * Correction). Non-essential categories (preferences/analytics/marketing)
 * are never preselected — every save is an explicit, timestamped
 * consent_records row. Withdrawal is a first-class, always-available
 * action, never buried or disabled by a dark pattern.
 */
export default function ConsentCenter() {
  const navigate = useNavigate()
  const [locale, setLocale] = useState(useLocale())
  const t = DICT[locale]
  function toggleLocale() { const next = locale === 'en' ? 'es' : 'en'; setLocale(next); setLocalePref(next) }

  const [subjectId, setSubjectId] = useState(null)
  const [subjectType, setSubjectType] = useState('guest')
  const [preferences, setPreferences] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    api.whoAmI().then((who) => {
      if (!who) return
      setSubjectId(who.subjectId); setSubjectType(who.subjectType)
      api.getCurrentConsent(who.subjectType, who.subjectId).then((r) => {
        if (r.ok && r.consent) { setPreferences(!!r.consent.preferences); setAnalytics(!!r.consent.analytics); setMarketing(!!r.consent.marketing) }
      })
    })
  }, [])

  async function save() {
    if (!subjectId) return
    setSaveState('saving'); setErrorMsg(null)
    const r = await api.setConsent({ subjectType, subjectId, preferences, analytics, marketing, consentVersion: CONSENT_VERSION })
    if (!r.ok) { setSaveState('error'); setErrorMsg(r.error); return }
    setSaveState('saved')
  }

  async function withdraw() {
    if (!subjectId) return
    setSaveState('saving')
    const r = await api.withdrawConsent({ subjectType, subjectId })
    if (!r.ok) { setSaveState('error'); setErrorMsg(r.error); return }
    setPreferences(false); setAnalytics(false); setMarketing(false)
    setSaveState('saved')
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={page} lang={locale}>
        <div style={wrap}>
          <button type="button" onClick={() => navigate(-1)} style={backBtn}>← {locale === 'en' ? 'Back' : 'Atras'}</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h1 style={h1Style}>{t.consentTitle}</h1>
            <button type="button" onClick={toggleLocale} style={secondaryBtn}>{t.langToggle}</button>
          </div>
          <div role="note" style={draftBanner}>{t.draftNotice}</div>

          <section style={card} aria-labelledby="cc-h">
            <h2 id="cc-h" style={h2Style}>{locale === 'en' ? 'Cookie & Data Categories' : 'Categorias de Cookies y Datos'}</h2>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, opacity: 0.7 }}>
              <label htmlFor="cc-necessary">{t.necessary}</label>
              <input id="cc-necessary" type="checkbox" checked disabled aria-label={t.necessary} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
              <label htmlFor="cc-preferences">{t.preferences}</label>
              <input id="cc-preferences" type="checkbox" checked={preferences} onChange={(e) => setPreferences(e.target.checked)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
              <label htmlFor="cc-analytics">{t.analytics}</label>
              <input id="cc-analytics" type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
              <label htmlFor="cc-marketing">{t.marketing}</label>
              <input id="cc-marketing" type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            </div>

            {errorMsg && <p role="alert" style={{ color: DANGER, fontSize: 12 }}>{errorMsg}</p>}
            {saveState === 'saved' && <p role="status" style={{ color: OK, fontSize: 12 }}>{locale === 'en' ? 'Preferences saved.' : 'Preferencias guardadas.'}</p>}

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button type="button" style={primaryBtn(!!subjectId)} disabled={!subjectId || saveState === 'saving'} onClick={save}>{t.save}</button>
              <button type="button" style={secondaryBtn} onClick={withdraw} disabled={!subjectId || saveState === 'saving'}>{t.withdraw}</button>
            </div>
          </section>
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
