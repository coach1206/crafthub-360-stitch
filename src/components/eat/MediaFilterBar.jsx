import { PANEL2, GOLD } from './ui.jsx'

const selectStyle = {
  background: PANEL2, color: '#e8eef5', border: '1px solid rgba(212,168,67,0.18)',
  borderRadius: 8, padding: '8px 10px', fontSize: 13,
}

export default function MediaFilterBar({ type, setType, category, setCategory, status, setStatus, types, categories, statuses, onUploadClick }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
      <select style={selectStyle} value={type} onChange={(e) => setType(e.target.value)}>
        <option value="">All Types</option>
        {types.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select style={selectStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">All Categories</option>
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select style={selectStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All Statuses</option>
        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button type="button" onClick={onUploadClick} style={{
        marginLeft: 'auto', background: `linear-gradient(135deg,${GOLD},#b88f2f)`, color: '#0f1419',
        border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
      }}>+ Upload Asset</button>
    </div>
  )
}
