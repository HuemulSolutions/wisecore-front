import type { HTMLAttributes } from 'react'

export interface EditStepCardData {
  id: string
  name: string
  hasSla: boolean
  slaValue: string
  slaUnit: string
  accessType: "all" | "owner" | "custom" | "custom_owner"
  ownerCanExecute: boolean
  roleIds: string[]
  roleNames: Record<string, string>
}

export interface EditStepContentProps {
  documentTypeId: string
  stepType: string
  onEditingChange?: (isEditing: boolean) => void
}

export interface EditStepCardProps {
  card: EditStepCardData
  stepType: string
  slaUnitOptions: { value: string; label: string }[]
  allRoles: { id: string; name: string }[]
  onChange: (updated: Partial<EditStepCardData>) => void
  onDelete: () => void
  onSave: () => Promise<void>
  t: (key: string, options?: Record<string, unknown>) => string
  isDeleting: boolean
  canDelete: boolean
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>
  onEditingChange?: (isEditing: boolean) => void
}
