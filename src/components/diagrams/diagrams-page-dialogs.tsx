"use client"

import { DiagramViewSheet } from "./diagram-view-sheet"
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
  /** `diagram:d`. Obligatoria: sin default, olvidarse de pasarla rompe el build. */
  canDelete: boolean
}

export function DiagramsPageDialogs({
  state,
  organizationId,
  onCloseDialog,
  canDelete,
}: DiagramsPageDialogsProps) {
  const closeDialog = (key: keyof DiagramsPageState) => (open: boolean) => {
    if (!open) onCloseDialog(key)
  }

  return (
    <>
      <DiagramViewSheet
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
        canDelete={canDelete}
      />
    </>
  )
}
