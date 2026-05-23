export interface CreateStepContentProps {
  documentTypeId: string
  stepType: string
  hasSla?: boolean
  hasValidity?: boolean
  noOwner?: boolean
  useAllOrCustomOwner?: boolean
  onEditingChange?: (isEditing: boolean) => void
}
