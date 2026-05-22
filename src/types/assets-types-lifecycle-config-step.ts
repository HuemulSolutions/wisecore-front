export interface ConfigStepContentProps {
  documentTypeId: string
  stepType: string
  stepLabel: string
  hasSla: boolean
  hasValidity?: boolean
  onRegisterSave?: (fn: (() => Promise<void>) | null, isPending: boolean) => void
  onEditingChange?: (isEditing: boolean) => void
}
