"use client"

import { CreateEditCustomFieldSheet } from "./custom-fields-create-edit-sheet"
import type { CustomFieldPageDialogsProps } from '@/types/custom-fields'

export type { CustomFieldPageDialogsProps } from '@/types/custom-fields'

export function CustomFieldPageDialogs({
  state,
  onCloseDialog,
  customFieldMutations,
  canCreate = false,
  canUpdate = false,
  canDelete = false,
}: CustomFieldPageDialogsProps) {
  return (
    <>
      {/* Create Dialog */}
      {canCreate && (
        <CreateEditCustomFieldSheet
          open={state.showCreateDialog}
          onOpenChange={(open: boolean) => {
            if (!open) onCloseDialog('showCreateDialog')
          }}
          customField={null}
          onSuccess={() => {
            onCloseDialog('showCreateDialog')
          }}
          customFieldMutations={customFieldMutations}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      )}

      {/* Edit Dialog */}
      {(canUpdate || canDelete) && (
        <CreateEditCustomFieldSheet
          open={!!state.editingCustomField}
          onOpenChange={(open: boolean) => {
            if (!open) onCloseDialog('editingCustomField')
          }}
          customField={state.editingCustomField}
          onSuccess={() => {
            onCloseDialog('editingCustomField')
          }}
          customFieldMutations={customFieldMutations}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      )}
    </>
  )
}