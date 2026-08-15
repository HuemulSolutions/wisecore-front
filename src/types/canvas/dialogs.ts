import type { Canvas } from './core'

export interface CanvasCreateEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  canvas: Canvas | null
  organizationId: string
  canSave?: boolean
}

export interface CanvasDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  canvas: Canvas | null
  organizationId: string
  canDelete?: boolean
}

export interface CanvasPageState {
  searchTerm: string
  showCreateDialog: boolean
  editingCanvas: Canvas | null
  deletingCanvas: Canvas | null
}

export interface CanvasPageDialogsProps {
  state: CanvasPageState
  organizationId: string
  onCloseDialog: (dialog: keyof CanvasPageState) => void
  canCreate?: boolean
  canUpdate?: boolean
  canDelete?: boolean
}
