import { createContext, useContext } from 'react'
import { useSmokeCraftImageBounds } from '../../hooks/useSmokeCraftImageBounds.js'

const ImageBoundsContext = createContext(null)

/**
 * SmokeCraftImageBounds
 * Provides image-bounds context to children. Wrap the component that needs
 * to position React controls relative to the cover-fitted background image.
 *
 * @param {string} src - Same src as the SmokeCraftAssetScreen background
 * @param {React.ReactNode} children
 */
export function SmokeCraftImageBoundsProvider({ src, children }) {
  const bounds = useSmokeCraftImageBounds(src)
  return (
    <ImageBoundsContext.Provider value={bounds}>
      {children}
    </ImageBoundsContext.Provider>
  )
}

/** Returns the current image bounds, or null if not yet computed. */
export function useImageBoundsContext() {
  return useContext(ImageBoundsContext)
}

export default SmokeCraftImageBoundsProvider
