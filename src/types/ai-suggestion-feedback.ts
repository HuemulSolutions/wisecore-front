export interface AiSuggestionFeedbackProps {
  sectionExecutionId: string
  onCompleted: (content: string) => void
  onFailed?: () => void
  onDismiss?: () => void
  /** Called when the user clicks "View Suggestion" in the completed state. */
  onViewSuggestion?: (content: string) => void
  className?: string
}
