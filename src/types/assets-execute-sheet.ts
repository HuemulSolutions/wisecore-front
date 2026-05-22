export interface ExecuteSheetProps {
  selectedFile: {
    id: string
    name: string
    type: "folder" | "document"
    access_levels?: string[]
  } | null
  fullDocument?: any
  isLoadingFullDocument?: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSectionSheetOpen: () => void
  onExecutionComplete?: () => void
  onExecutionCreated?: (executionId: string, mode: 'full' | 'full-single' | 'single' | 'from', sectionIndex?: number) => void
  isMobile?: boolean
  disabled?: boolean
  disabledReason?: string
  selectedExecutionId?: string | null
  executionContext?: { type: 'header' | 'section', sectionIndex?: number, sectionId?: string } | null
}
