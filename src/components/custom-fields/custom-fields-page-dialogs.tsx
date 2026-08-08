"use client"

import { CreateEditCustomFieldSheet } from "./custom-fields-create-edit-sheet"
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
      />

      {/* Edit Dialog */}
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
      />
    </>
  )
}