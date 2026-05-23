export interface SectionExecutionProps {
  sectionExecution: {
    id: string
    output: string
    section_id?: string
    /** Plate JSON nodes (stringified) – used to restore comment marks on load */
    plate_content?: string[]
    ai_suggestion_status?: 'pending' | 'completed' | 'failed' | null
    ai_suggestion_content?: string | null
    ai_suggestion_instruction?: string | null
    review_status?: 'editing' | 'reviewing' | 'finished' | null
  }
  onUpdate?: () => void
  readyToEdit: boolean
  sectionIndex?: number
  documentId?: string
  executionId?: string
  onExecutionStart?: (executionId?: string) => void
  executionStatus?: string
  onOpenExecuteSheet?: () => void
  executionMode?: 'single' | 'from' | 'full' | 'full-single'
  showExecutionFeedback?: boolean
  sectionType?: 'ai' | 'manual' | 'reference' | null
  sectionName?: string
  canEditSections?: boolean
  onCreateSectionFromSelection?: (selectedMarkdown: string) => void
  onCopyLink?: () => void
}
