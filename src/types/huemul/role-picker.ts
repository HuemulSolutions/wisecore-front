export interface HuemulRolePickerSelectMeta {
  color?: string | null
  description?: string | null
}

export interface HuemulRolePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (id: string, label: string, meta?: HuemulRolePickerSelectMeta) => void
}
