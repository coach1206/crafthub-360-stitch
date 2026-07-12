import { useState, useEffect, useRef, useCallback } from 'react'
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
const AMBER  = '#f0a830'
const GREEN  = '#5adb8e'
const RED    = '#e05a5a'

const LS_KEY = 'sc_flavor_memory_v1'

// ── Flavor catalog ────────────────────────────────────────────────────────────
const FLAVORS = [
  { id: 'cocoa',          label: 'Cocoa',          family: 'earthy',    def: 'A deep, slightly bitter chocolate note from well-fermented Nicaraguan leaf.' },
  { id: 'coffee',         label: 'Coffee',         family: 'earthy',    def: 'Roasted, ground-bean character — often a signature of Cuban-seed wrappers at medium heat.' },
  { id: 'espresso',       label: 'Espresso',        family: 'earthy',    def: 'Concentrated, intense roast. Sharper than coffee, associated with high-priming leaves.' },
  { id: 'cedar',          label: 'Cedar',           family: 'woody',     def: 'Clean, aromatic wood from the cigar box or aging room. Refreshing on the retrohale.' },
  { id: 'leather',        label: 'Leather',         family: 'woody',     def: 'A tanned, supple note common in aged Ecuadorian and Dominican wrappers at medium–full body.' },
  { id: 'earth',          label: 'Earth',           family: 'woody',     def: 'Damp soil, forest floor, or mineral tones. Characteristic of Honduran and Nicaraguan binders.' },
  { id: 'cream',          label: 'Cream',           family: 'smooth',    def: 'Silky, dairy-soft texture. Usually from Connecticut Shade wrappers or slow-burn construction.' },
  { id: 'toasted-almond', label: 'Toasted Almond',  family: 'smooth',    def: 'Nutty sweetness with a slight char edge — appears in the final third of well-aged medium cigars.' },
  { id: 'black-pepper',   label: 'Black Pepper',    family: 'spicy',     def: 'A peppery tingle at the back of the palate, most common in Ligero and Seco blend components.' },
  { id: 'dried-fruit',    label: 'Dried Fruit',     family: 'sweet',     def: 'Raisin, fig, or date sweetness, typically found in Maduro wrappers after extended fermentation.' },
  { id: 'oak',            label: 'Oak',             family: 'woody',     def: 'Barrel-adjacent wood note, rounded and slightly tannic. Often paired with whiskey.' },
  { id: 'spice',          label: 'Spice',           family: 'spicy',     def: 'A broad warmth — cinnamon, clove, or anise — from habano seed or aging.' },
  { id: 'sweet',          label: 'Sweet',           family: 'sweet',     def: 'A gentle caramel or honey finish. Characteristic of Connecticut Broadleaf wrappers.' },
  { id: 'smoky',          label: 'Smoky',           family: 'earthy',    def: 'Campfire, charcoal, or tobacco smoke forward on the palate — often from high-ligero blends.' },
  { id: 'bold',           label: 'Bold',            family: 'character', def: 'Full-bodied assertive character. Strength and complexity together — not for the uninitiated.' },
  { id: 'creamy',         label: 'Creamy',          family: 'smooth',    def: 'Smooth, rounded mouthfeel without astringency. Finish lingers softly rather than crisply.' },
  { id: 'balanced',       label: 'Balanced',        family: 'character', def: 'No single note dominates. Strength, body, and flavor transition harmoniously through thirds.' },
  { id: 'rich',           label: 'Rich',            family: 'character', def: 'Dense, layered complexity — a cigar that rewards slow smoking and deliberate attention.' },
]

const FLAVOR_FAMILIES = {
  earthy:    { label: 'Earthy',    color: '#8b6914' },
  woody:     { label: 'Woody',     color: '#6b4a2a' },
  smooth:    { label: 'Smooth',    color: '#5a7a5a' },
  spicy:     { label: 'Spicy',     color: '#a03a20' },
  sweet:     { label: 'Sweet',     color: '#a07030' },
  character: { label: 'Character', color: '#7a6020' },
}

const INTENSITY_LABELS = ['Mild', 'Mild–Med', 'Medium', 'Med–Full', 'Full']
const BODY_LABELS      = ['Light', 'Light–Med', 'Medium', 'Med–Full', 'Full']
const STRENGTH_LABELS  = ['Mild', 'Mild–Med', 'Medium', 'Med–Full', 'Full']

const EMPTY_STATE = {
  selectedFlavors: [],
  intensity: 3,
  body: 3,
  strength: 3,
  aromaNotes: [],
  pairingRecall: '',
  personalNotes: '',
  savedAt: null,
  saveStatus: 'neutral',
  persistenceMode: null,
}

// ── Persistence helpers ───────────────────────────────────────────────────────
function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...EMPTY_STATE, ...JSON.parse(raw) } : { ...EMPTY_STATE }
  } catch { return { ...EMPTY_STATE } }
}
function saveLocal(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ...s, savedAt: s.savedAt || Date.now() })) } catch {}
}

function extractPreviousSession(smokeCraft) {
  const completed = smokeCraft?.completedSessions
  if (!completed || completed.length === 0) return null
  return [...completed].reverse().find(s => s.flavorNotes?.length > 0 || s.tasteTags?.length > 0) || null
}

// ── Flavor radar chart ────────────────────────────────────────────────────────
function FlavorChart({ selections, intensity, body, strength }) {
  const empty = selections.length === 0 && intensity === 3 && body === 3 && strength === 3
  if (empty) {
    return (
      <div style={{ textAlign: 'center', color: DIM, fontSize: 15, padding: '6px 0', fontStyle: 'italic' }}>
        Select flavor notes above to populate the chart
      </div>
    )
  }

  const variety    = Math.min(selections.length, 5)
  const complexity = new Set(selections.map(id => FLAVORS.find(f => f.id === id)?.family)).size

  const axes = [
    { label: 'Intensity', value: intensity / 5 },
    { label: 'Body',      value: body / 5 },
    { label: 'Strength',  value: strength / 5 },
    { label: 'Variety',   value: variety / 5 },
    { label: 'Complexity',value: Math.min(complexity / 4, 1) },
  ]

  const CX = 75, CY = 68, R = 52
  const angle = (i) => (Math.PI * 2 * i) / axes.length - Math.PI / 2
  const webPt  = (i, scale = 1) => [CX + R * scale * Math.cos(angle(i)), CY + R * scale * Math.sin(angle(i))]
  const dataPt = (i) => { const r = R * axes[i].value; return [CX + r * Math.cos(angle(i)), CY + r * Math.sin(angle(i))] }
  const pts = (arr) => arr.map(p => p.join(',')).join(' ')

  return (
    <svg width={150} height={140} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map(s => (
        <polygon key={s} points={pts(axes.map((_, i) => webPt(i, s)))}
          fill="none" stroke="rgba(233,193,118,0.1)" strokeWidth={0.8} />
      ))}
      {axes.map((_, i) => { const [x2, y2] = webPt(i); return <line key={i} x1={CX} y1={CY} x2={x2} y2={y2} stroke="rgba(233,193,118,0.12)" strokeWidth={0.8} /> })}
      <polygon points={pts(axes.map((_, i) => dataPt(i)))}
        fill="rgba(233,193,118,0.14)" stroke={GOLD} strokeWidth={1.4} />
      {axes.map((a, i) => {
        const [bx, by] = webPt(i)
        const dx = bx - CX, dy = by - CY, len = Math.hypot(dx, dy) || 1
        return (
          <text key={i} x={bx + (dx / len) * 9} y={by + (dy / len) * 9}
            textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: 15, fill: DIM, fontFamily: 'Georgia, serif' }}>
            {a.label}
          </text>
        )
      })}
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FlavorMemory() {
  const { awardSessionRewards, session } = useGuestSession()
  const navigate = useNavigate()

  const smokeCraft = session?.smokeCraft || {}
  const currentXP  = session?.xp || 0
  const stepsCount = session?.completedSteps?.length || 0
  const prevSession = extractPreviousSession(smokeCraft)

  const [fm, setFm] = useState(loadLocal)
  const [activeDefinition, setActiveDefinition] = useState(null)
  const [expandNotes, setExpandNotes] = useState(false)
  const [done, setDone] = useState(false)
  const [apiStatus, setApiStatus] = useState('idle')
  const notesRef = useRef(null)

  useEffect(() => { saveLocal(fm) }, [fm])

  function toggleFlavor(id) {
    triggerHaptic('light')
    setFm(prev => {
      const isOn = prev.selectedFlavors.includes(id)
      setActiveDefinition(isOn ? null : FLAVORS.find(f => f.id === id))
      return { ...prev, selectedFlavors: isOn ? prev.selectedFlavors.filter(x => x !== id) : [...prev.selectedFlavors, id] }
    })
  }

  function toggleAroma(tag) {
    triggerHaptic('light')
    setFm(prev => ({
      ...prev,
      aromaNotes: prev.aromaNotes.includes(tag) ? prev.aromaNotes.filter(x => x !== tag) : [...prev.aromaNotes, tag],
    }))
  }

  function setSlider(field, val) { setFm(prev => ({ ...prev, [field]: Number(val) })) }

  const saveToBackend = useCallback(async (data) => {
    setApiStatus('saving')
    try {
      const r = await fetch('/api/modules/smokecraft/pairing/flavor-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.sessionId || 'local-session',
          userId: session?.guestId || 'guest',
          flavorNotes: data.selectedFlavors,
          aromaNotes: data.aromaNotes,
          strengthPerception: data.strength,
          bodyPerception: data.body,
          finishLength: data.intensity,
          memoryTags: data.selectedFlavors,
        }),
      })
      if (!r.ok) throw new Error(`API ${r.status}`)
      const result = await r.json()
      const mode = result.flavorMemory?.persistenceMode || 'memory_fallback'
      setApiStatus('saved')
      setFm(prev => ({ ...prev, saveStatus: 'saved', persistenceMode: mode }))
    } catch (e) {
      const offline = !navigator.onLine || e.message.includes('Failed to fetch')
      setApiStatus(offline ? 'offline' : 'error')
      setFm(prev => ({ ...prev, saveStatus: offline ? 'offline' : 'error' }))
    }
  }, [session])

  const saveToPassport = useCallback(async (data) => {
    try {
      await fetch('/api/passport-360/smokecraft/flavor-memory/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: session?.guestId || 'guest',
          sourceSessionId: session?.sessionId || 'local-session',
          tasteTags: data.selectedFlavors,
          tastingNotes: data.personalNotes,
          flavorProfileSource: 'guest_interactive',
          dataQualityStatus: data.selectedFlavors.length > 0 ? 'valid' : 'empty',
        }),
      })
    } catch {}
  }, [session])

  async function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')

    const snapshot = { ...fm, savedAt: Date.now() }
    setFm(prev => ({ ...prev, savedAt: snapshot.savedAt }))

    try {
      sessionStorage.setItem('smokecraftFlavorMemory', JSON.stringify({
        status: fm.selectedFlavors.length > 0 ? 'guest_input_collected' : 'skipped',
        source: 'interactive',
        backendConnected: true,
        tasteTags: fm.selectedFlavors,
        aromaNotes: fm.aromaNotes,
        strengthPerception: fm.strength,
        bodyPerception: fm.body,
        intensity: fm.intensity,
        pairingRecall: fm.pairingRecall,
        personalNotes: fm.personalNotes,
        savedAt: snapshot.savedAt,
      }))
    } catch {}

    await Promise.all([saveToBackend(snapshot), saveToPassport(snapshot)])
    awardSessionRewards('flavor-memory')
    navigate('/smokecraft/final-third')
  }

  const selectedCount = fm.selectedFlavors.length

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft/FLAVOR MEMORY.png"
        alt="SmokeCraft Flavor Memory — Capture Your Sensory Experience"
      />

      {/* Gradient mask — covers baked ratings/XP/chart zones */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(10,6,3,0.98) 0%, rgba(10,6,3,0.62) 48%, rgba(10,6,3,0.06) 100%)',
      }} />

      {/* XP + session progress strip */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 401,
        padding: '8px 16px',
        background: 'linear-gradient(to bottom, rgba(10,6,3,0.92) 70%, transparent)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ fontSize: 15, color: GOLD, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Flavor Memory — Session 14
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 15, color: DIM }}>Steps: <span style={{ color: GOLD, fontWeight: 700 }}>{stepsCount}</span></span>
            <span style={{ fontSize: 15, color: DIM }}>XP: <span style={{ color: GOLD, fontWeight: 700 }}>{currentXP}</span>
              <span style={{ color: 'rgba(233,193,118,0.4)', fontSize: 10 }}> +75</span>
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

          {/* ── Flavor notes ─────────────────────── */}
          <SectionLabel>Flavor Notes <Count n={selectedCount} /></SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {FLAVORS.map(f => {
              const active = fm.selectedFlavors.includes(f.id)
              const col = FLAVOR_FAMILIES[f.family].color
              return (
                <button key={f.id} type="button" data-flavor={f.id}
                  onClick={() => toggleFlavor(f.id)}
                  style={{
                    background: active ? col : 'transparent',
                    color: active ? '#fffde8' : GOLD,
                    border: `1px solid ${active ? col : 'rgba(233,193,118,0.28)'}`,
                    borderRadius: 20, padding: '10px 12px', minHeight: 44,
                    fontSize: 15, fontWeight: 600, fontFamily: 'Georgia, serif',
                    cursor: 'pointer', letterSpacing: '0.03em',
                  }}
                >{f.label}</button>
              )
            })}
          </div>

          {/* Flavor definition */}
          {activeDefinition && (
            <div style={{
              background: 'rgba(233,193,118,0.07)', border: `1px solid ${BORDER}`,
              borderRadius: 8, padding: '7px 10px', marginBottom: 8,
            }}>
              <div style={{ fontSize: 15, color: GOLD, fontWeight: 700, marginBottom: 2 }}>{activeDefinition.label}</div>
              <div style={{ fontSize: 15, color: DIM, lineHeight: 1.5 }}>{activeDefinition.def}</div>
            </div>
          )}

          {/* ── Flavor chart ──────────────────────── */}
          <Divider />
          <SectionLabel>Live Flavor Chart — Current Session</SectionLabel>
          <FlavorChart selections={fm.selectedFlavors} intensity={fm.intensity} body={fm.body} strength={fm.strength} />

          {/* ── Aromatic nuances ─────────────────── */}
          <Divider />
          <SectionLabel>Aromatic Nuances</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {['Floral', 'Hay', 'Toast', 'Mineral', 'Herbal', 'Barnyard', 'Vanilla', 'Citrus'].map(tag => {
              const active = fm.aromaNotes.includes(tag)
              return (
                <button key={tag} type="button" data-aroma={tag}
                  onClick={() => toggleAroma(tag)}
                  style={{
                    background: active ? 'rgba(233,193,118,0.15)' : 'transparent',
                    color: active ? GOLD : DIM,
                    border: `1px solid ${active ? GOLD : 'rgba(229,226,225,0.2)'}`,
                    borderRadius: 20, padding: '10px 12px', minHeight: 44, fontSize: 15, cursor: 'pointer',
                  }}
                >{tag}</button>
              )
            })}
          </div>

          {/* ── Sliders ───────────────────────────── */}
          <Divider />
          <SectionLabel>Sensory Ratings</SectionLabel>
          <SliderRow label="Flavor Intensity" value={fm.intensity} labels={INTENSITY_LABELS} onChange={v => setSlider('intensity', v)} />
          <SliderRow label="Body"             value={fm.body}      labels={BODY_LABELS}      onChange={v => setSlider('body', v)} />
          <SliderRow label="Strength"         value={fm.strength}  labels={STRENGTH_LABELS}  onChange={v => setSlider('strength', v)} />

          {/* ── Pairing recall ───────────────────── */}
          <Divider />
          <SectionLabel>Pairing Recall</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {['Whiskey', 'Rum', 'Coffee', 'Red Wine', 'Dark Chocolate', 'Craft Beer', 'None'].map(p => {
              const active = fm.pairingRecall === p
              return (
                <button key={p} type="button" data-pairing={p}
                  onClick={() => { triggerHaptic('light'); setFm(prev => ({ ...prev, pairingRecall: active ? '' : p })) }}
                  style={{
                    background: active ? GOLD : 'transparent',
                    color: active ? DARK : GOLD,
                    border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.3)'}`,
                    borderRadius: 20, padding: '10px 12px', minHeight: 44, fontSize: 15, fontWeight: 600,
                    fontFamily: 'Georgia, serif', cursor: 'pointer',
                  }}
                >{p}</button>
              )
            })}
          </div>

          {/* ── Personal notes ───────────────────── */}
          <Divider />
          <button type="button"
            onClick={() => { setExpandNotes(p => !p); setTimeout(() => notesRef.current?.focus(), 60) }}
            aria-label="Toggle Personal Notes"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', minHeight: 44, width: '100%', textAlign: 'left' }}>
            <SectionLabel>{expandNotes ? '▾' : '▸'} Personal Notes</SectionLabel>
          </button>
          {expandNotes && (
            <textarea ref={notesRef}
              value={fm.personalNotes}
              onChange={e => setFm(prev => ({ ...prev, personalNotes: e.target.value }))}
              placeholder="Describe what you noticed — no wrong answers…"
              maxLength={500} rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                borderRadius: 8, color: '#fff', fontSize: 14, padding: '8px 10px',
                fontFamily: 'Georgia, serif', resize: 'vertical', marginTop: 4,
              }}
            />
          )}

          {/* ── Previous session comparison ──────── */}
          <Divider />
          <SectionLabel>Previous Session Comparison</SectionLabel>
          {prevSession ? (
            <div style={{ fontSize: 15, color: DIM, lineHeight: 1.7 }}>
              <div>Session: <span style={{ color: GOLD }}>{prevSession.sessionId || 'prior visit'}</span></div>
              {(prevSession.flavorNotes?.length > 0) && (
                <div>Flavors recorded: <span style={{ color: GOLD }}>{prevSession.flavorNotes.join(', ')}</span></div>
              )}
              {(prevSession.tasteTags?.length > 0) && (
                <div>Tags: <span style={{ color: GOLD }}>{prevSession.tasteTags.join(', ')}</span></div>
              )}
              {fm.selectedFlavors.length > 0 && prevSession.flavorNotes?.length > 0 && (() => {
                const overlap = fm.selectedFlavors.filter(f => prevSession.flavorNotes.includes(f))
                return overlap.length > 0
                  ? <div style={{ color: GREEN }}>Recurring notes: {overlap.join(', ')}</div>
                  : <div style={{ color: DIM }}>No overlapping notes detected.</div>
              })()}
            </div>
          ) : (
            <div style={{ fontSize: 15, color: DIM, fontStyle: 'italic' }}>
              No previous session data available. Complete your first full journey to unlock comparison.
            </div>
          )}

          {/* ── Save status ─────────────────────── */}
          {apiStatus !== 'idle' && (
            <div style={{
              fontSize: 15, fontWeight: 700, letterSpacing: '0.08em', marginTop: 8, padding: '5px 10px',
              borderRadius: 6, textAlign: 'center',
              color: apiStatus === 'saved' ? GREEN : apiStatus === 'saving' ? GOLD : apiStatus === 'offline' ? AMBER : RED,
              background: apiStatus === 'saved' ? 'rgba(90,219,142,0.08)' : apiStatus === 'saving' ? 'rgba(233,193,118,0.08)' : apiStatus === 'offline' ? 'rgba(240,168,48,0.08)' : 'rgba(224,90,90,0.08)',
              border: `1px solid ${apiStatus === 'saved' ? 'rgba(90,219,142,0.3)' : apiStatus === 'saving' ? 'rgba(233,193,118,0.3)' : apiStatus === 'offline' ? 'rgba(240,168,48,0.3)' : 'rgba(224,90,90,0.3)'}`,
            }}>
              {apiStatus === 'saving'  && 'Saving flavor memory to backend…'}
              {apiStatus === 'saved'   && `Flavor memory saved — ${fm.persistenceMode === 'database' ? 'Postgres' : 'memory fallback'}`}
              {apiStatus === 'offline' && 'Saved locally — backend offline, will sync on reconnect'}
              {apiStatus === 'error'   && 'Save error — selections retained locally'}
            </div>
          )}
          {fm.savedAt && apiStatus === 'idle' && (
            <div style={{ fontSize: 15, color: 'rgba(229,226,225,0.28)', textAlign: 'right', marginTop: 4 }}>
              Last saved {new Date(fm.savedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <SmokeCraftNavBar
        primary={done ? 'Saving…' : 'Continue to Final Third →'}
        onPrimary={handleContinue}
      />
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <div style={{ fontSize: 15, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{children}</div>
}
function Count({ n }) {
  return n ? <span style={{ color: GOLD, fontWeight: 400 }}> ({n})</span> : null
}
function Divider() {
  return <div style={{ borderTop: `1px solid ${BORDER}`, margin: '8px 0' }} />
}
function SliderRow({ label, value, labels, onChange }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 15, color: DIM }}>{label}</span>
        <span style={{ fontSize: 15, color: GOLD, fontWeight: 700 }}>{labels[value - 1]}</span>
      </div>
      <input type="range" min={1} max={5} value={value}
        onChange={e => onChange(e.target.value)}
        data-slider={label.toLowerCase().replace(/\s+/g,'-')}
        style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
        <span style={{ fontSize: 15, color: 'rgba(229,226,225,0.28)' }}>{labels[0]}</span>
        <span style={{ fontSize: 15, color: 'rgba(229,226,225,0.28)' }}>{labels[4]}</span>
      </div>
    </div>
  )
}
