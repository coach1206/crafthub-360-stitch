import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { useSmokeCraftServerJourney } from '../../hooks/useSmokeCraftServerJourney.js'
import { mapJourneyToSnapshotPayload } from '../../services/smokecraft/managementSyncSnapshotMapper.js'
import { getRankFromXP } from '../../constants/session.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const ENRICHMENT_19 = getEducationalEnrichment(19)

const NAT_W = 1448
const NAT_H = 1086

const GOLD = '#E9C176'
const DARK = '#0a0603'
const GLASS = '#050505' // was rgba(5,5,5,0.88) — non-opaque bg let baked image content bleed through, fixed
const BORDER = 'rgba(233,193,118,0.28)'

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

function calcOverall(cats) {
  const vals = Object.values(cats).filter(v => v !== null && v !== undefined)
  if (!vals.length) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

function RatingDots({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: 11, color: 'rgba(229,226,225,0.55)', width: 26, flexShrink: 0, fontFamily: 'Georgia, serif' }}>
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
            width: 20, height: 20,
            borderRadius: '50%',
            border: `2px solid ${n <= (value || 0) ? GOLD : 'rgba(233,193,118,0.3)'}`,
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
  const { awardSessionRewards, session } = useGuestSession()
  const { journey, setScorecard } = useSmokeCraftJourney()
  const { managementSync, saveSnapshot } = useSmokeCraftServerJourney()
  const navigate = useNavigate()

  const smokeCraft  = session?.smokeCraft || {}
  const currentXP   = session?.xp || 0
  const currentRank = session?.rank || getRankFromXP(currentXP).name
  const stepsCount  = session?.completedSteps?.length || 0
  const cigarDetails = readCigarDetails(smokeCraft, journey)
  const pairingDetails = smokeCraft?.pairingSelections || null

  const firstThird  = smokeCraft?.firstThird  || null
  const secondThird = smokeCraft?.secondThird  || null
  const finalThird  = journey.finalThird || null

  const [sc, setSc] = useState(() => {
    const saved = journey.scorecard
    if (!saved) return { ...EMPTY_STATE }
    return {
      ...EMPTY_STATE,
      ...saved,
      categories: { ...EMPTY_STATE.categories, ...(saved.categories || {}) },
      meta: { ...EMPTY_STATE.meta, ...(saved.meta || {}) },
    }
  })
  const [done, setDone]       = useState(false)
  const [saveStatus, setSave] = useState('idle')

  function setCategory(id, val) {
    setSc(prev => {
      const next = { ...prev, categories: { ...prev.categories, [id]: val } }
      setScorecard(next)
      return next
    })
  }

  function setMeta(key, val) {
    setSc(prev => {
      const next = { ...prev, meta: { ...prev.meta, [key]: val } }
      setScorecard(next)
      return next
    })
  }

  function setNotes(val) {
    setSc(prev => {
      const next = { ...prev, personalNotes: val }
      setScorecard(next)
      return next
    })
  }

  function handleSaveDraft() {
    const snap = { ...sc, savedAt: Date.now(), overall: calcOverall(sc.categories) }
    setSc(prev => ({ ...prev, savedAt: snap.savedAt }))
    setScorecard(snap)
    setSave('saved')
    setTimeout(() => setSave('idle'), 2000)
  }

  const submitScorecard = useCallback(async (data) => {
    try {
      const r = await fetch('/api/smokecraft/scorecard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.sessionId || 'local-session',
          guestId: session?.guestId || 'guest',
          categories: data.categories,
          overall: calcOverall(data.categories),
          cigarDetails,
          pairingDetails: pairingDetails ? { selectedPairings: pairingDetails } : null,
          tastingData: { firstThird, secondThird, finalThird },
          sessionMeta: { ...data.meta, xpAtSubmission: currentXP, rank: currentRank, stepsCompleted: stepsCount },
          notes: data.personalNotes,
        }),
      })
      if (r.ok) {
        const result = await r.json()
        setSc(prev => {
          const next = { ...prev, submittedScorecardId: result.scorecard?.scorecardId, savedAt: Date.now() }
          setScorecard(next)
          return next
        })
      }
    } catch {}
  }, [session, cigarDetails, pairingDetails, firstThird, secondThird, finalThird, currentXP, currentRank, stepsCount, setScorecard]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    const snap = { ...sc, savedAt: Date.now(), overall: calcOverall(sc.categories) }
    setScorecard(snap)
    await submitScorecard(snap)
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

  const glassStyle = (extra = {}) => ({
    background: GLASS,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    ...extra,
  })

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.scorecard}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Scorecard — Your Complete Cigar Review"
      >
        {/* Nav mask */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%',
          background: 'linear-gradient(to bottom, transparent, #050505 50%)', pointerEvents: 'none', zIndex: 2 }} />

        {/* ── Cigar summary strip ── */}
        {cigarDetails && (
          <div style={{
            position: 'absolute',
            left: '6%', top: '4%',
            width: '88%',
            ...glassStyle({ padding: '7px 12px', display: 'flex', gap: 16, alignItems: 'center', pointerEvents: 'none' }),
          }}>
            <span style={{ color: GOLD, fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 'clamp(11px,1.05vw,14px)', whiteSpace: 'nowrap' }}>
              {cigarDetails.name}
            </span>
            <span style={{ color: 'rgba(229,226,225,0.5)', fontSize: 'clamp(9px,0.82vw,11px)', fontFamily: 'Georgia, serif' }}>
              {cigarDetails.country} · {cigarDetails.type}
            </span>
            {overall !== null && (
              <span style={{ marginLeft: 'auto', color: GOLD, fontWeight: 700, fontSize: 'clamp(12px,1.15vw,16px)', fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' }}>
                Overall: {overall}/5
              </span>
            )}
          </div>
        )}

        {/* ── Category ratings ── */}
        <div style={{
          position: 'absolute',
          left: '6%', top: '13%',
          width: '54%',
          ...glassStyle({ padding: '10px 14px', pointerEvents: 'auto' }),
        }}>
          <div style={{ fontSize: 10, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 8 }}>
            Rating Categories
          </div>
          {CATEGORIES.map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
              <div style={{ width: 105, flexShrink: 0 }}>
                <div style={{ color: 'rgba(229,226,225,0.9)', fontSize: 'clamp(10px,0.95vw,12px)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{cat.label}</div>
                <div style={{ color: 'rgba(229,226,225,0.38)', fontSize: 'clamp(8px,0.72vw,9px)', fontFamily: 'Georgia, serif' }}>{cat.hint}</div>
              </div>
              <RatingDots
                label={cat.label}
                value={sc.categories[cat.id]}
                onChange={val => setCategory(cat.id, val)}
              />
            </div>
          ))}
          {overall !== null && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(229,226,225,0.6)', fontSize: 10, fontFamily: 'Georgia, serif' }}>{filledCount}/6 categories rated</span>
                <span style={{ color: GOLD, fontWeight: 700, fontSize: 'clamp(12px,1.1vw,15px)', fontFamily: 'Georgia, serif' }}>{overall}/5</span>
              </div>
              <div style={{ height: 3, background: 'rgba(233,193,118,0.15)', borderRadius: 2, marginTop: 5 }}>
                <div style={{ height: '100%', width: `${(overall / 5) * 100}%`, background: GOLD, borderRadius: 2 }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Session meta ── */}
        <div style={{
          position: 'absolute',
          left: '62%', top: '13%',
          width: '32%',
          ...glassStyle({ padding: '10px 12px', pointerEvents: 'auto' }),
        }}>
          <div style={{ fontSize: 10, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 8 }}>
            Session Details
          </div>
          {[
            { key: 'durationMinutes', label: 'Duration (min)', placeholder: 'e.g. 60', max: 240 },
            { key: 'puffCount',       label: 'Puff Count',     placeholder: 'approx.', max: 500 },
            { key: 'relightCount',    label: 'Relights',       placeholder: '0',       max: 20  },
          ].map(({ key, label, placeholder, max }) => (
            <label key={key} style={{ display: 'block', marginBottom: 8 }}>
              <div style={{ color: 'rgba(229,226,225,0.65)', fontSize: 10, fontFamily: 'Georgia, serif', marginBottom: 3 }}>{label}</div>
              <input
                type="number"
                min={0}
                max={max}
                placeholder={placeholder}
                value={sc.meta[key] ?? ''}
                onChange={e => setMeta(key, e.target.value === '' ? null : parseInt(e.target.value, 10))}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(233,193,118,0.28)',
                  borderRadius: 4, color: '#e5e2e1',
                  fontSize: 'clamp(11px,1.0vw,13px)',
                  padding: '5px 8px',
                  fontFamily: 'Georgia, serif',
                  outline: 'none',
                }}
              />
            </label>
          ))}
          {pairingDetails?.length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
              <div style={{ color: 'rgba(233,193,118,0.55)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 3 }}>Pairing</div>
              <div style={{ color: GOLD, fontSize: 10, fontFamily: 'Georgia, serif' }}>{pairingDetails.join(' + ')}</div>
            </div>
          )}
        </div>

        {/* ── Personal notes ── */}
        <div style={{
          position: 'absolute',
          left: '6%', top: '62%',
          width: '88%',
          ...glassStyle({ padding: '10px 12px', pointerEvents: 'auto' }),
        }}>
          <div style={{ fontSize: 10, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 6 }}>
            Final Impressions &amp; Personal Notes
          </div>
          <textarea
            aria-label="Personal tasting notes"
            placeholder="Describe your overall experience, standout moments, and what you would order again…"
            value={sc.personalNotes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(233,193,118,0.22)',
              borderRadius: 4,
              color: '#e5e2e1',
              fontSize: 'clamp(11px,1.0vw,13px)',
              padding: '8px 10px',
              fontFamily: 'Georgia, serif',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.5,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              style={{
                background: 'transparent',
                border: `1px solid ${BORDER}`,
                borderRadius: 4,
                color: GOLD,
                fontSize: 10,
                fontFamily: 'Georgia, serif',
                padding: '5px 12px',
                cursor: 'pointer',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Save Draft
            </button>
            {saveStatus === 'saving' && <span style={{ color: 'rgba(229,226,225,0.5)', fontSize: 10, fontFamily: 'Georgia, serif' }}>Saving…</span>}
            {saveStatus === 'saved' && <span style={{ color: GOLD, fontSize: 10, fontFamily: 'Georgia, serif' }}>✓ Saved</span>}
            {sc.savedAt && saveStatus === 'idle' && (
              <span style={{ color: 'rgba(229,226,225,0.32)', fontSize: 9, fontFamily: 'Georgia, serif' }}>
                Saved {new Date(sc.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* ── Tasting history strip ── */}
        {(firstThird?.notesSelected?.length > 0 || secondThird?.notesSelected?.length > 0) && (
          <div style={{
            position: 'absolute',
            left: '6%', top: '84%',
            width: '88%',
            ...glassStyle({ padding: '7px 12px', display: 'flex', gap: 20, pointerEvents: 'none' }),
          }}>
            {firstThird?.notesSelected?.length > 0 && (
              <div>
                <div style={{ color: 'rgba(233,193,118,0.5)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>First Third</div>
                <div style={{ color: 'rgba(229,226,225,0.7)', fontSize: 10, fontFamily: 'Georgia, serif' }}>{firstThird.notesSelected.join(' · ')}</div>
              </div>
            )}
            {secondThird?.notesSelected?.length > 0 && (
              <div>
                <div style={{ color: 'rgba(233,193,118,0.5)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Second Third</div>
                <div style={{ color: 'rgba(229,226,225,0.7)', fontSize: 10, fontFamily: 'Georgia, serif' }}>{secondThird.notesSelected.join(' · ')}</div>
              </div>
            )}
          </div>
        )}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftLessonInfoButton
        sessionNumber={19} totalSessions={TOTAL_SESSIONS} phase={5} totalPhases={TOTAL_VISITS}
        title="Rate Every Category" whyItMatters={ENRICHMENT_19?.whyItMatters} goldenBox={ENRICHMENT_19?.goldenBox}
      />

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Continue to AI Summary →'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/final-third'))}
      />
    </>
  )
}
