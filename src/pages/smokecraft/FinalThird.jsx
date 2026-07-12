import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD   = '#E9C176'
const DARK   = '#0a0603'
const DIM    = 'rgba(229,226,225,0.55)'
const PANEL  = 'rgba(10,6,3,0.96)'
const BORDER = 'rgba(233,193,118,0.18)'
const GREEN  = '#5adb8e'
const RED    = '#e05a5a'
const AMBER  = '#f0a830'

const LS_KEY = 'sc_final_third_v1'

// ── Flavor catalog (same 18 as Flavor Memory) ─────────────────────────────────
const FLAVORS = [
  { id: 'cocoa',          label: 'Cocoa',         family: 'earthy' },
  { id: 'coffee',         label: 'Coffee',        family: 'earthy' },
  { id: 'espresso',       label: 'Espresso',       family: 'earthy' },
  { id: 'cedar',          label: 'Cedar',          family: 'woody'  },
  { id: 'leather',        label: 'Leather',        family: 'woody'  },
  { id: 'earth',          label: 'Earth',          family: 'woody'  },
  { id: 'cream',          label: 'Cream',          family: 'smooth' },
  { id: 'toasted-almond', label: 'Toasted Almond', family: 'smooth' },
  { id: 'black-pepper',   label: 'Black Pepper',   family: 'spicy'  },
  { id: 'dried-fruit',    label: 'Dried Fruit',    family: 'sweet'  },
  { id: 'oak',            label: 'Oak',            family: 'woody'  },
  { id: 'spice',          label: 'Spice',          family: 'spicy'  },
  { id: 'sweet',          label: 'Sweet',          family: 'sweet'  },
  { id: 'smoky',          label: 'Smoky',          family: 'earthy' },
  { id: 'bold',           label: 'Bold',           family: 'char'   },
  { id: 'creamy',         label: 'Creamy',         family: 'smooth' },
  { id: 'balanced',       label: 'Balanced',       family: 'char'   },
  { id: 'rich',           label: 'Rich',           family: 'char'   },
]

const FAMILY_COLORS = {
  earthy: '#8b6914', woody: '#6b4a2a', smooth: '#5a7a5a',
  spicy:  '#a03a20', sweet: '#a07030', char:   '#7a6020',
}

// ── Select-option groups ──────────────────────────────────────────────────────
const FINISH_OPTIONS   = ['Short', 'Medium', 'Long', 'Very Long']
const STRENGTH_OPTIONS = ['Mild', 'Mild–Med', 'Medium', 'Med–Full', 'Full']
const BODY_OPTIONS     = ['Light', 'Light–Med', 'Medium', 'Med–Full', 'Full']
const DRAW_OPTIONS     = ['Too Open', 'Slightly Open', 'Perfect', 'Slightly Tight', 'Too Tight']
const BURN_OPTIONS     = ['Even', 'Slight Wave', 'Wavy', 'Tunneling', 'Canoe']
const ASH_OPTIONS      = ['White', 'Light Grey', 'Grey', 'Dark Grey', 'Black']
const SMOKE_OPTIONS    = ['Thin', 'Medium', 'Full', 'Very Dense']
const RATING_OPTIONS   = [1, 2, 3, 4, 5]

// ── Persistence helpers ───────────────────────────────────────────────────────
const EMPTY = {
  selectedFlavors: [],
  finishLength: null,
  strength: null,
  body: null,
  drawQuality: null,
  burnQuality: null,
  ashColor: null,
  smokeTexture: null,
  pairingResult: null,
  overallRating: null,
  personalNotes: '',
  savedAt: null,
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY }
  } catch { return { ...EMPTY } }
}

function saveLocal(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ...s, savedAt: s.savedAt || Date.now() })) } catch {}
}

// ── Pairing result calculator ─────────────────────────────────────────────────
function computePairingResult(pairingLab, selectedFlavors) {
  if (!pairingLab?.selectedPairings?.length) return null
  const pairings = pairingLab.selectedPairings

  // Simple affinity map — earthy/bold/rich pairs with Whiskey/Rum/Coffee
  const affinity = {
    Whiskey:        ['oak', 'leather', 'cedar', 'bold', 'rich', 'earth', 'smoky'],
    Rum:            ['sweet', 'dried-fruit', 'cream', 'creamy', 'spice'],
    Cognac:         ['dried-fruit', 'oak', 'leather', 'rich', 'balanced'],
    Coffee:         ['cocoa', 'coffee', 'espresso', 'bold', 'earthy'],
    'Red Wine':     ['cedar', 'earth', 'leather', 'balanced', 'oak'],
    'Dark Chocolate': ['cocoa', 'espresso', 'bold', 'rich', 'black-pepper'],
    'Craft Beer':   ['cedar', 'earth', 'spice', 'balanced', 'smoky'],
  }

  let totalHits = 0, total = 0
  for (const p of pairings) {
    const affinityList = affinity[p] || []
    const hits = selectedFlavors.filter(f => affinityList.includes(f)).length
    totalHits += hits
    total += affinityList.length
  }

  if (total === 0) return { label: 'Neutral Pairing', score: 50 }
  const score = Math.round((totalHits / Math.min(total, pairings.length * 3)) * 100)
  if (score >= 67) return { label: 'Strong Match', score }
  if (score >= 34) return { label: 'Good Match', score }
  return { label: 'Mild Contrast', score }
}

// ── Third comparison helper ───────────────────────────────────────────────────
function ThirdComparison({ label, data }) {
  if (!data || data.status === 'observe_confirm_step' || !data.notesSelected?.length) {
    return (
      <div style={{ fontSize: 10, color: DIM, fontStyle: 'italic' }}>
        {label}: No tasting data recorded — only observation was confirmed.
      </div>
    )
  }
  return (
    <div style={{ fontSize: 10, color: DIM, lineHeight: 1.7 }}>
      <span style={{ color: GOLD, fontWeight: 600 }}>{label}</span>
      {data.notesSelected.length > 0 && (
        <div>Notes: <span style={{ color: GOLD }}>{data.notesSelected.join(', ')}</span></div>
      )}
      {data.drawRating && <div>Draw: <span style={{ color: GOLD }}>{data.drawRating}</span></div>}
      {data.strength && <div>Strength: <span style={{ color: GOLD }}>{data.strength}</span></div>}
    </div>
  )
}

// ── Star rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {RATING_OPTIONS.map(n => (
        <button key={n} type="button" data-star={n}
          onClick={() => { triggerHaptic('light'); onChange(n === value ? null : n) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '10px 6px',
            minWidth: 44, minHeight: 44,
            fontSize: 22, lineHeight: 1,
            color: n <= (value || 0) ? GOLD : 'rgba(233,193,118,0.2)',
            filter: n <= (value || 0) ? 'drop-shadow(0 0 3px rgba(233,193,118,0.4))' : 'none',
          }}
        >★</button>
      ))}
      {value && <span style={{ fontSize: 10, color: DIM, marginLeft: 4, alignSelf: 'center' }}>{value}/5</span>}
    </div>
  )
}

// ── Chip selector row ─────────────────────────────────────────────────────────
function ChipRow({ options, value, onChange, dataPrefix }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {options.map(opt => {
        const active = value === opt
        return (
          <button key={opt} type="button"
            data-option={dataPrefix ? `${dataPrefix}-${opt.toLowerCase().replace(/\s+/g, '-')}` : undefined}
            onClick={() => { triggerHaptic('light'); onChange(active ? null : opt) }}
            style={{
              background: active ? GOLD : 'transparent',
              color: active ? DARK : GOLD,
              border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.28)'}`,
              borderRadius: 20, padding: '10px 12px', minHeight: 44,
              fontSize: 11, fontWeight: 600, fontFamily: 'Georgia, serif', cursor: 'pointer',
            }}
          >{opt}</button>
        )
      })}
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────
function SL({ children }) {
  return <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{children}</div>
}
function HR() {
  return <div style={{ borderTop: `1px solid ${BORDER}`, margin: '8px 0' }} />
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FinalThird() {
  const { awardSessionRewards, setFinalThirdTasting, session } = useGuestSession()
  const navigate = useNavigate()

  const smokeCraft = session?.smokeCraft || {}
  const currentXP  = session?.xp || 0
  const stepsCount = session?.completedSteps?.length || 0

  // Read prior tasting data from session state
  const firstThirdData  = smokeCraft.firstThird  || null
  const secondThirdData = smokeCraft.secondThird  || null
  const pairingLabData  = smokeCraft.pairingSelections
    ? { selectedPairings: smokeCraft.pairingSelections }
    : null

  // Also read from sessionStorage for compatibility with Flavor Memory
  const flavorMemory = (() => {
    try { return JSON.parse(sessionStorage.getItem('smokecraftFlavorMemory') || 'null') } catch { return null }
  })()

  const [ft, setFt] = useState(loadLocal)
  const [expandNotes, setExpandNotes] = useState(false)
  const [done, setDone] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')

  // Compute pairing result whenever flavor selections or pairing lab data changes
  const pairingResult = ft.selectedFlavors.length > 0 && pairingLabData
    ? computePairingResult(pairingLabData, ft.selectedFlavors)
    : null

  useEffect(() => { saveLocal(ft) }, [ft])

  function toggleFlavor(id) {
    triggerHaptic('light')
    setFt(prev => ({
      ...prev,
      selectedFlavors: prev.selectedFlavors.includes(id)
        ? prev.selectedFlavors.filter(x => x !== id)
        : [...prev.selectedFlavors, id],
    }))
  }

  function setField(field, val) {
    setFt(prev => ({ ...prev, [field]: val }))
  }

  async function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    setSaveStatus('saving')

    const payload = {
      status: ft.selectedFlavors.length > 0 || ft.overallRating ? 'complete' : 'observe_confirm_step',
      source: 'interactive',
      tasteProfileSource: ft.selectedFlavors.length > 0 ? 'guest_selected' : 'not_collected',
      safeClaim: ft.selectedFlavors.length > 0
        ? 'Guest selected final-third flavor notes and ratings'
        : 'Guest confirmed observation — no tasting input captured',
      notesSelected: ft.selectedFlavors,
      notesCount: ft.selectedFlavors.length,
      overallRating: ft.overallRating,
      hasOverallRating: ft.overallRating != null,
      finalStrength: ft.strength,
      finalBody: ft.body,
      finishLength: ft.finishLength,
      drawQuality: ft.drawQuality,
      burnQuality: ft.burnQuality,
      ashColor: ft.ashColor,
      smokeTexture: ft.smokeTexture,
      heatHarshness: null,
      burnFinish: ft.burnQuality,
      finalPairingReaction: pairingResult?.label || ft.pairingResult || null,
      wouldSmokeAgain: ft.overallRating >= 4 ? true : ft.overallRating <= 2 ? false : null,
      pairingMatchScore: pairingResult?.score || null,
      personalNotes: ft.personalNotes,
      savedAt: Date.now(),
    }

    setFinalThirdTasting(payload)

    // Save to localStorage with timestamp
    setFt(prev => ({ ...prev, savedAt: Date.now() }))

    try {
      // Also persist to session storage for downstream screens
      sessionStorage.setItem('smokecraftFinalThird', JSON.stringify(payload))
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }

    awardSessionRewards('final-third')
    navigate('/smokecraft/scorecard')
  }

  const selectedCount = ft.selectedFlavors.length

  const pairingColor = pairingResult
    ? pairingResult.score >= 67 ? GREEN : pairingResult.score >= 34 ? GOLD : AMBER
    : DIM

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft/FINAL THIRD.png"
        alt="SmokeCraft Final Third — Complete Your Tasting Journey"
      />

      {/* Gradient mask — covers baked ratings/XP/selections in image */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(10,6,3,0.98) 0%, rgba(10,6,3,0.65) 50%, rgba(10,6,3,0.06) 100%)',
      }} />

      {/* Session progress strip */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 401,
        padding: '8px 16px',
        background: 'linear-gradient(to bottom, rgba(10,6,3,0.92) 70%, transparent)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Final Third — Session 15
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 9, color: DIM }}>Steps: <span style={{ color: GOLD, fontWeight: 700 }}>{stepsCount}</span></span>
            <span style={{ fontSize: 9, color: DIM }}>XP: <span style={{ color: GOLD, fontWeight: 700 }}>{currentXP}</span>
              <span style={{ color: 'rgba(233,193,118,0.4)', fontSize: 8 }}> +75</span>
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable panel */}
      <div style={{
        position: 'fixed', bottom: 110, left: 0, right: 0,
        zIndex: 400, padding: '0 16px',
        maxHeight: 'calc(100vh - 190px)', overflowY: 'auto',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: PANEL, border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: '12px 14px',
          maxWidth: 500, margin: '0 auto',
        }}>

          {/* ── Final Flavor Notes ──────────────────── */}
          <SL>Final Flavor Notes {selectedCount > 0 && <span style={{ fontWeight: 400 }}>({selectedCount})</span>}</SL>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {FLAVORS.map(f => {
              const active = ft.selectedFlavors.includes(f.id)
              const col = FAMILY_COLORS[f.family] || GOLD
              return (
                <button key={f.id} type="button" data-flavor={f.id}
                  onClick={() => toggleFlavor(f.id)}
                  style={{
                    background: active ? col : 'transparent',
                    color: active ? '#fffde8' : GOLD,
                    border: `1px solid ${active ? col : 'rgba(233,193,118,0.28)'}`,
                    borderRadius: 20, padding: '10px 12px', minHeight: 44,
                    fontSize: 11, fontWeight: 600, fontFamily: 'Georgia, serif', cursor: 'pointer',
                  }}
                >{f.label}</button>
              )
            })}
          </div>

          {/* ── Finish + Strength + Body ─────────────── */}
          <HR />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <SL>Finish Length</SL>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {FINISH_OPTIONS.map(opt => {
                  const active = ft.finishLength === opt
                  return (
                    <button key={opt} type="button" data-finish={opt.toLowerCase().replace(/\s+/g,'-')}
                      onClick={() => { triggerHaptic('light'); setField('finishLength', active ? null : opt) }}
                      style={{
                        background: active ? GOLD : 'transparent', color: active ? DARK : GOLD,
                        border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.22)'}`,
                        borderRadius: 6, padding: '10px 8px', minHeight: 44, fontSize: 10, fontFamily: 'Georgia, serif', cursor: 'pointer', textAlign: 'left',
                      }}
                    >{opt}</button>
                  )
                })}
              </div>
            </div>
            <div>
              <SL>Strength</SL>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {STRENGTH_OPTIONS.map(opt => {
                  const active = ft.strength === opt
                  return (
                    <button key={opt} type="button" data-strength={opt.toLowerCase().replace(/[\s–]+/g,'-')}
                      onClick={() => { triggerHaptic('light'); setField('strength', active ? null : opt) }}
                      style={{
                        background: active ? GOLD : 'transparent', color: active ? DARK : GOLD,
                        border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.22)'}`,
                        borderRadius: 6, padding: '10px 8px', minHeight: 44, fontSize: 10, fontFamily: 'Georgia, serif', cursor: 'pointer', textAlign: 'left',
                      }}
                    >{opt}</button>
                  )
                })}
              </div>
            </div>
            <div>
              <SL>Body</SL>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {BODY_OPTIONS.map(opt => {
                  const active = ft.body === opt
                  return (
                    <button key={opt} type="button" data-body={opt.toLowerCase().replace(/[\s–]+/g,'-')}
                      onClick={() => { triggerHaptic('light'); setField('body', active ? null : opt) }}
                      style={{
                        background: active ? GOLD : 'transparent', color: active ? DARK : GOLD,
                        border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.22)'}`,
                        borderRadius: 6, padding: '10px 8px', minHeight: 44, fontSize: 10, fontFamily: 'Georgia, serif', cursor: 'pointer', textAlign: 'left',
                      }}
                    >{opt}</button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Draw + Burn + Ash + Smoke ────────────── */}
          <HR />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <SL>Draw Quality</SL>
              <ChipRow options={DRAW_OPTIONS} value={ft.drawQuality} onChange={v => setField('drawQuality', v)} dataPrefix="draw" />
            </div>
            <div>
              <SL>Burn Quality</SL>
              <ChipRow options={BURN_OPTIONS} value={ft.burnQuality} onChange={v => setField('burnQuality', v)} dataPrefix="burn" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            <div>
              <SL>Ash Color</SL>
              <ChipRow options={ASH_OPTIONS} value={ft.ashColor} onChange={v => setField('ashColor', v)} dataPrefix="ash" />
            </div>
            <div>
              <SL>Smoke Texture</SL>
              <ChipRow options={SMOKE_OPTIONS} value={ft.smokeTexture} onChange={v => setField('smokeTexture', v)} dataPrefix="smoke" />
            </div>
          </div>

          {/* ── Pairing Result ──────────────────────── */}
          <HR />
          <SL>Pairing Result</SL>
          {pairingResult ? (
            <div style={{
              background: 'rgba(0,0,0,0.3)', border: `1px solid ${pairingColor}30`,
              borderRadius: 8, padding: '7px 10px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: pairingColor, fontFamily: 'Georgia, serif' }}>
                {pairingResult.label}
              </div>
              <div style={{ fontSize: 9, color: DIM, marginTop: 2 }}>
                Affinity score: {pairingResult.score}% — calculated from session pairing selections and final flavor notes
              </div>
            </div>
          ) : pairingLabData ? (
            <div style={{ fontSize: 10, color: DIM, fontStyle: 'italic' }}>
              Select final flavor notes above to calculate pairing affinity.
            </div>
          ) : (
            <div style={{ fontSize: 10, color: DIM, fontStyle: 'italic' }}>
              No pairing data from this session. Complete Pairing Lab to enable this comparison.
            </div>
          )}
          {/* Guard: never display "Perfect Match" without real calculation */}

          {/* ── Overall Rating ──────────────────────── */}
          <HR />
          <SL>Overall Final Third Rating</SL>
          <StarRating value={ft.overallRating} onChange={v => setField('overallRating', v)} />

          {/* ── First Third Comparison ──────────────── */}
          <HR />
          <SL>First Third Comparison</SL>
          <ThirdComparison label="First Third" data={firstThirdData} />

          {/* ── Second Third Comparison ─────────────── */}
          <HR />
          <SL>Second Third Comparison</SL>
          <ThirdComparison label="Second Third" data={secondThirdData} />

          {/* ── Flavor Memory Recall ────────────────── */}
          {flavorMemory?.tasteTags?.length > 0 && (
            <>
              <HR />
              <SL>Flavor Memory Reference</SL>
              <div style={{ fontSize: 10, color: DIM }}>
                Recorded in Flavor Memory: <span style={{ color: GOLD }}>{flavorMemory.tasteTags.join(', ')}</span>
              </div>
              {ft.selectedFlavors.length > 0 && (() => {
                const overlap = ft.selectedFlavors.filter(f => flavorMemory.tasteTags.includes(f))
                return overlap.length > 0
                  ? <div style={{ fontSize: 10, color: GREEN, marginTop: 2 }}>Recurring in final third: {overlap.join(', ')}</div>
                  : <div style={{ fontSize: 10, color: DIM, marginTop: 2, fontStyle: 'italic' }}>No overlap with Flavor Memory notes.</div>
              })()}
            </>
          )}

          {/* ── Personal Notes ──────────────────────── */}
          <HR />
          <button type="button"
            onClick={() => setExpandNotes(p => !p)}
            aria-label="Toggle Personal Notes"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', minHeight: 44, width: '100%', textAlign: 'left' }}>
            <SL>{expandNotes ? '▾' : '▸'} Personal Notes</SL>
          </button>
          {expandNotes && (
            <textarea
              value={ft.personalNotes}
              onChange={e => setFt(prev => ({ ...prev, personalNotes: e.target.value }))}
              placeholder="How did the final third evolve? Any surprises?"
              maxLength={400} rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                borderRadius: 8, color: '#fff', fontSize: 12, padding: '8px 10px',
                fontFamily: 'Georgia, serif', resize: 'vertical', marginTop: 4,
              }}
            />
          )}

          {/* ── Save status ─────────────────────────── */}
          {saveStatus !== 'idle' && (
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', marginTop: 8,
              padding: '4px 8px', borderRadius: 6, textAlign: 'center',
              color: saveStatus === 'saved' ? GREEN : saveStatus === 'saving' ? GOLD : RED,
              background: saveStatus === 'saved' ? 'rgba(90,219,142,0.08)' : saveStatus === 'saving' ? 'rgba(233,193,118,0.08)' : 'rgba(224,90,90,0.08)',
              border: `1px solid ${saveStatus === 'saved' ? 'rgba(90,219,142,0.3)' : saveStatus === 'saving' ? 'rgba(233,193,118,0.3)' : 'rgba(224,90,90,0.3)'}`,
            }}>
              {saveStatus === 'saving' && 'Saving final third…'}
              {saveStatus === 'saved'  && 'Final third saved — continuing to Scorecard'}
              {saveStatus === 'error'  && 'Session storage error — data retained in state'}
            </div>
          )}

          {ft.savedAt && saveStatus === 'idle' && (
            <div style={{ fontSize: 9, color: 'rgba(229,226,225,0.28)', textAlign: 'right', marginTop: 4 }}>
              Last saved {new Date(ft.savedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <SmokeCraftNavBar
        primary={done ? 'Saving…' : 'Continue to Scorecard →'}
        onPrimary={handleContinue}
      />
    </>
  )
}
