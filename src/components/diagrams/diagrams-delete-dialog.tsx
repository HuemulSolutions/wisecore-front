"use client"

import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useDiagramMutations } from "@/hooks/useDiagrams"
import { handleApiError } from "@/lib/error-utils"
import type { Diagram } from "@/types/diagrams"

export interface DiagramsDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  diagram: Diagram | null
  organizationId: string
}

export function DiagramsDeleteDialog({
  open,
  onOpenChange,
  diagram,
  organizationId,
}: DiagramsDeleteDialogProps) {
  const { t } = useTranslation(['diagrams', 'common'])
  const mutations = useDiagramMutations(organizationId)

  if (!diagram) return null

  const handleDelete = () =>
    new Promise<void>((resolve, reject) => {
      mutations.deleteDiagram.mutate(diagram.id, {
        onSuccess: () => { onOpenChange(false); resolve() },
        onError: (err) => {
          handleApiError(err)
          reject(err)
        },
      })
    })

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteDialog.title')}
      icon={Trash2}
      iconClassName="text-destructive"
      closeDelay={800}
      saveAction={{
        label: t('actions.deleteDiagram'),
        onClick: handleDelete,
        variant: "destructive",
        icon: Trash2,
      }}
    >
      <div className="space-y-3">
        <p>{t('deleteDialog.description')}</p>
        <div className="rounded-lg border p-3 bg-muted/50">
          <div className="text-sm space-y-1">
            <div>
              <span className="font-medium">{t('deleteDialog.nameLabel')}:</span>{" "}
              {diagram.name}
            </div>
          </div>
        </div>
      </div>
    </HuemulDialog>
  )
}
