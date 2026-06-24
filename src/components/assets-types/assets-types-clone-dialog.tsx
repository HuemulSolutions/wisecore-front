import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Copy } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { CloneAssetTypeDialogProps } from "@/types/assets"
export type { CloneAssetTypeDialogProps } from "@/types/assets"

export function CloneAssetTypeDialog({ open, onOpenChange, assetTypeName, onConfirm }: CloneAssetTypeDialogProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const [includeRelationships, setIncludeRelationships] = useState(true)

  const handleConfirm = async () => {
    await onConfirm(includeRelationships)
    setIncludeRelationships(true)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setIncludeRelationships(true)
    }
    onOpenChange(isOpen)
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("clone.title")}
      description={t("clone.description", { name: assetTypeName })}
      icon={Copy}
      cancelLabel={t("common:cancel")}
      saveAction={{
        label: t("clone.confirm"),
        onClick: handleConfirm,
        icon: Copy,
      }}
    >
      <div className="py-2">
        <HuemulField
          type="switch"
          label={t("clone.copyRelationships")}
          description={t("clone.copyRelationshipsDescription")}
          value={includeRelationships}
          onChange={(val) => setIncludeRelationships(val as boolean)}
        />
      </div>
    </HuemulDialog>
  )
}
