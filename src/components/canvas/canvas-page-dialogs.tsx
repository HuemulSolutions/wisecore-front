"use client"

import { CanvasCreateEditDialog } from "./canvas-create-edit-dialog"
import { CanvasDeleteDialog } from "./canvas-delete-dialog"
import type { CanvasPageState, CanvasPageDialogsProps } from '@/types/canvas'
export type { CanvasPageState } from '@/types/canvas'

export function CanvasPageDialogs({
  state,
  organizationId,
  onCloseDialog,
}: CanvasPageDialogsProps) {
  const closeDialog = (key: keyof CanvasPageState) => (open: boolean) => {
    if (!open) onCloseDialog(key)
  }

  return (
    <>
      <CanvasCreateEditDialog
        open={state.showCreateDialog}
        onOpenChange={closeDialog('showCreateDialog')}
        canvas={null}
        organizationId={organizationId}
      />

      <CanvasCreateEditDialog
        open={!!state.editingCanvas}
        onOpenChange={closeDialog('editingCanvas')}
        canvas={state.editingCanvas}
        organizationId={organizationId}
      />

      <CanvasDeleteDialog
        open={!!state.deletingCanvas}
        onOpenChange={closeDialog('deletingCanvas')}
        canvas={state.deletingCanvas}
        organizationId={organizationId}
      />
    </>
  )
}
