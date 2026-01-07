"use client"

import type { CustomFieldPageState } from "./index"
import type { useCustomFieldMutations } from "@/hooks/useCustomFields"
import { CreateEditCustomFieldDialog } from "./create-edit-custom-field-dialog"
import { DeleteCustomFieldDialog } from "./delete-custom-field-dialog"

interface CustomFieldPageDialogsProps {
  state: CustomFieldPageState
  onCloseDialog: (dialog: keyof CustomFieldPageState) => void
  customFieldMutations: ReturnType<typeof useCustomFieldMutations>
}

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