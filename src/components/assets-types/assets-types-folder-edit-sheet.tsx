import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { FolderPen, Trash2 } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/error-utils"
import { useDocumentTypeFolderMutations } from "@/hooks/useDocumentTypeFolders"
import type { AssetTypeFolderEditSheetProps } from "@/types/assets"

export type { AssetTypeFolderEditSheetProps } from "@/types/assets"

export function AssetTypeFolderEditSheet({
  folder,
  open,
  onOpenChange,
  canDelete = false,
}: AssetTypeFolderEditSheetProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { updateFolder, deleteFolder } = useDocumentTypeFolderMutations()

  useEffect(() => {
    if (folder && open) {
      setName(folder.name)
      setError(null)
    }
  }, [folder, open])

  const handleSave = async () => {
    if (!folder) return
    if (!name.trim()) {
      setError(t("asset-types:folders.nameRequired"))
      return
    }
    setError(null)
    try {
      await updateFolder.mutateAsync({ id: folder.id, data: { name: name.trim() } })
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err, t("asset-types:folders.updateError")))
    }
  }

  const isDirty = !!folder && name.trim() !== folder.name

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("asset-types:folders.editTitle")}
        icon={FolderPen}
        maxWidth="sm:max-w-lg"
        saveAction={{
          label: t("common:save"),
          onClick: handleSave,
          loading: updateFolder.isPending,
          disabled: !name.trim() || !isDirty,
          closeOnSuccess: false,
        }}
        cancelLabel={t("common:cancel")}
        footerLeft={canDelete ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:cursor-pointer"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {t("asset-types:folders.delete")}
          </Button>
        ) : undefined}
      >
        <HuemulField
          label={t("asset-types:folders.nameLabel")}
          name="name"
          value={name}
          onChange={(v) => setName(String(v))}
          placeholder={t("asset-types:folders.namePlaceholder")}
          error={error ?? undefined}
          disabled={updateFolder.isPending}
          required
        />
      </HuemulSheet>

      <HuemulAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("asset-types:folders.deleteTitle")}
        description={t("asset-types:folders.deleteDescription", { name: folder?.name })}
        actionLabel={t("asset-types:folders.delete")}
        actionIcon={Trash2}
        actionVariant="destructive"
        cancelLabel={t("common:cancel")}
        onAction={async () => {
          if (!folder) return
          await deleteFolder.mutateAsync(folder.id)
          setDeleteOpen(false)
          onOpenChange(false)
        }}
      />
    </>
  )
}

export default AssetTypeFolderEditSheet
