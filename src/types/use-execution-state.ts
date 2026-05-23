export interface UseExecutionStateProps {
  selectedFileId?: string
  selectedOrganizationId?: string
  documentContent?: any
  documentExecutions?: any[]
  selectedExecutionId: string | null
  setSelectedExecutionId: (id: string | null) => void
}
