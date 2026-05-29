"use client"

import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useCanvasMutations } from "@/hooks/useCanvas"
import type { CanvasDeleteDialogProps } from '@/types/canvas'
export type { CanvasDeleteDialogProps } from '@/types/canvas'

export function CanvasDeleteDialog({
  open,
  onOpenChange,
  canvas,
  organizationId,
}: CanvasDeleteDialogProps) {
  const { t } = useTranslation(['canvas', 'common'])
  const mutations = useCanvasMutations(organizationId)

  if (!canvas) return null

  const handleDelete = () =>
    new Promise<void>((resolve, reject) => {
      mutations.deleteCanvas.mutate(canvas.id, {
        onSuccess: () => { onOpenChange(false); resolve() },
        onError: (err) => reject(err),
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
        label: t('actions.deleteCanvas'),
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
              {canvas.name}
            </div>
          </div>
        </div>
      </div>
    </HuemulDialog>
  )
}
