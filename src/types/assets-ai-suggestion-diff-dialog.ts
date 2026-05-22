export interface AiSuggestionDiffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionOutput: string
  aiSuggestionInstruction?: string | null
  aiSuggestionContent?: string | null
  aiPreview: string | null
  onAccept: () => Promise<void>
  onReject: () => Promise<void>
}
