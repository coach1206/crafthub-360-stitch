import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { useSmokeCraftServerJourney } from '../../hooks/useSmokeCraftServerJourney.js'
import { mapJourneyToSnapshotPayload } from '../../services/smokecraft/managementSyncSnapshotMapper.js'
import { getRankFromXP } from '../../constants/session.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'
import {
  GOLD, GOLD_DIM, CREAM, BORDER, GLASS,
  heroBannerStyle, pageShellStyle, cardStyle, sectionLabelStyle,
} from '../../constants/smokecraftLiveScreenTokens.js'

/**
 * Scorecard — /smokecraft/scorecard (Session 19/20)
 *
 * TWO-GENERATION MIGRATION — replaces SmokeCraftImageBoundsOverlay (this
 * screen was already almost entirely real DOM controls, just positioned
 * as percentage overlays on a baked background image) with the shared
 * live-DOM card system. No image asset is used, matching the Format /
 * Thirds precedent.
 *
 * IMPORTANT: this screen was previously root-caused (see prior defect
 * history) as never actually broken — the real blocker was Final Third
 * silently requiring a flavor selection. Every rating control below
 * keeps its exact `aria-label="Rate ${label} ${n} out of 5..."` pattern
 * so existing capture/verification scripts (which target
 * `button[aria-label*="Rate ${cat} 4"]`) continue to work unchanged.
 * The prior fixed-position layout bug that could let the Personal Notes
 * panel visually cover the last rating row cannot recur in a normal
 * document-flow layout — categories and notes are now separate stacked
 * sections, never overlapping regions.
 *
 * All logic preserved verbatim: server-authoritative draft load/retry,
 * debounced autosave with 409-conflict adoption, setCategory/setMeta/
 * setNotes, handleSaveDraft, submitScorecardEvidence-gated
 * handleContinue, management-sync snapshot save.
 */

const ENRICHMENT_19 = getEducationalEnrichment(19)

const CATEGORIES = [
  { id: 'appearance',   label: 'Appearance',   hint: 'Color, veins, oiliness, seam' },
  { id: 'construction', label: 'Construction',  hint: 'Feel, weight, firmness' },
  { id: 'draw',         label: 'Draw',          hint: 'Airflow resistance and ease' },
  { id: 'burn',         label: 'Burn',          hint: 'Even line, ash color, relights' },
  { id: 'flavor',       label: 'Flavor',        hint: 'Complexity, evolution, notes' },
  { id: 'pairing',      label: 'Pairing Match', hint: 'How well it matched your choice' },
]

function readCigarDetails(smokeCraft, journey) {
  const rec = smokeCraft?.selectedHumidorRecommendation
  const fmt = smokeCraft?.selectedFormat
  if (rec) return { name: rec.selectedCigarName || '—', country: rec.selectedCigarCountry || '—', type: rec.selectedCigarType || '—', size: fmt?.name || '—' }
  if (journey?.selectedCigar) return { name: journey.selectedCigar.name || '—', country: journey.selectedCigar.origin || '—', type: journey.selectedCigar.wrapper || '—', size: journey.format?.label || '—' }
  if (fmt) return { name: fmt.name || '—', country: '—', type: '—', size: fmt.name || '—' }
  return null
}

const EMPTY_STATE = {
  categories: { appearance: null, construction: null, draw: null, burn: null, flavor: null, pairing: null },
  meta: { durationMinutes: null, puffCount: null, relightCount: 0 },
  personalNotes: '',
  savedAt: null,
  submittedScorecardId: null,
}

const ACTIVITY_KEY = 'scorecard'
const CATEGORY_IDS = ['appearance', 'construction', 'draw', 'burn', 'flavor', 'pairing']

function calcOverall(cats) {
  const vals = Object.values(cats).filter(v => v !== null && v !== undefined)
  if (!vals.length) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

function RatingDots({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'rgba(229,226,225,0.55)', width: 32, flexShrink: 0, fontFamily: 'Georgia, serif' }}>
        {value !== null && value !== undefined ? `${value}/5` : '—/5'}
      </span>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${label} ${n} out of 5${value === n ? ' (current)' : ''}`}
          aria-pressed={value === n}
          onClick={() => { triggerHaptic('light'); onChange(n === value ? null : n) }}
          style={{
            width: 28, height: 28,
            minWidth: 28, minHeight: 28,
            borderRadius: '50%',
            border: `2px solid ${n <= (value || 0) ? GOLD : BORDER}`,
            background: n <= (value || 0) ? GOLD : 'transparent',
            cursor: 'pointer',
            padding: 0,
            outline: 'none',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

export default function Scorecard({ onBack, onComplete } = {}) {
  const { awardSessionRewards, session, loadTastingDraft, saveTastingDraft, submitScorecard: submitScorecardEvidence } = useGuestSession()
  const { journey, setScorecard } = useSmokeCraftJourney()
  const { managementSync, saveSnapshot } = useSmokeCraftServerJourney()
  const navigate = useNavigate()

  const smokeCraft  = session?.smokeCraft || {}
  const cigarDetails = readCigarDetails(smokeCraft, journey)
  const pairingDetails = smokeCraft?.pairingSelections || null

  const firstThird  = smokeCraft?.firstThird  || null
  const secondThird = smokeCraft?.secondThird  || null

  // Required-Interaction Closure Package B: the server-authoritative
  // scorecard draft (smokecraft_tasting_drafts, activityKey='scorecard'
  // — the same table/routes Package A's Sessions 8/12/16 and Mini
  // Tasting already use) is the source of truth on entry —
  // localStorage/journey state is never treated as authority.
  const [phase, setPhase] = useState('loading')
  const [sc, setSc] = useState({ ...EMPTY_STATE })
  const [draftVersion, setDraftVersion] = useState(0)
  const [saveStatus, setSave] = useState('idle') // idle | saving | saved | error | conflict
  const [draftLocked, setDraftLocked] = useState(false)
  const [done, setDone]       = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    let cancelled = false
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (cancelled) return
      if (!result.ok) { setPhase('error'); return }
      const d = result.draftData || {}
      setSc({
        ...EMPTY_STATE,
        categories: { ...EMPTY_STATE.categories, ...(d.categories || {}) },
        meta: { ...EMPTY_STATE.meta, ...(d.meta || {}) },
        personalNotes: d.personalNotes || '',
      })
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
    return () => { cancelled = true }
  }, [loadTastingDraft])

  function handleRetryLoad() {
    setPhase('loading')
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (!result.ok) { setPhase('error'); return }
      const d = result.draftData || {}
      setSc({
        ...EMPTY_STATE,
        categories: { ...EMPTY_STATE.categories, ...(d.categories || {}) },
        meta: { ...EMPTY_STATE.meta, ...(d.meta || {}) },
        personalNotes: d.personalNotes || '',
      })
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
  }

  // Mirror into local journey state too (used for the in-progress UI
  // only — the server draft above remains the authoritative source read
  // on entry/reload).
  useEffect(() => {
    if (phase !== 'ready') return
    setScorecard({ ...sc, overall: calcOverall(sc.categories) })
  }, [phase, sc]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced server-authoritative draft save — partial ratings only,
  // never completion or XP. A 409 (another tab/device saved first, or
  // the session is already completed) adopts the server's current state
  // rather than silently overwriting it.
  useEffect(() => {
    if (phase !== 'ready' || done || draftLocked) return
    const t = setTimeout(() => {
      setSave('saving')
      saveTastingDraft(ACTIVITY_KEY, { categories: sc.categories, personalNotes: sc.personalNotes, meta: sc.meta }, draftVersion).then(result => {
        if (result.alreadyCompleted) { setSave('idle'); setDraftLocked(true); return }
        if (result.conflict) {
          const d = result.current.draftData || {}
          setSc(prev => ({ ...prev, categories: { ...EMPTY_STATE.categories, ...(d.categories || {}) }, meta: { ...EMPTY_STATE.meta, ...(d.meta || {}) }, personalNotes: d.personalNotes || '' }))
          setDraftVersion(result.current.version)
          setSave('conflict')
          return
        }
        if (!result.ok) { setSave('error'); return }
        setDraftVersion(result.current.version)
        setSave('saved')
      })
    }, 1200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sc, done, draftVersion, draftLocked])

  function setCategory(id, val) {
    triggerHaptic('light')
    setSc(prev => ({ ...prev, categories: { ...prev.categories, [id]: val } }))
  }

  function setMeta(key, val) {
    setSc(prev => ({ ...prev, meta: { ...prev.meta, [key]: val } }))
  }

  function setNotes(val) {
    setSc(prev => ({ ...prev, personalNotes: val }))
  }

  function handleSaveDraft() {
    if (phase !== 'ready' || done || draftLocked) return
    triggerHaptic('light')
    setSave('saving')
    saveTastingDraft(ACTIVITY_KEY, { categories: sc.categories, personalNotes: sc.personalNotes, meta: sc.meta }, draftVersion).then(result => {
      if (result.alreadyCompleted) { setSave('idle'); setDraftLocked(true); return }
      if (result.conflict) {
        const d = result.current.draftData || {}
        setSc(prev => ({ ...prev, categories: { ...EMPTY_STATE.categories, ...(d.categories || {}) }, meta: { ...EMPTY_STATE.meta, ...(d.meta || {}) }, personalNotes: d.personalNotes || '' }))
        setDraftVersion(result.current.version)
        setSave('conflict')
        return
      }
      if (!result.ok) { setSave('error'); return }
      setDraftVersion(result.current.version)
      setSave('saved')
    })
  }

  async function handleContinue() {
    if (done) return
    const missing = CATEGORY_IDS.filter(id => sc.categories[id] === null || sc.categories[id] === undefined)
    if (missing.length > 0) {
      setSubmitError('Rate all 6 categories before continuing.')
      return
    }
    setSubmitError(null)
    setDone(true)
    triggerHaptic('medium')

    const snap = { ...sc, savedAt: Date.now(), overall: calcOverall(sc.categories) }
    setScorecard(snap)

    // Force a final, synchronous draft save before submitting evidence —
    // the debounced autosave (1200ms) may not have fired yet if Continue
    // is clicked quickly after the last rating, which silently left the
    // server-side draft stale/incomplete even though real evidence was
    // submitted below, making the ratings appear "lost" on revisit.
    // Best-effort — never blocks the real evidence submission.
    saveTastingDraft(ACTIVITY_KEY, { categories: sc.categories, personalNotes: sc.personalNotes, meta: sc.meta }, draftVersion).catch(() => {})

    // Required-Interaction Closure Package B: real, complete scorecard
    // evidence is submitted server-side BEFORE either completion path
    // below runs — completeSession() independently re-verifies this
    // evidence exists, so this is a real, server-enforced gate, not a
    // client-trusted claim. The server computes and owns the overall
    // score; the client never submits its own "overall"/"passed" value.
    const result = await submitScorecardEvidence(sc.categories, sc.personalNotes, sc.meta)
    if (!result.ok) {
      setDone(false)
      setSubmitError('Unable to save your scorecard right now. Please try again.')
      return
    }
    setSc(prev => ({ ...prev, submittedScorecardId: result.data?.overall != null ? String(result.data.overall) : prev.submittedScorecardId }))

    if (!onComplete) awardSessionRewards('scorecard')
    // Meaningful checkpoint: save a real server snapshot including the
    // scorecard just submitted — only if a server journey already
    // exists (established at START/RESUME). Never creates a journey
    // here, and never blocks navigation on the result.
    if (managementSync.serverJourneyId) {
      saveSnapshot({ ...mapJourneyToSnapshotPayload({ ...journey, scorecard: snap }), completionState: 'in_progress' }).catch(() => {})
    }
    if (onComplete) {
      onComplete()
      return
    }
    navigate('/smokecraft/ai-summary')
  }

  const overall    = calcOverall(sc.categories)
  const filledCount = Object.values(sc.categories).filter(v => v !== null).length

  if (phase === 'loading') {
    return (
      <div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: '#050505', color: 'rgba(229,226,225,.7)', fontFamily: 'Georgia, serif' }}>
        Loading your saved scorecard…
      </div>
    )
  }
  if (phase === 'error') {
    return (
      <div role="alert" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#050505', color: 'rgba(229,170,100,0.9)', fontFamily: 'Georgia, serif' }}>
        <p style={{ margin: 0 }}>Something went wrong loading your saved scorecard.</p>
        <button type="button" onClick={handleRetryLoad} style={{ minHeight: 44, padding: '0 18px', borderRadius: 20, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={pageShellStyle}>
        <div style={heroBannerStyle}>
          <div aria-hidden="true" style={{ fontSize: 40 }}>📋</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: GOLD_DIM, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>SmokeCraft 360 — Scorecard</div>
            <h1 style={{ margin: '4px 0 6px', color: CREAM, fontSize: 'clamp(26px,3.4vw,36px)' }}>Your Complete Cigar Review</h1>
            {cigarDetails && (
              <p style={{ margin: 0, color: 'rgba(229,226,225,.75)', fontSize: 'clamp(13px,1.4vw,15px)' }}>
                <strong style={{ color: GOLD }}>{cigarDetails.name}</strong> — {cigarDetails.country} · {cigarDetails.type}
              </p>
            )}
          </div>
          {overall !== null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: GOLD_DIM, textTransform: 'uppercase', letterSpacing: '.08em' }}>Overall</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: GOLD }}>{overall}/5</div>
            </div>
          )}
        </div>

        <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
          <div style={sectionLabelStyle}>Rating Categories</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
            {CATEGORIES.map(cat => (
              <div key={cat.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, justifyContent: 'space-between' }}>
                <div style={{ minWidth: 160 }}>
                  <div style={{ color: CREAM, fontSize: 14, fontFamily: 'Georgia, serif', fontWeight: 700 }}>{cat.label}</div>
                  <div style={{ color: 'rgba(229,226,225,0.42)', fontSize: 11.5, fontFamily: 'Georgia, serif' }}>{cat.hint}</div>
                </div>
                <RatingDots label={cat.label} value={sc.categories[cat.id]} onChange={val => setCategory(cat.id, val)} />
              </div>
            ))}
          </div>
          {overall !== null && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(229,226,225,0.6)', fontSize: 12.5 }}>{filledCount}/6 categories rated</span>
                <span style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>{overall}/5</span>
              </div>
              <div style={{ height: 4, background: 'rgba(233,193,118,0.15)', borderRadius: 2, marginTop: 8 }}>
                <div style={{ height: '100%', width: `${(overall / 5) * 100}%`, background: GOLD, borderRadius: 2 }} />
              </div>
            </div>
          )}
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={sectionLabelStyle}>Session Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {[
                { key: 'durationMinutes', label: 'Duration (min)', placeholder: 'e.g. 60', max: 240 },
                { key: 'puffCount',       label: 'Puff Count',     placeholder: 'approx.', max: 500 },
                { key: 'relightCount',    label: 'Relights',       placeholder: '0',       max: 20  },
              ].map(({ key, label, placeholder, max }) => (
                <label key={key} style={{ display: 'block' }}>
                  <div style={{ color: 'rgba(229,226,225,0.65)', fontSize: 12, fontFamily: 'Georgia, serif', marginBottom: 5 }}>{label}</div>
                  <input
                    type="number"
                    min={0}
                    max={max}
                    placeholder={placeholder}
                    value={sc.meta[key] ?? ''}
                    onChange={e => setMeta(key, e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    style={{
                      width: '100%', boxSizing: 'border-box', minHeight: 40,
                      background: '#0d1420', border: `1px solid ${BORDER}`,
                      borderRadius: 6, color: CREAM, fontSize: 13.5,
                      padding: '8px 10px', fontFamily: 'Georgia, serif', outline: 'none',
                    }}
                  />
                </label>
              ))}
            </div>
            {pairingDetails?.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                <div style={{ color: GOLD_DIM, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Pairing</div>
                <div style={{ color: GOLD, fontSize: 13 }}>{pairingDetails.join(' + ')}</div>
              </div>
            )}
            {(firstThird?.notesSelected?.length > 0 || secondThird?.notesSelected?.length > 0) && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {firstThird?.notesSelected?.length > 0 && (
                  <div>
                    <div style={{ color: GOLD_DIM, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>First Third</div>
                    <div style={{ color: 'rgba(229,226,225,0.7)', fontSize: 12 }}>{firstThird.notesSelected.join(' · ')}</div>
                  </div>
                )}
                {secondThird?.notesSelected?.length > 0 && (
                  <div>
                    <div style={{ color: GOLD_DIM, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Second Third</div>
                    <div style={{ color: 'rgba(229,226,225,0.7)', fontSize: 12 }}>{secondThird.notesSelected.join(' · ')}</div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={sectionLabelStyle}>Final Impressions &amp; Personal Notes</div>
            <textarea
              aria-label="Personal tasting notes"
              placeholder="Describe your overall experience, standout moments, and what you would order again…"
              value={sc.personalNotes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              style={{
                width: '100%', boxSizing: 'border-box', marginTop: 10, resize: 'vertical',
                background: '#0d1420', border: `1px solid ${BORDER}`, borderRadius: 8,
                color: CREAM, fontSize: 13.5, fontFamily: 'Georgia, serif',
                padding: 12, outline: 'none', lineHeight: 1.5,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={phase !== 'ready' || done || draftLocked}
                style={{
                  minHeight: 36, background: 'transparent', border: `1px solid ${BORDER}`,
                  borderRadius: 6, color: GOLD, fontSize: 11.5, fontFamily: 'Georgia, serif',
                  padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                }}
              >
                Save Draft
              </button>
              {saveStatus === 'saving' && <span style={{ color: 'rgba(229,226,225,0.5)', fontSize: 11.5 }}>Saving…</span>}
              {saveStatus === 'saved' && <span style={{ color: GOLD, fontSize: 11.5 }}>✓ Saved</span>}
              {sc.savedAt && saveStatus === 'idle' && (
                <span style={{ color: 'rgba(229,226,225,0.32)', fontSize: 11 }}>
                  Saved {new Date(sc.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </section>
        </div>

        {submitError && (
          <div role="alert" style={{
            borderRadius: 9, padding: 12, border: '1px solid rgba(255,150,150,.45)',
            background: 'rgba(120,20,20,.35)', color: '#ffdada', fontSize: 13,
          }}>
            {submitError}
          </div>
        )}

        <div style={{ height: 90 }} aria-hidden="true" />
      </div>

      <SmokeCraftLessonInfoButton
        sessionNumber={19} totalSessions={TOTAL_SESSIONS} phase={5} totalPhases={TOTAL_VISITS}
        title="Rate Every Category" whyItMatters={ENRICHMENT_19?.whyItMatters} goldenBox={ENRICHMENT_19?.goldenBox}
      />

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Continue to AI Summary →'}
        onPrimary={handleContinue}
        primaryDisabled={done}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/final-third'))}
      />
    </SmokeCraftScreenShell>
  )
}
