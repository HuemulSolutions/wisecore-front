export interface EditorProps {
  sectionId: string
  content: string
  onSave: (sectionId: string, newContent: string) => void | Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

import type { OurFileRouter } from '@/lib/uploadthing'
import type { ClientUploadedFileData, UploadFilesOptions } from 'uploadthing/types'

export interface EditorUploadedFile {
  url: string
  /** Actual download URL for in-editor preview. url contains the {{MEDIA:uuid}} token. */
  previewUrl?: string
  name: string
  size: number
  type: string
  mediaId: string
}

export type UploadedFile<T = unknown> = ClientUploadedFileData<T>

export interface UseUploadFileProps
  extends Pick<
    UploadFilesOptions<OurFileRouter['editorUploader']>,
    'headers' | 'onUploadBegin' | 'onUploadProgress' | 'skipPolling'
  > {
  onUploadComplete?: (file: UploadedFile) => void
  onUploadError?: (error: unknown) => void
}
