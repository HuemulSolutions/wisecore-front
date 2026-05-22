export interface ProviderActionsProps {
  provider: any
  onEdit: (provider: any) => void | Promise<void>
  onDelete: (provider: any) => void
  isDeleting: boolean
  dropdownOpen: boolean
  onDropdownChange: (open: boolean) => void
  canUpdate: boolean
  canDelete: boolean
}
