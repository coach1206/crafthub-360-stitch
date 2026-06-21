import { Card } from '../../eat/ui.jsx'

const TYPES = [
  { key: 'menu', label: 'Menu & Categories' },
  { key: 'orders', label: 'Orders' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'staff', label: 'Staff' },
]

/** Checkbox toggles for which data types to sync. */
export default function POSSyncSettings({ syncOptions, onChange }) {
  function toggle(key) {
    onChange({ ...syncOptions, [key]: !syncOptions[key] })
  }
  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Sync Settings</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TYPES.map((t) => (
          <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!syncOptions[t.key]} onChange={() => toggle(t.key)} />
            {t.label}
          </label>
        ))}
      </div>
    </Card>
  )
}
