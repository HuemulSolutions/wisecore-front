"use client"

import { DiagramEditSheet } from "./diagram-edit-sheet"
import { DiagramsDeleteDialog } from "./diagrams-delete-dialog"
import type { Diagram } from "@/types/diagrams"

export interface DiagramsPageState {
  editingDiagramId: string | null
  deletingDiagram: Diagram | null
}

export interface DiagramsPageDialogsProps {
  state: DiagramsPageState
  organizationId: string
  onCloseDialog: (dialog: keyof DiagramsPageState) => void
}

export function DiagramsPageDialogs({
  state,
  organizationId,
  onCloseDialog,
}: DiagramsPageDialogsProps) {
  const closeDialog = (key: keyof DiagramsPageState) => (open: boolean) => {
    if (!open) onCloseDialog(key)
  }

  return (
    <>
      <DiagramEditSheet
        open={!!state.editingDiagramId}
        onOpenChange={closeDialog('editingDiagramId')}
        diagramId={state.editingDiagramId}
        organizationId={organizationId}
      />

      <DiagramsDeleteDialog
        open={!!state.deletingDiagram}
        onOpenChange={closeDialog('deletingDiagram')}
        diagram={state.deletingDiagram}
        organizationId={organizationId}
      />
    </>
  )
}
