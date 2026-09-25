import { createContext, useContext } from 'react'
import type { PlateEditor } from 'platejs/react'
import type { MediaLevel } from '@/types/media'

/** Where files uploaded from the editor should be attached. */
export interface EditorMediaUploadTarget {
  level: MediaLevel
  parentId: string
}

interface MediaReferenceContextValue {
  /**
   * Call this to open the media reference picker for the given editor instance.
   * Returns null when the picker is not available (e.g. no organizationId provided).
   */
  openPicker: ((editor: PlateEditor) => void) | null
  /**
   * Target (level + parent id) for files uploaded from this editor. When null,
   * uploads fall back to the organization level.
   */
  uploadTarget: EditorMediaUploadTarget | null
}

export const MediaReferenceContext = createContext<MediaReferenceContextValue>({
  openPicker: null,
  uploadTarget: null,
})

export function useMediaReference(): MediaReferenceContextValue {
  return useContext(MediaReferenceContext)
}
