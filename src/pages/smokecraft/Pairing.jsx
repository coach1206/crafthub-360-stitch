import { useNavigate } from 'react-router-dom'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import {
  resolveSmokeCraftLandingAction,
  getSmokeCraftLandingJourneyState,
  getPrimaryActionId,
} from '../../constants/smokecraftLandingActions.js'

/**
 * Pairing — /smokecraft/pairing
 *
 * FINAL APPROVED SHELLS PASS — fit correction.
 *
 * The immediately-prior pass disclosed this screen as:
 *
 *   "Pairing.jsx uses backgroundSize: cover, so the approved pairing image is
 *    cropped rather than shown at true aspect ratio. Route is correct; fit is
 *    not."
 *
 * The approved composition is PORTRAIT (1086 x 1448). Rendering it as a
 * `background-size: cover` fill on a landscape viewport cropped away the top
 * header ("STEP 7 OF 17", the back arrow) and the entire bottom control row
 * ("BACK", "CONTINUE TO NEXT STEP") — i.e. `cover` was destroying exactly the
 * controls and labels the image exists to present.
 *
 * It now renders through SmokeCraftImageBoundsOverlay, the same non-destructive
 * technique Format.jsx / HowItWorks.jsx use: the intrinsic <img> is scaled by
 * `Math.min(containerW/naturalW, containerH/naturalH)` and centred, so the
 * COMPLETE composition is always visible, aspect ratio is always preserved,
 * nothing is clipped, and the overlay rect tracks the rendered image via a
 * ResizeObserver — which is what keeps the percentage-positioned hotspots
 * below aligned to the artwork at every viewport size.
 *
 * The image's own BACK and CONTINUE buttons are now live controls. CONTINUE
 * resolves through the canonical landing resolver rather than a hardcoded
 * route, so this screen never invents a destination of its own.
 */

const NAT_W = 1086
const NAT_H = 1448
const GOLD = '#E9C176'

const HOTSPOT = {
  position: 'absolute',
  background: 'transparent',
  border: '1.5px solid transparent',
  borderRadius: 6,
  cursor: 'pointer',
  pointerEvents: 'auto',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}

function focusRing(e, on) { e.currentTarget.style.borderColor = on ? GOLD : 'transparent' }

export default function Pairing() {
  const navigate = useNavigate()

  const journeyState = getSmokeCraftLandingJourneyState()
  const primary = resolveSmokeCraftLandingAction(getPrimaryActionId(journeyState), journeyState)

  function handleBack() {
    triggerHaptic('light')
    navigate(-1)
  }

  function handleContinue() {
    triggerHaptic('medium')
    navigate(primary.route)
  }

  return (
    <SmokeCraftImageBoundsOverlay
      src="/assets/smokecraft-reference/approved/smokecraft-pairing.png"
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="SmokeCraft 360 — Your Blend Pairing Guide"
      bottomOffset={0}
    >
      <h1 style={{
        position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
        overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
      }}>SmokeCraft 360 — Your Blend Pairing Guide</h1>

      {/* Image's own top-left back arrow */}
      <button
        type="button"
        data-testid="pairing-back-arrow"
        aria-label="Go back"
        onClick={handleBack}
        style={{ ...HOTSPOT, left: '1.4%', top: '0.8%', width: '3.4%', height: '2.4%', borderRadius: '50%' }}
        onMouseEnter={e => focusRing(e, true)} onMouseLeave={e => focusRing(e, false)}
        onFocus={e => focusRing(e, true)} onBlur={e => focusRing(e, false)}
      />

      {/* Image's own bottom "BACK" button */}
      <button
        type="button"
        data-testid="pairing-back"
        aria-label="Back"
        onClick={handleBack}
        style={{ ...HOTSPOT, left: '24.4%', top: '95.2%', width: '17.6%', height: '3.5%' }}
        onMouseEnter={e => focusRing(e, true)} onMouseLeave={e => focusRing(e, false)}
        onFocus={e => focusRing(e, true)} onBlur={e => focusRing(e, false)}
      />

      {/* Image's own bottom "CONTINUE TO NEXT STEP" button */}
      <button
        type="button"
        data-testid="pairing-continue"
        aria-label={primary.label}
        onClick={handleContinue}
        style={{ ...HOTSPOT, left: '42.9%', top: '95.2%', width: '31.7%', height: '3.5%' }}
        onMouseEnter={e => focusRing(e, true)} onMouseLeave={e => focusRing(e, false)}
        onFocus={e => focusRing(e, true)} onBlur={e => focusRing(e, false)}
      />
    </SmokeCraftImageBoundsOverlay>
  )
}
