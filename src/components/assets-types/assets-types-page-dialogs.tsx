import { useTranslation } from "react-i18next"
import CreateDocumentType from "@/components/assets-types/assets-types-create"
import RolePermissionsDialog from "@/components/roles/roles-permissions-dialog"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import AssetTypeLifecycleDialog from "@/components/assets-types/assets-types-lifecycle-dialog"
import { useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { type AssetTypePageState } from "@/types/assets-types"

interface AssetTypePageDialogsProps {
  state: AssetTypePageState
  onCloseDialog: (dialog: keyof AssetTypePageState) => void
  onUpdateState: (updates: Partial<AssetTypePageState>) => void
  assetTypeMutations: ReturnType<typeof useAssetTypeMutations>
}

export default function AssetTypePageDialogs({ 
  state, 
  onCloseDialog, 
  onUpdateState, 
  assetTypeMutations 
}: AssetTypePageDialogsProps) {
  const { t } = useTranslation(['asset-types', 'common'])

  const handleDelete = async () => {
    if (!state.deletingAssetType) return

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

  return (
    <>
      {/* Create/Edit Dialog */}
      <CreateDocumentType
        type="asset"
        documentType={state.editingAssetType}
        open={!!state.editingAssetType || state.showCreateDialog}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDialog('editingAssetType')
            onUpdateState({ showCreateDialog: false })
          }
        }}
        onDocumentTypeCreated={() => {
          onCloseDialog('editingAssetType')
          onUpdateState({ showCreateDialog: false })
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

      {/* Role Permissions Dialog */}
      <RolePermissionsDialog
        documentType={state.rolePermissionsAssetType ? {
          id: state.rolePermissionsAssetType.document_type_id,
          name: state.rolePermissionsAssetType.document_type_name,
        } as any : null}
        open={!!state.rolePermissionsAssetType}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDialog('rolePermissionsAssetType')
          }
        }}
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
      />
    </>
  )
}
