import type { ExternalSystem } from '@/types/external-systems'

export type Tab = "docs" | "params" | "secrets"

export interface ExternalSystemDetailProps {
  system: ExternalSystem | null
  organizationId?: string
  onAddFunctionality?: () => void
  onEdit?: () => void
  onDelete?: () => void
}
