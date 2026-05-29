import { useState, useEffect } from "react"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { DeleteFolderDialogProps } from "@/types/assets"
import { useTranslation } from "react-i18next"

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folderName,
  onConfirm,
}: DeleteFolderDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDocuments, setDeleteDocuments] = useState(false)
  const { t } = useTranslation(["assets", "common"])

  useEffect(() => {
    if (!open) setDeleteDocuments(false)
  }, [open])

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm(deleteDocuments)
    } finally {
      setIsDeleting(false)
    }
  }

  const description = (
    <div className="space-y-4">
      <p>{t('deleteFolder.description', { name: folderName })}</p>
      <div className="flex items-center gap-2">
        <Checkbox
          id="delete-documents"
          checked={deleteDocuments}
          onCheckedChange={(checked) => setDeleteDocuments(checked === true)}
          disabled={isDeleting}
        />
        <Label htmlFor="delete-documents" className="cursor-pointer font-normal">
          {t('deleteFolder.deleteDocumentsLabel')}
        </Label>
      </div>
    </div>
  )

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteFolder.title')}
      description={description}
      onAction={handleConfirm}
      actionLabel={t('common:delete')}
    />
  )
}
