import SmokeCraftAssetScreen from './SmokeCraftAssetScreen.jsx'
import SmokeCraftHotspotLayer from './SmokeCraftHotspotLayer.jsx'

/**
 * Composes SmokeCraftAssetScreen with an optional invisible hotspot overlay.
 * SmokeCraftAssetScreen is not modified.
 *
 * Props:
 *   src       — image path passed through to SmokeCraftAssetScreen
 *   alt       — alt text passed through to SmokeCraftAssetScreen
 *   hotspots  — array of hotspot definitions (see SmokeCraftHotspotLayer)
 */
export default function SmokeCraftAssetRoute({ src, alt, hotspots = [], route = '', objectPosition }) {
  return (
    <SmokeCraftAssetScreen src={src} alt={alt} objectPosition={objectPosition}>
      {hotspots.length > 0 && <SmokeCraftHotspotLayer hotspots={hotspots} route={route} />}
    </SmokeCraftAssetScreen>
  )
}
