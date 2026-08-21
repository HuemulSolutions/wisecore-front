import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { FolderPlus } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { getErrorMessage } from "@/lib/error-utils"
import { useDocumentTypeFolderMutations } from "@/hooks/useDocumentTypeFolders"
import type { AssetTypeFolderCreateSheetProps } from "@/types/assets"

export type { AssetTypeFolderCreateSheetProps } from "@/types/assets"

export function AssetTypeFolderCreateSheet({ open, onOpenChange }: AssetTypeFolderCreateSheetProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { createFolder } = useDocumentTypeFolderMutations()

  useEffect(() => {
    if (open) {
      setName("")
      setError(null)
    }
  }, [open])

  const handleCreate = async () => {
    if (!name.trim()) {
      setError(t("asset-types:folders.nameRequired"))
      return
    }
    setError(null)
    try {
      await createFolder.mutateAsync({ name: name.trim() })
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err, t("asset-types:folders.createError")))
    }
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("asset-types:folders.createTitle")}
      icon={FolderPlus}
      maxWidth="sm:max-w-lg"
      saveAction={{
        label: t("common:create"),
        onClick: handleCreate,
        loading: createFolder.isPending,
        disabled: !name.trim(),
        closeOnSuccess: false,
      }}
      cancelLabel={t("common:cancel")}
    >
      <HuemulField
        label={t("asset-types:folders.nameLabel")}
        name="name"
        value={name}
        onChange={(v) => setName(String(v))}
        placeholder={t("asset-types:folders.namePlaceholder")}
        error={error ?? undefined}
        disabled={createFolder.isPending}
        required
      />
    </HuemulSheet>
  )
}

export default AssetTypeFolderCreateSheet
