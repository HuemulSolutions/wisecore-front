import { createContext, useContext } from 'react'
import type { PlateEditor } from 'platejs/react'

interface MediaReferenceContextValue {
  /**
   * Call this to open the media reference picker for the given editor instance.
   * Returns null when the picker is not available (e.g. no organizationId provided).
   */
  openPicker: ((editor: PlateEditor) => void) | null
}

export const MediaReferenceContext = createContext<MediaReferenceContextValue>({
  openPicker: null,
})

export function useMediaReference(): MediaReferenceContextValue {
  return useContext(MediaReferenceContext)
}
