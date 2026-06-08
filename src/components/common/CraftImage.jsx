import { useState } from 'react'
import { getFallback } from '../../lib/craftImages.js'

export default function CraftImage({
  src,
  alt = '',
  fallbackType = 'default',
  fallbackSrc,
  className = '',
  style = {},
  loading = 'lazy',
  onClick,
}) {
  const resolvedFallback = fallbackSrc || getFallback(fallbackType)
  const [imgSrc, setImgSrc] = useState(src || resolvedFallback)
  const [errored, setErrored] = useState(false)

  function handleError() {
    if (!errored) {
      setErrored(true)
      setImgSrc(resolvedFallback)
    }
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading={loading}
      onError={handleError}
      onClick={onClick}
      className={className}
      style={{
        objectFit: 'cover',
        display: 'block',
        ...style,
        cursor: onClick ? 'pointer' : style.cursor,
      }}
    />
  )
}
