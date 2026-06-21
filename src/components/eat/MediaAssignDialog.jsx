import { useState } from 'react'
import { PANEL, PANEL2, Btn } from './ui.jsx'

const inputStyle = {
  width: '100%', background: PANEL2, color: '#e8eef5', border: '1px solid rgba(212,168,67,0.18)',
  borderRadius: 8, padding: '8px 10px', fontSize: 13, marginBottom: 10,
}

const TARGET_SYSTEMS = ['SMOKECRAFT', 'POS3', 'EAT', 'NOVEE']
const TARGET_TYPES = ['menuItem', 'table', 'ticket', 'inventoryItem', 'sectionBanner', 'general']

export default function MediaAssignDialog({ asset, onClose, onAssign }) {
  const [targetSystem, setTargetSystem] = useState('EAT')
  const [targetType, setTargetType] = useState('general')
  const [targetId, setTargetId] = useState('')

  function submit() {
    onAssign({ assetId: asset.id, targetSystem, targetType, targetId: targetId || null })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
      <div style={{ background: PANEL, borderRadius: 16, padding: 22, width: 380, border: '1px solid rgba(212,168,67,0.2)' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Assign "{asset.name}"</div>
        <label style={{ fontSize: 12, color: '#8b95a3' }}>Target System</label>
        <select style={inputStyle} value={targetSystem} onChange={(e) => setTargetSystem(e.target.value)}>
          {TARGET_SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label style={{ fontSize: 12, color: '#8b95a3' }}>Target Type</label>
        <select style={inputStyle} value={targetType} onChange={(e) => setTargetType(e.target.value)}>
          {TARGET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label style={{ fontSize: 12, color: '#8b95a3' }}>Target ID (optional)</label>
        <input style={inputStyle} placeholder="e.g. m_padron, T2, inv_opusx" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <Btn tone="gray" onClick={onClose}>Cancel</Btn>
          <Btn tone="gold" onClick={submit}>Assign</Btn>
        </div>
      </div>
    </div>
  )
}
