"use client"

import { CreateEditCustomFieldDialog } from "./custom-fields-create-edit-dialog"
import { DeleteCustomFieldDialog } from "./custom-fields-delete-dialog"
import type { CustomFieldPageDialogsProps } from '@/types/custom-fields'

export type { CustomFieldPageDialogsProps } from '@/types/custom-fields'

export function CustomFieldPageDialogs({
  state,
  onCloseDialog,
  customFieldMutations,
}: CustomFieldPageDialogsProps) {
  return (
    <>
      {/* Create Dialog */}
      <CreateEditCustomFieldDialog
        open={state.showCreateDialog}
        onOpenChange={(open: boolean) => {
          if (!open) onCloseDialog('showCreateDialog')
        }}
        customField={null}
        onSuccess={() => {
          onCloseDialog('showCreateDialog')
        }}
        customFieldMutations={customFieldMutations}
      />

      {/* Edit Dialog */}
      <CreateEditCustomFieldDialog
        open={!!state.editingCustomField}
        onOpenChange={(open: boolean) => {
          if (!open) onCloseDialog('editingCustomField')
        }}
        customField={state.editingCustomField}
        onSuccess={() => {
          onCloseDialog('editingCustomField')
        }}
        customFieldMutations={customFieldMutations}
      />

      {/* Delete Dialog */}
      <DeleteCustomFieldDialog
        open={!!state.deletingCustomField}
        onOpenChange={(open: boolean) => {
          if (!open) onCloseDialog('deletingCustomField')
        }}
        customField={state.deletingCustomField}
        onConfirm={(customField: any) => {
          customFieldMutations.delete.mutate(customField.id)
          // Don't close here - let the delete dialog handle it with delay
        }}
      />
    </>
  )
}