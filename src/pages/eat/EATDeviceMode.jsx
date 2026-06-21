import { useState } from 'react'
import { ManagementLayout, Card, Pill, Btn, useToast } from '../../components/eat/ui.jsx'

const MODES = [
  { id: 'kiosk', label: 'Kiosk (guest-facing)' },
  { id: 'staff', label: 'Staff Terminal' },
  { id: 'manager', label: 'Manager Tablet' },
]

export default function EATDeviceMode() {
  const toast = useToast()
  const [mode, setMode] = useState('manager')

  return (
    <ManagementLayout title="Device Mode" subtitle="Local device role for this browser/session">
      <Card style={{ maxWidth: 480 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Active Mode</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {MODES.map((m) => (
            <Btn key={m.id} tone={mode === m.id ? 'gold' : 'gray'} onClick={() => { setMode(m.id); toast(`Device mode set to ${m.label}`) }}>{m.label}</Btn>
          ))}
        </div>
        <Pill label={MODES.find((m) => m.id === mode)?.label} tone="open" />
        <div style={{ fontSize: 12, color: '#8b95a3', marginTop: 12 }}>
          This setting is session-local and does not persist across devices or reload.
        </div>
      </Card>
    </ManagementLayout>
  )
}
