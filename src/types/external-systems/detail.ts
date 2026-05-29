import type { ExternalSystem } from './core'

export type ExternalSystemDetailTab = "docs" | "params" | "secrets"

export interface ExternalSystemDetailProps {
  system: ExternalSystem | null | undefined
  organizationId?: string
  onAddFunctionality?: () => void
  onEdit?: () => void
  onDelete?: () => void
}
