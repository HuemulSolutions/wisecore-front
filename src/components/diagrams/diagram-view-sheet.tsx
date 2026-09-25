"use client"

import { useTranslation } from "react-i18next"
import { Pencil, Workflow } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { useDiagram } from "@/hooks/useDiagrams"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useOrgPath } from "@/hooks/useOrgRouter"
import { DiagramCanvas } from "./diagram-canvas"

export interface DiagramViewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  diagramId: string | null
  organizationId: string
}

// Read-only diagram viewer: pan/zoom + info side panels, no editing. To actually
// edit relationships the user is sent to /diagrams, donde el árbol de assets está
// disponible para arrastrar y relacionar.
export function DiagramViewSheet({ open, onOpenChange, diagramId, organizationId }: DiagramViewSheetProps) {
  const { t } = useTranslation("diagrams")
  const buildPath = useOrgPath()
  const { isOrgAdmin, hasPermission } = useUserPermissions()

  // Shares the react-query cache with DiagramCanvas — only used here for the sheet title.
  const { data: diagram } = useDiagram(organizationId, diagramId ?? "")

  const canEdit = isOrgAdmin || hasPermission("diagram:u")

  const handleEdit = () => {
    if (!diagramId) return
    window.open(buildPath(`/diagrams?diagram=${diagramId}`), "_blank", "noopener,noreferrer")
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={diagram?.name ?? t("editSheet.title")}
      icon={Workflow}
      showFooter={false}
      maxWidth="sm:max-w-[95vw]"
      extraActions={canEdit && diagramId ? [{
        label: t("editSheet.editAction"),
        icon: Pencil,
        position: "header",
        onClick: handleEdit,
      }] : undefined}
    >
      {diagramId && (
        <div className="h-[80vh]">
          <DiagramCanvas organizationId={organizationId} diagramId={diagramId} readOnly />
        </div>
      )}
    </HuemulSheet>
  )
}
