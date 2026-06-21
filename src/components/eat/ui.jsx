/**
 * Shared POS3 / E.A.T. design-system primitives.
 * Dark navy (#0f1419) background, gold/amber (#d4a843) accent, rounded cards,
 * pill badges. Reused across both the touch-first POS3 surface and the denser
 * E.A.T. back-office surface.
 */
import { NavLink } from 'react-router-dom'

export const GOLD = '#d4a843'
export const NAVY = '#0f1419'
export const PANEL = '#161d26'
export const PANEL2 = '#1d2530'
export const LINE = 'rgba(212,168,67,0.18)'

export function Shell({ children, style }) {
  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: '#e8eef5', fontFamily: 'system-ui, sans-serif', ...style }}>
      {children}
    </div>
  )
}

export function EatBadge({ children = 'Managed by E.A.T.' }) {
  return (
    <span style={{
      fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: GOLD, border: `1px solid ${LINE}`, borderRadius: 999,
      padding: '4px 10px', background: 'rgba(212,168,67,0.08)', whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

const STATION_COLORS = {
  kitchen: { bg: 'rgba(220,80,60,0.15)', fg: '#f0907f' },
  bar:     { bg: 'rgba(150,90,210,0.15)', fg: '#bfa0ee' },
  humidor: { bg: 'rgba(150,90,210,0.15)', fg: '#bfa0ee' },
  open:    { bg: 'rgba(80,200,120,0.15)', fg: '#7ddca0' },
  occupied:{ bg: 'rgba(212,168,67,0.15)', fg: GOLD },
  dirty:   { bg: 'rgba(160,160,160,0.15)', fg: '#b5bcc6' },
  sent:    { bg: 'rgba(80,200,120,0.15)', fg: '#7ddca0' },
  held:    { bg: 'rgba(160,160,160,0.15)', fg: '#b5bcc6' },
  paid:    { bg: 'rgba(80,200,120,0.15)', fg: '#7ddca0' },
  pending: { bg: 'rgba(212,168,67,0.15)', fg: GOLD },
  critical:{ bg: 'rgba(220,80,60,0.18)', fg: '#f0907f' },
  warning: { bg: 'rgba(212,168,67,0.15)', fg: GOLD },
  info:    { bg: 'rgba(90,150,230,0.15)', fg: '#8fb6f0' },
}

export function Pill({ label, tone }) {
  const c = STATION_COLORS[tone] || STATION_COLORS.info
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
      color: c.fg, background: c.bg, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16,
      padding: 16, ...(onClick ? { cursor: 'pointer' } : {}), ...style,
    }}>{children}</div>
  )
}

export function KpiCard({ label, value, accent = GOLD }) {
  return (
    <Card style={{ flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b95a3' }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: accent, marginTop: 6 }}>{value}</div>
    </Card>
  )
}

export function Btn({ children, onClick, tone = 'gold', disabled, title, style }) {
  const tones = {
    gold:   { bg: 'linear-gradient(135deg,#d4a843,#b88f2f)', fg: '#0f1419' },
    green:  { bg: '#2f9e5b', fg: '#fff' },
    red:    { bg: '#c0443a', fg: '#fff' },
    purple: { bg: '#7e57c2', fg: '#fff' },
    blue:   { bg: '#3a72c0', fg: '#fff' },
    orange: { bg: '#d9822b', fg: '#fff' },
    gray:   { bg: '#2a3340', fg: '#cdd5df' },
  }
  const c = tones[tone] || tones.gold
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} style={{
      background: c.bg, color: c.fg, border: 'none', borderRadius: 12,
      padding: '12px 18px', fontWeight: 600, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1, ...style,
    }}>{children}</button>
  )
}

const EAT_NAV = [
  ['Command Hub', '/eat'], ['POS Control', '/eat/pos-control'], ['Inventory', '/eat/inventory'],
  ['Reorders', '/eat/reorders'], ['Staff', '/eat/staff'], ['Sections', '/eat/sections'],
  ['Kitchen', '/eat/kitchen'], ['Bar', '/eat/bar'], ['Humidor', '/eat/humidor'],
  ['Data', '/eat/data'], ['Reports', '/eat/reports'], ['Media Library', '/eat/media'],
  ['Device Mode', '/eat/device-mode'], ['Settings', '/eat/settings'],
]

const POS3_NAV = [
  ['Home', '/pos3'], ['Handheld', '/pos3/handheld'], ['Tables', '/pos3/tables'],
  ['Orders', '/pos3/orders'], ['Checkout', '/pos3/checkout'], ['Settings', '/pos3/settings'],
]

export function SideNav({ system = 'EAT' }) {
  const items = system === 'EAT' ? EAT_NAV : POS3_NAV
  return (
    <nav style={{
      width: 210, flexShrink: 0, background: PANEL, borderRight: `1px solid ${LINE}`,
      padding: 14, display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16, padding: '6px 8px 12px' }}>
        {system === 'EAT' ? 'E.A.T. Command' : 'POS 3'}
      </div>
      {items.map(([label, to]) => (
        <NavLink key={to} to={to} end={to === '/eat' || to === '/pos3'}
          style={({ isActive }) => ({
            padding: '9px 10px', borderRadius: 9, fontSize: 13, textDecoration: 'none',
            color: isActive ? '#0f1419' : '#aab3bf',
            background: isActive ? GOLD : 'transparent', fontWeight: isActive ? 700 : 500,
          })}>{label}</NavLink>
      ))}
    </nav>
  )
}

export function TopBar({ system = 'EAT', title, subtitle }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', borderBottom: `1px solid ${LINE}`, background: PANEL,
    }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#e8eef5' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#8b95a3' }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Pill label="System Online" tone="open" />
        <span style={{ fontSize: 12, color: '#aab3bf' }}>Jordan Smith · Floor Supervisor</span>
        <EatBadge />
      </div>
    </div>
  )
}

export function ManagementLayout({ system = 'EAT', title, subtitle, children }) {
  return (
    <Shell>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <SideNav system={system} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <TopBar system={system} title={title} subtitle={subtitle} />
          <div style={{ padding: 20, overflowX: 'auto' }}>{children}</div>
        </div>
      </div>
    </Shell>
  )
}

export function Table({ columns, rows, renderCell }) {
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: PANEL2 }}>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: 'left', padding: '11px 14px', color: '#8b95a3', fontWeight: 600, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i} style={{ borderTop: `1px solid rgba(255,255,255,0.05)` }}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: '11px 14px', color: '#cdd5df' }}>
                  {renderCell ? renderCell(row, c.key) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

export function useToast() {
  return (msg) => {
    try {
      const el = document.createElement('div')
      el.textContent = msg
      Object.assign(el.style, {
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        background: '#1d2530', color: '#e8eef5', border: `1px solid ${LINE}`,
        padding: '12px 20px', borderRadius: 12, zIndex: 9999, fontSize: 14,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      })
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 2400)
    } catch {}
  }
}
