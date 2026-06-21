/**
 * ModifierSheet — bottom-sheet modal for picking modifiers on a menu item
 * before it's added to the cart. Confirm button finalizes the selection.
 */
import { useState } from 'react'
import { GOLD, PANEL, PANEL2, LINE } from '../eat/ui.jsx'
import TouchButton from './TouchButton.jsx'
import { selectionTap } from '../../services/shared/haptics.js'

export default function ModifierSheet({ item, open, onConfirm, onClose }) {
  const [selected, setSelected] = useState([])

  if (!open || !item) return null

  function toggle(mod) {
    try { selectionTap() } catch {}
    setSelected((s) => (s.find((m) => m.id === mod.id) ? s.filter((m) => m.id !== mod.id) : [...s, mod]))
  }

  function confirm() {
    onConfirm && onConfirm(selected)
    setSelected([])
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: PANEL, borderTop: `1px solid ${LINE}`, borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 480, padding: 20, paddingBottom: 28,
          animation: 'pos3-sheet-up 0.22s ease-out',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{item.name}</div>
        <div style={{ fontSize: 12, color: '#8b95a3', marginBottom: 16 }}>Choose modifiers</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {(item.modifiers || []).map((mod) => {
            const active = !!selected.find((m) => m.id === mod.id)
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => toggle(mod)}
                style={{
                  minHeight: 48,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 12,
                  border: active ? `2px solid ${GOLD}` : `1px solid ${LINE}`,
                  background: active ? 'rgba(212,168,67,0.12)' : PANEL2,
                  color: '#e8eef5', cursor: 'pointer', touchAction: 'manipulation',
                }}
              >
                <span>{mod.label}</span>
                <span style={{ color: GOLD, fontWeight: 700 }}>{mod.priceDelta > 0 ? `+$${mod.priceDelta.toFixed(2)}` : mod.priceDelta < 0 ? `-$${Math.abs(mod.priceDelta).toFixed(2)}` : 'Included'}</span>
              </button>
            )
          })}
          {!(item.modifiers || []).length && <div style={{ color: '#8b95a3', fontSize: 13 }}>No modifiers for this item.</div>}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <TouchButton tone="neutral" onClick={onClose} style={{ flex: 1 }}>Cancel</TouchButton>
          <TouchButton tone="success" onClick={confirm} style={{ flex: 2 }}>Add to Order</TouchButton>
        </div>
      </div>
      <style>{`@keyframes pos3-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  )
}
