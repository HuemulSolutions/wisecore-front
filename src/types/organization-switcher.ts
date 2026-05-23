export interface OrganizationDialogData {
  id: string
  name: string
  description?: string | null
  db_name?: string
  max_users?: number | null
  token_limit?: number | null
}
