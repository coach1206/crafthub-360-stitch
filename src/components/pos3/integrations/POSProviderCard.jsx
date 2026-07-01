import { useState } from 'react'
import { L_NAVY, L_GOLD } from '../../eat/lightTheme.jsx'

const STATE_TONE = {
  not_connected: { bg: 'rgba(19,41,75,0.06)', fg: '#6b7385' },
  needs_credentials: { bg: 'rgba(201,149,44,0.14)', fg: '#9c7320' },
  connected: { bg: 'rgba(46,160,90,0.12)', fg: '#1f7a45' },
  sync_active: { bg: 'rgba(46,160,90,0.12)', fg: '#1f7a45' },
  error: { bg: 'rgba(196,60,60,0.12)', fg: '#b33b3b' },
  disabled: { bg: 'rgba(19,41,75,0.06)', fg: '#8b95a3' },
}

const STATE_LABEL = {
  not_connected: 'Not Connected', needs_credentials: 'Needs Credentials', connected: 'Connected',
  sync_active: 'Sync Active', error: 'Error', disabled: 'Disabled',
}

const ICON_BADGE = {
  square: { icon: 'crop_square', bg: '#1c2230' },
  clover: { icon: 'spa', bg: '#0f8a3c' },
  toast: { icon: 'local_cafe', bg: '#d6502e' },
  lightspeed: { icon: 'bolt', bg: '#d6342e' },
  shopify_pos: { icon: 'storefront', bg: '#5fbf6a' },
  stripe_terminal: { icon: 'credit_card', bg: '#5b5bd6' },
  ncr_aloha: { icon: 'link', bg: '#2a8fae' },
  oracle_micros: { icon: 'dns', bg: '#c0392b' },
  revel: { icon: 'tablet_mac', bg: '#1f5fb8' },
  spoton: { icon: 'my_location', bg: '#1c2230' },
  touchbistro: { icon: 'restaurant', bg: '#0f8a3c' },
  manual_csv: { icon: 'upload_file', bg: '#6b7385' },
  custom_api: { icon: 'api', bg: '#6b7385' },
}

/**
 * Provider card — raised cream surface with gold rim accent, mapped from the
 * "Connected Systems" card anatomy in the approved target image
 * public/smokecraft/images/POS 3 Intergration hub.png (icon badge, name,
 * status pill, description, feature chips, Manage row).
 */
export default function POSProviderCard({ provider, status, onOpen }) {
  const [pressed, setPressed] = useState(false)
  const tone = STATE_TONE[status] || STATE_TONE.not_connected
  const isConnected = status === 'connected' || status === 'sync_active'
  const badge = ICON_BADGE[provider.id] || { icon: 'extension', bg: '#6b7385' }

  return (
    <div
      onClick={() => onOpen?.(provider)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 10, minHeight: 196, cursor: 'pointer',
        background: 'linear-gradient(165deg, #ffffff 0%, #fbf8f1 100%)', borderRadius: 18, padding: 17,
        border: `1px solid ${isConnected ? 'rgba(201,149,44,0.5)' : 'rgba(19,41,75,0.08)'}`,
        borderTop: `3px solid ${isConnected ? L_GOLD : 'rgba(201,149,44,0.3)'}`,
        boxShadow: pressed
          ? '0 2px 6px rgba(19,41,75,0.16), 0 1px 0 rgba(255,255,255,0.6) inset'
          : '0 14px 28px rgba(19,41,75,0.14), 0 2px 4px rgba(19,41,75,0.06), 0 1px 0 rgba(255,255,255,0.7) inset',
        transform: pressed ? 'translateY(2px) scale(0.985)' : 'translateY(0) scale(1)',
        transition: 'box-shadow 0.14s ease, transform 0.14s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: badge.bg, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{badge.icon}</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, color: L_NAVY }}>{provider.name}</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, color: tone.fg, background: tone.bg,
          borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap',
        }}>{STATE_LABEL[status] || 'Not Connected'}</span>
      </div>
      <div style={{ fontSize: 12.5, color: '#6b7385' }}>{provider.description}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
        {provider.whatItSyncs.map((w) => (
          <span key={w} style={{
            fontSize: 10.5, color: '#9c7320', background: 'rgba(201,149,44,0.1)',
            border: '1px solid rgba(201,149,44,0.25)', borderRadius: 999, padding: '2px 8px',
          }}>{w}</span>
        ))}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onOpen?.(provider) }}
        style={{
          marginTop: 4, minHeight: 40, fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none',
          background: isConnected ? L_NAVY : L_GOLD, color: isConnected ? '#fff' : '#1c2230', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        {status === 'not_connected' || !status ? 'Connect' : 'Manage'}
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
      </button>
    </div>
  )
}
