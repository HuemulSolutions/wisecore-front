export interface AssetVersionCompareExecution {
  id: string
  created_at: string
  name: string
  status: string
  version?: string | null
}

export interface AssetVersionCompareSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  executions: AssetVersionCompareExecution[]
  /** Version shown on the right ("new") side. Defaults to the currently selected/latest version. */
  defaultRightExecutionId?: string
  /** Version shown on the left ("previous") side. Defaults to the version immediately before the right one. */
  defaultLeftExecutionId?: string
}
