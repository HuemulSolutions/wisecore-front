import type { ExternalFunctionality } from '@/types/external-functionalities'

export type Tab = "docs" | "params" | "body" | "logs"

export interface ExternalFunctionalityDetailProps {
  functionality: ExternalFunctionality
  organizationId?: string
  systemId?: string
  onEdit?: () => void
  onDelete?: () => void
}
