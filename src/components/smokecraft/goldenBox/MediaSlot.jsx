import { useState } from 'react'
import { SC_ASSETS } from '../../../constants/smokecraftAssets.js'

/**
 * Package 2 — data-driven media slot (permanent image directive: the
 * user is actively creating new SmokeCraft images; this component must
 * be ready to receive them without a screen rebuild). Looks up
 * `assetKey` in SC_ASSETS first; if no approved asset exists yet, shows
 * an honest, clearly-labeled "image pending" fallback — never a baked
 * placeholder image passed off as final art.
 */
export default function MediaSlot({ assetKey, directSrc, alt, caption, decorative = false, style }) {
  const [failed, setFailed] = useState(false)
  // `directSrc` covers approved assets that already have a real path from
  // an existing registry (e.g. the mentor roster's own `image` field)
  // but aren't (yet) keyed into SC_ASSETS — still a real, approved image,
  // never a fabricated placeholder.
  const src = directSrc || (assetKey ? SC_ASSETS[assetKey] : null)
  const hasApprovedAsset = !!src && !failed

  return (
    <figure style={{ margin: 0, position: 'relative', overflow: 'hidden', background: '#0a0e16', ...style }}>
      {hasApprovedAsset ? (
        <img
          src={src}
          alt={decorative ? '' : (alt || '')}
          aria-hidden={decorative || undefined}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div
          role={decorative ? undefined : 'img'}
          aria-label={decorative ? undefined : (alt ? `${alt} — image pending` : 'Image pending')}
          style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(233,193,118,0.45)', fontFamily: 'Georgia, serif', fontSize: 12, textAlign: 'center', padding: 8,
            border: '1px dashed rgba(233,193,118,0.25)',
          }}
        >
          Image pending{assetKey ? ` (${assetKey})` : ''}
        </div>
      )}
      {caption && !decorative && (
        <figcaption style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', color: '#e5e2e1', fontSize: 11, padding: '4px 8px' }}>
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
