import type { Tag } from './core'

export interface TagFormData {
  name: string
  color: string | null
  description: string | null
}

export interface TagFormFieldsProps {
  formData: TagFormData
  onChange: <K extends keyof TagFormData>(field: K, value: TagFormData[K]) => void
  errors?: Record<string, string>
  disabled?: boolean
}

export interface CreateTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  canCreate?: boolean
}

export interface EditTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag: Tag | null
  canUpdate?: boolean
}

export interface DeleteTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag: Tag | null
  canDelete?: boolean
}
