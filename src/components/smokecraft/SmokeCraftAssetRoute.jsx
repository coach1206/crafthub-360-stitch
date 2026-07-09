import SmokeCraftAssetScreen from './SmokeCraftAssetScreen.jsx'
import SmokeCraftHotspotLayer from './SmokeCraftHotspotLayer.jsx'

/**
 * Composes SmokeCraftAssetScreen with an optional hotspot overlay.
 *
 * The hotspot layer is rendered as a CHILD of SmokeCraftAssetScreen so its
 * coordinate system is relative to the rendered image — not the viewport.
 * This fixes misaligned pills on screens where the image aspect ratio differs
 * from the device viewport (e.g. portrait image on landscape desktop).
 */
export default function SmokeCraftAssetRoute({ src, alt, hotspots = [], route = '' }) {
  return (
    <SmokeCraftAssetScreen src={src} alt={alt}>
      {hotspots.length > 0 && (
        <SmokeCraftHotspotLayer hotspots={hotspots} route={route} />
      )}
    </SmokeCraftAssetScreen>
  )
}
