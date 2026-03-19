"use client"

import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import type { CustomField } from "@/types/custom-fields"
import { useTranslation } from "react-i18next"

interface DeleteCustomFieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customField: CustomField | null
  onConfirm: (customField: CustomField) => void
}

export function DeleteCustomFieldDialog({
  open,
  onOpenChange,
  customField,
  onConfirm,
}: DeleteCustomFieldDialogProps) {
  const { t } = useTranslation('custom-fields')

  const handleDelete = async () => {
    onConfirm(customField!)
  }

  if (!customField) return null

  const formatDataType = (dataType: string) => {
    return t(`dataTypes.${dataType}` as Parameters<typeof t>[0], { defaultValue: dataType })
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteDialog.title')}
      icon={Trash2}
      iconClassName="text-destructive"
      closeDelay={800}
      saveAction={{
        label: t('actions.deleteCustomField'),
        onClick: handleDelete,
        variant: "destructive",
        icon: Trash2,
      }}
    >
      <div className="space-y-3">
        <p>
          {t('deleteDialog.description')}
        </p>

        <div className="rounded-lg border p-3 bg-muted/50">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">{t('deleteDialog.nameLabel')}:</span> {customField.name}
            </div>
            <div>
              <span className="font-medium">{t('deleteDialog.descriptionLabel')}:</span> {customField.description}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{t('deleteDialog.dataTypeLabel')}:</span>
              <Badge variant="outline">
                {formatDataType(customField.data_type)}
              </Badge>
            </div>
            {customField.masc && (
              <div>
                <span className="font-medium">{t('deleteDialog.maskLabel')}:</span>
                <code className="ml-1 text-xs bg-background px-1 py-0.5 rounded">
                  {customField.masc}
                </code>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          <strong>{t('deleteDialog.warningTitle')}:</strong> {t('deleteDialog.warningMessage')}
        </p>
      </div>
    </HuemulDialog>
  )
}