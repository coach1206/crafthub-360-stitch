import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PoweredByNoveeOSBadge from '../../components/shared/PoweredByNoveeOSBadge.jsx'
import {
  CommandTouchButton, CommandGlassPanel,
  IVORY, IVORY_PANEL, NAVY, NAVY_SOFT, GOLD, GOLD_DEEP, SLATE, LINE,
} from '../../components/pos3/shell/CommandAppShell.jsx'
import { THEME_PRESETS } from '../../data/pos360VenueSystems.js'
import {
  getVenueTheme, updateVenueTheme, getVenueImages, uploadVenueImagePreview,
  getInventoryConnections, calculateInventoryHealthScore, generateLowStockAlerts,
  getNetworkHealth, generateNetworkAlerts, getConnectedDevices, getDeviceHealth, updateDeviceStatus,
} from '../../services/pos3/venueSystemsService.js'

const NAV_ITEMS = [
  ['Home', '/pos3', 'home'], ['Tables', '/pos3/venue-tables', 'table_restaurant'], ['Orders', '/pos3/orders', 'receipt_long'],
  ['Integrations', '/pos3/integrations', 'sync'], ['Venue Systems', '/pos3/venue-systems', 'tune'],
]
const CONNECTED_SYSTEMS = [
  ['POS3 Sync', 'sync'], ['Oracle Micros', 'point_of_sale'], ['Stripe Terminal', 'credit_card'],
  ['Kitchen Display', 'soup_kitchen'], ['Humidor Lock', 'lock'],
]

const SECTIONS = [
  ['Theme', 'palette'], ['Images', 'image'], ['Inventory', 'inventory_2'], ['Network', 'wifi'], ['Devices', 'devices'],
]

// Real-image-or-needs-asset card data. Every card carries an `img` field if (and only
// if) a matching real asset already exists in public/ — there is no fake/random imagery
// here. Cards without a real asset render the styled "Needs Asset" placeholder treatment.
const THEME_CARDS = [
  { id: 'vaultLounge', label: 'Vault Lounge', sub: 'Primary lounge theme', img: '/background-lounge-airy.jpg', pos: 'center', accent: GOLD_DEEP },
  { id: 'bar', label: 'Bar', sub: 'Bar program theme', img: '/beercraft.jpg', pos: 'center 45%', accent: '#3a6ea8' },
  { id: 'humidor', label: 'Humidor', sub: 'Cigar lounge theme', img: '/smokecraft.jpg', pos: 'center 62%', accent: '#8a5a2b' },
  { id: 'patio', label: 'Patio', sub: 'Open-air seating theme', img: null, accent: '#2f9e5b' },
  { id: 'privateDining', label: 'Private Dining', sub: 'Reserved-room theme', img: null, accent: '#7e57c2' },
]

const IMAGE_CARDS = [
  { id: 'loungeFloor', label: 'Lounge Floor', count: '12 Images', icon: 'weekend', img: '/pos360-floor-canvas-reference.png', pos: 'center', accent: '#7e57c2' },
  { id: 'barArea', label: 'Bar Area', count: '16 Images', icon: 'sports_bar', img: '/beercraft.jpg', pos: 'center 45%', accent: '#3a6ea8' },
  { id: 'humidorArea', label: 'Humidor Area', count: '14 Images', icon: 'inventory', img: '/smokecraft.jpg', pos: 'center 62%', accent: '#8a5a2b' },
  { id: 'patioFloor', label: 'Patio Floor', count: '18 Images', icon: 'deck', img: null, accent: '#2f9e5b' },
  { id: 'food', label: 'Food', count: '48 Images', icon: 'restaurant', img: null, accent: '#c0443a' },
  { id: 'liquor', label: 'Liquor & Cocktails', count: '63 Images', icon: 'local_bar', img: '/pourcraft.jpg', pos: 'center 68%', accent: GOLD_DEEP },
  { id: 'cigars', label: 'Cigars', count: '32 Images', icon: 'inventory_2', img: '/assets/smokecraft/cigars/toro.jpg', pos: 'center', accent: '#8a5a2b' },
  { id: 'pairings', label: 'Pairings', count: '27 Images', icon: 'workspace_premium', img: '/assets/smokecraft/cropped/pairing-lab-hero.jpg', pos: 'center', accent: GOLD_DEEP },
]

const INVENTORY_CARDS = [
  { id: 'cigars', label: 'Cigars', img: '/assets/smokecraft/cigars/toro.jpg', pos: 'center', accent: '#8a5a2b' },
  { id: 'liquor', label: 'Liquor', img: '/pourcraft.jpg', pos: 'center 68%', accent: GOLD_DEEP },
  { id: 'food', label: 'Food', img: null, accent: '#c0443a' },
  { id: 'pairings', label: 'Pairings', img: '/assets/smokecraft/cropped/pairing-lab-hero.jpg', pos: 'center', accent: '#7e57c2' },
]

const NETWORK_DEVICE_CARDS = [
  ['POS360 Bridge', 'router', true], ['Kitchen Display', 'soup_kitchen', true], ['Bar Station', 'local_bar', true],
  ['Humidor Station', 'inventory_2', false], ['Payment Terminal', 'point_of_sale', true], ['Printer', 'print', true],
]

const QUICK_ACTIONS = [
  ['Table Management', '/pos3/venue-tables', 'table_restaurant', GOLD_DEEP],
  ['Integration Hub', '/pos3/integrations', 'hub', '#3a6ea8'],
  ['Reservations', null, 'event', '#7e57c2'],
  ['Audit Log', null, 'history', SLATE],
  ['Staff Devices', null, 'badge', '#2f9e5b'],
  ['Floor Plans', '/pos3/venue-tables', 'dashboard_customize', '#8a5a2b'],
]

const SIGNAL_COLOR = { strong: '#2f9e5b', weak: '#c9952c', offline: '#c0443a' }

/** Embossed metal/enamel badge — a real medallion (bevel, gloss highlight, rim),
 * not a flat icon-in-a-pill. Replaces the flatter shared status pill on this screen. */
function RealBadge({ color, icon, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#2a2014',
      padding: '3px 11px 3px 3px', borderRadius: 999, letterSpacing: '0.01em',
      background: `linear-gradient(160deg, #fffdf8 0%, #f3ead4 55%, #e7dabd 100%)`,
      border: `1px solid ${color}66`,
      boxShadow: `0 3px 8px rgba(20,15,5,0.22), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 1px rgba(0,0,0,0.06)`,
    }}>
      <span style={{
        width: 17, height: 17, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(circle at 32% 26%, ${color} 0%, ${color}dd 45%, ${color}99 100%)`,
        boxShadow: `0 1px 2px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.7), inset 0 -2px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.55)`,
      }}>
        {icon ? (
          <span className="material-symbols-outlined" style={{ fontSize: 10.5, color: '#fff', textShadow: '0 1px 1px rgba(0,0,0,0.45)' }}>{icon}</span>
        ) : (
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 1px rgba(0,0,0,0.4)' }} />
        )}
      </span>
      {children}
    </span>
  )
}

/** Premium image-or-asset card. Real photo when one exists; otherwise a designed
 * "Needs Asset" placeholder — never a blank box, never a generic stock icon only. */
function AssetCard({ card, height = 96, onUpload, footer }) {
  const live = !!card.img
  return (
    // Raised tile shell: lifted off the canvas via a deep two-layer shadow
    // (tight contact shadow + wide ambient throw) plus a 1px gold rim and a
    // bright top bevel line, so the card reads as a physical touch tile
    // rather than an image dropped flat into a box.
    <div className="vsu-haptic vsu-raised-tile" style={{
      borderRadius: 20, position: 'relative', padding: 3,
      background: live
        ? `linear-gradient(165deg, #1c3a64 0%, #0a1426 55%, #050a16 100%)`
        : `linear-gradient(165deg, #16294a 0%, #0a1426 55%, #050a16 100%)`,
      boxShadow: `
        0 1px 0 rgba(255,255,255,0.5) inset,
        0 0 0 1px ${live ? 'rgba(201,149,44,0.55)' : GOLD}55,
        0 2px 4px rgba(10,15,30,0.5),
        0 14px 26px rgba(10,15,30,0.4),
        0 26px 46px rgba(10,15,30,0.22)`,
    }}>
      {/* bright bevel highlight along the top edge — physical lift cue */}
      <div style={{ position: 'absolute', top: 1, left: 14, right: 14, height: 1, borderRadius: 1, background: 'linear-gradient(90deg, transparent, rgba(255,222,160,0.55) 45%, rgba(255,222,160,0.55) 55%, transparent)', zIndex: 4, pointerEvents: 'none' }} />
      <div style={{ borderRadius: 17, overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}>
        {/* gold foil corner accent */}
        <div style={{
          position: 'absolute', top: -1, left: -1, width: 46, height: 46, zIndex: 3, pointerEvents: 'none',
          background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD} 38%, transparent 40%)`, opacity: 0.9,
          clipPath: 'polygon(0 0, 100% 0, 0 100%)',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
        }} />
        <div style={{
          height, position: 'relative',
          background: live
            ? `linear-gradient(195deg, rgba(5,8,16,0.05) 0%, rgba(5,8,16,0.25) 45%, rgba(5,8,16,0.92) 100%), url('${card.img}') ${card.pos || 'center'}/cover`
            : `radial-gradient(circle at 50% -10%, rgba(201,149,44,0.28), transparent 60%), linear-gradient(200deg, #060c1a 0%, #0c1c36 35%, ${NAVY} 70%, #050a16 100%)`,
        }}>
          {/* subtle inner vignette ring for glass/metal feel */}
          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 30px 40px -20px rgba(0,0,0,0.55)' }} />

          {live ? (
            <span style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
              <RealBadge color="#2f9e5b" icon="check">Live</RealBadge>
            </span>
          ) : (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, zIndex: 2 }}>
              <span style={{
                width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(circle at 35% 30%, rgba(201,149,44,0.35), rgba(201,149,44,0.08))',
                border: `1.5px solid ${GOLD}`, boxShadow: '0 0 18px rgba(201,149,44,0.45), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 17, color: GOLD }}>add_photo_alternate</span>
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: GOLD, letterSpacing: '0.06em', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>NEEDS ASSET</span>
              <button type="button" onClick={() => onUpload && onUpload(card)} className="vsu-haptic" style={{
                border: `1px solid rgba(255,255,255,0.35)`, borderRadius: 999, padding: '3px 10px', background: 'linear-gradient(165deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))',
                color: 'rgba(255,255,255,0.92)', fontSize: 9.5, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 3px 8px rgba(0,0,0,0.4)',
              }}>Upload Image</button>
            </div>
          )}

          {/* caption overlaid directly on the image, poster-style */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px 9px', zIndex: 2, background: live ? 'none' : 'linear-gradient(0deg, rgba(0,0,0,0.55), transparent)' }}>
            <div style={{
              fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.01em',
              textShadow: '0 2px 6px rgba(0,0,0,0.8)',
            }}>{card.label}</div>
            {card.sub && <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.78)', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>{card.sub}</div>}
            {card.count && <div style={{ fontSize: 10.5, color: GOLD, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>{card.count}</div>}
          </div>
        </div>
        {footer && (
          <div style={{ padding: '8px 12px', background: 'linear-gradient(165deg,#ffffff,#fbf8f1)', borderTop: `1px solid ${LINE}` }}>{footer}</div>
        )}
      </div>
    </div>
  )
}

export default function POS360VenueSystemsSetup() {
  const navigate = useNavigate()
  const [section, setSection] = useState('Theme')
  const [theme, setTheme] = useState(() => getVenueTheme())
  const [images, setImages] = useState(() => getVenueImages())
  const [inventory] = useState(() => getInventoryConnections())
  const [devices, setDevices] = useState(() => getConnectedDevices())
  const network = getNetworkHealth()
  const devHealth = getDeviceHealth()
  const inventoryHealth = calculateInventoryHealthScore()
  const lowStockAlerts = generateLowStockAlerts()
  const networkAlerts = generateNetworkAlerts()
  void THEME_PRESETS; void theme

  const allCards = [...THEME_CARDS, ...IMAGE_CARDS]
  const assetsPresent = allCards.filter((c) => c.img).length
  const assetsMissing = allCards.filter((c) => !c.img)
  const setupCompletion = Math.round((assetsPresent / allCards.length) * 100)

  function handleUploadCard(card) {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        setImages(uploadVenueImagePreview(card.id, reader.result))
        window.alert(`"${card.label}" image saved locally. This is a local/demo preview — no backend asset storage is connected yet.`)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  function handleSelectTheme(presetId) {
    setTheme(updateVenueTheme({ presetId }))
  }

  function handlePingDevice(id) {
    setDevices(updateDeviceStatus(id, { lastSync: 'just now' }))
  }

  const KPI = [
    ['SETUP', `${setupCompletion}%`, 'Complete', 'fact_check', GOLD_DEEP],
    ['IMAGES', `${assetsPresent}/${allCards.length}`, 'Assets Live', 'image', '#7e57c2'],
    ['INVENTORY', `${inventoryHealth.score}%`, 'Health Score', 'inventory_2', inventoryHealth.score >= 70 ? '#2f9e5b' : '#c9952c'],
    ['NETWORK', network.status === 'online' ? 'Online' : 'Offline', `${network.latencyMs}ms`, 'wifi', network.status === 'online' ? '#2f9e5b' : '#c0443a'],
    ['DEVICES', `${devHealth.online}/${devHealth.total}`, 'Connected', 'devices', devHealth.online === devHealth.total ? '#2f9e5b' : '#c9952c'],
  ]

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', fontFamily: 'system-ui, sans-serif', background: IVORY }}>
      <style>{`
        .vsu-haptic { transition: transform 0.08s ease, box-shadow 0.08s ease, filter 0.08s ease, background 0.08s ease; cursor: pointer; }
        .vsu-haptic:active { transform: translateY(2px) scale(0.97); filter: brightness(0.94); }
        .vsu-raised-tile { transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease; }
        .vsu-raised-tile:hover { transform: translateY(-3px); filter: brightness(1.04); }
        .vsu-raised-tile:active { transform: translateY(1px) scale(0.985); filter: brightness(0.96); }
        @media (prefers-reduced-motion: reduce) {
          .vsu-haptic, .vsu-haptic:active, .vsu-raised-tile, .vsu-raised-tile:hover, .vsu-raised-tile:active { transition: none; transform: none; filter: none; }
        }
      `}</style>
      {/* LEFT RAIL */}
      <nav style={{
        width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '18px 14px', overflowY: 'auto',
        background: `radial-gradient(circle at 18% 0%, rgba(201,149,44,0.16), transparent 45%),
          linear-gradient(200deg, #050b18 0%, #0b1830 28%, ${NAVY} 58%, #060d1c 100%)`,
        borderRight: '1px solid rgba(201,149,44,0.3)', boxShadow: 'inset -16px 0 36px rgba(0,0,0,0.45), 4px 0 24px rgba(0,0,0,0.35)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 4px 0' }}>
          <span style={{ color: GOLD, fontWeight: 800, fontSize: 18, letterSpacing: '0.04em' }}>POS360</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700, padding: '0 4px 16px', letterSpacing: '0.08em' }}>THE VAULT LOUNGE</div>
        {NAV_ITEMS.map(([label, to, icon]) => {
          const active = label === 'Venue Systems'
          return (
            <button key={label} type="button" disabled={!to} onClick={() => to && navigate(to)} className={to ? 'vsu-haptic' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 10,
              fontSize: 12.5, border: 'none', cursor: to ? 'pointer' : 'not-allowed', marginBottom: 1, minHeight: 38,
              color: active ? '#1c1206' : to ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
              background: active ? `linear-gradient(160deg, #f0cf6e, ${GOLD} 50%, ${GOLD_DEEP})` : 'transparent', fontWeight: active ? 800 : 500,
              boxShadow: active ? '0 6px 18px rgba(201,149,44,0.55), inset 0 1px 0 rgba(255,255,255,0.5)' : 'none',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>{label}
            </button>
          )
        })}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(201,149,44,0.22)' }}>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9.5, fontWeight: 700, padding: '0 4px 8px', letterSpacing: '0.08em' }}>CONNECTED SYSTEMS</div>
          {CONNECTED_SYSTEMS.map(([label, icon]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{label}</div>
              </div>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2f9e5b', boxShadow: '0 0 6px #2f9e5b' }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(201,149,44,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: GOLD }}>VL</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Vault Manager</div>
              <div style={{ fontSize: 10, color: '#7ddca0', fontWeight: 700 }}>● All Systems Operational</div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}><PoweredByNoveeOSBadge variant="sidebar" compact /></div>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <div style={{ padding: '16px 22px 28px' }}>
          {/* TOP BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD_DEEP, fontWeight: 700 }}>Venue Systems</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginTop: 2 }}>POS360 Venue Systems</div>
              <div style={{ fontSize: 12, color: SLATE, marginTop: 2 }}>Configure venue identity, images, devices, inventory, and operating zones</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <PoweredByNoveeOSBadge variant="header" />
                <RealBadge color={SLATE} icon="hourglass_empty">Local Demo · Backend Pending</RealBadge>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CommandTouchButton onClick={() => navigate('/pos3/venue-tables')} className="vsu-haptic ch-touch-btn" style={{ minHeight: 46, padding: '0 16px', boxShadow: '0 1px 0 rgba(255,255,255,0.5) inset, 0 4px 0 rgba(19,41,75,0.1), 0 6px 14px rgba(19,41,75,0.18)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6, verticalAlign: '-3px' }}>visibility</span>
                Preview Venue
              </CommandTouchButton>
              <CommandTouchButton active onClick={() => window.alert('Venue configuration saved locally. No backend settings endpoint is connected yet.')} className="vsu-haptic ch-touch-btn" style={{ minHeight: 46, padding: '0 18px', boxShadow: '0 2px 10px rgba(201,149,44,0.4), inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 0 rgba(168,116,32,0.45)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6, verticalAlign: '-3px' }}>save</span>
                Save Configuration
              </CommandTouchButton>
            </div>
          </div>

          {/* KPI STRIP */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {KPI.map(([label, value, sub, icon, accent]) => (
              <div key={label} style={{
                flex: '1 1 150px', background: 'linear-gradient(165deg,#ffffff,#fbf8f1)', border: `1px solid ${LINE}`, borderRadius: 14, padding: '10px 14px',
                boxShadow: '0 8px 20px rgba(19,41,75,0.16)', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: accent }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: SLATE, fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>{value}</div>
                  <div style={{ fontSize: 10, color: SLATE }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* HERO IMAGE PANEL + RIGHT INTELLIGENCE PANEL */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                position: 'relative', borderRadius: 22, overflow: 'hidden', height: 260,
                border: `1px solid ${GOLD}33`,
                backgroundImage: `linear-gradient(165deg, rgba(10,8,5,0.25), rgba(6,5,3,0.7)), url('/background-lounge-airy.jpg')`,
                backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4), 0 14px 36px rgba(19,41,75,0.35)',
              }}>
                <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 6, flexWrap: 'wrap', zIndex: 2, maxWidth: '70%' }}>
                  {SECTIONS.map(([label, icon]) => (
                    <span key={label} style={{
                      display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
                      borderRadius: 999, padding: '4px 10px', color: '#f3eee1', fontSize: 11, fontWeight: 700,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{icon}</span>{label}
                    </span>
                  ))}
                </div>
                <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 2 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>The Vault Lounge</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <RealBadge color="#2f9e5b" icon="check_circle">System Ready</RealBadge>
                    <RealBadge color={assetsMissing.length ? '#c9952c' : '#2f9e5b'} icon={assetsMissing.length ? 'warning' : 'check'}>
                      {assetsMissing.length} Asset{assetsMissing.length === 1 ? '' : 's'} Needed
                    </RealBadge>
                  </div>
                </div>
                <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 2, textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: GOLD, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{setupCompletion}%</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: '0.06em' }}>SETUP COMPLETE</div>
                </div>
              </div>

              {/* TAB CHIPS */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {SECTIONS.map(([label, icon]) => (
                  <CommandTouchButton key={label} active={section === label} onClick={() => setSection(label)} className="vsu-haptic ch-touch-btn" style={{
                    minHeight: 52, padding: '0 20px', fontSize: 13.5,
                    boxShadow: section === label
                      ? '0 2px 10px rgba(201,149,44,0.4), inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 0 rgba(168,116,32,0.45)'
                      : '0 1px 0 rgba(255,255,255,0.6) inset, 0 4px 0 rgba(19,41,75,0.08), 0 5px 12px rgba(19,41,75,0.14)',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17, marginRight: 7, verticalAlign: '-3px' }}>{icon}</span>{label}
                  </CommandTouchButton>
                ))}
              </div>

              {/* TAB CONTENT */}
              <div style={{ marginTop: 14 }}>
                {section === 'Theme' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 18 }}>
                    {THEME_CARDS.map((c) => (
                      <div key={c.id} onClick={() => handleSelectTheme(c.id)} className="vsu-haptic" style={{ cursor: 'pointer', borderRadius: 18 }}>
                        <AssetCard card={c} height={172} onUpload={handleUploadCard} />
                      </div>
                    ))}
                  </div>
                )}

                {section === 'Images' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px,1fr))', gap: 18 }}>
                    {IMAGE_CARDS.map((c) => (
                      <AssetCard key={c.id} card={images[c.id] ? { ...c, img: images[c.id] } : c} height={158} onUpload={handleUploadCard} />
                    ))}
                  </div>
                )}

                {section === 'Inventory' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 12 }}>
                    {INVENTORY_CARDS.map((c) => {
                      const conn = inventory.find((i) => i.id === c.id)
                      return (
                        <AssetCard key={c.id} card={c} height={88} onUpload={handleUploadCard} footer={
                          conn && (
                            <div style={{ marginTop: 4 }}>
                              <RealBadge color={conn.connected ? '#2f9e5b' : SLATE} icon={conn.connected ? 'check_circle' : 'link_off'}>
                                {conn.connected ? `${conn.items - conn.lowStock}/${conn.items} In Stock` : 'Not Connected'}
                              </RealBadge>
                            </div>
                          )
                        } />
                      )
                    })}
                    <div style={{ borderRadius: 14, border: `1px solid ${LINE}`, background: IVORY_PANEL, padding: 12, boxShadow: '0 4px 12px rgba(19,41,75,0.1)' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: NAVY, marginBottom: 6 }}>LOW STOCK ALERTS</div>
                      {lowStockAlerts.length === 0 ? (
                        <div style={{ fontSize: 11, color: SLATE }}>No low-stock alerts.</div>
                      ) : lowStockAlerts.map((a, i) => (
                        <div key={i} style={{ fontSize: 10.5, color: '#c0443a', padding: '2px 0' }}>⚠ {a.message}</div>
                      ))}
                    </div>
                    <div style={{ borderRadius: 14, border: `1px solid ${LINE}`, background: IVORY_PANEL, padding: 12, boxShadow: '0 4px 12px rgba(19,41,75,0.1)' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: NAVY, marginBottom: 6 }}>REORDER SIGNALS</div>
                      {inventory.filter((i) => i.connected && i.lowStock > 0).length === 0 ? (
                        <div style={{ fontSize: 11, color: SLATE }}>No reorder signals.</div>
                      ) : inventory.filter((i) => i.connected && i.lowStock > 0).map((i) => (
                        <div key={i.id} style={{ fontSize: 10.5, color: GOLD_DEEP, padding: '2px 0' }}>↻ Reorder suggested — {i.label}</div>
                      ))}
                    </div>
                  </div>
                )}

                {section === 'Network' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12 }}>
                    {NETWORK_DEVICE_CARDS.map(([name, icon, online]) => (
                      <div key={name} style={{ borderRadius: 14, border: `1px solid ${LINE}`, background: IVORY_PANEL, padding: 14, boxShadow: '0 4px 12px rgba(19,41,75,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{
                            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: `linear-gradient(160deg, ${online ? '#2f9e5b22' : '#c0443a22'}, transparent)`, border: `1px solid ${online ? '#2f9e5b55' : '#c0443a55'}`,
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 17, color: online ? '#2f9e5b' : '#c0443a' }}>{icon}</span>
                          </span>
                          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{name}</div>
                        </div>
                        <RealBadge color={online ? '#2f9e5b' : '#c0443a'} icon={online ? 'check_circle' : 'error'}>{online ? 'Online' : 'Offline'}</RealBadge>
                      </div>
                    ))}
                    <div style={{ borderRadius: 14, border: `1px solid ${LINE}`, background: IVORY_PANEL, padding: 14, boxShadow: '0 4px 12px rgba(19,41,75,0.1)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Wi-Fi / Sync</div>
                      <div style={{ fontSize: 11, color: SLATE }}>SSID: {network.ssid}</div>
                      <div style={{ fontSize: 11, color: SLATE }}>Latency: {network.latencyMs}ms · Sync queue: {network.syncQueue}</div>
                      <div style={{ marginTop: 6 }}><RealBadge color={network.status === 'online' ? '#2f9e5b' : '#c0443a'} icon={network.status === 'online' ? 'check_circle' : 'error'}>{network.status === 'online' ? 'Online' : 'Offline'}</RealBadge></div>
                    </div>
                  </div>
                )}

                {section === 'Devices' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12 }}>
                    {devices.map((d) => (
                      <div key={d.id} style={{ borderRadius: 14, border: `1px solid ${LINE}`, background: IVORY_PANEL, padding: 14, boxShadow: '0 4px 12px rgba(19,41,75,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: NAVY }}>{d.name}</div>
                            <div style={{ fontSize: 10.5, color: SLATE }}>{d.role} · {d.location}</div>
                          </div>
                          <RealBadge color={d.online ? SIGNAL_COLOR[d.signal] || '#2f9e5b' : '#c0443a'} icon={d.online ? 'wifi' : 'wifi_off'}>{d.online ? d.signal : 'Offline'}</RealBadge>
                        </div>
                        {d.battery != null && <div style={{ fontSize: 10.5, color: SLATE }}>Battery: {d.battery}%</div>}
                        <div style={{ fontSize: 10.5, color: SLATE }}>Last sync: {d.lastSync}</div>
                        <CommandTouchButton onClick={() => handlePingDevice(d.id)} className="vsu-haptic ch-touch-btn" style={{
                          minHeight: 32, marginTop: 8, fontSize: 11, padding: '0 12px',
                          boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset, 0 3px 0 rgba(19,41,75,0.08), 0 4px 10px rgba(19,41,75,0.14)',
                        }}>Ping / Reconnect</CommandTouchButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT INTELLIGENCE PANEL */}
            <div style={{
              width: 300, flexShrink: 0, borderRadius: 18, background: 'linear-gradient(165deg,#ffffff,#fbf8f1)',
              border: `1px solid ${LINE}`, boxShadow: '0 14px 36px rgba(19,41,75,0.24)', padding: 16,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 12, borderRadius: 10,
                background: `radial-gradient(circle at 20% 0%, rgba(201,149,44,0.2), transparent 55%), linear-gradient(200deg, #050b18 0%, #0b1830 30%, ${NAVY} 65%, #060d1c 100%)`,
                boxShadow: '0 3px 10px rgba(19,41,75,0.3)',
              }}>
                <span style={{ width: 6, height: 16, borderRadius: 3, background: GOLD }} />
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>System Health Summary</div>
              </div>
              {[
                ['POS Sync Engine', true], ['Oracle Micros', true], ['Stripe Terminal', network.status === 'online'],
                ['Kitchen Display', true], ['Humidor Lock', devHealth.online === devHealth.total],
              ].map(([label, ok]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '4px 0', borderTop: `1px solid ${LINE}` }}>
                  <span style={{ color: NAVY }}>{label}</span>
                  <RealBadge color={ok ? '#2f9e5b' : '#c9952c'} icon={ok ? 'check_circle' : 'warning'}>{ok ? 'Healthy' : 'Warning'}</RealBadge>
                </div>
              ))}

              <CommandGlassPanel title="Setup Completion">
                <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>{setupCompletion}%</div>
                <div style={{ fontSize: 11, color: SLATE }}>{assetsPresent} of {allCards.length} assets live</div>
              </CommandGlassPanel>

              <CommandGlassPanel title="Missing Assets">
                {assetsMissing.length === 0 ? (
                  <div style={{ fontSize: 11.5, color: SLATE }}>No missing assets.</div>
                ) : assetsMissing.map((c) => (
                  <div key={c.id} style={{ fontSize: 11, color: GOLD_DEEP, padding: '2px 0' }}>• {c.label}</div>
                ))}
              </CommandGlassPanel>

              <CommandGlassPanel title="Connected Devices">
                <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{devHealth.online}/{devHealth.total}</div>
                <div style={{ fontSize: 11, color: SLATE }}>{devHealth.weak} with weak signal</div>
              </CommandGlassPanel>

              <CommandGlassPanel title="Low Stock Alerts">
                {lowStockAlerts.length === 0 ? (
                  <div style={{ fontSize: 11.5, color: SLATE }}>No low-stock alerts.</div>
                ) : lowStockAlerts.map((a, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#c0443a', padding: '2px 0' }}>⚠ {a.message}</div>
                ))}
              </CommandGlassPanel>

              <CommandGlassPanel title="Integration Status">
                <div style={{ fontSize: 11.5, color: SLATE }}>{networkAlerts.length} active network alert{networkAlerts.length === 1 ? '' : 's'}</div>
                {networkAlerts.slice(0, 3).map((a, i) => (
                  <div key={i} style={{ fontSize: 10.5, color: a.severity === 'high' ? '#c0443a' : GOLD_DEEP, padding: '2px 0' }}>⚠ {a.message}</div>
                ))}
              </CommandGlassPanel>

              <CommandGlassPanel title="Next Recommended Action">
                <div style={{ fontSize: 11.5, color: NAVY, fontWeight: 600 }}>
                  {assetsMissing.length > 0
                    ? `Upload a real image for "${assetsMissing[0].label}" to raise setup completion.`
                    : 'All venue assets are live — review inventory and device health next.'}
                </div>
              </CommandGlassPanel>
            </div>
          </div>

          {/* BOTTOM QUICK ACTIONS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {QUICK_ACTIONS.map(([label, to, icon, accent]) => (
              <button key={label} type="button" onClick={() => to ? navigate(to) : window.alert(`${label} — local-only action. No backend endpoint connected yet.`)} className="vsu-haptic" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 92,
                borderRadius: 14, border: `1px solid ${LINE}`, background: 'linear-gradient(165deg,#ffffff,#fbf8f1)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 4px 0 rgba(19,41,75,0.07), 0 8px 20px rgba(19,41,75,0.16)', cursor: 'pointer', padding: 10,
              }}>
                <span style={{
                  width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `radial-gradient(circle at 32% 28%, ${accent}, ${accent}cc 80%)`, boxShadow: `0 2px 6px ${accent}40`,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>{icon}</span>
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: NAVY, textAlign: 'center' }}>{label}</span>
              </button>
            ))}
          </div>

          <div style={{ fontSize: 10, color: SLATE, marginTop: 14, textAlign: 'center' }}>
            Venue theme, images, inventory connections, network telemetry, and device registry are local/demo until backend persistence is connected.
          </div>
        </div>
      </div>
    </div>
  )
}
