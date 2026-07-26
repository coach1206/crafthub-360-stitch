import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import {
  resolveSmokeCraftLandingAction,
  SMOKECRAFT_LANDING_ACTIONS,
} from '../../constants/smokecraftLandingActions.js'

const NAT_W = 1672
const NAT_H = 941
const GOLD = '#E9C176'

/**
 * SmokeCraftCraftHub — /smokecraft/crafthub
 *
 * APPROVED-ASSET CONTROL PLANE PASS — new landing-accessible destination.
 *
 * Root cause this fixes
 * ---------------------
 * The Landing screen's bottom-bar tile is labelled CRAFTHUB in the approved
 * artwork, but its handler navigated to `/smokecraft/smokecraft-challenge` —
 * a `requires="scorecard"`-guarded curriculum screen. So the tile advertised
 * CraftHub and delivered either the Challenge screen or a bounce to enroll.
 * There was no `/smokecraft/crafthub` route at all; the only `crafthub` route
 * in the app is the unrelated top-level `/crafthub`.
 *
 * Per the mandate this destination must never route to SmokeCraft Identity or
 * a Personal Dashboard, must never show "Greg Guy", and must preserve the
 * active journey. This screen navigates only through the canonical landing
 * resolver and mutates no journey state whatsoever, so entering and leaving
 * CraftHub cannot disturb an in-progress journey.
 *
 * Visual foundation
 * -----------------
 * The approved `CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` renders as-is at its
 * true 1672x941 aspect ratio. It carries no fabricated learner data and no
 * baked lock artwork, so React occludes nothing — it only makes the artwork's
 * own craft tiles and bottom action row touch-enabled.
 */

// The artwork's five craft tiles. Only SmokeCraft 360 has a destination in
// this build; the other craft verticals are drawn in the approved artwork but
// have no module yet, so they are announced as unavailable rather than wired
// to a stand-in screen or silently made dead.
const CRAFT_TILES = [
  { id: 'smokecraft', label: 'SmokeCraft 360',            left: '6.5%',  available: true  },
  { id: 'pourcraft',  label: 'PourCraft 360',             left: '23.8%', available: false },
  { id: 'winecraft',  label: 'WineCraft 360',             left: '40.9%', available: false },
  { id: 'beercraft',  label: 'BeerCraft 360',             left: '58.0%', available: false },
  { id: 'passport',   label: '360 Passport Connections',  left: '75.2%', available: true  },
]

export default function SmokeCraftCraftHub() {
  const navigate = useNavigate()

  function goAction(actionId) {
    triggerHaptic('light')
    navigate(resolveSmokeCraftLandingAction(actionId).route)
  }

  // Back returns to the EXACT prior screen the user came from — the same
  // established pattern used elsewhere in this app (VenueOwnerDemo,
  // EATCommand, KioskSetup) — falling back to the SmokeCraft landing only
  // when there is no history entry to return to. It mutates no journey state,
  // so leaving CraftHub can never reset or restart the active journey.
  function goBack() {
    triggerHaptic('light')
    if (window.history.length > 1) navigate(-1)
    else navigate('/smokecraft')
  }

  function handleTile(tile) {
    if (!tile.available) return
    if (tile.id === 'smokecraft') return goAction(SMOKECRAFT_LANDING_ACTIONS.RESUME)
    return goAction(SMOKECRAFT_LANDING_ACTIONS.PASSPORT)
  }

  const hotspot = {
    position: 'absolute',
    background: 'transparent',
    border: '1.5px solid transparent',
    borderRadius: 10,
    pointerEvents: 'auto',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  }

  const hoverable = enabled => ({
    onMouseEnter: e => { if (enabled) e.currentTarget.style.borderColor = GOLD },
    onMouseLeave: e => { e.currentTarget.style.borderColor = 'transparent' },
    onFocus:      e => { if (enabled) e.currentTarget.style.borderColor = GOLD },
    onBlur:       e => { e.currentTarget.style.borderColor = 'transparent' },
  })

  return (
    <SmokeCraftImageBoundsOverlay
      src={SC_ASSETS.craftHubVenueTable}
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="CraftHub 360 — Venue Table Experience"
      bottomOffset={0}
    >
      <h1 style={{
        position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
        overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
      }}>CraftHub 360 — Venue Table Experience</h1>

      {/* The artwork's five craft tiles, made touch-enabled. */}
      {CRAFT_TILES.map(tile => (
        <button
          key={tile.id}
          type="button"
          data-testid={`crafthub-tile-${tile.id}`}
          aria-label={tile.available ? tile.label : `${tile.label} — not available yet`}
          aria-disabled={!tile.available}
          onClick={() => handleTile(tile)}
          style={{
            ...hotspot,
            left: tile.left, top: '35.5%', width: '15.6%', height: '44.0%',
            cursor: tile.available ? 'pointer' : 'default',
          }}
          {...hoverable(tile.available)}
        />
      ))}

      {/* The artwork's bottom action row: ENTER CRAFTHUB / STAFF HANDOFF /
          360 PASSPORT CONNECTIONS / DAYONE360 TRAVEL.
          System Audit Prompt 3E-1 (SC-D013): DAYONE360 TRAVEL has a real
          destination (/dayone360-travel — a top-level route, sibling to
          /smokecraft, not nested under it) and is now wired. STAFF
          HANDOFF has no real feature anywhere in this codebase (confirmed:
          no staff-handoff route exists) — honestly disabled rather than
          fabricated. */}
      <button
        type="button"
        data-testid="crafthub-enter"
        aria-label="Enter CraftHub"
        onClick={() => goAction(SMOKECRAFT_LANDING_ACTIONS.RESUME)}
        style={{ ...hotspot, left: '13.7%', top: '86.4%', width: '18.0%', height: '7.6%', cursor: 'pointer' }}
        {...hoverable(true)}
      />
      <button
        type="button"
        data-testid="crafthub-staff-handoff"
        aria-label="Staff Handoff (not yet available)"
        disabled
        style={{ ...hotspot, left: '33.25%', top: '86.4%', width: '18.0%', height: '7.6%', cursor: 'default' }}
      />
      <button
        type="button"
        data-testid="crafthub-passport"
        aria-label="360 Passport Connections"
        onClick={() => goAction(SMOKECRAFT_LANDING_ACTIONS.PASSPORT)}
        style={{ ...hotspot, left: '52.8%', top: '86.4%', width: '18.0%', height: '7.6%', cursor: 'pointer' }}
        {...hoverable(true)}
      />
      <button
        type="button"
        data-testid="crafthub-dayone360"
        aria-label="DayOne360 Travel"
        onClick={() => { triggerHaptic('light'); navigate('/dayone360-travel') }}
        style={{ ...hotspot, left: '72.4%', top: '86.4%', width: '18.0%', height: '7.6%', cursor: 'pointer' }}
        {...hoverable(true)}
      />

      {/* The artwork's top-left "BACK TO NOVEE OS" / "HOME" controls. */}
      <button
        type="button"
        data-testid="crafthub-back"
        aria-label="Back to SmokeCraft landing"
        onClick={goBack}
        style={{ ...hotspot, left: '7.6%', top: '3.4%', width: '13.5%', height: '5.4%', cursor: 'pointer' }}
        {...hoverable(true)}
      />
    </SmokeCraftImageBoundsOverlay>
  )
}
