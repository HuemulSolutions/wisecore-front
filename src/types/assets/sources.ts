import type { ContextItem } from '@/types/context'
import type { Dependency } from '@/types/dependency/sheets'

export type SourceKind = 'asset' | 'file' | 'text'

/** Tipo de archivo inferido por la extensión del nombre (el backend no guarda MIME ni tamaño). */
export type SourceFileType = 'pdf' | 'word' | 'excel' | 'text' | 'other'

export interface AssetSourceRow {
  key: string
  kind: 'asset'
  name: string
  dependency: Dependency
}

export interface ContextSourceRow {
  key: string
  kind: 'file' | 'text'
  name: string
  context: ContextItem
  required: boolean
  /** Obligatoria y sin contenido: bloquea la generación con IA. */
  pending: boolean
  fileType: SourceFileType | null
  /** Largo del texto (solo tiene sentido en `kind === 'text'`). */
  characters: number
}

export type SourceRow = AssetSourceRow | ContextSourceRow

export interface SourceGroups {
  assets: AssetSourceRow[]
  files: ContextSourceRow[]
  texts: ContextSourceRow[]
}

/** Subida de archivo en curso (aún no existe como fuente en el backend). */
export interface SourceUpload {
  id: string
  name: string
  size: number
  /** 0-100. */
  progress: number
}

export interface AssetsSourcesSheetProps {
  selectedFile: { id: string; name?: string }
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  documentName?: string
  lifecyclePermissions?: {
    view?: boolean
    create?: boolean
    edit?: boolean
    review?: boolean
    approve?: boolean
    publish?: boolean
    archive?: boolean
  }
  stage?: string
  /** `isExternalElaborationLocked(documentContent?.lifecycle_status)` del caller — ver ia context/elaboracion-externa-guide.md. */
  isExternalElaborationLocked?: boolean
  /** El activo está en modo Lector: las fuentes se ven pero no se modifican. */
  isViewMode: boolean
  /** Cambia el activo a modo Editor (aviso "Pasar a Editor"). */
  onSwitchToEditor: () => void
}
