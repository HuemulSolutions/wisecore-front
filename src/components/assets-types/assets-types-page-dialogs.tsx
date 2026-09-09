import { useTranslation } from "react-i18next"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import CreateDocumentType from "@/components/assets-types/assets-types-create"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { CloneAssetTypeDialog } from "@/components/assets-types/assets-types-clone-dialog"
import { AssetTypeRelationshipsSheet } from "@/components/assets-types/assets-types-relationships-sheet"
import { AssetTypeExportDialog } from "@/components/assets-types/assets-types-export-dialog"
import { AssetTypeImportSheet } from "@/components/assets-types/assets-types-import-sheet"
import { useDocumentTypeFolderMutations } from "@/hooks/useDocumentTypeFolders"
import type { AssetTypePageDialogsProps } from '@/types/assets'

export type { AssetTypePageDialogsProps } from '@/types/assets'

export default function AssetTypePageDialogs({
  state,
  onCloseDialog,
  onUpdateState,
  assetTypeMutations,
  onImportSuccess,
  exportSelectedIds,
  onExported,
  onAssetTypeCreated,
}: AssetTypePageDialogsProps) {
  const { t } = useTranslation(['asset-types', 'common'])
  const { canDelete, canCreate } = useUserPermissions()
  const { deleteFolder } = useDocumentTypeFolderMutations()

  const handleDeleteFolder = async () => {
    if (!state.deletingFolder) return
    await deleteFolder.mutateAsync(state.deletingFolder.id)
  }

  const handleDelete = async () => {
    if (!canDelete('asset_type') || !state.deletingAssetType) return

    const minDelay = new Promise(resolve => setTimeout(resolve, 800))

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        assetTypeMutations.deleteAssetType.mutate(state.deletingAssetType!.document_type_id, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        })
      }),
      minDelay
    ])
  }

  const handleClone = async (includeRelationships: boolean) => {
    if (!canCreate('asset_type') || !state.cloningAssetType) return

    const minDelay = new Promise(resolve => setTimeout(resolve, 800))

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        assetTypeMutations.cloneAssetType.mutate(
          { id: state.cloningAssetType!.document_type_id, includeRelationships },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error)
          }
        )
      }),
      minDelay
    ])
  }

  return (
    <>
      {/* Create Dialog — la edición vive ahora en el tab General del sheet de configuración */}
      <CreateDocumentType
        type="asset"
        documentType={null}
        canSave={canCreate('asset_type')}
        open={state.showCreateDialog}
        onOpenChange={(open) => {
          if (!open) {
            onUpdateState({ showCreateDialog: false })
          }
        }}
        onDocumentTypeCreated={(result) => {
          onUpdateState({ showCreateDialog: false })
          onAssetTypeCreated?.(result)
        }}
      />

      {/* La configuración (general + plantillas + ciclo de vida) ya no es un
          sheet acá: vive en su propia página compartible
          (pages/asset-type-detail.tsx). El sheet se conserva solo para el
          canvas de assets-types-relationships-sheet.tsx. */}

      {/* Delete Asset Type Dialog */}
      <HuemulAlertDialog
        open={!!state.deletingAssetType}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDialog('deletingAssetType')
          }
        }}
        title={t('delete.title')}
        description={t('delete.description', { name: state.deletingAssetType?.document_type_name })}
        onAction={handleDelete}
        actionLabel={t('common:delete')}
        cancelLabel={t('common:cancel')}
        actionVariant="destructive"
      />

      {/* Clone Asset Type Dialog */}
      <CloneAssetTypeDialog
        open={!!state.cloningAssetType}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDialog('cloningAssetType')
          }
        }}
        assetTypeName={state.cloningAssetType?.document_type_name}
        onConfirm={handleClone}
      />

      {/* View Relationships Sheet */}
      <AssetTypeRelationshipsSheet
        assetType={state.viewRelationshipsAssetType}
        open={!!state.viewRelationshipsAssetType}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDialog('viewRelationshipsAssetType')
          }
        }}
      />

      {/* Export Dialog */}
      <AssetTypeExportDialog
        open={state.showExportDialog}
        onOpenChange={(open) => {
          if (!open) {
            onUpdateState({ showExportDialog: false })
          }
        }}
        selectedIds={exportSelectedIds}
        onExported={onExported}
      />

      {/* Import Sheet */}
      <AssetTypeImportSheet
        open={state.showImportSheet}
        onOpenChange={(open) => {
          if (!open) {
            onUpdateState({ showImportSheet: false })
          }
        }}
        onImportSuccess={onImportSuccess}
      />

      {/* Delete Folder Dialog — crear/renombrar son inline en la tabla, solo el borrado confirma */}
      <HuemulAlertDialog
        open={!!state.deletingFolder}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDialog('deletingFolder')
          }
        }}
        title={t('folders.deleteTitle')}
        description={t('folders.deleteDescription', { name: state.deletingFolder?.name })}
        onAction={handleDeleteFolder}
        actionLabel={t('folders.delete')}
        cancelLabel={t('common:cancel')}
        actionVariant="destructive"
      />
    </>
  )
}
