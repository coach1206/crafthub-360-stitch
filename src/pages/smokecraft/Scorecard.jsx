import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getRankFromXP } from '../../constants/session.js'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftMenuButton from '../../components/smokecraft/SmokeCraftMenuButton.jsx'

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD   = '#E9C176'
const DARK   = '#0a0603'
const DIM    = 'rgba(229,226,225,0.55)'
const PANEL  = 'rgba(10,6,3,0.96)'
const BORDER = 'rgba(233,193,118,0.18)'
const GREEN  = '#5adb8e'
const RED    = '#e05a5a'
const AMBER  = '#f0a830'

const LS_KEY = 'sc_scorecard_v1'

// ── Scoring weights (matches server) ─────────────────────────────────────────
const WEIGHTS = { flavor: 0.30, draw: 0.20, burn: 0.15, construction: 0.15, appearance: 0.10, pairing: 0.10 }
const MAX_SCORE = 25   // each category out of 25

const CATEGORY_DEFS = {
  appearance:   { label: 'Appearance',   desc: 'Wrapper quality, color uniformity, visible imperfections, overall presentation.' },
  construction: { label: 'Construction', desc: 'Cap integrity, foot formation, wrapper seam, overall roll consistency.' },
  draw:         { label: 'Draw',         desc: 'Air resistance from cold to warm — the feel before and after lighting.' },
  burn:         { label: 'Burn',         desc: 'Line evenness, ash firmness, self-correction ability across all three thirds.' },
  flavor:       { label: 'Flavor',       desc: 'Complexity, evolution across thirds, balance, finish, and character.' },
  pairing:      { label: 'Pairing',      desc: 'How well your selected pairing complemented or contrasted the cigar profile.' },
}

// ── Score label thresholds ────────────────────────────────────────────────────
function getScoreLabel(overall) {
  if (overall == null) return { label: null, color: DIM }
  if (overall >= 90) return { label: 'Exceptional Smoke',  color: GREEN }
  if (overall >= 80) return { label: 'Outstanding Smoke',  color: GREEN }
  if (overall >= 70) return { label: 'Very Good Smoke',    color: GOLD  }
  if (overall >= 60) return { label: 'Good Smoke',         color: GOLD  }
  if (overall >= 50) return { label: 'Average Smoke',      color: AMBER }
  return { label: 'Below Average', color: RED }
}

// ── Calculate overall score ───────────────────────────────────────────────────
function calcOverall(cats) {
  let total = 0, totalWeight = 0
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const raw = cats[key]
    if (raw != null && raw > 0) {
      // Convert raw 1–25 to 0–100
      const pct = (raw / MAX_SCORE) * 100
      total += pct * weight
      totalWeight += weight
    }
  }
  if (totalWeight === 0) return null
  return Math.round((total / totalWeight) * 10) / 10
}

// ── Persistence helpers ───────────────────────────────────────────────────────
const EMPTY_CATS = { appearance: null, construction: null, draw: null, burn: null, flavor: null, pairing: null }
const EMPTY_META = { durationMinutes: null, puffCount: null, relightCount: 0 }
const EMPTY_STATE = { categories: { ...EMPTY_CATS }, meta: { ...EMPTY_META }, personalNotes: '', savedAt: null, submittedScorecardId: null }

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...EMPTY_STATE, ...JSON.parse(raw) } : { ...EMPTY_STATE }
  } catch { return { ...EMPTY_STATE } }
}
function saveLocal(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ...s, savedAt: s.savedAt || Date.now() })) } catch {}
}

// ── Session data readers ──────────────────────────────────────────────────────
function readTastingData(smokeCraft) {
  const firstThird  = smokeCraft?.firstThird  || null
  const secondThird = smokeCraft?.secondThird  || null
  const finalThird  = (() => {
    try { return JSON.parse(sessionStorage.getItem('smokecraftFinalThird') || 'null') } catch { return null }
  })()
  const flavorMemory = (() => {
    try { return JSON.parse(sessionStorage.getItem('smokecraftFlavorMemory') || 'null') } catch { return null }
  })()
  return { firstThird, secondThird, finalThird, flavorMemory }
}

function readCigarDetails(smokeCraft) {
  const rec = smokeCraft?.selectedHumidorRecommendation
  const fmt = smokeCraft?.selectedFormat
  if (rec) return {
    name:    rec.selectedCigarName || '—',
    country: rec.selectedCigarCountry || '—',
    type:    rec.selectedCigarType || '—',
    size:    fmt?.name || '—',
  }
  if (fmt) return { name: fmt.name || '—', country: '—', type: '—', size: fmt.name || '—' }
  return null
}

function readPairingDetails(smokeCraft) {
  const pairings = smokeCraft?.pairingSelections
  if (pairings?.length) return pairings
  // Fall back to sessionStorage from PairingLab
  return null
}

// ── Score ring component ──────────────────────────────────────────────────────
function ScoreRing({ value, max = 25, size = 54, color = GOLD }) {
  const pct = value != null ? Math.max(0, Math.min(1, value / max)) : 0
  const r = (size - 6) / 2, cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  const dash = circ * pct

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(233,193,118,0.1)" strokeWidth={4} />
      {value != null && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
      )}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: value != null ? 13 : 10, fontFamily: 'Georgia, serif', fontWeight: 700, fill: value != null ? '#fff' : 'rgba(229,226,225,0.25)' }}>
        {value != null ? value : '—'}
      </text>
    </svg>
  )
}

// ── Numeric rating slider 0–25 ────────────────────────────────────────────────
function RatingSlider({ category, value, onChange }) {
  const def = CATEGORY_DEFS[category]
  const pct = value != null ? Math.round((value / MAX_SCORE) * 100) : null
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <ScoreRing value={value} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, color: GOLD, fontWeight: 700, fontFamily: 'Georgia, serif' }}>{def.label}</span>
            <span style={{ fontSize: 15, color: value != null ? GOLD : DIM }}>
              {value != null ? `${value}/25 (${pct}%)` : 'Not rated'}
            </span>
          </div>
          <div style={{ fontSize: 15, color: DIM, lineHeight: 1.4, marginTop: 1 }}>{def.desc}</div>
        </div>
      </div>
      <input type="range" min={0} max={25} value={value ?? 0}
        onChange={e => { const v = Number(e.target.value); onChange(v === 0 ? null : v) }}
        data-slider={`score-${category}`}
        aria-label={`${def.label} score (0 to 25)`}
        style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
        <span style={{ fontSize: 15, color: 'rgba(229,226,225,0.28)' }}>0</span>
        <span style={{ fontSize: 15, color: 'rgba(229,226,225,0.28)' }}>25</span>
      </div>
    </div>
  )
}

// ── Third summary row ─────────────────────────────────────────────────────────
function ThirdSummary({ label, data, sessionKey }) {
  // Try sessionStorage key for finalThird
  const stored = (() => {
    if (!sessionKey) return null
    try { return JSON.parse(sessionStorage.getItem(sessionKey) || 'null') } catch { return null }
  })()

  const d = stored || data
  const hasData = d && (d.notesSelected?.length > 0 || d.status === 'complete' || d.finalStrength)

  if (!hasData) {
    return (
      <div style={{ fontSize: 15, color: DIM, fontStyle: 'italic', padding: '2px 0' }}>
        {label}: No tasting data recorded.
      </div>
    )
  }

  return (
    <div style={{ fontSize: 15, color: DIM, lineHeight: 1.6, padding: '2px 0' }}>
      <span style={{ color: GOLD, fontWeight: 600 }}>{label} </span>
      {d.notesSelected?.length > 0 && <span>Notes: <span style={{ color: GOLD }}>{d.notesSelected.slice(0, 4).join(', ')}</span>{d.notesSelected.length > 4 ? ` +${d.notesSelected.length - 4}` : ''} </span>}
      {d.finalStrength && <span>Strength: <span style={{ color: GOLD }}>{d.finalStrength}</span> </span>}
      {d.strength && !d.finalStrength && <span>Strength: <span style={{ color: GOLD }}>{d.strength}</span> </span>}
      {d.overallRating && <span>Rating: <span style={{ color: GOLD }}>{d.overallRating}/5★</span></span>}
    </div>
  )
}

// ── Manual session meta entry ─────────────────────────────────────────────────
function MetaField({ label, value, min, max, unit, onChange, dataAttr }) {
  return (
    <div>
      <div style={{ fontSize: 15, color: GOLD, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input type="number" min={min} max={max} value={value ?? ''}
          onChange={e => { const v = e.target.value; onChange(v === '' ? null : Number(v)) }}
          placeholder="—"
          data-meta={dataAttr}
          style={{
            width: 60, background: 'rgba(255,255,255,0.06)',
            border: `1px solid rgba(233,193,118,0.3)`, borderRadius: 6,
            color: '#fff', fontSize: 15, padding: '5px 8px',
            fontFamily: 'Georgia, serif', boxSizing: 'border-box',
          }}
        />
        <span style={{ fontSize: 15, color: DIM }}>{unit}</span>
      </div>
    </div>
  )
}

// ── Section helpers ───────────────────────────────────────────────────────────
function SL({ children }) {
  return <div style={{ fontSize: 15, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{children}</div>
}
function HR() { return <div style={{ borderTop: `1px solid ${BORDER}`, margin: '10px 0' }} /> }

// ── Main component ────────────────────────────────────────────────────────────
export default function Scorecard() {
  const { awardSessionRewards, session } = useGuestSession()
  const navigate = useNavigate()

  const smokeCraft = session?.smokeCraft || {}
  const currentXP  = session?.xp  || 0
  const currentRank = session?.rank || getRankFromXP(currentXP).name
  const stepsCount = session?.completedSteps?.length || 0
  const badges = session?.badges || []

  const cigarDetails  = readCigarDetails(smokeCraft)
  const pairingDetails = readPairingDetails(smokeCraft)
  const { firstThird, secondThird, finalThird, flavorMemory } = readTastingData(smokeCraft)

  const [sc, setSc] = useState(loadLocal)
  const [done, setDone]         = useState(false)
  const [apiStatus, setApiStatus] = useState('idle')
  const [submitted, setSubmitted] = useState(null)   // server response
  const [expandNotes, setExpandNotes] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)

  useEffect(() => { saveLocal(sc) }, [sc])

  const overall = calcOverall(sc.categories)
  const scoreInfo = getScoreLabel(overall)
  const xpToEarn  = 100  // scorecard awards 100 XP per smokecraftRewards.js

  function setCategory(cat, val) {
    setSc(prev => ({ ...prev, categories: { ...prev.categories, [cat]: val } }))
  }
  function setMeta(field, val) {
    setSc(prev => ({ ...prev, meta: { ...prev.meta, [field]: val } }))
  }

  const submitScorecard = useCallback(async (data, overall) => {
    setApiStatus('saving')
    try {
      const r = await fetch('/api/smokecraft/scorecard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.sessionId || 'local-session',
          guestId:   session?.guestId   || 'guest',
          categories: data.categories,
          cigarDetails,
          pairingDetails: pairingDetails ? { selectedPairings: pairingDetails } : null,
          tastingData: { firstThird, secondThird, finalThird },
          sessionMeta: {
            ...data.meta,
            xpAtSubmission: currentXP,
            rank: currentRank,
            stepsCompleted: stepsCount,
          },
          notes: data.personalNotes,
        }),
      })
      if (!r.ok) throw new Error(`API ${r.status}`)
      const result = await r.json()
      setApiStatus('saved')
      setSubmitted(result.scorecard)
      setSc(prev => ({ ...prev, submittedScorecardId: result.scorecard?.scorecardId, savedAt: Date.now() }))
    } catch (e) {
      const offline = !navigator.onLine || e.message.includes('Failed to fetch')
      setApiStatus(offline ? 'offline' : 'error')
    }
  }, [session, cigarDetails, pairingDetails, firstThird, secondThird, finalThird, currentXP, currentRank, stepsCount])

  async function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    setSc(prev => ({ ...prev, savedAt: Date.now() }))
    await submitScorecard(sc, overall)
    awardSessionRewards('scorecard')
    navigate('/smokecraft/final-review')
  }

  const completedCount = Object.values(sc.categories).filter(v => v != null && v > 0).length
  const totalCats      = Object.keys(WEIGHTS).length
  const isPartial      = completedCount > 0 && completedCount < totalCats
  const isComplete     = completedCount === totalCats

  // Rank the badge earned from this step
  const scorecardBadges = badges.filter(b => ['sc-cigar-review', 'sc-scorecard'].includes(b.id))

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft/Scorecard.png"
        alt="SmokeCraft Scorecard — Your Complete Cigar Review"
      />

      {/* Gradient mask — covers all baked scores, rankings, XP, cigar details */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(10,6,3,0.99) 0%, rgba(10,6,3,0.7) 50%, rgba(10,6,3,0.08) 100%)',
      }} />

      {/* Session strip */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 401,
        padding: '8px 16px',
        background: 'linear-gradient(to bottom, rgba(10,6,3,0.94) 70%, transparent)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ fontSize: 15, color: GOLD, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Scorecard — Session 16
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 15, color: DIM }}>Steps: <span style={{ color: GOLD, fontWeight: 700 }}>{stepsCount}</span></span>
            <span style={{ fontSize: 15, color: DIM }}>
              XP: <span style={{ color: GOLD, fontWeight: 700 }}>{currentXP}</span>
              <span style={{ color: 'rgba(233,193,118,0.4)', fontSize: 10 }}> +{xpToEarn}</span>
            </span>
            <span style={{ fontSize: 15, color: DIM }}>Rank: <span style={{ color: GOLD, fontWeight: 700 }}>{currentRank}</span></span>
          </div>
        </div>
      </div>

      {/* Main scrollable panel */}
      <div style={{
        position: 'fixed', bottom: 110, left: 0, right: 0,
        zIndex: 400, padding: '0 16px',
        maxHeight: 'calc(100vh - 190px)', overflowY: 'auto',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: PANEL, border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: '14px 14px',
          maxWidth: 500, margin: '0 auto',
        }}>

          {/* ── Live Overall Score ──────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            {/* Large score ring */}
            <div style={{ position: 'relative' }}>
              <ScoreRing value={overall} max={100} size={80}
                color={scoreInfo.color === DIM ? 'rgba(233,193,118,0.25)' : scoreInfo.color} />
              {overall != null && (
                <div style={{ position: 'absolute', bottom: -14, left: 0, right: 0, textAlign: 'center', fontSize: 15, color: DIM }}>/ 100</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              {overall != null ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 700, color: scoreInfo.color, fontFamily: 'Georgia, serif', lineHeight: 1.1 }}>
                    {scoreInfo.label}
                  </div>
                  <div style={{ fontSize: 15, color: DIM, marginTop: 3, lineHeight: 1.4 }}>
                    Calculated from {completedCount}/{totalCats} categories rated
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 15, color: 'rgba(229,226,225,0.3)', fontFamily: 'Georgia, serif' }}>No score yet</div>
                  <div style={{ fontSize: 15, color: DIM, marginTop: 3 }}>
                    {isPartial ? `${completedCount}/${totalCats} categories rated — complete all for final score` : 'Rate all 6 categories to generate your score'}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          {(isPartial || isComplete) && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ height: 3, background: 'rgba(233,193,118,0.12)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(completedCount / totalCats) * 100}%`, background: isComplete ? GREEN : GOLD, borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 15, color: DIM, marginTop: 2, textAlign: 'right' }}>
                {isComplete ? 'All categories rated' : `${completedCount}/${totalCats} rated`}
              </div>
            </div>
          )}

          {/* ── Category Ratings ────────────────────── */}
          <SL>Category Scores (0–25 each)</SL>
          {Object.keys(WEIGHTS).map(cat => (
            <RatingSlider key={cat} category={cat} value={sc.categories[cat]}
              onChange={v => { setCategory(cat, v); setActiveCategory(cat) }} />
          ))}

          {/* Active category tooltip */}
          {activeCategory && (
            <div style={{
              background: 'rgba(233,193,118,0.07)', border: `1px solid ${BORDER}`,
              borderRadius: 8, padding: '6px 10px', marginBottom: 8, fontSize: 15, color: DIM,
            }}>
              <span style={{ color: GOLD, fontWeight: 700 }}>{CATEGORY_DEFS[activeCategory].label}: </span>
              {CATEGORY_DEFS[activeCategory].desc}
            </div>
          )}

          {/* ── Cigar Details ────────────────────────── */}
          <HR />
          <div data-section="cigar-details">
          <SL>Cigar Details</SL>
          {cigarDetails ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px', fontSize: 10 }}>
              <div style={{ color: DIM }}>Name <span style={{ color: GOLD }}>{cigarDetails.name}</span></div>
              <div style={{ color: DIM }}>Origin <span style={{ color: GOLD }}>{cigarDetails.country}</span></div>
              <div style={{ color: DIM }}>Type <span style={{ color: GOLD }}>{cigarDetails.type}</span></div>
              <div style={{ color: DIM }}>Size <span style={{ color: GOLD }}>{cigarDetails.size}</span></div>
            </div>
          ) : (
            <div style={{ fontSize: 15, color: DIM, fontStyle: 'italic' }}>
              No cigar selection recorded. Complete Humidor Match to populate these fields.
            </div>
          )}

          </div>

          {/* ── Pairing ─────────────────────────────── */}
          <HR />
          <div data-section="pairing-summary">
          <SL>Pairing</SL>
          {pairingDetails?.length > 0 ? (
            <div style={{ fontSize: 15, color: GOLD }}>{pairingDetails.join(', ')}</div>
          ) : (
            <div style={{ fontSize: 15, color: DIM, fontStyle: 'italic' }}>No pairing selection recorded.</div>
          )}

          </div>

          {/* ── Tasting Summaries ───────────────────── */}
          <HR />
          <div data-section="tasting-summary">
          <SL>Tasting Journey Summary</SL>
          <ThirdSummary label="First Third"  data={firstThird}  />
          <ThirdSummary label="Second Third" data={secondThird} />
          <ThirdSummary label="Final Third"  data={finalThird}  sessionKey="smokecraftFinalThird" />
          {flavorMemory?.tasteTags?.length > 0 && (
            <div style={{ fontSize: 15, color: DIM, marginTop: 4 }}>
              Flavor Memory tags: <span style={{ color: GOLD }}>{flavorMemory.tasteTags.slice(0, 6).join(', ')}{flavorMemory.tasteTags.length > 6 ? ' …' : ''}</span>
            </div>
          )}

          </div>

          {/* ── Session Meta ────────────────────────── */}
          <HR />
          <SL>Session Metrics</SL>
          <div style={{ fontSize: 15, color: DIM, marginBottom: 8 }}>
            Values come from your session. Enter manually if not tracked automatically.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <MetaField label="Duration" value={sc.meta.durationMinutes} min={1} max={240} unit="min" dataAttr="duration" onChange={v => setMeta('durationMinutes', v)} />
            <MetaField label="Puff Count" value={sc.meta.puffCount} min={0} max={300} unit="puffs" dataAttr="puff-count" onChange={v => setMeta('puffCount', v)} />
            <MetaField label="Relights" value={sc.meta.relightCount} min={0} max={10} unit="times" dataAttr="relight-count" onChange={v => setMeta('relightCount', v)} />
          </div>

          {/* ── XP + Badge ──────────────────────────── */}
          <HR />
          <SL>Rewards</SL>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 15, color: DIM }}>
              XP earned this session: <span style={{ color: GOLD, fontWeight: 700 }}>{currentXP}</span>
              {!done && <span style={{ color: 'rgba(233,193,118,0.5)' }}> (+{xpToEarn} on submit)</span>}
            </div>
            <div style={{ fontSize: 15, color: DIM }}>
              Current rank: <span style={{ color: GOLD, fontWeight: 700 }}>{currentRank}</span>
            </div>
          </div>
          {scorecardBadges.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {scorecardBadges.map(b => (
                <div key={b.id} style={{
                  background: 'rgba(233,193,118,0.1)', border: `1px solid rgba(233,193,118,0.3)`,
                  borderRadius: 8, padding: '3px 10px', fontSize: 15, color: GOLD,
                }}>{b.label}</div>
              ))}
            </div>
          )}
          {scorecardBadges.length === 0 && (
            <div style={{ fontSize: 15, color: DIM, fontStyle: 'italic', marginTop: 4 }}>
              Badges awarded on submit — not shown until earned.
            </div>
          )}

          {/* ── Personal Notes ──────────────────────── */}
          <HR />
          <button type="button" onClick={() => setExpandNotes(p => !p)}
            aria-label="Toggle Personal Notes"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', minHeight: 44, width: '100%', textAlign: 'left' }}>
            <SL>{expandNotes ? '▾' : '▸'} Personal Notes</SL>
          </button>
          {expandNotes && (
            <textarea value={sc.personalNotes}
              onChange={e => setSc(prev => ({ ...prev, personalNotes: e.target.value }))}
              placeholder="Final impressions, would you recommend this cigar?"
              maxLength={500} rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                borderRadius: 8, color: '#fff', fontSize: 14, padding: '8px 10px',
                fontFamily: 'Georgia, serif', resize: 'vertical', marginTop: 4,
              }}
            />
          )}

          {/* ── Submitted result ────────────────────── */}
          {submitted && (
            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(90,219,142,0.08)', border: '1px solid rgba(90,219,142,0.3)',
            }}>
              <div style={{ fontSize: 14, color: GREEN, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                {submitted.scoreLabel || 'Scorecard Submitted'}
              </div>
              <div style={{ fontSize: 15, color: DIM, marginTop: 2 }}>
                Score: {submitted.overall}/100 · ID: {submitted.scorecardId}
              </div>
              {submitted.scoreDescription && (
                <div style={{ fontSize: 15, color: DIM, marginTop: 3 }}>{submitted.scoreDescription}</div>
              )}
            </div>
          )}

          {/* ── API Status ──────────────────────────── */}
          {apiStatus !== 'idle' && !submitted && (
            <div style={{
              fontSize: 15, fontWeight: 700, marginTop: 8, padding: '4px 8px', borderRadius: 6, textAlign: 'center',
              color: apiStatus === 'saving' ? GOLD : apiStatus === 'offline' ? AMBER : RED,
              background: apiStatus === 'saving' ? 'rgba(233,193,118,0.08)' : apiStatus === 'offline' ? 'rgba(240,168,48,0.08)' : 'rgba(224,90,90,0.08)',
              border: `1px solid ${apiStatus === 'saving' ? 'rgba(233,193,118,0.3)' : apiStatus === 'offline' ? 'rgba(240,168,48,0.3)' : 'rgba(224,90,90,0.3)'}`,
            }}>
              {apiStatus === 'saving'  && 'Submitting scorecard…'}
              {apiStatus === 'offline' && 'Saved locally — backend offline'}
              {apiStatus === 'error'   && 'Submit error — data retained locally'}
            </div>
          )}

          {sc.savedAt && apiStatus === 'idle' && (
            <div style={{ fontSize: 15, color: 'rgba(229,226,225,0.28)', textAlign: 'right', marginTop: 4 }}>
              Last saved {new Date(sc.savedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <SmokeCraftMenuButton label="View Menu" />

      <SmokeCraftNavBar
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft/final-third')}
        primary={done ? 'Submitting…' : `Submit Scorecard${isComplete ? ` — ${overall}/100` : ''} →`}
        onPrimary={handleContinue}
      />
    </>
  )
}
