import { memo } from "react"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import type { DeleteDocumentDialogProps } from "@/types/assets"
export type { DeleteDocumentDialogProps } from "@/types/assets"
import { useTranslation } from "react-i18next"

// Diálogo único de borrado de activo/ejecución, usado tanto desde el árbol
// de la biblioteca (nav-knowledge-provider) como desde el detalle del
// activo (assets-content). showSuccessState=false porque el del árbol vive
// siempre montado en el layout: si mostrara el check "Listo", Radix lo
// dejaría visible durante toda la animación de salida (~200ms).
export const DeleteDocumentDialog = memo(function DeleteDocumentDialog({
  open,
  onOpenChange,
  deleteType = 'document',
  documentName,
  executionFormattedDate,
  onAction,
}: DeleteDocumentDialogProps) {
  const { t } = useTranslation(["assets", "common"])
  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={deleteType === 'execution' ? t('content.deleteVersionTitle') : t('content.deleteDocumentTitle')}
      description={
        deleteType === 'execution'
          ? (executionFormattedDate
              ? t('content.deleteExecutionDescription', { date: executionFormattedDate })
              : t('content.deleteExecutionFallback'))
          : t('content.deleteDocumentDescription', { name: documentName })
      }
      onAction={onAction}
      actionLabel={t('content.deleteConfirm')}
      loadingLabel={t('common:deleting')}
      actionVariant="destructive"
      showSuccessState={false}
    />
  )
})
