/**
 * TestProgressChecklist — Phase 12
 * Field test checklist for live venue testing.
 * State is local (no API) — observer marks items as they're verified.
 */

import { useState } from 'react'

const GOLD = '#C9A84C'
const DARK = '#050505'
const CARD = 'rgba(18,12,5,0.97)'

const CHECKLISTS = {
  guest: {
    label: 'Guest Flow',
    color: '#a3e635',
    items: [
      'Boot loads without errors',
      'Guest understands how to activate the experience',
      'CraftHub opens and modules are visible',
      'SmokeCraft starts correctly',
      'Mentor selection is clear',
      'Voice listen works',
      'Mute works',
      'Read mode works',
      'Session completes',
      'Passport stamp appears',
      'Leaderboard is visible',
      'Return home works',
    ],
  },
  staff: {
    label: 'Staff Flow',
    color: '#60a5fa',
    items: [
      'Staff login works with PIN',
      'POS 3 opens',
      'Active orders are visible',
      'Table status is visible',
      'Recommendation preview is visible',
      'Staff cannot access manager-only panels',
    ],
  },
  manager: {
    label: 'Manager Flow',
    color: '#c084fc',
    items: [
      'Manager login works',
      'E.A.T. Command opens',
      'Environment feed is visible',
      'Asset feed is visible',
      'Transaction feed is visible',
      'Deployment / device status is visible',
      'Export works',
    ],
  },
  kiosk: {
    label: 'Kiosk / Offline',
    color: '#fb923c',
    items: [
      'Kiosk route lock works',
      'Staff unlock works',
      'Back buttons stay within kiosk route map',
      'Offline page shows when network lost',
      'Boot fallback timer fires if stuck',
    ],
  },
}

function CheckItem({ label, checked, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0',
        borderBottom: `1px solid rgba(201,168,76,0.06)`, cursor: 'pointer',
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
        border: `1px solid ${checked ? '#4ade80' : `${GOLD}33`}`,
        background: checked ? 'rgba(74,222,128,0.15)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', color: '#4ade80',
      }}>
        {checked ? '✓' : ''}
      </div>
      <span style={{
        fontSize: '0.8rem', color: checked ? `${GOLD}66` : GOLD,
        textDecoration: checked ? 'line-through' : 'none',
        fontFamily: 'Georgia, serif', lineHeight: 1.4,
      }}>{label}</span>
    </div>
  )
}

export default function TestProgressChecklist() {
  const [activeSection, setActiveSection] = useState('guest')
  const [checked, setChecked] = useState({})

  function toggle(section, idx) {
    const key = `${section}:${idx}`
    setChecked(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const section    = CHECKLISTS[activeSection]
  const sectionArr = section.items
  const doneCount  = sectionArr.filter((_, i) => checked[`${activeSection}:${i}`]).length
  const pct        = Math.round((doneCount / sectionArr.length) * 100)

  return (
    <div style={{ background: CARD, border: `1px solid ${GOLD}18`, borderRadius: '10px', padding: '1.25rem' }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.25em', color: `${GOLD}44`, textTransform: 'uppercase', marginBottom: '1rem' }}>Field Test Checklist</div>

      {/* Tab strip */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {Object.entries(CHECKLISTS).map(([key, val]) => {
          const total = val.items.length
          const done  = val.items.filter((_, i) => checked[`${key}:${i}`]).length
          return (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: '5px', fontSize: '0.68rem',
                fontFamily: 'Georgia, serif', cursor: 'pointer', minHeight: '36px',
                border: `1px solid ${activeSection === key ? val.color : `${GOLD}22`}`,
                background: activeSection === key ? `${val.color}15` : 'transparent',
                color: activeSection === key ? val.color : `${GOLD}55`,
              }}
            >{val.label} {done}/{total}</button>
          )
        })}
      </div>

      {/* Progress bar */}
      <div style={{ background: `${GOLD}15`, borderRadius: '3px', height: '4px', marginBottom: '1rem', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: section.color, transition: 'width 0.3s ease', borderRadius: '3px' }} />
      </div>

      {/* Items */}
      <div>
        {sectionArr.map((item, i) => (
          <CheckItem
            key={i}
            label={item}
            checked={!!checked[`${activeSection}:${i}`]}
            onToggle={() => toggle(activeSection, i)}
          />
        ))}
      </div>

      {/* Summary */}
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: `${GOLD}55` }}>
        <span>{doneCount} of {sectionArr.length} verified</span>
        <span style={{ color: pct === 100 ? '#4ade80' : `${GOLD}55` }}>{pct}%{pct === 100 ? ' ✓' : ''}</span>
      </div>
    </div>
  )
}
