export interface ExecutionSummary {
  id: string
  name: string
  status: string
  created_at: string
  version?: string | null
  lifecycle_state?: string
}

export interface VersionManagementSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  executions: ExecutionSummary[]
  organizationId: string
  canEdit: boolean
  documentId: string
  /** The execution currently viewed in the document — used to pre-select the version */
  initialExecutionId?: string | null
}

export interface EditFormState {
  name: string
  expiration_date: string
  estimated_publication_date: string
  review_date: string
  audit_date: string
}

export interface ExecutionDetailProps {
  executionId: string
  organizationId: string
  canEdit: boolean
  onSaved: () => void
}
