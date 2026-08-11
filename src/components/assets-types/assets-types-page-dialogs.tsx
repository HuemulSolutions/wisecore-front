import { useTranslation } from "react-i18next"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import CreateDocumentType from "@/components/assets-types/assets-types-create"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { CloneAssetTypeDialog } from "@/components/assets-types/assets-types-clone-dialog"
import AssetTypeLifecycleDialog from "@/components/assets-types/assets-types-lifecycle-dialog"
import { AssetTypeRelationshipsSheet } from "@/components/assets-types/assets-types-relationships-sheet"
import { AssetTypeTemplatesSheet } from "@/components/assets-types/assets-types-templates-sheet"
import { AssetTypeExportDialog } from "@/components/assets-types/assets-types-export-dialog"
import { AssetTypeImportSheet } from "@/components/assets-types/assets-types-import-sheet"
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
  const { selectedOrganizationId } = useOrganization()
  const { canDelete, canCreate, canUpdate } = useUserPermissions()

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
      {/* Create/Edit Dialog */}
      {/* El mismo sheet crea o edita según `editingAssetType`, así que el
          permiso exigido cambia con el modo. */}
      <CreateDocumentType
        type="asset"
        documentType={state.editingAssetType}
        canSave={state.editingAssetType ? canUpdate('asset_type') : canCreate('asset_type')}
        open={!!state.editingAssetType || state.showCreateDialog}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDialog('editingAssetType')
            onUpdateState({ showCreateDialog: false })
          }
        }}
        onDocumentTypeCreated={(result) => {
          const wasEditing = !!state.editingAssetType
          onCloseDialog('editingAssetType')
          onUpdateState({ showCreateDialog: false })
          if (!wasEditing) {
            onAssetTypeCreated?.(result)
          }
        }}
      />

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

      {/* Lifecycle Dialog */}
      <AssetTypeLifecycleDialog
        assetType={state.lifecycleAssetType}
        open={!!state.lifecycleAssetType}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDialog('lifecycleAssetType')
          }
        }}
        organizationId={selectedOrganizationId ?? ""}
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

      {/* Manage Templates Sheet */}
      <AssetTypeTemplatesSheet
        assetType={state.templatesAssetType}
        open={!!state.templatesAssetType}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDialog('templatesAssetType')
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
    </>
  )
}
